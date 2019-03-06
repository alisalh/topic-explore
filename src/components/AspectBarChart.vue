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
            height: 0,
            selectedDocs: null,
            barG: null,
            svg: null,
            barWidth: 11
        }
    },
    props: ['topicColormap', 'docData'],
    methods: {
        draw(data){
            this.$refs.root.innerHTML = ''
            const margin = { top: 10, right: 10, bottom: 10, left: 20 }
            var gap = 11  // 组间距离
            var chartWidth = this.barWidth*data.length + gap*data.length/2

           this.svg = d3
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
            this.barG = this.svg.selectAll('g')
                .data(data)
                .enter().append('g')
                // .attr('id', (d, i) => 'barG'+i)
                // .attr('transform', (d, i) => {
                //     return 'translate('+ (i * this.barWidth + gap * (0.5 + Math.floor(i/2))) 
                //         + ',' + (this.height - margin.bottom - margin.top - y(d.val)) +')'
                // })
            
            this.barG.append('rect')
                .attr('fill', d => d.color )
                .attr('class', 'bar')
                .attr('id', (d, i) => 'bar'+i)
                .attr('x', (d, i) => i * this.barWidth + gap * parseInt(i/2))
                .attr('y', d => this.height - margin.bottom - margin.top - y(d.val))
                .attr('height', d =>y(d.val))
                .attr('width', this.barWidth - 2)  // 1为组内bar间的距离 
                .style('stroke', 'black') 
                .attr('stroke-dasharray', d => {
                    if(d.type === 'prev') return '3,3'
                })
                .attr('stroke-opacity', 0.5)
            // svg.append('g')
            // .attr('class','x axis')
            // .attr('transform', 'translate(' + margin.left +',' + (this.height - 20) +')')
            // .call(xAxis)

        },
        getVecSum(data){
            var preVec = Array(data[0].vec.length).fill(0), 
                curVec = Array(data[0].vec.length).fill(0)
            data.forEach(doc => {
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
            return {preVec: preVec, curVec: curVec}
        }
    },
    watch: {
        selectedDocs(){
            this.svg.selectAll('.bar-tick').remove()
            let vec = this.getVecSum(this.selectedDocs)
            let preVec = vec.preVec, curVec = vec.curVec
            this.barG.each((d, i) => {
                if(i%2 === 0 && preVec[parseInt(i/2)] > 0.2){
                    let barHeight = parseFloat(this.barG.select('#bar'+i).attr('height'))
                    let newHeight = preVec[parseInt(i/2)]/d.val*barHeight
                    let x = this.barG.select('#bar'+i).attr('x'),
                        y = this.barG.select('#bar'+i).attr('y')
                    this.svg.append('g')
                        .attr('class', 'bar-tick')
                        .append('rect')
                        .attr('fill', 'none')
                        .attr('class', 'bar')
                        .attr('x', x)
                        .attr('y', parseFloat(y)+barHeight-newHeight)
                        .attr('height', newHeight)
                        .attr('width', this.barWidth - 2)  
                        .style('stroke', 'black') 
                        .attr('stroke-dasharray','3,3')
                        .attr('stroke-width', '1.5')
                    
                }
                if(i%2 === 1 && curVec[parseInt(i/2)] > 0.2){
                    let barHeight = parseFloat(this.barG.select('#bar'+i).attr('height'))
                    let newHeight = curVec[parseInt(i/2)]/d.val*barHeight
                    let x = this.barG.select('#bar'+i).attr('x'),
                        y = this.barG.select('#bar'+i).attr('y')
                    this.svg.append('g')
                        .attr('class', 'bar-tick')
                        .append('rect')
                        .attr('fill', 'none')
                        .attr('class', 'bar')
                        .attr('x', x)
                        .attr('y', parseFloat(y)+barHeight-newHeight)
                        .attr('height', newHeight)
                        .attr('width', this.barWidth - 2)  
                        .style('stroke', 'black') 
                        .attr('stroke-width', '1.5')
                }
            })
        }
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
            let vec = this.getVecSum(docs)
            let preVec = vec.preVec, curVec = vec.curVec
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
        this.$bus.$on('docs-selected', docs =>{
            this.selectedDocs = docs
        })
        this.$bus.$on('version-restored', d => {
            this.$refs.root.innerHTML = ''
        })
    }
}
</script>
<style lang="less">
// .aspect-bar-chart{
//     height:100%;
// }
</style>
