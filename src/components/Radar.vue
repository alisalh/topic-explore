<template>
  <div class='radar'
       ref='root'>
  </div>
</template>

<script>
import * as d3 from 'd3'
export default {
  name: 'component_name',
  data () {
    return {
      width: 125,
      height: 125,
      svg: null,
      centerG: null
    }
  },
  props: ['doc', 'funcNumColorMap', 'sizeColorMap'],
  watch: {
    doc () {
      this.draw()
    }
  },
  methods: {
    draw () {
      // console.log('draw radar')
      const topicCon = this.doc.data[0]['Topic_Contribution']
      const levelNumArr = [0, 0.2, 0.4, 0.6, 0.8, 1]
      const axisLine = d3.line()
      const levelLine = d3.lineRadial()
      /*       const angleScale = d3
        .scaleLinear()
        .domain([0, topicCon.length - 1])
        .range([0, Math.PI * 2]) */
      const angleStep = (2 * Math.PI) / topicCon.length
      const levelScale = d3
        .scaleLinear()
        .domain([0, 1])
        .range([0, this.width / 2 - 20])
      // 画刻度
      let levelLinePoints = []
      let radiusOffset = -1
      this.centerG
        .selectAll('.level')
        .data(levelNumArr)
        .enter()
        .append('circle')
        .attr('r', d => levelScale(d))
        .attr('stroke', 'rgb(205, 205, 205)')
        .attr('fill', 'rgb(205, 205, 205)')
        .attr('fill-opacity', 0.2)
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
        .attr('stroke-width', 2)
        .attr('stroke-linejoin', 'round')
        .attr('stroke-linecap', 'round')
        .attr('stroke', 'white')
        .attr(
          'transform',
          d => `rotate(${(d.topicId * angleStep * 180) / Math.PI})`
        )
      /*         .append('path')
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
        .attr('stroke', 'black') */
      // 画雷达线
      const lineColorMap = d3
        .scaleOrdinal()
        .domain(['pre', 'next'])
        .range(['#fc8d59', '#91cf60'])
      this.centerG
        .selectAll('.radar-line')
        .data(this.doc.data)
        .enter()
        .append('path')
        .attr('d', (d, i) => {
          levelLinePoints = []
          // radiusOffset = levelScale(d)
          for (let i = 0; i < topicCon.length; i++) {
            levelLinePoints.push([
              i * angleStep,
              levelScale(d['Topic_Contribution'][i].percent)
            ])
          }
          // console.log(d, levelLinePoints)
          levelLinePoints.push([
            0,
            levelScale(d['Topic_Contribution'][0].percent)
          ])
          return levelLine(levelLinePoints)
        })
        .attr('fill', 'none')
        .attr('stroke-width', 3)
        .attr('stroke-linejoin', 'round')
        .attr('stroke-linecap', 'round')
        .attr('stroke', d => lineColorMap(d.version))
        .attr('opacity', 0.5)
        .on('click', d => {
          console.log(d)
        })

      this.drawDonut()
    },
    drawDonut () {
      const pieData = [
        { name: 'size', value: this.doc.size, ratio: 1 },
        { name: 'funcNum', value: this.doc.funcNum, ratio: 1 }
      ]
      const pie = d3
        .pie()
        .padAngle(0.005)
        .sort(null)
        .value(d => d.ratio)
      const arcs = pie(pieData)
      this.centerG
        .append('g')
        .attr('class', 'arcs')
        .selectAll('path')
        .data(arcs)
        .enter()
        .append('path')
        .attr('fill', d => {
          if (d.data.name === 'funcNum') {
            return this.funcNumColorMap(d.data.value)
          } else {
            return this.sizeColorMap(d.data.value)
          }
        })
        .attr(
          'd',
          d3
            .arc()
            .innerRadius(this.width / 2 - 20)
            .outerRadius(this.width / 2 - 16)
        )
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
      .on('click', d => {
        console.log(this.doc)
      })
    this.draw()
  }
}
</script>

<style lang="less">
</style>