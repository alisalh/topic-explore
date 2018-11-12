<template>
  <div class='sunburst' ref='root'></div>
</template>

<script>
import * as d3 from 'd3'
import { TOPIC_COLOR } from '../utils/constant.js'
export default {
  name: 'component_name',
  data () {
    return {
      width: 300,
      height: 300
    }
  },
  methods: {
    draw (data) {
      let root = d3.hierarchy(data)
      root.sum(d => (d.children ? 0 : 1))
      let svg = d3
        .select(this.$refs.root)
        .append('svg')
        .attr('width', this.width)
        .attr('height', this.height)
        .append('g')
        .attr(
          'transform',
          'translate(' + this.width / 2 + ',' + this.height / 2 + ')'
        )
      var x = d3.scaleLinear().range([0, 2 * Math.PI])
      var y = d3
        .scaleLinear()
        .range([0, this.height / 2])
        .domain([1, 0])
      const topicColorMap = d3
        .scaleOrdinal()
        .domain(data.map(d => parseInt(d.key)).sort((a, b) => a - b))
        .range(TOPIC_COLOR)
      var partition = d3.partition()
      var arc = d3
        .arc()
        .startAngle(function (d) {
          return Math.max(0, Math.min(2 * Math.PI, x(d.x0)))
        })
        .endAngle(function (d) {
          return Math.max(0, Math.min(2 * Math.PI, x(d.x1)))
        })
        .innerRadius(function (d) {
          return Math.max(0, y(d.y0))
        })
        .outerRadius(function (d) {
          return Math.max(0, y(d.y1))
        })
      var node = svg
        .selectAll('.hierarchy-node')
        .data(
          partition(root)
            .descendants()
            .slice(1)
        )
        .enter()
        .append('g')
      node
        .append('path')
        .attr('class', 'hierarchy-node')
        .attr('d', arc)
        .attr('id', d => d.data.filename)
        .style('stroke', d => {
          return 'white'
        })
        .style('fill', function (d) {
          if (d.data.type === 'dir') {
            return '#fed9a6'
          }
          return '#e5d8bd' /* color((d.children ? d : d.parent).data.name); */
        })
        .on('click', d => {
          console.log(d)
        })
    }
  },
  mounted () {
    this.$bus.$on('version-selected', d => {
      this.$axios
        .get('topics/getTopicDisByVersion', { version: d })
        .then(({ data }) => {
          this.draw(data)
        })
    })
  }
}
</script>

<style lang="scss" scoped>
</style>