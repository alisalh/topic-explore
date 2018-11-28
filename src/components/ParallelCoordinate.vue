<template>
  <div class='parallel-coordinate'
       ref='root'></div>
</template>

<script>
import * as d3 from 'd3'
export default {
  name: 'component_name',
  data () {
    return {
      svgHeight: 0,
      svgWidth: 0,
      clusterFiles: null
    }
  },
  computed: {
    y () {
      return d3
        .scaleBand()
        .domain(this.dimensions)
        .range([0, this.width])
        .paddingInner(1)
        .paddingOuter(0.3)
    },
    dimensions () {
      return Array(this.topicData.length)
        .fill(null)
        .map((d, i) => i)
    }
  },
  props: ['docVerData', 'topicData'],
  methods: {
    draw (data) {
      var margin = { top: 10, right: 30, bottom: 20, left: 40 }
      var width = this.svgWidth - margin.left - margin.right
      var height = this.svgHeight - margin.top - margin.bottom
      function path (d) {
        return line(
          dimensions.map(function (dim) {
            return [x[dim](d['Topic_Contribution'][dim].percent), y(dim)]
          })
        )
      }
      var svg = d3
        .select(this.$refs.root)
        .append('svg')
        .attr('width', this.svgWidth)
        .attr('height', this.svgHeight)
        .append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
      const dimensions = Array(this.topicData.length)
        .fill(null)
        .map((d, i) => i)
      const y = d3
        .scaleBand()
        .domain(dimensions)
        .range([0, height])
        .paddingInner(1)
        .paddingOuter(0.3)
      const x = {}
      dimensions.forEach(d => {
        x[d] = d3
          .scaleLinear()
          .domain(
            d3.extent(data, function (p) {
              return p['Topic_Contribution'][d].percent
            })
          )
          .range([width, 0])
      })
      var g = svg
        .selectAll('.dimension')
        .data(dimensions)
        .enter()
        .append('g')
        .attr('class', 'dimension')
        .attr('transform', function (d) {
          return 'translate(0,' + y(d) + ')'
        })
      g.append('g')
        .attr('class', 'axis')
        .each(function (d) {
          d3.select(this).call(d3.axisBottom(x[d]))
        })
        .append('text')
        .attr('fill', 'black')
        .style('text-anchor', 'middle')
        .attr('x', -9)
        .text(function (d) {
          return d
        })
      var line = d3.line().curve(d3.curveCardinal)
      svg
        .append('g')
        .attr('class', 'foreground')
        .selectAll('path')
        .data(data)
        .enter()
        .append('path')
        .attr('d', path)
    }
  },
  created () {
    this.$bus.$on('cluster-selected', ids => {
      this.clusterFiles = this.docVerData.files.filter(
        d => ids.indexOf(d['id']) !== -1
      )
      this.draw(this.clusterFiles)
      console.log(this.clusterFiles)
    })
  },
  mounted () {
    this.svgWidth = Math.floor(this.$refs.root.clientWidth)
    this.svgHeight = Math.floor(this.$refs.root.clientHeight)
  }
}
</script>

<style lang="less">
.parallel-coordinate {
  height: 100%;
  .foreground path {
    fill: none;
    stroke: steelblue;
    stroke-opacity: 0.7;
  }
}
</style>