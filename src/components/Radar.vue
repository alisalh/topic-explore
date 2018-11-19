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
      const topicCon = this.doc[0]['Topic_Contribution']
      const levelNumArr = [0, 1]
      const axisLine = d3.line()
      const levelLine = d3.lineRadial()
      /*       const angleScale = d3
        .scaleLinear()
        .domain([0, topicCon.length - 1])
        .range([0, Math.PI * 2]) */
      const angleStep = 2 * Math.PI / topicCon.length
      const levelScale = d3
        .scaleLinear()
        .domain([0, 1])
        .range([0, this.width / 2 - 20])
      // 画坐标轴
      this.centerG
        .selectAll('.axis')
        .data(topicCon)
        .enter()
        .append('path')
        .attr('d', () => {
          return axisLine([[0, 0], [0, this.width / 2 - 20]])
        })
        .attr('fill', 'none')
        .attr('stroke-width', 1)
        .attr('stroke-linejoin', 'round')
        .attr('stroke-linecap', 'round')
        .attr('stroke', 'black')
        .attr(
          'transform',
          d => `rotate(${(d.topicId * angleStep * 180) / Math.PI})`
        )
        // 画刻度
      let levelLinePoints = []
      let radiusOffset = -1
      this.centerG
        .selectAll('.level')
        .data(levelNumArr)
        .enter()
        .append('path')
        .attr('d', (d, i) => {
          levelLinePoints = []
          radiusOffset = levelScale(d)
          for (let i = 0; i < topicCon.length; i++) {
            levelLinePoints.push([i * angleStep, radiusOffset])
          }
          levelLinePoints.push([0, radiusOffset])
          return levelLine(levelLinePoints)
        })
        .attr('fill', 'none')
        .attr('stroke-width', 1)
        .attr('stroke-linejoin', 'round')
        .attr('stroke-linecap', 'round')
        .attr('stroke', 'black')
      /*         .call(d3.axisLeft(topicScale))
        .selectAll('.tick').attr('opacity', 0) */
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