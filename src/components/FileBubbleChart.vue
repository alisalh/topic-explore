<template>
  <div class='file-bubble-chart'
       ref="root">

  </div>
</template>

<script>
import * as d3 from 'd3'
export default {
  name: 'component_name',
  props: ['fileData', 'topicColormap', 'id', 'funcNumColorMap', 'sizeColorMap'],
  data () {
    return {
      width: null,
      height: null,
      svg: null,
      centerG: null,
      donutOuterOffset: 15,
      donutInnerOffset: 25,
      pieChartOffset: 30
    }
  },
  mounted () {
    this.height = Math.floor(this.$refs.root.clientHeight)
    this.width = Math.floor(this.$refs.root.clientWidth)
    this.svg = d3
      .select(this.$refs.root)
      .append('svg')
      .attr('width', this.width)
      .attr('height', this.height)
    this.centerG = this.svg
      .append('g')
      .attr('transform', `translate(${this.width / 2},${this.height / 2})`)
      .attr('class', 'center-g')
  },
  watch: {
    fileData (val) {
      this.clear()
      if (!val.data[this.id]) return
      this.drawPieChart(val.data[this.id]['Topic_Contribution'])
      this.drawDonut({
        size: val.size,
        funcNum: val.funcNum
      })
    }
  },
  methods: {
    clear () {
      // d3.select('.file-bubble-chart>svg *').remove()
      d3.select(this.$refs.root)
        .selectAll('svg .center-g *')
        .remove()
    },
    drawPieChart (data) {
      const pie = d3
        .pie()
        .sort(null)
        .value(d => d.percent)
      const arc = d3
        .arc()
        .innerRadius(0)
        .outerRadius(
          Math.min(this.width, this.height) / 2 - this.pieChartOffset
        )
      const arcs = pie(data)
      this.centerG
        .selectAll('path')
        .data(arcs)
        .enter()
        .append('path')
        .attr('fill', d => {
          // console.log(d, this.topicColormap(d.data.topicId))
          return this.topicColormap(d.data.topicId)
        })
        .attr('stroke', 'white')
        .attr('d', arc)
    },
    drawDonut (data) {
      const pieData = [
        { name: 'size', value: data.size, ratio: 1 },
        { name: 'funcNum', value: data.funcNum, ratio: 1 }
      ]
      const pie = d3
        .pie()
        .padAngle(0.005)
        .sort(null)
        .value(d => d.ratio)
      const arcs = pie(pieData)
      this.centerG
        .append('g')
        .attr('class', 'arcs')
        .selectAll('path')
        .data(arcs)
        .enter()
        .append('path')
        .attr('fill', d => {
          if (d.data.name === 'funcNum') {
            return this.funcNumColorMap(d.data.value)
          } else {
            return this.sizeColorMap(d.data.value)
          }
        })
        .attr(
          'd',
          d3
            .arc()
            .innerRadius(
              Math.min(this.width, this.height) / 2 - this.donutInnerOffset
            )
            .outerRadius(
              Math.min(this.width, this.height) / 2 - this.donutOuterOffset
            )
        )
    }
  }
}
</script>

<style lang="less">
.file-bubble-chart {
  display: flex;
  flex-direction: column;
}
</style>