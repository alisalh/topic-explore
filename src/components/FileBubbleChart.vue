<template>
  <div class='file-bubble-chart'
       ref="root">

  </div>
</template>

<script>
import * as d3 from 'd3'
export default {
  name: 'component_name',
  props: ['fileData', 'topicColormap'],
  data () {
    return {
      width: null,
      height: null,
      svg: null,
      centerG: null
    }
  },
  mounted () {
    console.log(this.fileData)
    this.height = Math.floor(this.$refs.root.clientHeight)
    this.width = Math.floor(this.$refs.root.clientWidth)
    this.svg = d3
      .select(this.$refs.root)
      .append('svg')
      .attr('width', this.width)
      .attr('height', this.height)
  },
  watch: {
    fileData (val) {
      this.clear()
      if (!val) return
      this.draw(val)
    }
  },
  methods: {
    clear () {
      // d3.select('.file-bubble-chart>svg *').remove()
      d3.select(this.$refs.root)
        .select('svg *')
        .remove()
    },
    draw (data) {
      console.log(this.topicColormap(9))
      this.centerG = this.svg
        .append('g')
        .attr('transform', `translate(${this.width / 2},${this.height / 2})`)
      console.log(data)
      const pie = d3
        .pie()
        .sort(null)
        .value(d => d.percent)
      const arc = d3
        .arc()
        .innerRadius(0)
        .outerRadius(Math.min(this.width, this.height) / 2 - 1)
      const arcs = pie(data['Topic_Contribution'])
      console.log(arcs)
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