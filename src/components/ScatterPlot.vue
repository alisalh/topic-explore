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
      markerG: null
    }
  },
  props: ['fileGroup', 'topicData', 'prevVer'],
  computed: {
    clusterColormap () {
      return d3
        .scaleOrdinal()
        .domain(
          Array(this.clusterNum)
            .fill(null)
            .map((d, i) => i)
        )
        .range(CLUSTER_COLOR)
    }
  },
  watch: {
    fileGroup () {
      const allDocs = this.getDocData(this.fileGroup)
      this.$axios
        .post('http://localhost:5000/topic/', allDocs)
        .then(({ data: { data: chartData, cluster_num: clusterNum } }) => {
          this.clusterNum = clusterNum
          // console.log(this.clusterNum)
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
      console.log(data)
      const margin = { top: 20, right: 30, bottom: 30, left: 40 }
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
      const xAxis = g =>
        g
          .attr('transform', `translate(0,${height - margin.bottom})`)
          .call(d3.axisBottom(x))
          .call(g => g.select('.domain').remove())
      const yAxis = g =>
        g
          .attr('transform', `translate(${margin.left},0)`)
          .call(d3.axisLeft(y))
          .call(g => g.select('.domain').remove())
      svg.append('g').call(xAxis)
      svg.append('g').call(yAxis)
      // 添加marker形状定义
      const markerSize = 5
      // 圆
      svg
        .append('defs')
        .append('g')
        .attr('id', 'marker-circle')
        .append('circle')
        .attr('r', markerSize)
      // 正方形
      svg
        .append('defs')
        .append('g')
        .attr('id', 'marker-square')
        .append('rect')
        .attr('width', markerSize * 2)
        .attr('height', markerSize * 2)
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
      const type2Shape = {
        add: '#marker-square',
        del: '#marker-circle',
        edit: '#marker-triangle'
      }
      this.markerG = svg
        .append('g')
        .selectAll('marker')
        .data(data)
        .enter()
        .append('use')
        .attr('href', d => type2Shape[d.type])
        .attr('x', d => x(d.x))
        .attr('y', d => y(d.y))
        .attr('fill', d => this.clusterColormap(d.cluster))
        .attr('opacity', 0.7)
        .on('mouseenter', d => {
          this.resetStatus()
          this.highlightMarker(d.cluster)
        })
        .on('mouseleave', d => {
          this.resetStatus()
        })
        .on('click', ({ cluster: selectedCluster }) => {
          let clusters = []
          this.markerG
            .filter(d => d.cluster === selectedCluster)
            .each(d => {
              clusters = clusters.concat(d['fileIds'])
            })
          this.$bus.$emit('cluster-selected', clusters)
        })
    },
    resetStatus () {
      this.markerG.attr('opacity', 0.5)
    },
    highlightMarker (selectedCluster) {
      this.markerG.attr('opacity', 0.1)
      this.markerG
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
    getDocData (data) {
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