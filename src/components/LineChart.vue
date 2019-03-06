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
      height: 0,
      width: 0,
      lineSvg: null,
      strokeWidth: 1.5,
      curData: [],
      showVersions: [],
      selectedVersion: null
      // verRange: {}
    }
  },
  props: ['topicColormap', 'topicsGroup', 'versions', 'normData'],
  methods: {
    draw (data) {
      // const vm = this
      const margin = { top: 20, right: 25, bottom: 45, left: 40 }
      const brushHeight = 50, gap = 20  //gap表示brush和linechart之间的间隔
      const svg = d3
        .select(this.$refs.root)
        .append('svg')
        .attr('width', this.width)
        .attr('height', this.height)
      var maxY = d3.max(data, topic =>
        d3.max(topic.val, version => version.val.length)
      )
      var y = d3
        .scaleLinear()
        .domain([0, maxY])
        .nice()
        .range([this.height - brushHeight - margin.bottom - gap, margin.top])
      var x = d3
        .scalePoint()
        .domain(this.versions)
        .range([margin.left, this.width - margin.right])
      var xAxis = g =>
        g
          .attr('transform', `translate(0,${this.height - brushHeight -margin.bottom - gap})`)
          .call(d3.axisBottom(x))
          // .call(g =>
          //   g
          //     .select('.tick:last-of-type text')   // 设置x轴文字
          //     .clone()
          //     .attr('text-anchor', 'end')
          //     .attr('font-weight', 'bold')
          //     .attr('class', 'x-label')
          //     .attr('y', -10)
          //     .text('versions')
          // )
          .call(g =>                            // 设置tick
            g
              .selectAll('text:not(.x-label)')
              .style('text-anchor', 'end')
              .attr('dx', '-.8em')
              .attr('dy', '.15em')
              .attr('transform', 'rotate(-65)')
          )
      var yAxis = g =>
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
              .text('number of files(#)')
          )
      svg.append('g').attr('class','axis axis--x').call(xAxis)

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
        // .attr('transform', `translate(${x.bandwidth() / 2},0)`)
        .attr('fill', 'none')
        .attr('stroke-width', this.stokeWidth)
        .attr('stroke-linejoin', 'round')
        .attr('stroke-linecap', 'round')
        .selectAll('path')
        .data(data)
        .enter()
        .append('path')
        .attr('class', 'topic-line')
        .attr('stroke', d => {
          // console.log(d.key, this.topicColormap(parseInt(d.key)))
          return this.topicColormap(parseInt(d.key))
        })
        // .style('mix-blend-mode', 'multiply')
        .attr('d', d => {
          return line(d.val)
        })
        // .on('mouseenter', d => {
        //   // console.log('hover', d.key)
        // })
        // .on('click', d => {
        //   this.$bus.$emit('topic-selected', d.key)
        // })
      // 画版本定位辅助线
      let xOffset = 0
      var gridLine = svg
        .append('g')
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
        .attr('d', d => {
          xOffset = x(d)
          return d3.line()([
            [xOffset, margin.top],
            [xOffset, this.height - margin.bottom-brushHeight -gap]
          ])
        })
        .on('mouseenter', function () {
          d3.select(this).attr('opacity', 0.7)
        })
        .on('mouseout', function () {
          d3.select(this).attr('opacity', 0.0)
        })
        .on('click', d => {
           gridLine
            .on('mouseout', function () {
              d3.select(this).attr('opacity', 0.0)
            })
            .attr('opacity', 0.0)
           gridLine
            .filter(ver => ver === d)
            .on('mouseout', null)
            .attr('opacity', 0.7)
          this.selectedVersion = d
          this.$bus.$emit('version-selected', d)
        })
       
      // // 画点
      // const dot = svg.append('g').attr('display', 'none')
      // dot.append('circle').attr('r', 2.5)
      // dot
      //   .append('text')
      //   .style('font', '10px sans-serif')
      //   .attr('text-anchor', 'middle')
      //   .attr('y', -8)

      // 添加brush的折线图
      const maxBrushY = d3.max(this.normData.map(d => d.val))
      const brushY = d3
        .scaleLinear()
        .domain([0, maxBrushY])
        .range([this.height - margin.bottom, this.height-margin.bottom-brushHeight+gap])
      const brushX = d3
        .scalePoint()
        .domain(this.versions)
        .range([margin.left, this.width - margin.right])
      var brushXAxis = g =>
        g
          .attr('transform', `translate(0,${this.height -margin.bottom})`)
          .call(d3.axisBottom(brushX).tickValues(this.showVersions))
          .call(g =>
            g
              .selectAll('text:not(.x-label)')
              .style('text-anchor', 'end')
              .attr('dx', '-.8em')
              .attr('dy', '.15em')
              .attr('transform', 'rotate(-65)')
          )
      svg.append('g').call(brushXAxis)
      const brushLine = d3.line()
        .curve(d3.curveMonotoneX)
        .x(d => brushX(d.ver))
        .y(d => brushY(d.val))
      svg.append('g')
        .attr('fill', 'none')
        .attr('stroke-width', this.stokeWidth)
        .attr('stroke-linejoin', 'round')
        .attr('stroke-linecap', 'round')
        .append('path')
        .attr('stroke', 'black')
        .attr('d', brushLine(this.normData))
      
      // 添加brush
      var brush = d3.brushX()
        .extent([[margin.left, 0],[this.width - margin.right, brushHeight-gap+2]])
        .on('start', brushstarted.bind(this))
        .on('brush', brushed)
        .on('end', brushended.bind(this))
      svg.append('g')
        .attr('transform', `translate(0,${brushY(maxBrushY)-2})`)
        .attr('class', 'brush')
        .call(brush)
      function brushstarted(){
        gridLine
          .attr('opacity', 0.0)
        this.$bus.$emit('version-restored', 'all')
      }
      function brushended(){
        // 点击brush恢复到原始状态
        let s = d3.event.selection
        if(!s){
          x.domain(brushX.domain())
          svg.select('.axis--x').call(xAxis)
          this.lineSvg = svg.selectAll('.topic-line')
              .data(data)
              .attr('d', d => {
                return line(d.val)
          })
          gridLine
            .attr('opacity', 0.0)
            .attr('d', d => {
              xOffset = x(d)
              return d3.line()([
                [xOffset, margin.top],
                [xOffset, 400 - margin.bottom-brushHeight -gap]
              ])
            })
            .on('mouseenter', function(){
              d3.select(this).attr('opacity', 0.7)
            })
            .on('mouseout', function () {
              d3.select(this).attr('opacity', 0.0)
            })
          this.$bus.$emit('version-returned', 'all')
        }
        else{
          let eachBand = brushX.step()
          let prevIndex = Math.round((s[0]-margin.left)/eachBand),
            curvIndex = Math.round((s[1]-margin.left)/eachBand)
          this.$bus.$emit('version-range-selected',{
            curv: brushX.domain()[curvIndex],
            prev: brushX.domain()[prevIndex]
          })
        }
      }
      function brushed(){
        let s = d3.event.selection
        if (s != null) {
          let eachBand = brushX.step()
          let prevIndex = Math.round((s[0]-margin.left)/eachBand),
            curvIndex = Math.round((s[1]-margin.left)/eachBand)
          // 更新x轴
          this.showVersions = []
          for(let i=prevIndex; i<=curvIndex; i++)
            this.showVersions.push(brushX.domain()[i])
          x.domain(this.showVersions)
          svg.select('.axis--x').call(xAxis)
          // 更新折线
          this.curData = []
          data.forEach(topic => {
            let item = topic.val.filter(d => this.showVersions.indexOf(d.key) != -1)
            this.curData.push({key: topic.key, val: item})
          })
          this.lineSvg = svg.selectAll('.topic-line')
              .data(this.curData)
              .attr('d', d => {
                return line(d.val)
          })
          // 更新辅助线(高度this.height问题)
          gridLine.on('mouseenter', null)
          gridLine.filter(d => this.showVersions.indexOf(d) != -1)
            .on('mouseenter', function(){
              d3.select(this).attr('opacity', 0.7)
            })
            .attr('d', d => {
              xOffset = x(d)
              return d3.line()([
                [xOffset, margin.top],
                [xOffset, 400 - margin.bottom-brushHeight -gap]
              ])
            })
        }
      }
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
  watch: {
  },
  created () {
    // 当所有异步数据都获取完以后才开始渲染(类Promise.all实现)
    const requiredData = ['topicColormap', 'topicsGroup', 'versions', 'normData']
    let cnt = 0
    requiredData.forEach(d => {
      this.$watch(d, val => {
        if (val) cnt++
        if (cnt === requiredData.length) {
          this.showVersions.push(this.versions[0])
          for(let i=1; i<this.normData.length; i++) {
            if(this.normData[i].val >= 2) 
              this.showVersions.push(this.versions[i])
          }
          this.topicsGroup.forEach(topic => {
            let item = topic.val.filter(d => this.showVersions.indexOf(d.key) != -1)
            this.curData.push({key: topic.key, val: item})
          })
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