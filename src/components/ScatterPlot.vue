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
      chartData: null
    }
  },
  props: ['topicColormap', 'docData'],
  computed: {
    clusterColormap () {
      return d3
        .scaleOrdinal()
        .domain(
          Array(this.clusterNum + 1)
            .fill(null)
            .map((d, i) => i - 1)
        )
        .range(CLUSTER_COLOR)
    }
  },
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
    chartData(){
      this.$bus.$emit('diff-docs-changed', this.chartData)
    }
  },
  mounted () {
    this.height = Math.floor(this.$refs.root.clientHeight)
    this.width = Math.floor(this.$refs.root.clientWidth)
    this.$bus.$on('version-range-selected', d => {
      this.$axios.get('topics/getDiffDocs', d)
        .then(({ data }) => {
         this.diffDocs = data
        })
    })
    this.$bus.$on('version-restored', d => {
      this.$refs.root.innerHTML = ''
    })
    this.$bus.$on('min-samples-selected', d => this.min_samples = d)
    this.$bus.$on('eps-selected', d => this.eps = d)
    this.$bus.$on('threshold-selected', d => this.threshold = d)
  },
  methods: {
    getCluster(){
      this.$axios
        .post('http://localhost:5000/topic/getClusterDrInfo', {
          docs: this.diffDocs, threshold: this.threshold, 
          min_samples: this.min_samples, eps: this.eps
        })
        .then(({ data: { data: chartData, cluster_num: clusterNum } }) => {
          this.clusterNum = clusterNum
          this.selectedCluster = null
          let step = 0
          chartData.forEach(d => {
            if(d.cluster === -1) {
              d.cluster = d.cluster - step
              step = step + 1
            }
          })
          this.chartData = chartData
          this.draw(chartData)
        })
    },
    draw (data) {
      this.$refs.root.innerHTML = ''
      const margin = { top: 10, right: 10, bottom: 10, left: 10 }
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
      const y = d3
        .scaleLinear()
        .domain(d3.extent(data, d => d.y))
        .nice()
        .range([height - margin.bottom, margin.top])
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

      svg
        .append('defs')
        .append('g')
        .attr('id', 'marker-circle')
        .append('circle')
        .attr('r', markerSize)
        .style('stroke', '#999494')
      // 正方形
      svg
        .append('defs')
        .append('g')
        .attr('id', 'marker-square')
        .append('rect')
        .attr('width', markerSize * 2)
        .attr('height', markerSize * 2)
        .style('stroke', '#999494')
      // 三角形
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
        .on('mouseenter', d => {
          if (this.selectedCluster) return
            resetStatus()
            highlightMarker(d.cluster)
        })
        .on('mouseleave', function() {
           if(!this.selectedCluster)
            resetStatus()
        })
        .on('click', ({ cluster: selectedCluster }) => {
          console.log(selectedCluster)
          // 解绑mouseleave事件
          circle.on('mouseleave', null)
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
          highlightMarker(selectedCluster)
          this.$bus.$emit('cluster-selected', clusters)
          this.$bus.$emit('docs-selected', selectedDocs)
        })

      svg.on('click', () => {
        this.selectedCluster = null
        this.$bus.$emit('cluster-restored', {})
        this.$bus.$emit('docs-selected', null)
        circle.on('mouseleave', function() {
          if(!this.selectedCluster)
            resetStatus()
        })
        resetStatus()
      })

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
        
        // 状态重置和高亮
        function resetStatus () {
          circle.attr('opacity', 1)
          // solidPath.attr('opacity', 1)
          // dashedPath.attr('opacity', 1)
        }
        function highlightMarker (selectedCluster) {
          circle.attr('opacity', 0.1)
          // solidPath.attr('opacity', 0.1)
          // dashedPath.attr('opacity', 0.1)
          circle
            .filter(d => d.cluster === selectedCluster)
            .attr('opacity', 1)
          // solidPath
          //   .filter(d => d.cluster === selectedCluster)
          //   .attr('opacity', d => {if(d.type === 'edit') return 1})
          // dashedPath
          //   .filter(d => d.cluster === selectedCluster)
          //   .attr('opacity', d => {if(d.type === 'edit') return 1})
        }
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