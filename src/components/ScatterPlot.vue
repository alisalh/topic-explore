<template>
  <div class='scatter-plot'
       ref='root'>
  </div>
</template>

<script>
import * as d3 from 'd3'
import { CLUSTER_COLOR } from '../utils/constant.js'

export default {
  name: 'component_name',
  data () {
    return {
      height: 0,
      width: 0,
      clusterNum: 0,
      diffDocs: null,
      min_samples: 2,
      eps: 0.05,
      threshold: 0.1,
      // markerG: null,
      selectedCluster: null,
      chartData: null,
      dom_args: null,
      allCircle: null,
      xScale: null,
      yScale: null,
      percentSum: null,
      topicNum: 0, 
      maxVal: 0
    }
  },
  props: ['topicColormap', 'docData', 'topicData'],
  // computed: {
  //   clusterColormap () {
  //     return d3
  //       .scaleOrdinal()
  //       .domain(
  //         Array(this.clusterNum + 1)
  //           .fill(null)
  //           .map((d, i) => i - 1)
  //       )
  //       .range(CLUSTER_COLOR)
  //   }
  // },
  watch: {
    // fileGroup () {
    //   const allDocs = this.getDocData()
    //   console.log(allDocs)
    //   this.$axios
    //     .post('http://localhost:5000/topic/getClusterDrInfo', allDocs)
    //     .then(({ data: { data: chartData, cluster_num: clusterNum } }) => {
    //       this.clusterNum = clusterNum
    //       this.selectedCluster = null
    //       // console.log(this.clusterNum)
    //       console.log('chartData:', chartData)
    //       this.draw(chartData)
    //     })
    //     .catch(e => {
    //       console.log(e)
    //     })
    // }

    min_samples(){
      if(this.diffDocs)
        this.getCluster()
    },
    eps(){
      if(this.diffDocs)
        this.getCluster()
    },
    threshold(){
      if(this.diffDocs)
        this.getCluster()
    },
    diffDocs(){
      this.getCluster()
    },
    // chartData(){
    //   this.$bus.$emit('diff-docs-changed', this.chartData)
    // }
  },
  created(){
    const requiredData = ['topicColormap', 'docData', 'topicData']
    let cnt = 0
    requiredData.forEach(d => {
        this.$watch(d, val => {
            if (val) 
                cnt++
            if (cnt === requiredData.length) {
                this.topicNum = this.topicData.length
            }
        })
    })
  },
  mounted () {
    this.dom_args = this.$refs.root.getBoundingClientRect()
    this.height = Math.floor(this.$refs.root.clientHeight)
    this.width = Math.floor(this.$refs.root.clientWidth)
    // this.$bus.$on('version-range-selected', d => {
    //   this.$refs.root.innerHTML = ''
    //   this.$bus.$emit('tip-close', {})
    //   this.$axios.get('topics/getDiffDocs', d)
    //     .then(({ data }) => {
    //      this.diffDocs = data
    //     })
    // })
    this.$bus.$on('version-restored', d => {
      this.$refs.root.innerHTML = ''
      this.$bus.$emit('tip-close', {})
    })
    this.$bus.$on('version-selected', d => {
      this.$refs.root.innerHTML = ''
      this.$bus.$emit('tip-close', {})
    })
    this.$bus.$on('min-samples-selected', d => {
      this.min_samples = d
      this.$bus.$emit('tip-close', {})
    })
    this.$bus.$on('eps-selected', d => {
      this.eps = d
      this.$bus.$emit('tip-close', {})
    })
    this.$bus.$on('threshold-selected', d => {
      this.threshold = d
      this.$bus.$emit('tip-close', {})
    })
    this.$bus.$on('show-cluster', d=>{
      if(d){
        let cluster = this.chartData
          .filter(doc => doc.fileIds.indexOf(d) != -1)
        this.allCircle.attr('opacity', 0.1)
        this.allCircle
          .filter(circle => circle.cluster === cluster[0].cluster)
          .attr('opacity', 1)
        // this.selectedCluster = cluster.cluster
        this.allCircle
          .on('mouseenter', null)
          .on('mouseleave', null)
          .on('click', null)
        this.$bus.$emit('selected-tip-show', 
          { x: this.xScale(cluster[0].x),
            y: this.yScale(cluster[0].y), 
            args: this.dom_args,
            max: this.maxVal,
            docs: this.percentSum.filter(item=>item.cluster===cluster[0].cluster)
          })
      }
    })
    this.$bus.$on('cluster-restored', () => {
       this.$bus.$emit('selected-tip-hide', {})
       this.allCircle
          .attr('opacity', 1)
          .on('mouseenter', (d) => {
            let x = d3.event.pageX, y = d3.event.pageY
            if (this.selectedCluster || this.selectedCluster === 0) return
            this.resetStatus()
            this.highlightMarker(d.cluster)
            let selectedDocs = this.chartData.filter(doc => doc.cluster === d.cluster)
            this.$bus.$emit('tip-show', {x: x, y: y, 
              args: this.dom_args, 
              max: this.maxVal,
              docs: this.percentSum.filter(item=>item.cluster===d.cluster)})
          })
          .on('mouseleave', () => {
            if(!this.selectedCluster)
              this.resetStatus()
            this.$bus.$emit('tip-close', {})
          })
          .on('click', ({ cluster: selectedCluster }) => {
            // 解绑mouseleave事件
            this.allCircle.on('mouseleave', null)
            if(this.selectedCluster && this.selectedCluster != selectedCluster){
              // this.$bus.$emit('tip-close', {})
              let x = d3.event.pageX, y = d3.event.pageY
              let selectedDocs = this.chartData.filter(doc => doc.cluster === selectedCluster)
              this.$bus.$emit('tip-show', {x: x, y: y, 
                args: this.dom_args,
                max: this.maxVal, 
                docs: this.percentSum.filter(item=>item.cluster===selectedCluster)})
            }
            this.selectedCluster = selectedCluster
            let clusters = [], selectedDocs = []
            this.allCircle
              .filter(d => d.cluster === selectedCluster)
              .each(d => {
                // 合并数组concat
                clusters = clusters.concat(d['fileIds'])
                selectedDocs.push(d)
              })
            // 多事件结合使用时，可以阻止其他事件的发生，避免产生多个动作
            d3.event.stopPropagation()
            this.highlightMarker(selectedCluster)
            this.$bus.$emit('cluster-selected', clusters)
            this.$bus.$emit('docs-selected', selectedDocs)
          })
    })
  },
  methods: {
    getCluster(){
      this.$axios
        .post('http://localhost:8000/topic/getClusterDrInfo', {
          docs: this.diffDocs, threshold: this.threshold, 
          min_samples: this.min_samples, eps: this.eps
        })
        .then(({ data: { data: chartData, cluster_num: clusterNum } }) => {
          this.clusterNum = clusterNum
          this.selectedCluster = null
          let step = 0
          this.percentSum = []
          chartData.forEach(d => {
            if(d.cluster === -1) {
              d.cluster = d.cluster - step
              step = step + 1
            }
            let temp = this.percentSum.filter(item => item.cluster === d.cluster)
            if(temp.length === 0)
              this.percentSum.push({cluster: d.cluster, type: d.type, vec:[]})
          })
          let max = 0
          this.percentSum.forEach(item =>{
            let curData = chartData.filter(data => data.cluster === item.cluster)
            item.vec = this.getChartData(curData)
            item.vec.forEach(vec => {
              if(vec.val.length === 1){
                if(max < vec.val[0])
                  max = vec.val[0]
              }
              if(vec.val.length === 2){
                if(max < Math.max(vec.val[0], vec.val[1]))
                  max = Math.max(vec.val[0], vec.val[1])
              }
            })
          })
          this.maxVal = max
          this.chartData = chartData
          this.draw(chartData)
        })
    },
    getChartData(data){
      let preVec = Array(this.topicNum).fill(0), 
          curVec = Array(this.topicNum).fill(0)
      let chartData = []
      data.forEach(doc => {
        if(doc.type === 'edit'){
            let preId = doc.fileIds[0], curId = doc.fileIds[1]
            let preDoc = this.docData[preId], curDoc = this.docData[curId]
            let edit_preVec = preDoc['Topic_Contribution'].map(topic => topic['percent']),
                edit_curVec = curDoc['Topic_Contribution'].map(topic => topic['percent'])
            preVec = preVec.map((d, i) => d+edit_preVec[i])
            curVec = curVec.map((d, i) => d+edit_curVec[i])
        }
        if(doc.type === 'add'){
            let curId = doc.fileIds[0]
            let curDoc = this.docData[curId]
            let add_preVec = Array(this.topicNum).fill(0),
                add_curVec = curDoc['Topic_Contribution'].map(topic => topic['percent'])
            preVec = preVec.map((d, i) => d+add_preVec[i])
            curVec = curVec.map((d, i) => d+add_curVec[i])
        }
        if(doc.type === 'del'){
            let preId = doc.fileIds[0]
            let preDoc = this.docData[preId]
            let del_preVec = preDoc['Topic_Contribution'].map(topic => topic['percent']),
                del_curVec = Array(this.topicNum).fill(0)
            preVec = preVec.map((d, i) => d+del_preVec[i])
            curVec = curVec.map((d, i) => d+del_curVec[i])
        }
      })
      if(data[0].type === 'add'){
        curVec.forEach((d, i) => {
            if(d != 0) chartData.push({topic: i, val: [d], type: 'add'})
        })
      }
      if(data[0].type === 'del'){
        preVec.forEach((d, i) => {
            if(d != 0) chartData.push({topic: i, val: [d], type: 'del' })
        })
      }
      if(data[0].type === 'edit'){
        preVec.forEach((d, i) => {
            if(d!=0 || curVec[i]!=0)
                chartData.push({topic: i, val: [d, curVec[i]], type: 'edit'})
        })
      }
      return chartData
    },
    draw (data) {
      this.$refs.root.innerHTML = ''
      const margin = { top: 60, right: 10, bottom: 30, left: 10 }
      const height = this.height
      const width = this.width
      const svg = d3
        .select(this.$refs.root)
        .append('svg')
        .attr('width', width)
        .attr('height', height)
      const x = d3
        .scaleLinear()
        .domain(d3.extent(data, d => d.x))
        .nice()
        .range([margin.left, width - margin.right])
      this.xScale = x
      const y = d3
        .scaleLinear()
        .domain(d3.extent(data, d => d.y))
        .nice()
        .range([height - margin.bottom, margin.top])
      this.yScale = y
      // const xAxis = g =>
      //   g
      //     .attr('transform', `translate(0,${height - margin.bottom})`)
      //     .call(d3.axisBottom(x))
      //     .call(g => g.select('.domain').remove())
      //     .call(g => g.selectAll('text').remove())
      // const yAxis = g =>
      //   g
      //     .attr('transform', `translate(${margin.left},0)`)
      //     .call(d3.axisLeft(y))
      //     .call(g => g.select('.domain').remove())
      //     .call(g => g.selectAll('text').remove())
      // svg.append('g').call(xAxis)
      // svg.append('g').call(yAxis)

      // 添加marker形状定义
      const markerSize = 5
      // <defs>元素用于存储图形对象, 但并不立即渲染, 根据<use>中的设置进行渲染
      // 虚线圆(del)
      // svg
      //   .append('defs')
      //   .append('g')
      //   .attr('id', 'marker-dashedCircle')
      //   .append('circle')
      //   .attr('r', markerSize)
      //   .style('stroke', function() {
      //     return 'black'
      //   })
      //   .attr('stroke-dasharray', '3,3')
      //   .attr('stroke-width', '2')
      // // 实线圆(add)
      // svg
      //   .append('defs')
      //   .append('g')
      //   .attr('id', 'marker-solidCircle')
      //   .append('circle')
      //   .attr('r', markerSize)
      //   .style('stroke', function() {
      //     return 'black'
      //   })
      //   .attr('stroke-width', '2')
      // // 半虚半实圆(edit)
      // var g = svg
      //   .append('defs')
      //   .append('g')
      //   .attr('id', 'marker-otherCircle')
      // g.append('circle')
      //   .attr('r', markerSize)
      // g.append('path')
      //   .attr('d', d3.arc()({
      //     innerRadius: markerSize,
      //     outerRadius: markerSize,
      //     startAngle: 0,
      //     endAngle: Math.PI
      //   }))
      //   .style('stroke', function() {
      //     return 'black'
      //   })
      //   .attr('stroke-width', '2')
      // g.append('path')
      //   .attr('d', d3.arc()({
      //     innerRadius: markerSize,
      //     outerRadius: markerSize,
      //     startAngle: Math.PI,
      //     endAngle: 2*Math.PI
      //   }))
      //   .style('stroke', function() {
      //     return 'black'
      //   })
      //   .attr('stroke-dasharray', '3,3')
      //   .attr('stroke-dashoffset', '3')
      //   .attr('stroke-width', '2')

      // const type2Shape = {
      //   add: '#marker-solidCircle',
      //   del: '#marker-dashedCircle',
      //   edit: '#marker-otherCircle'
      // }

    // 圆形(删除文件)
      svg
        .append('defs')
        .append('g')
        .attr('id', 'marker-circle')
        .append('circle')
        .attr('r', markerSize)
        .style('stroke', '#999494')
      // 正方形(增加文件)
      svg
        .append('defs')
        .append('g')
        .attr('id', 'marker-square')
        .append('rect')
        .attr('width', markerSize * 2)
        .attr('height', markerSize * 2)
        .style('stroke', '#999494')
      // 三角形(修改文件)
      svg
        .append('defs')
        .append('svg')
        .attr('id', 'marker-triangle')
        .attr('viewBox', '0 0 1024 1024')
        .attr('width', markerSize * 3)
        .attr('height', markerSize * 3)
        .append('path')
        .attr('d', 'M71.675 893.33l440.325-762.683 440.325 762.683z')
        .style('stroke', '#999494')
      
      const type2Shape = {
        add: '#marker-square',
        del: '#marker-circle',
        edit: '#marker-triangle'
      }

      var circle = svg
        .append('g')
        .selectAll('marker')
        .data(data)
        .enter()
        .append('use')
        .attr('href', d => type2Shape[d.type])
        .attr('x', d => x(d.x))
        .attr('y', d => y(d.y))
        .attr('fill', d => {
          // this.clusterColormap(d.cluster)
          if(d.cluster < 0)
            return 'grey'
          else{
            if(d.type === 'edit')
              return this.topicColormap(this.docData[parseInt(d.fileIds[1])].Dominant_Topic)
            else
              return this.topicColormap(this.docData[parseInt(d.fileIds[0])].Dominant_Topic)
          }
        })
        // .attr('opacity', 0.8)
        .on('mouseenter', (d) => {
          let x = d3.event.pageX, y = d3.event.pageY
          if (this.selectedCluster || this.selectedCluster === 0) return
          this.resetStatus()
          this.highlightMarker(d.cluster)
          let selectedDocs = this.chartData.filter(doc => doc.cluster === d.cluster)
          this.$bus.$emit('tip-show', {x: x, y: y, 
            args: this.dom_args, 
            max: this.maxVal,
            docs: this.percentSum.filter(item=>item.cluster===d.cluster)})
        })
        .on('mouseleave', () => {
           if(!this.selectedCluster)
            this.resetStatus()
           this.$bus.$emit('tip-close', {})
        })
        .on('click', ({ cluster: selectedCluster }) => {
          // 解绑mouseleave事件
          circle.on('mouseleave', null)
          if(this.selectedCluster && this.selectedCluster != selectedCluster){
            // this.$bus.$emit('tip-close', {})
            let x = d3.event.pageX, y = d3.event.pageY
            let selectedDocs = this.chartData.filter(doc => doc.cluster === selectedCluster)
            this.$bus.$emit('tip-show', {x: x, y: y, 
              args: this.dom_args, 
              max: this.maxVal,
              docs: this.percentSum.filter(item=>item.cluster===selectedCluster)})
          }
          this.selectedCluster = selectedCluster
          let clusters = [], selectedDocs = []
          circle
            .filter(d => d.cluster === selectedCluster)
            .each(d => {
              // 合并数组concat
              clusters = clusters.concat(d['fileIds'])
              selectedDocs.push(d)
            })
          // 多事件结合使用时，可以阻止其他事件的发生，避免产生多个动作
          d3.event.stopPropagation()
          this.highlightMarker(selectedCluster)
          this.$bus.$emit('cluster-selected', clusters)
          this.$bus.$emit('docs-selected', selectedDocs)
        })
      this.allCircle = circle
      svg.on('click', () => {
        this.selectedCluster = null
        this.$bus.$emit('cluster-restored', {})
        this.$bus.$emit('docs-selected', null)
        this.$bus.$emit('tip-close', {})
        this.resetStatus()
        circle.on('mouseenter', (d) => {
            let x = d3.event.pageX, y = d3.event.pageY
            if (this.selectedCluster || this.selectedCluster === 0) return
            this.resetStatus()
            this.highlightMarker(d.cluster)
            let selectedDocs = this.chartData.filter(doc => doc.cluster === d.cluster)
            this.$bus.$emit('tip-show', {x: x, y: y, 
              args: this.dom_args, 
              max: this.maxVal,
              docs: this.percentSum.filter(item=>item.cluster===d.cluster)})
            })
          .on('mouseleave', () => {
            if(!this.selectedCluster)
              this.resetStatus()
            this.$bus.$emit('tip-close', {})
          })
          .on('click', ({ cluster: selectedCluster }) => {
            // 解绑mouseleave事件
            circle.on('mouseleave', null)
            if(this.selectedCluster && this.selectedCluster != selectedCluster){
              // this.$bus.$emit('tip-close', {})
              let x = d3.event.pageX, y = d3.event.pageY
              let selectedDocs = this.chartData.filter(doc => doc.cluster === selectedCluster)
              this.$bus.$emit('tip-show', {x: x, y: y, 
                args: this.dom_args, 
                max: this.maxVal,
                docs: this.percentSum.filter(item=>item.cluster===selectedCluster)})
            }
            this.selectedCluster = selectedCluster
            let clusters = [], selectedDocs = []
            circle
              .filter(d => d.cluster === selectedCluster)
              .each(d => {
                // 合并数组concat
                clusters = clusters.concat(d['fileIds'])
                selectedDocs.push(d)
              })
            // 多事件结合使用时，可以阻止其他事件的发生，避免产生多个动作
            d3.event.stopPropagation()
            this.highlightMarker(selectedCluster)
            this.$bus.$emit('cluster-selected', clusters)
            this.$bus.$emit('docs-selected', selectedDocs)
          })
        })

      // 添加legend
      var legend = svg.append('g')
        .attr('transform', 'translate(10,10)')
        // .style('stroke', 'grey')
      legend
        .append('use')
        .attr('href', '#marker-square')
        .attr('fill', 'none')
        .attr('x', 10)
        .attr('y', 10)
        .attr('stroke-width', '2')
      legend.append('text')
        .attr('x', 30)
        .attr('y', 18)
        .attr('font-size', '13px')
        .text('add')
      legend
        .append('use')
        .attr('href', '#marker-circle')
        .attr('fill', 'none')
        .attr('x', 80)
        .attr('y', 15)
        .attr('stroke-width', '2')
      legend.append('text')
        .attr('x', 93)
        .attr('y', 20)
        .attr('font-size', '13px')
        .text('delete')
      legend
        .append('use')
        .attr('href', '#marker-triangle')
        .attr('fill', 'none')
        .attr('x', 150)
        .attr('y', 8)
        .style('stroke','#999494')
        .attr('stroke-width', '120')
      legend.append('text')
        .attr('x', 170)
        .attr('y', 20)
        .attr('font-size', '13px')
        .text('edit')
      // // 力布局避免重叠
      // var clusters = new Array(this.clusterNum+1)
      // var cnt = 0
      // for(var i=0; i<data.length; i++){
      //   if(cnt > this.clusterNum) break
      //   var id = data[i].cluster+1
      //   if(!clusters[id]) {
      //     clusters[id] = data[i]
      //     cnt++
      //   }
      // }
      // var forceCollide = d3.forceCollide()
      //   .radius(function(){ return markerSize+1.5})
      //   .iterations(1)
      // function forceCluster(alpha){
      //   for (var i = 0, n = data.length, node, cluster, k = alpha * 1; i < n; ++i) {
      //     node = data[i]
      //     cluster = clusters[node.cluster+1]
      //     node.vx -= (node.x - cluster.x) * k
      //     node.vy -= (node.y - cluster.y) * k
      //   }
      // }  
      // function tick(){
      //   circle
      //     .attr('cx', function(d){return d.x})
      //     .attr('cy', function(d){return d.y})
      //   solidPath.attr('transform', 
      //     function(d){ return 'translate('+d.x+','+d.y+')'})
      //   dashedPath.attr('transform', 
      //     function(d){ return 'translate('+d.x+','+d.y+')'})
      // }
      // d3.forceSimulation()
      //   .nodes(data)
      //   .force('center', d3.forceCenter(this.width/2, this.height/2))
      //   .force('collide', forceCollide)
      //   .force('cluster', forceCluster)
      //   .force('gravity', d3.forceManyBody(30))
      //   .force('x', d3.forceX().strength(.7))
      //   .force('y', d3.forceY().strength(.7))
      //   .on('tick', tick)
      // var markerG = svg
      //   .append('g')
      // var circle = markerG
      //   .selectAll('marker')
      //   .data(data)
      //   .enter()
      //   .append('g')
      //   .attr('class', function(d){
      //     if(d.type === 'add') return 'marker-solidCircle'
      //     if(d.type === 'del') return 'marker-dashedCircle'
      //     if(d.type === 'edit') return 'marker-otherCircle'
      //   })
      //   // .append('use')
      //   // .attr('href', d => type2Shape[d.type])
      //   .append('circle')
        
      //   .attr('r', markerSize)
      //   .attr('x', d => x(d.x))
      //   .attr('y', d => y(d.y))
      //   .attr('fill', d => this.clusterColormap(d.cluster))
      //   .attr('opacity', 0.7)
      //   .on('mouseenter', d => {
      //     if (this.selectedCluster) return
      //     resetStatus()
      //     highlightMarker(d.cluster)
      //   })
      //   .on('mouseleave', function() {
      //     resetStatus()
      //   })
      //   .on('click', ({ cluster: selectedCluster }) => {
      //     // 解绑mouseleave事件
      //     circle.on('mouseleave', null)
      //     this.selectedCluster = selectedCluster
      //     let clusters = []
      //     circle
      //       .filter(d => d.cluster === selectedCluster)
      //       .each(d => {
      //         // 合并数组concat
      //         console.log('fileIds: ' + d['fileIds'])
      //         clusters = clusters.concat(d['fileIds'])
      //       })
      //     // 多事件结合使用时，可以阻止其他事件的发生，避免产生多个动作
      //     d3.event.stopPropagation()
      //     highlightMarker(selectedCluster)
      //     this.$bus.$emit('cluster-selected', clusters)
      //   })
      //   // 设置轮廓
      //   d3.selectAll('.marker-solidCircle')
      //    .style('stroke', 'black')
      //   d3.selectAll('.marker-dashedCircle')
      //     .style('stroke', 'black')
      //     .attr('stroke-dasharray', '3,5')
      //   var solidPath = d3.selectAll('.marker-otherCircle')
      //     .append('path')
      //     .attr('d', d3.arc()({
      //       innerRadius: markerSize,
      //       outerRadius: markerSize,
      //       startAngle: 0,
      //       endAngle: Math.PI
      //     }))
      //     .style('stroke', 'black')
      //     .attr('opacity', 1)
      //   var dashedPath = d3.selectAll('.marker-otherCircle')
      //     .append('path')
      //     .attr('d', d3.arc()({
      //       innerRadius: markerSize,
      //       outerRadius: markerSize,
      //       startAngle: Math.PI,
      //       endAngle: 2*Math.PI
      //     }))
      //     .style('stroke', 'black')
      //     .attr('opacity', 1)
      //     .attr('stroke-dasharray', '3,5')
      //     .attr('stroke-dashoffset', '3')
    },
    // 状态重置和高亮
    resetStatus () {
      this.allCircle.attr('opacity', 1)
    },
    highlightMarker (selectedCluster) {
     this.allCircle.attr('opacity', 0.1)
      this.allCircle
        .filter(d => d.cluster === selectedCluster)
        .attr('opacity', 1)
    },
    fieldAdapter (doc) {
      return {
        fileName: doc['relFileName'],
        vec: doc['diffVec'],
        type: doc['type'],
        fileIds: doc['fileIds']
      }
    },
  }
}
</script>

<style lang="less">
  // .scatter-plot{
  //   height: 100%;
  // }
</style>