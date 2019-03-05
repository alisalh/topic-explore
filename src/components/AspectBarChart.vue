<template>
  <div class='aspect-bar-chart'
       ref='root'>
  </div>
</template>

<script>
import * as d3 from 'd3'
export default {
    name: 'component_name',
    data() {
        return{
            width: 0,
            height: 0
        }
    },
    props: ['topicColormap', 'docData'],
    methods: {
        draw(data){
            this.$refs.root.innerHTML = ''
            const margin = { top: 10, right: 10, bottom: 10, left: 20 }
            var barWidth = 12,
                gap = 8  // 组间距离
            var chartWidth = barWidth*data.length + gap*data.length/2

            const svg = d3
              .select(this.$refs.root)
              .append('svg')
              .attr('height', this.height - margin.top - margin.bottom)
              .attr('width', chartWidth)
              .attr('transform', 'translate(' + [margin.left, margin.top] + ')')
            var y = d3.scaleLinear()
                .domain([0, d3.max(data.map(d => d.val))])
                .range([0, this.height - margin.top - margin.bottom])
            // var x = d3.scaleLinear()
            //     .range([0, chartWidth + gap])
            // var xAxis = d3.axisBottom(x)
            //     .tickFormat('')
            //     .tickSize(0)
            var barG = svg.selectAll('g')
                .data(data)
                .enter().append('g')
                .attr('transform', (d, i) => {
                    return 'translate('+ (i * barWidth + gap * (0.5 + Math.floor(i/2))) 
                        + ',' + (this.height - margin.bottom - y(d.val)) +')'
                })
            barG.append('rect')
                .attr('fill', d => d.color )
                .attr('class', 'bar')
                .attr('height', d => y(d.val))
                .attr('width', barWidth - 3)  // 1为组内bar间的距离 
                .style('stroke', 'black') 
                .attr('stroke-dasharray', d => {
                    if(d.type === 'prev') return '5,5'
                })
            // svg.append('g')
            // .attr('class','x axis')
            // .attr('transform', 'translate(' + margin.left +',' + (this.height - 20) +')')
            // .call(xAxis)
        }
    },
    watch: {
       
    },
    created() {

    },
    mounted() {
        this.height = Math.floor(this.$refs.root.clientHeight)
        this.width = Math.floor(this.$refs.root.clientWidth)
        this.$bus.$on('diff-docs-changed', docs => {
            console.log('diffDocs:', docs)
            if(!docs){
                this.$refs.root.innerHTML = ''
                return
            }
            var preVec = Array(docs[0].vec.length).fill(0), 
                curVec = Array(docs[0].vec.length).fill(0)
            docs.forEach(doc => {
                if(doc.type === 'edit'){
                    let preId = doc.fileIds[0], curId = doc.fileIds[1]
                    let preDoc = this.docData[preId], curDoc = this.docData[curId]
                    let edit_preVec = preDoc['Topic_Contribution'].map(topic => topic['percent']),
                        edit_curVec = curDoc['Topic_Contribution'].map(topic => topic['percent'])
                    preVec = preVec.map((d, i) => d+edit_preVec[i])
                    curVec = curVec.map((d, i) => d+edit_curVec[i])
                }
                if(doc.type === 'add'){
                    let curId = doc.fileIds[0]
                    let curDoc = this.docData[curId]
                    let add_preVec = Array(doc.vec.length).fill(0),
                        add_curVec = curDoc['Topic_Contribution'].map(topic => topic['percent'])
                    preVec = preVec.map((d, i) => d+add_preVec[i])
                    curVec = curVec.map((d, i) => d+add_curVec[i])
                }
                if(doc.type === 'del'){
                    let preId = doc.fileIds[0]
                    let preDoc = this.docData[preId]
                    let del_preVec = preDoc['Topic_Contribution'].map(topic => topic['percent']),
                        del_curVec = Array(doc.vec.length).fill(0)
                    preVec = preVec.map((d, i) => d+del_preVec[i])
                    curVec = curVec.map((d, i) => d+del_curVec[i])
                }
            })
            var barData = []
            preVec.forEach((d, i) => {
                barData.push({
                    topicId: i,
                    val: d,
                    type: 'prev',
                    color: this.topicColormap(i)
                })
                barData.push({
                    topicId: i,
                    val: curVec[i],
                    type: 'curv',
                    color: this.topicColormap(i)
                })
            })
            this.draw(barData)
        })
    }
}
</script>
<style lang="less">
// .aspect-bar-chart{
//     height:100%;
// }
</style>
