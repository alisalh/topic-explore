<template>
  <div class='aspect-bar-chart'
    v-show="isShow"
    :style="style"
    ref='root'>
  </div>
</template>

<script>
import * as d3 from 'd3'
export default {
    name: 'component_name',
    data() {
        return{
            barG: null,
            barWidth: 11,
            isShow: false,
            height: 100,
            width: 0,
            topics: []
        }
    },
    props: ['topicColormap', 'docData'],
    methods: {
        draw(data){
            this.$refs.root.innerHTML = ''
            const margin = { top: 30, right: 10, bottom: 30, left: 10 }
            var gap = 10  // 组间距离
            var chartWidth = this.barWidth*data.length + gap*data.length/2
            this.width = chartWidth+margin.right+margin.left
            const svg = d3
              .select(this.$refs.root)
              .append('svg')
              .attr('height', this.height)
              .attr('width', this.width)
              .append('g')
              .attr('transform', `translate(${margin.left}, ${margin.top})`)
            var y = d3.scaleLinear()
                .domain([0, d3.max(data.map(d => d.val))])
                .range([0, this.height - margin.top - margin.bottom])
            // var x = d3
            //     .scalePoint()
            //     .domain(this.topics)
            //     .range([0, chartWidth])
            // var xAxis = g =>
            //     g
            //     .attr('transform', `translate(0, ${this.height - margin.bottom - margin.top})`)
            //     .call(d3.axisBottom(x))
            //     .call(g => g.select(".domain").remove())
            // svg.append('g').call(xAxis)
            this.barG = svg.selectAll('.barG')
                .data(data)
                .enter().append('g').attr('class', 'barG')
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
                .attr('stroke-opacity', 0.8)

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
    created() {

    },
    computed: {
        style() {
            return {
                width: `${this.width}px`,
            }
        }
    },
    mounted() {
        this.$bus.$on('docs-selected', docs =>{
            if(!docs){
                this.isShow=false
                this.$refs.root.innerHTML = ''
                return
            }
            this.isShow = true
            let vec = this.getVecSum(docs)
            let preVec = vec.preVec, curVec = vec.curVec
            var barData = []
            this.topics = []
            preVec.forEach((d, i) => {
                if(d>=0.1 || curVec[i]>=0.1) {
                    this.topics.push(i)
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
                }
            })
            this.draw(barData)
        })
        this.$bus.$on('version-restored', d => {
            this.$refs.root.innerHTML = ''
        })
    }
}
</script>
<style lang="less">
.aspect-bar-chart{
    position: absolute;
    // width: 200px;
    height: 100px;
    left: 900px;
    top: 400px;
}
</style>
