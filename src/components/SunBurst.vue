<template>
  <div class='sunburst'
       ref='root'>
    <!-- <svg></svg> -->
  </div>
</template>

<script>
import * as d3 from 'd3'
export default {
  name: 'component_name',
  data () {
    return {
      // width: 600,
      height: 0,
      arcSvg: null
    }
  },
  computed: {
    width () {
      return this.height
    }
  },
  props: ['topicColormap'],
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
        .range([100, this.height / 2])
        .domain([1, 0])

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
      this.arcSvg = node
        .append('path')
        .attr('class', 'hierarchy-node')
        .attr('d', arc)
        .attr('id', d => d.data.filename)
        .style('stroke', d => {
          return 'black'
        })
        .style('fill', d => {
          if (d.data.type === 'dir') {
            return '#f0f0f0'
          }
          // console.log(d.data.topic, this.topicColormap(parseInt(d.data.topic)))
          return this.topicColormap(parseInt(d.data.topic))
        })
        .on('click', d => {
          console.log(d)
        })
      this.arcSvg
        .append('title')
        // .text(function(d) { return d.data.name.slice(d.data.name.lastIndexOf('/') + 1) })
        .text(d => d.data.name)
      node
        .filter(d => d.data.type === 'dir')
        .attr('stroke-dasharray', '5,5')
        .attr('stroke-opacity', '0.6')
    },
    resetStatus () {
      this.arcSvg.attr('opacity', 1)
    }
  },
  created () {
    this.$bus.$on('topic-selected', topicId => {
      this.resetStatus()
      if (topicId === -1) {
        return
      }
      this.arcSvg
        .filter(
          d => d.data.type !== 'dir' && parseInt(d.data.topic) !== topicId
        )
        .attr('opacity', 0.1)
    })
  },
  mounted () {
    this.height = Math.floor(this.$refs.root.clientHeight)
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

<style lang="less">
.sunburst {
  height: 100%;
}
</style>