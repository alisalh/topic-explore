<template>
  <div class="line-chart"
       ref="root">
  </div>
</template>

<script>
import * as d3 from 'd3'
export default {
  name: 'component_name',
  data () {
    return {
      topicsGroup: null,
      height: 0,
      width: 0,
      versions: null,
      lineSvg: null,
      strokeWidth: 1.5
    }
  },
  props: ['topicColormap', 'docVerData'],
  methods: {
    groupBy (arr, prop) {
      const propType = typeof prop
      const cb = function (d) {
        if (propType === 'string') return d[prop]
        else return prop(d)
      }
      let propsCategory = [...new Set(arr.map(d => cb(d)))]
      let res = []
      propsCategory.forEach(p => {
        res.push({
          key: p,
          val: arr.filter(d => cb(d) === p)
        })
      })
      return res
    },
    verCompare ({ key: a }, { key: b }) {
      let arr = a.split('.').map(d => parseInt(d))
      let brr = b.split('.').map(d => parseInt(d))
      for (let i = 0, len = arr.length; i < len; i++) {
        if (arr[i] < brr[i]) {
          return -1
        } else if (arr[i] > brr[i]) {
          return 1
        }
      }
    },
    dataAdapter (rawData) {
      rawData.forEach(
        d => (d['Dominant_Topic'] = parseInt(d['Dominant_Topic']))
      )
      let topicsGroup = this.groupBy(rawData, 'Dominant_Topic')
      let verReg = /vue-(\d*\.\d*\.\d*)/
      topicsGroup.forEach(d => {
        d.val = this.groupBy(d.val, d => d.filename.match(verReg)[1]).sort(
          this.verCompare
        )
      })
      return topicsGroup
    },
    draw (data) {
      const vm = this
      const margin = { top: 20, right: 20, bottom: 40, left: 50 }
      const svg = d3
        .select(this.$refs.root)
        .append('svg')
        .attr('width', this.width)
        .attr('height', this.height)
      const maxY = d3.max(data, topic =>
        d3.max(topic.val, version => version.val.length)
      )
      const y = d3
        .scaleLinear()
        .domain([0, maxY])
        .nice()
        .range([this.height - margin.bottom, margin.top])
      const x = d3
        .scaleBand()
        .domain(this.versions)
        .range([margin.left, this.width - margin.right])
        .padding(0.1)
      const xAxis = g =>
        g
          .attr('transform', `translate(0,${this.height - margin.bottom})`)
          .call(d3.axisBottom(x))
          .call(g =>
            g
              .select('.tick:last-of-type text')
              .clone()
              .attr('text-anchor', 'end')
              .attr('font-weight', 'bold')
              .attr('class', 'x-label')
              .attr('y', -10)
              .text('版本号')
          )
          .call(g =>
            g
              .selectAll('text:not(.x-label)')
              .style('text-anchor', 'end')
              .attr('dx', '-.8em')
              .attr('dy', '.15em')
              .attr('transform', 'rotate(-65)')
          )
      const yAxis = g =>
        g
          .attr('transform', `translate(${margin.left},0)`)
          .call(d3.axisLeft(y))
          .call(g => g.select('.domain').remove())
          .call(g =>
            g
              .select('.tick:last-of-type text')
              .clone()
              .attr('x', 3)
              .attr('text-anchor', 'start')
              .attr('font-weight', 'bold')
              .text('文件数(#)')
          )
      svg.append('g').call(xAxis)

      svg.append('g').call(yAxis)
      // 画线
      const line = d3
        .line()
        .curve(d3.curveBasis)
        // .defined(d => !isNaN(d))
        .x(d => {
          return x(d.key)
        })
        .y(d => y(d.val.length))
      this.lineSvg = svg
        .append('g')
        .attr('transform', `translate(${x.bandwidth() / 2},0)`)
        .attr('fill', 'none')
        .attr('stroke-width', this.stokeWidth)
        .attr('stroke-linejoin', 'round')
        .attr('stroke-linecap', 'round')
        .selectAll('path')
        .data(data)
        .enter()
        .append('path')
        .attr('stroke', d => {
          // console.log(d.key, this.topicColormap(parseInt(d.key)))
          return this.topicColormap(parseInt(d.key))
        })
        // .style('mix-blend-mode', 'multiply')
        .attr('d', d => {
          return line(d.val)
        })
        .on('mouseenter', d => {
          // console.log('hover', d.key)
        })
        .on('click', d => {
          this.$bus.$emit('topic-selected', d.key)
        })
      // 画x轴延长线
      const gridLine = d3.line()
      let xOffset = 0
      svg
        .append('g')
        .attr('transform', `translate(${x.bandwidth() / 2},0)`)
        .attr('fill', 'none')
        .attr('stroke-width', 3)
        .attr('stroke-linejoin', 'round')
        .attr('stroke-linecap', 'round')
        .attr('stroke', 'black')
        .attr('stroke-dasharray', '5,5')
        .selectAll('.x-grid-line')
        .data(this.versions)
        .enter()
        .append('path')
        .attr('opacity', 0)
        .attr('d', (d, i) => {
          xOffset = x(d)
          return gridLine([
            [xOffset, margin.top],
            [xOffset, this.height - margin.bottom]
          ])
        })
        .on('mouseenter', function () {
          d3.select(this).attr('opacity', 0.7)
        })
        .on('mouseout', function () {
          d3.select(this).attr('opacity', 0.0)
        })
        .on('click', d => {
          console.log(d)
          this.$bus.$emit('version-selected', d)
        })
      // 画点
      const dot = svg.append('g').attr('display', 'none')
      dot.append('circle').attr('r', 2.5)
      dot
        .append('text')
        .style('font', '10px sans-serif')
        .attr('text-anchor', 'middle')
        .attr('y', -8)
    },
    resetLineStatus () {
      this.lineSvg.attr('opacity', 1).attr('stroke-width', this.strokeWidth)
    },
    highlightLine (topicId) {
      this.resetLineStatus()
      this.lineSvg
        .filter(d => parseInt(d.key) === topicId)
        .attr('stroke-width', 3)
      this.lineSvg
        .filter(d => parseInt(d.key) !== topicId)
        .attr('opacity', 0.1)
    }
  },
  watch: {},
  created () {
    // 当所有异步数据都获取完以后才开始渲染(类Promise.all实现)
    const requiredData = ['topicColormap', 'docVerData']
    let cnt = 0
    requiredData.forEach(d => {
      this.$watch(d, val => {
        cnt++
        if (d === 'docVerData') {
          this.versions = val.versions
          this.topicsGroup = this.dataAdapter(val.files)
        }
        if (cnt === requiredData.length) {
          this.draw(this.topicsGroup)
        }
      })
    })
  },
  mounted () {
    this.height = Math.floor(this.$refs.root.clientHeight)
    this.width = Math.floor(this.$refs.root.clientWidth)
    this.$bus.$on('topic-selected', topicId => {
      if (topicId === -1) this.resetLineStatus()
      else this.highlightLine(topicId)
    })
  }
}
</script>

<style lang="less">
.line-chart {
  height: 100%;
}
</style>