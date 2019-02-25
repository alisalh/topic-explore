<template>
  <div class='aspect-bar-chart'
       ref='root'>
  </div>
</template>

<script>
import * as d3 from 'd3'
import {getVersion} from '../utils/index.js'
export default {
    name: 'component_name',
    data() {
        return{
            width: 0,
            height: 0,
            changedFiles: []
        }
    },
    props: ['topicColormap', 'fileGroup', 'topicData', 'prevVer'],
    methods: {
        draw(data){
            console.log(data)
            this.$refs.root.innerHTML = ''
            const margin = { top: 20, right: 20, bottom: 20, left: 20 }
            var barHeight = 10,
                gap = 5,  // 组间距离
                spaceForLabels = 50 // 显示text的空间
            var chartHeight = barHeight*data.length + gap*data.length/2

            const svg = d3
              .select(this.$refs.root)
              .append('svg')
              .attr('width', this.width - margin.right - margin.left)
              .attr('height', chartHeight)
              .attr('transform', 'translate(' + [margin.left, margin.top] + ')')
            var x = d3.scaleLinear()
                .domain([0, d3.max(data.map(d => d.val))])
                .range([0, this.width - margin.right - margin.right-spaceForLabels])
            var y = d3.scaleLinear()
                .range([chartHeight + gap, 0])
            var yAxis = d3.axisLeft(y)
                .tickFormat('')
                .tickSize(0)
            var barG = svg.selectAll('g')
                .data(data)
                .enter().append('g')
                .attr('transform', (d, i) => {
                    return 'translate('+ spaceForLabels + ',' + 
                        (i * barHeight + gap * (0.5 + Math.floor(i/2))) + ')'
                })
            barG.append('rect')
                .attr('fill', d => d.color )
                .attr('class', 'bar')
                .attr('width', d => x(d.val))
                .attr('height', barHeight - 2)  // 1为组内bar间的距离 
                .style('stroke', 'black') 
                .attr('stroke-dasharray', d => {
                    if(d.type === 'prev') return '5,5'
                })
            svg.append('g')
            .attr('class','y axis')
            .attr('transform', 'translate(' + spaceForLabels +',' + -gap/2 +')')
            .call(yAxis)
        }
    },
    watch: {
        fileGroup(){
            const topicNum = this.topicData.length
            this.fileGroup.addDocs.forEach(doc => {
                this.changedFiles.push({
                    fileIds: doc.id,
                    fileName: doc.filename,
                    type: 'add',
                    prevec: Array(topicNum).fill(0),
                    curvec: doc['Topic_Contribution'].map(topic => topic['percent'])
                }) 
            })
            this.fileGroup.delDocs.forEach(doc => {
                this.changedFiles.push({
                    fileIds: doc.id,
                    type: 'del',
                    fileName: doc.filename,
                    prevec: doc['Topic_Contribution'].map(topic => topic['percent']),
                    curvec: Array(topicNum).fill(0)   
                }) 
            })
            Object.keys(this.fileGroup.editDocsObj).forEach(key => {
                let val = this.fileGroup.editDocsObj[key]
                if(val.length === 2) {
                    var preData, curData
                    let version = getVersion(val[0].filename)
                    if(version === this.prevVer) {
                        preData = val[0]
                        curData = val[1]
                    }
                    else {
                        preData = val[1]
                        curData = val[0]
                    }
                    this.changedFiles.push({
                        fileIds: [preData.id, curData.id],
                        type: 'edit',
                        fileName: [preData.filename, curData.filename],
                        prevec: preData['Topic_Contribution'].map(topic => topic['percent']),
                        curvec: curData['Topic_Contribution'].map(topic => topic['percent']),  
                    })
                }
            })
            // console.log(this.changedFiles)
        }
    },
    created() {

    },
    mounted() {
        this.height = Math.floor(this.$refs.root.clientHeight)
        this.width = Math.floor(this.$refs.root.clientWidth)
        this.$bus.$on('cluster-selected', clusters => {
            if(!clusters)
                this.$refs.root.innerHTML = ''
            var selectedFiles = []
            clusters.forEach(d => {
                let doc = this.changedFiles.find(doc => {
                    return doc.fileIds === d || doc.fileIds[0] === d
                })
                if(doc) selectedFiles.push(doc)
            })
            // 概率求和
            var prevec = Array(this.topicData.length).fill(0)
            var curvec = Array(this.topicData.length).fill(0)
            selectedFiles.forEach(doc => {
                prevec = prevec.map((d, i) => d+doc.prevec[i])
                curvec = curvec.map((d, i) => d+doc.curvec[i])
            })
            // 构造barchart所需数据
            var barData = []
            for(let i=0; i<this.topicData.length; i++) {
                if(prevec[i] || curvec[i]) {
                    barData.push({
                        topicId: i,
                        val: prevec[i],
                        type: 'prev',
                        color: this.topicColormap(i)
                    })
                    barData.push({
                        topicId: i,
                        val: curvec[i],
                        type: 'curv',
                        color: this.topicColormap(i)
                    })
                }
            }
            this.draw(barData)
        })
    }
}
</script>
<style lang="less">
.aspect-bar-chart{
    height:100%;
}
</style>
