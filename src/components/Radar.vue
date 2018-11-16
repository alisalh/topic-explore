<template>
    <div class='radar' ref='root'>
    </div>
</template>

<script>
import * as d3 from 'd3'
export default {
  name: 'component_name',
  data () {
    return {
      width: 150,
      height: 150,
      svg: null,
      centerG: null
    }
  },
  props: ['doc'],
  methods: {
    draw () {
      const topicCon = this.doc['Topic_Contribution']
      const angleScale = d3
        .scaleLinear()
        .domain([0, topicCon.length - 1])
        .range([0, Math.PI * 2])
      const topicScale = d3
        .scaleLinear()
        .domain([0, 1])
        .range([0, this.width / 2 - 20])
      this.centerG
        .selectAll('.axis')
        .data(topicCon)
        .enter()
        .append('g')
        .attr(
          'transform',
          d => `rotate(${(angleScale(d.topicId) * 180) / Math.PI})`
        )
        .call(d3.axisLeft(topicScale))
        .selectAll('.tick').attr('opacity', 0)
    }
  },
  mounted () {
    this.svg = d3
      .select(this.$refs.root)
      .append('svg')
      .attr('width', this.width)
      .attr('height', this.height)
    this.centerG = this.svg
      .append('g')
      .attr('transform', `translate(${this.width / 2},${this.height / 2})`)
    this.draw()
  }
}
</script>

<style lang="less">
</style>