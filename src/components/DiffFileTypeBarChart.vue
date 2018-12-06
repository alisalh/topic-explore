<template>
  <div class='diff-file-type-bar-chart'
       ref="root"></div>
</template>

<script>
import * as d3 from 'd3'
export default {
  name: 'component_name',
  props: ['diffFileGroup'],
  data () {
    return {
      width: 0,
      height: 0,
      chartData: [],
      svg: null
    }
  },
  watch: {
    diffFileGroup (val) {
      this.chartData = val.map(d => ({
        num: d.docs.length,
        type: d.type
      }))
      this.draw(this.chartData)
    }
  },
  methods: {
    clear () {
      this.svg.selectAll('*').remove()
    },
    draw (data) {
      this.clear()
      var svg = this.svg
      var margin = { top: 10, right: 10, bottom: 30, left: 30 }
      var width = svg.attr('width') - margin.left - margin.right
      var height = svg.attr('height') - margin.top - margin.bottom
      const colorMap = d3
        .scaleOrdinal()
        .domain(data.map(d => d.type))
        .range(['#8dd3c7', '#ffffb3', '#bebada'])
      var g = svg
        .append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
      var x = d3
        .scaleBand()
        .rangeRound([0, width])
        .padding(0.1)
      var y = d3.scaleLinear().rangeRound([height, 0])
      x.domain(
        data.map(function (d) {
          return d.type
        })
      )
      y.domain([
        0,
        d3.max(data, function (d) {
          return d.num
        })
      ])

      g.append('g')
        .attr('class', 'axis axis--x')
        .attr('transform', 'translate(0,' + height + ')')
        .call(d3.axisBottom(x))

      g.append('g')
        .attr('class', 'axis axis--y')
        .call(d3.axisLeft(y))

      g.selectAll('.bar')
        .data(data)
        .enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('x', function (d) {
          return x(d.type)
        })
        .attr('y', function (d) {
          return y(d.num)
        })
        .attr('width', x.bandwidth())
        .attr('height', function (d) {
          return height - y(d.num)
        })
        .attr('fill', d => colorMap(d.type))
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
  }
}
</script>

<style lang="less">
</style>