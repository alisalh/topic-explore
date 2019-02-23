<template>
  <div class='scatter-plot'
       ref='root'>
  </div>
</template>

<script>
import * as d3 from 'd3'
import { getRelPath, getVersion } from '../utils/index.js'
import { CLUSTER_COLOR } from '../utils/constant.js'

export default {
  name: 'component_name',
  data () {
    return {
      height: 0,
      width: 0,
      clusterNum: 0,
      // markerG: null,
      selectedCluster: null
    }
  },
  props: ['fileGroup', 'topicData', 'prevVer'],
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
    fileGroup () {
      const allDocs = this.getDocData()
      this.$axios
        .post('http://localhost:5000/topic/getClusterDrInfo', allDocs)
        .then(({ data: { data: chartData, cluster_num: clusterNum } }) => {
          this.clusterNum = clusterNum
          // console.log(this.clusterNum)
          console.log('chartData:', chartData)
          this.draw(chartData)
        })
        .catch(e => {
          console.log(e)
        })
    }
  },
  mounted () {
    this.height = Math.floor(this.$refs.root.clientHeight)
    this.width = Math.floor(this.$refs.root.clientWidth)
  },
  methods: {
    draw (data) {
      this.$refs.root.innerHTML = ''
      const margin = { top: 20, right: 30, bottom: 30, left: 40 }
      const height = this.height
      const width = this.width
      const svg = d3
        .select(this.$refs.root)
        .append('svg')
        .attr('width', width)
        .attr('height', height)
      svg.on('click', () => {
        this.selectedCluster = null
        this.$bus.$emit('cluster-selected', null)
        resetStatus()
      })
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
      const markerSize = 10
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
      //   .attr('stroke-dasharray', '5,5')
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
      //   // .append('rect')
      //   // .attr('width', markerSize * 2)
      //   // .attr('height', markerSize * 2)
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
      //   .attr('stroke-dasharray', '5,5')
      //   // .attr('viewBox', '0 0 1024 1024')
      //   // .attr('width', markerSize * 3)
      //   // .attr('height', markerSize * 3)
      //   // .append('path')
      //   // .attr('d', 'M71.675 893.33l440.325-762.683 440.325 762.683z')

      // const type2Shape = {
      //   add: '#marker-solidCircle',
      //   del: '#marker-dashedCircle',
      //   edit: '#marker-otherCircle'
      // }

      // 力布局避免重叠
      var clusters = new Array(this.clusterNum+1)
      var cnt = 0
      for(var i=0; i<data.length; i++){
        if(cnt > this.clusterNum) break
        var id = data[i].cluster+1
        if(!clusters[id]) {
          clusters[id] = data[i]
          cnt++
        }
      }
      var forceCollide = d3.forceCollide()
        .radius(function(){ return markerSize+1.5})
        .iterations(1)
      function forceCluster(alpha){
        for (var i = 0, n = data.length, node, cluster, k = alpha * 1; i < n; ++i) {
          node = data[i]
          cluster = clusters[node.cluster+1]
          node.vx -= (node.x - cluster.x) * k
          node.vy -= (node.y - cluster.y) * k
        }
      }  
      function tick(){
        circle
          .attr('cx', function(d){return d.x})
          .attr('cy', function(d){return d.y})
        solidPath.attr('transform', 
          function(d){ return 'translate('+d.x+','+d.y+')'})
        dashedPath.attr('transform', 
          function(d){ return 'translate('+d.x+','+d.y+')'})
      }
      d3.forceSimulation()
        .nodes(data)
        .force('center', d3.forceCenter(this.width/2, this.height/2))
        .force('collide', forceCollide)
        .force('cluster', forceCluster)
        .force('gravity', d3.forceManyBody(30))
        .force('x', d3.forceX().strength(.7))
        .force('y', d3.forceY().strength(.7))
        .on('tick', tick)
      var markerG = svg
        .append('g')
      var circle = markerG
        .selectAll('marker')
        .data(data)
        .enter()
        .append('g')
        .attr('class', function(d){
          if(d.type === 'add') return 'marker-solidCircle'
          if(d.type === 'del') return 'marker-dashedCircle'
          if(d.type === 'edit') return 'marker-otherCircle'
        })
        // .append('use')
        // .attr('href', d => type2Shape[d.type])
        .append('circle')
        
        .attr('r', markerSize)
        .attr('x', d => x(d.x))
        .attr('y', d => y(d.y))
        .attr('fill', d => this.clusterColormap(d.cluster))
        .attr('opacity', 0.7)
        .on('mouseenter', d => {
          if (this.selectedCluster) return
          resetStatus()
          highlightMarker(d.cluster)
        })
        .on('mouseleave', function() {
          resetStatus()
        })
        .on('click', ({ cluster: selectedCluster }) => {
          // 解绑mouseleave事件
          circle.on('mouseleave', null)
          this.selectedCluster = selectedCluster
          let clusters = []
          circle
            .filter(d => d.cluster === selectedCluster)
            .each(d => {
              // 合并数组concat
              console.log('fileIds: ' + d['fileIds'])
              clusters = clusters.concat(d['fileIds'])
            })
          // 多事件结合使用时，可以阻止其他事件的发生，避免产生多个动作
          d3.event.stopPropagation()
          highlightMarker(selectedCluster)
          this.$bus.$emit('cluster-selected', clusters)
        })
        // 设置轮廓
        d3.selectAll('.marker-solidCircle')
         .style('stroke', 'black')
        d3.selectAll('.marker-dashedCircle')
          .style('stroke', 'black')
          .attr('stroke-dasharray', '3,5')
        var solidPath = d3.selectAll('.marker-otherCircle')
          .append('path')
          .attr('d', d3.arc()({
            innerRadius: markerSize,
            outerRadius: markerSize,
            startAngle: 0,
            endAngle: Math.PI
          }))
          .style('stroke', 'black')
          .attr('opacity', 1)
        var dashedPath = d3.selectAll('.marker-otherCircle')
          .append('path')
          .attr('d', d3.arc()({
            innerRadius: markerSize,
            outerRadius: markerSize,
            startAngle: Math.PI,
            endAngle: 2*Math.PI
          }))
          .style('stroke', 'black')
          .attr('opacity', 1)
          .attr('stroke-dasharray', '3,5')
          .attr('stroke-dashoffset', '3')
        
        // 状态重置和高亮
        function resetStatus () {
          circle.attr('opacity', 0.7)
          solidPath.attr('opacity', 1)
          dashedPath.attr('opacity', 1)
        }
        function highlightMarker (selectedCluster) {
          circle.attr('opacity', 0.1)
          solidPath.attr('opacity', 0.1)
          dashedPath.attr('opacity', 0.1)
          circle
            .filter(d => d.cluster === selectedCluster)
            .attr('opacity', 0.7)
          solidPath
            .filter(d => d.cluster === selectedCluster)
            .attr('opacity', d => {if(d.type === 'edit') return 1})
          dashedPath
            .filter(d => d.cluster === selectedCluster)
            .attr('opacity', d => {if(d.type === 'edit') return 1})
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
    getDocData () {
      const topicNum = this.topicData.length
      const addDocs = this.fileGroup.addDocs.map(doc => ({
        relFileName: getRelPath(doc.filename),
        diffVec: this.calDiffVec(
          Array(topicNum).fill(0),
          doc['Topic_Contribution'].map(topic => topic['percent'])
        ),
        type: 'add',
        fileIds: [doc.id]
      }))
      const delDocs = this.fileGroup.delDocs.map(doc => ({
        relFileName: getRelPath(doc.filename),
        diffVec: this.calDiffVec(
          doc['Topic_Contribution'].map(topic => topic['percent']),
          Array(topicNum).fill(0)
        ),
        type: 'del',
        fileIds: [doc.id]
      }))
      let editDocs = []
      let val, preData, nextData, version
      Object.keys(this.fileGroup.editDocsObj).forEach(key => {
        val = this.fileGroup.editDocsObj[key]
        if (val.length === 2) {
          for (let i = 0; i < val.length; i++) {
            version = getVersion(val[i].filename)
            if (version === this.prevVer) preData = val[i]
            else nextData = val[i]
          }
          editDocs.push({
            relFileName: getRelPath(preData.filename),
            diffVec: this.calDiffVec(
              preData['Topic_Contribution'].map(topic => topic['percent']),
              nextData['Topic_Contribution'].map(topic => topic['percent'])
            ),
            type: 'edit',
            fileIds: [preData.id, nextData.id]
          })
        }
      })
      return [addDocs, delDocs, editDocs]
        .reduce((a, b) => a.concat(b))
        .map(d => this.fieldAdapter(d))
    },
    calDiffVec (a, b) {
      return a.map((val, idx) => b[idx] - val)
    }
  }
}
</script>

<style lang="less">
</style>