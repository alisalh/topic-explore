<template>
  <div class="aspect-tip" v-show="isShow"
    :style="style" ref="root">
  </div>
</template>

<script>
import * as d3 from 'd3'
export default {
    name: 'component_name',
    data() {
        return {
            placement: 'top',
            isShow: false,
            aspectData: [],
            x: 0,
            y: 0,
            width: 100,
            height: 50,
            topicNum: 0
        }
    },
    props: ['topicColormap','topicData', 'docData'],
    computed: {
        style() {
            return {
                left: `${this.x}px`,
                top: `${this.y}px`, 
                width: `${this.width}px`,
                height: `${this.height}px`
            }
        }
    },
    methods:{
        draw(data){
            this.$refs.root.innerHTML = ''
            var chartWidth = this.width-10,
                barHeight = 10,
                gap=10, spaceForLabel = 50,
                chartHeight=0
            data.forEach(d =>{
                if(d.val.length === 1){
                    if(d.val[0] >= 0.2)
                        chartHeight = chartHeight+barHeight+gap
                }  
                else{
                    if(d.val[0] >= 0.2){
                        if(d.val[1] >= 0.2)
                            chartHeight = chartHeight+barHeight*2+gap
                        else
                            chartHeight = chartHeight+barHeight+gap
                    }
                    else{
                        if(d.val[1] >= 0.2)
                            chartHeight = chartHeight+barHeight+gap
                    }
                        
                }
            })
            this.height = chartHeight+20 - gap
            var x = d3.scaleLinear()
                .domain([0, d3.max(data, d => d3.max(d.val))])
                .range([0, chartWidth-spaceForLabel])
            const svg = d3.select(this.$refs.root)
                .append('svg')
                .attr('width', chartWidth)
                .attr('height', this.height)
                .append('g')
            var i1 = 0, i2 = 0
            data.forEach((d, i) => {
                if(d.val.length === 1){
                    if(d.val[0] >= 0.2) {
                        let g = svg.append('g')
                            .attr('transform', `translate(${spaceForLabel},${i1*barHeight+i2*gap+10})`)
                        g.append('rect')
                            .attr('fill', this.topicColormap(d.topic))
                            .attr('class', 'bar')
                            .attr('width', x(d.val[0]))
                            .attr('height', barHeight)
                            .style('stroke', 'black')
                        g.append('text')
                            .attr('x', 10-spaceForLabel)
                            .attr('dy', '.7em')
                            .text(d.topic)
                        i1++
                        i2++
                    }
                }
                if(d.val.length === 2){
                    if(d.val[0] >= 0.2){
                        let g = svg.append('g')
                                .attr('transform', `translate(${spaceForLabel},${i1*barHeight+ i2*gap+10})`)
                            g.append('rect')
                                .attr('fill', this.topicColormap(d.topic))
                                .attr('class', 'bar')
                                .attr('width', x(d.val[0]))
                                .attr('height', barHeight-1)
                                .style('stroke', 'black')
                                .attr('stroke-dasharray', '3,3')
                        if(d.val[1] >= 0.2){
                            g.append('rect')
                                .attr('transform', 'translate(0,'+(barHeight+2)+')')
                                .attr('fill', this.topicColormap(d.topic))
                                .attr('class', 'bar')
                                .attr('width', x(d.val[0]))
                                .attr('height', barHeight-1)
                                .style('stroke', 'black')  
                            g.append('text')
                                .attr('x', 10-spaceForLabel)
                                .attr('dy', '1em')
                                .text(d.topic)
                            i1 = i1+2
                        }  
                        else{
                            g.append('text')
                                .attr('x', 10-spaceForLabel)
                                .attr('dy', '.7em')
                                .text(d.topic)
                            i1++
                        }
                        i2++   
                    }
                    else{
                        if(d.val[1] >= 0.2){
                            let g = svg.append('g')
                                .attr('transform', `translate(${spaceForLabel},${i1*barHeight+ i2*gap+10})`)
                            g.append('rect')
                                .attr('fill', this.topicColormap(d.topic))
                                .attr('class', 'bar')
                                .attr('width', x(d.val[1]))
                                .attr('height', barHeight)
                                .style('stroke', 'black')
                            g.append('text')
                                .attr('x', 10-spaceForLabel)
                                .attr('dy', '.7em')
                                .text(d.topic)
                            i1++
                            i2++
                        }
                    }
                }
            })
            
        },
        // filterVal(data){
        //     var chartData = []
        //     let sum = 0, mean = 0, num = 0
        //     data.forEach(d => {
        //         if (d != 0) num++
        //         sum = sum+d
        //     })
        //     mean = sum / num
        //     data.forEach((d, i) =>{
        //         if(d >= mean){
        //             chartData.push({topic: i, val: [d]})
        //         }
        //     })
        //     return chartData
        // },
        getChartData(data){
            var preVec = Array(this.topicNum).fill(0), 
                curVec = Array(this.topicNum).fill(0)
            var chartData = []
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
                    let add_preVec = Array(this.topicNum).fill(0),
                        add_curVec = curDoc['Topic_Contribution'].map(topic => topic['percent'])
                    preVec = preVec.map((d, i) => d+add_preVec[i])
                    curVec = curVec.map((d, i) => d+add_curVec[i])
                }
                if(doc.type === 'del'){
                    let preId = doc.fileIds[0]
                    let preDoc = this.docData[preId]
                    let del_preVec = preDoc['Topic_Contribution'].map(topic => topic['percent']),
                        del_curVec = Array(this.topicNum).fill(0)
                    preVec = preVec.map((d, i) => d+del_preVec[i])
                    curVec = curVec.map((d, i) => d+del_curVec[i])
                }
            })
            if(data[0].type === 'add'){
                curVec.forEach((d, i) => {
                    if(d != 0) chartData.push({topic: i, val: [d] })
                })
            }
            if(data[0].type === 'del'){
                preVec.forEach((d, i) => {
                    if(d != 0) chartData.push({topic: i, val: [d] })
                })
            }
            if(data[0].type === 'edit'){
                preVec.forEach((d, i) => {
                    if(d!=0 || curVec[i]!=0)
                        chartData.push({topic: i, val: [d, curVec[i]] })
                })
            }
            return chartData
        }

    },
    created(){
        const requiredData = ['topicColormap', 'topicData', 'docData']
        let cnt = 0
        requiredData.forEach(d => {
            this.$watch(d, val => {
                if (val) 
                    cnt++
                if (cnt === requiredData.length) {
                    this.topicNum = this.topicData.length
                }
            })
        })
    },
    mounted(){
        this.$bus.$on('tip-show', d =>{
            this.draw(this.getChartData(d.docs))
            this.x = d.x+20
            this.y = d.y+20
            if(this.x <= d.args.left)
                this.x = d.args.left + 20
            else if(this.x + this.width >= d.args.right)
                this.x = d.args.right - this.width - 20
            if(this.y <= d.args.top)
                this.y = d.args.top+20
            else if(this.y + this.height >= d.args.bottom)
                this.y = d.args.bottom-this.height-20
            this.isShow = true
        })
        this.$bus.$on('tip-close', d =>{
            this.isShow = false
        })
    }
}
</script>

<style lang="less">
.aspect-tip{
    position: absolute;
    font-size: 13px;
}
</style>
