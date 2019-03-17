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
            topicNum: 0,
            type: '',
            maxVal: 0
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
                spaceForTitle = 20,
                chartHeight=spaceForTitle
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
                .domain([0, this.maxVal])
                .range([0, chartWidth-spaceForLabel])
            const svg = d3.select(this.$refs.root)
                .append('svg')
                .attr('width', chartWidth)
                .attr('height', this.height)
                .append('g')
            svg.append('g')
                .attr('transform', 'translate(25,15)')
                .append('text')
                .text(this.type)
                .style('font-size', 15+'px')
            var i1 = 0, i2 = 0
            data.forEach((d, i) => {
                if(d.val.length === 1){
                    if(d.val[0] >= 0.2) {
                        let g = svg.append('g')
                            .attr('transform', `translate(${spaceForLabel},${i1*barHeight+i2*gap+10+spaceForTitle})`)
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
                        if(d.type === 'del')
                            g.selectAll('rect').attr('stroke-dasharray', '3,3')
                        i1++
                        i2++
                    }
                }
                if(d.val.length === 2){
                    if(d.val[0] >= 0.2){
                        let g = svg.append('g')
                                .attr('transform', `translate(${spaceForLabel},${i1*barHeight+ i2*gap+10+spaceForTitle})`)
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
                                .attr('transform', `translate(${spaceForLabel},${i1*barHeight+ i2*gap+10+spaceForTitle})`)
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
            this.type = d.docs[0].type + ' files'
            this.maxVal = d.max
            // this.draw(this.getChartData(d.docs))
            this.draw(d.docs[0].vec)
            this.x = d.x+10
            this.y = d.y+10
            if(this.x <= d.args.left)
                this.x = d.args.left + 10
            else if(this.x + this.width >= d.args.right)
                this.x = d.args.right - this.width - 10
            if(this.y <= d.args.top)
                this.y = d.args.top+10
            else if(this.y + this.height >= d.args.bottom)
                this.y = d.args.bottom-this.height-10
            this.isShow = true
        })
        this.$bus.$on('tip-close', d =>{
            this.isShow = false
        })
        this.$bus.$on('selected-tip-show', d =>{
            this.type = d.docs[0].type + ' files'
            // this.draw(this.getChartData(d.docs))
            this.maxVal = d.max
            this.draw(d.docs[0].vec)
            this.x = d.x+d.args.left+20
            this.y = d.y+d.args.top+20
            if(this.x <= d.args.left)
                this.x = d.args.left + 10
            else if(this.x + this.width >= d.args.right)
                this.x = d.args.right - this.width - 10
            if(this.y <= d.args.top)
                this.y = d.args.top+10
            else if(this.y + this.height >= d.args.bottom)
                this.y = d.args.bottom-this.height-10
            this.isShow = true
        })
        this.$bus.$on('selected-tip-hide', d =>{
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
