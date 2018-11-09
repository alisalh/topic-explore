<template>
  <div class="line-chart" ref="root">
  </div>
</template>

<script>
import * as d3 from 'd3'
export default {
  name: 'component_name',
  data () {
    return {
      topicsGroup: null,
      height: 300,
      width: 800,
      versions: null
    }
  },
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
      console.log(topicsGroup)
      return topicsGroup
    },
    draw (data) {
      const margin = { top: 20, right: 20, bottom: 30, left: 40 }
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
      const yAxis = g =>
        g.attr('transform', `translate(${margin.left},0)`).call(d3.axisLeft(y))
      svg.append('g').call(xAxis)
      svg.append('g').call(yAxis)
      // 画线
      const line = d3
        .line()
        .curve(d3.curveBasis)
        // .defined(d => !isNaN(d))
        .x(d => {
          console.log(d.key)
          return x(d.key)
        })
        .y(d => y(d.val.length))
      const lineColorMap = d3
        .scaleOrdinal()
        .domain(data.map(d => parseInt(d.key)).sort((a, b) => a - b))
        .range([
          '#8dd3c7',
          '#ffffb3',
          '#bebada',
          '#fb8072',
          '#80b1d3',
          '#fdb462',
          '#b3de69',
          '#fccde5',
          '#d9d9d9',
          '#bc80bd'
        ])
      // 画坐标轴
      const path = svg
        .append('g')
        .attr('fill', 'none')
        .attr('stroke-width', 1.5)
        .attr('stroke-linejoin', 'round')
        .attr('stroke-linecap', 'round')
        .selectAll('path')
        .data(data)
        .enter()
        .append('path')
        .attr('stroke', d => lineColorMap(parseInt(d.key)))
        // .style('mix-blend-mode', 'multiply')
        .attr('d', d => {
          console.log(d.key)
          return line(d.val)
        })
    }
  },
  mounted () {
    this.$axios.get('topics/getAllDocs', {}).then(({ data }) => {
      this.versions = data.versions
      this.topicsGroup = this.dataAdapter(data.files)
      this.draw(this.topicsGroup)
    })
  }
}
</script>

<style lang="scss" scoped>
</style>