<template>
    <div class='bubble-chart' ref='root'></div>
</template>

<script>
import * as d3 from 'd3'
export default {
  name: 'component_name',
  data () {
    return {
      width: 0,
      height: 0,
      svg: null,
      centerG: null,
      topicCluster: null
    }
  },
  props: ['topicColormap'],
  methods: {
    draw (data) {
      const pack = data =>
        d3
          .pack()
          .size([this.width, this.height - 25])
          .padding(10)(
            d3
              .hierarchy(data)
              .sum(d => d.size)
              .sort((a, b) => b.value - a.value)
          )
      const root = pack(data)
      const node = this.svg
        .selectAll('g')
        .data(root.descendants())
        .enter()
        .append('g')
        .attr('transform', d => `translate(${d.x + 1},${d.y + 10})`)
      node
        .append('circle')
        .attr('r', d => d.r)
        .attr('fill', d => {
          if (!d.children) {
            return this.topicColormap(d.data.index[0])
          }
          return '#fff'
        })
        .attr('stroke', '#000')
      node
        .filter(d => !d.children)
        .attr('fill', d => this.topicColormap(d.data.index[0]))
    }
  },
  created () {
    // 当所有异步数据都获取完以后才开始渲染(类Promise.all实现)
    const requiredData = ['topicColormap', 'topicCluster']
    let cnt = 0
    requiredData.forEach(d => {
      this.$watch(d, () => {
        cnt++
        if (cnt === requiredData.length) {
          this.draw(this.topicCluster)
        }
      })
    })
  },
  mounted () {
    this.height = Math.floor(this.$refs.root.clientHeight)
    this.width = Math.floor(this.$refs.root.clientWidth)
    this.svg = d3
      .select(this.$refs.root)
      .append('svg')
      .attr('width', this.width)
      .attr('height', this.height)
    /*     this.centerG = this.svg
      .append('g')
      .attr(
        'transform',
        'translate(' + this.width / 2 + ',' + this.height / 2 + ')'
      ) */
    this.$axios.get('topics/getTopicCluster', {}).then(({ data }) => {
      this.topicCluster = data
    })
  }
}
</script>

<style lang="less">
.bubble-chart {
  height: 100%;
}
</style>