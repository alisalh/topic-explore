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
      gridLineG: null,
      strokeWidth: 1.5,
      curData: [],
      showVersions: [],
      selectedVersion: null,
      selectedTopic: null,
      tickValues: null, 
      flag: false
      // verRange: {}
    }
  },
  props: ['topicColormap', 'topicsGroup', 'versions', 'normData'],
  methods: {
    draw (data) {
      // const vm = this
      const margin = { top: 10, right: 25, bottom: 90, left: 40 }
      const brushHeight = 30, gap = 40  //gap表示brush和linechart之间的间隔
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
        .range([this.height-margin.bottom+gap, margin.top+brushHeight+gap])
      var x = d3
        .scalePoint()
        .domain(this.versions)
        .range([margin.left, this.width - margin.right])
      var xAxis = g =>
        g
          .attr('transform', `translate(0,${this.height - margin.bottom + gap})`)
          .call(d3.axisBottom(x).tickValues(this.tickValues))
          .call(g =>
            g
              .select('.tick:last-of-type text')   // 设置x轴文字
              .clone()
              .attr('text-anchor', 'end')
              .attr('font-weight', 'bold')
              .attr('class', 'x-label')
              .attr('y', -10)
              .text('versions')
          )
          .call(g =>                            // 设置tick
            g
              .style('cursor', 'default')
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
              .text('number of files')
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
      svg.on('click', ()=>{
        if(!this.flag){
          this.resetLineStatus()
          this.selectedTopic = null
          this.$bus.$emit('line-restored', {})
        }
        else{
          this.flag = false
        }
      })
        
      this.lineSvg = svg
        .append('g')
        // .attr('transform', `translate(${x.bandwidth() / 2},0)`)
        .attr('fill', 'none')
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
        .attr('stroke-width', 1.5)
        // .style('mix-blend-mode', 'multiply')
        .attr('d', d => {
          return line(d.val)
        })
        .on('click', d => {
          d3.event.stopPropagation()
          this.selectedTopic = d.key
          this.resetLineStatus()
          this.highlightLine(d.key)
          this.$bus.$emit('line-selected', d.key)
        })
        
      // 画版本定位辅助线
      let xOffset = 0
      this.gridLineG = svg
        .append('g')
      var gridLine = this.gridLineG
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
        .attr('class', 'x-grid-line')
        .attr('id', d => 'grid-line-'+d.replace(/\./g, ''))
        .attr('opacity', 0)
        .attr('d', d => {
          xOffset = x(d)
          return d3.line()([
            [xOffset, margin.top+brushHeight+gap],
            [xOffset, 400 - margin.bottom+gap]
          ])
        })
        // .on('mouseenter', function () {
        //   d3.select(this).attr('opacity', 0.7)
        // })
        // .on('mouseout', function () {
        //   d3.select(this).attr('opacity', 0.0)
        // })
        // .on('click', d => {
        //    gridLine
        //     .on('mouseout', function () {
        //       d3.select(this).attr('opacity', 0.0)
        //     })
        //     .attr('opacity', 0.0)
        //    gridLine
        //     .filter(ver => ver === d)
        //     .on('mouseout', null)
        //     .attr('opacity', 0.7)
        //   this.selectedVersion = d
        //   this.$bus.$emit('version-selected', d)
        // })

        // 点击tick显示辅助线
        svg.select('.axis')
          .selectAll('.tick')
          .on('mouseenter', d=>{
            gridLine
              .filter(ver => ver === d)
              .attr('opacity', 0.7)
          })
          .on('mouseleave', ()=>{
            gridLine.attr('opacity', 0.0)
            gridLine
              .filter(ver => ver === this.selectedVersion)
              .attr('opacity', 0.7)
          })
          .on('click', d=>{
            gridLine.attr('opacity', 0.0)
            if(d === this.selectedVersion){
              this.selectedVersion = null
              this.$bus.$emit('version-restored', 'all')
            }
            else {
              gridLine
                .filter(ver => ver === d)
                .attr('opacity', 0.7)
              this.selectedVersion = d
              if(this.selectedTopic || this.selectedTopic === 0) this.flag = true
              this.$bus.$emit('version-selected', {version: d, topic: this.selectedTopic})
            }
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
        .range([margin.top+brushHeight, margin.top])
      const brushX = d3
        .scalePoint()
        .domain(this.versions)
        .range([margin.left, this.width - margin.right])
      var brushXAxis = g =>
        g
          .attr('transform', `translate(0,${margin.top+brushHeight})`)
          .call(d3.axisBottom(brushX).tickValues(this.showVersions))
          .call(g => g.select('.domain').remove())
          .call(g =>
            g
              .selectAll('text:not(.x-label)')
              .style('text-anchor', 'middle')
              .attr('dy', '1em')
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
        .attr('stroke', 'grey')
        .attr('d', brushLine(this.normData))
      
      // 添加brush
      var brush = d3.brushX()
        .extent([[margin.left, 0],[this.width - margin.right, brushHeight+2]])
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
        this.selectedVersion = null
        this.$bus.$emit('version-restored', 'all')
      }
      function brushended(){
        // 点击brush恢复到原始状态
        let s = d3.event.selection
        if(!s){
          x.domain(brushX.domain())
          // 更新刻度
          this.tickValues = null
          if(brushX.domain().length > 40){
            let n = Math.round(brushX.domain().length/40)
            this.tickValues = brushX.domain().filter((d, i) => i%n === 0)
            this.tickValues.push(brushX.domain().slice(-1)[0])
          }
          else{
            this.tickValues = brushX.domain()
          }
          xAxis = g => 
            g
            .call(d3.axisBottom(x).tickValues(this.tickValues))
            .call(g =>
            g
              .select('.tick:last-of-type text')   // 设置x轴文字
              .clone()
              .attr('text-anchor', 'end')
              .attr('font-weight', 'bold')
              .attr('class', 'x-label')
              .attr('y', -10)
              .text('versions')
            )
            .call(g =>                            // 设置tick
              g
                .style('cursor', 'default')
                .selectAll('text:not(.x-label)')
                .style('text-anchor', 'end')
                .attr('dx', '-.8em')
                .attr('dy', '.15em')
                .attr('transform', 'rotate(-65)')
            )
          svg.select('.axis--x').call(xAxis)
          this.lineSvg = svg.selectAll('.topic-line')
              .data(data)
              .attr('d', d => {
                return line(d.val)
          })
          gridLine
            .attr('opacity', 0.0)
            .attr('transform', d => {
              let reg = /M(.*)L/
              let pos = reg.exec(this.gridLineG.select('#grid-line-'+d.replace(/\./g,'')).attr('d'))[1]
              xOffset = x(d)-pos.split(',')[0]
              return `translate(${xOffset},0)`
            })
        }
        else{
          let eachBand = brushX.step()
          let prevIndex = Math.round((s[0]-margin.left)/eachBand),
            curvIndex = Math.round((s[1]-margin.left)/eachBand)
          // 更新x轴
          this.showVersions = []
          for(let i=prevIndex; i<=curvIndex; i++)
            this.showVersions.push(brushX.domain()[i])
          x.domain(this.showVersions)
          svg.select('.axis--x').call(xAxis)
           // 更新辅助线
          gridLine.filter(d => this.showVersions.indexOf(d) === -1)
            .attr('opacity', 0.0)
            .attr('transform', d => {
              let reg = /M(.*)L/
              let curLine = this.gridLineG.select('#grid-line-'+d.replace(/\./g,''))
              let pos = reg.exec(curLine.attr('d'))[1]
              xOffset = 0-pos.split(',')[0]
              return `translate(${xOffset},0)`
            })
          gridLine.filter(d => this.showVersions.indexOf(d) != -1)
            .attr('transform', d => {
              let reg = /M(.*)L/
              let curLine = this.gridLineG.select('#grid-line-'+d.replace(/\./g,''))
              let pos = reg.exec(curLine.attr('d'))[1]
              xOffset = x(d)-pos.split(',')[0]
              return `translate(${xOffset},0)`
          })
        }
        // 重新绑定tick事件
        svg.select('.axis')
          .selectAll('.tick')
          .on('mouseenter', d=>{
            gridLine
              .filter(ver => ver === d)
              .attr('opacity', 0.7)
          })
          .on('mouseleave', ()=>{
            gridLine.attr('opacity', 0.0)
            gridLine
              .filter(ver => ver === this.selectedVersion)
              .attr('opacity', 0.7)
          })
          .on('click', (d)=>{
            gridLine.attr('opacity', 0.0)
            if(d === this.selectedVersion){
              this.selectedVersion = null
              this.$bus.$emit('version-restored', 'all')
            }
            else {
              gridLine
                .filter(ver => ver === d)
                .attr('opacity', 0.7)
              this.selectedVersion = d
              if(this.selectedTopic || this.selectedTopic === 0) this.flag = true
              this.$bus.$emit('version-selected', {version: d, topic: this.selectedTopic})
            }
          })
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
          // 更新刻度
          this.tickValues = null
          if(this.showVersions.length > 40){
            let n = Math.round(this.showVersions.length/40)
            this.tickValues = this.showVersions.filter((d, i) => i%n === 0)
            this.tickValues.push(this.showVersions.slice(-1)[0])
          }
          else{
            this.tickValues = this.showVersions
          }
          xAxis = g => 
            g
            .call(d3.axisBottom(x).tickValues(this.tickValues))
            // .call(g =>
            // g
            //   .select('.tick:last-of-type text')   // 设置x轴文字
            //   .clone()
            //   .attr('text-anchor', 'end')
            //   .attr('font-weight', 'bold')
            //   .attr('class', 'x-label')
            //   .attr('y', -10)
            //   .text('versions')
            // )
            .call(g =>                            // 设置tick
              g
                .style('cursor', 'default')
                .selectAll('text:not(.x-label)')
                .style('text-anchor', 'end')
                .attr('dx', '-.8em')
                .attr('dy', '.15em')
                .attr('transform', 'rotate(-65)')
            )
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
        }
      }
    },
    resetLineStatus () {
      this.lineSvg.attr('opacity', 1).attr('stroke-width', this.strokeWidth)
    },
    highlightLine (topicId) {
      // this.resetLineStatus()
      this.lineSvg
        .filter(d => parseInt(d.key) === topicId)
        .attr('stroke-width', 3)
      this.lineSvg
        .filter(d => parseInt(d.key) !== topicId)
        .attr('opacity', 0.1)
    },
    getTickValues(versions){
      this.tickValues = null
      if(versions.length > 40){
        let n = Math.round(versions.length/40)
        this.tickValues = versions.filter((d, i) => i%n === 0)
        this.tickValues.push(versions.slice(-1)[0])
      }
      else{
        this.tickValues = versions
      }
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
          // 选择norm line显示的刻度
          let sum = 0, mean = 0
          this.normData.forEach(d=>sum = sum+d.val)
          mean = sum/this.normData.length+4
          this.showVersions.push(this.versions[0])
          for(let i=1; i<this.normData.length; i++) {
            if(this.normData[i].val >= mean) 
              this.showVersions.push(this.versions[i])
          }
          // 过滤特殊值
          let chartData = []
          this.topicsGroup.forEach((topic,i) =>{
            // // vue的处理
            // if(topic.key===1 || topic.key===6){
            //   let temp = {key: topic.key, val:[]}
            //   topic.val.forEach(d => {
            //     if(this.versions.indexOf(d.key) >= this.versions.indexOf('2.0.0'))
            //       temp.val.push(d)
            //   })
            //   chartData.push(temp)
            // }
            // else
            //   chartData.push(topic)

            // d3的处理
            let temp = {key: topic.key, val: []}
            topic.val.forEach(ver => {
                let vers = {key: ver.key, val: []}
                let docs = []
                ver.val.forEach(doc =>{
                  let vec = doc['Topic_Contribution'].map(topic => topic['percent'])
                  if(new Set(vec).size !== 1)
                    docs.push(doc)
                })
                vers.val = docs
                temp.val.push(vers)
            })
            chartData.push(temp)
          })
          console.log(chartData)
          // 设置刻度
          this.getTickValues(this.versions)
          this.showVersions.push(this.versions.slice(-1)[0])
          this.draw(this.topicsGroup)
        }
      })
    })
  },
  mounted () {
    this.height = Math.floor(this.$refs.root.clientHeight)
    this.width = Math.floor(this.$refs.root.clientWidth)
    this.$bus.$on('topic-selected', topicId => {
      this.resetLineStatus()
      this.selectedTopic = topicId
      if(topicId != -1) this.highlightLine(topicId)
      else this.selectedTopic = null
    })
    this.$bus.$on('version-range-selected', d =>{
      this.selectedVersion = null
      this.gridLineG.selectAll('.x-grid-line')
        .attr('opacity', 0)
    })
  }
}
</script>

<style lang="less">
.line-chart {
  height: 100%;
}
</style>