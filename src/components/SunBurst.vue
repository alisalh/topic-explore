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
      this.$refs.root.innerHTML = ''
      let root = d3.hierarchy(data)
      // 后序遍历, value相加, 详情见https://github.com/xswei/d3-hierarchy
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
          return Math.max(-Math.PI/2, Math.min(-Math.PI/2 + 2*Math.PI, -Math.PI/2 + x(d.x0)))
        })
        .endAngle(function (d) {
          return Math.max(-Math.PI/2, Math.min(-Math.PI/2 + 2*Math.PI, -Math.PI/2 + x(d.x1)))
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
        .attr('id', (d, i) => 'hierarchy-node-'+i)
        .attr('d', arc)
        .style('stroke', function() {
          return 'black'
        })
        .style('fill', d => {
          if (d.data.type === 'dir') {
            return '#f0f0f0'
          }
          // console.log(d.data.topic, this.topicColormap(parseInt(d.data.topic)))
          return this.topicColormap(parseInt(d.data.topic))
        })
        // 添加不可见的arc, text根据该arc显示(详情见https://www.visualcinnamon.com/2015/09/placing-text-on-arcs.html)
        .each((d, i) => {
          var firstArcSection = /(^.+?)L/
          var newArc = firstArcSection.exec(node.select('#hierarchy-node-'+i).attr('d'))[1]
          newArc = newArc.replace(/,/g, ' ')
          if(newArc.split(' ')[7] > Math.PI/2){
            var startLoc = /M(.*?)A/,
              middleLoc = /A(.*?)0 0 1/,
              endLoc = /0 0 1 (.*?)$/
            var newStart = endLoc.exec(newArc)[1],
              newEnd = startLoc.exec(newArc)[1],
              middleSec = middleLoc.exec(newArc)[1]
            newArc = 'M' + newStart + 'A' + middleSec + '0 0 0' + newEnd 
          }
          node.append('path')
            .attr('class', 'hiddenDonutArcs')
            .attr('id', 'donutArc'+i)
            .attr('d', newArc)
            .style('fill', 'none')
        })
        .on('click', d => {
          console.log(d)
        })
      node
        .append('text')
        .attr('dy', function(d) { 
          var angle = arc(d).split(',')[7].split('L')
          return (angle[0] > Math.PI/2 ? -6 : 18) 
        })
        .append('textPath')
        .attr('startOffset','50%')
        .style('text-anchor','middle')
        .attr('xlink:href', (d, i) => '#donutArc'+i)
        .text(function(d){
          if(d.data.type === 'dir')
            return d.data.name.substr(d.data.name.lastIndexOf('\\') + 1)
        })
        
        
      this.arcSvg
        .append('title')
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
    this.$bus.$on('cluster-selected', ids => {
      console.log('ids: ' + ids)
      this.resetStatus()
      if (ids === null) {
        return
      }
      this.arcSvg
        .filter(d => d.data.type !== 'dir' && ids.indexOf(d.data.id) === -1)
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