<template>
  <div class='radar-chart-wrapper'>
    <div v-for='group in fileGroup'
         class='radar-group'>
      <div class="title">
        {{group.status}}
      </div>
      <div class="content bl-card">
        <radar v-for="doc in group.docs"
               :doc='doc'
               :sizeColorMap='group.sizeColorMap'
               :funcNumColorMap='group.funcNumColorMap'></radar>
      </div>
    </div>
  </div>
</template>

<script>
import _ from 'lodash'
import * as d3 from 'd3'
import { getVersion, getRelPath } from '../utils'
import Radar from './Radar.vue'
export default {
  name: 'component_name',
  data () {
    return {
      fileGroup: [],
      height: null
    }
  },
  props: ['docVerData'],
  components: {
    Radar
  },
  methods: {
    /**
     * 根据选中的版本获取将文件分为：修改的、新增的、删除的
     */
    groupFileByStatus (curVer) {
      const docs = this.docVerData.files
      const versions = this.docVerData.versions
      const prevVer = this.getRelVersion(versions, curVer, -1)
      const nextVer = this.getRelVersion(versions, curVer, 1)
      const curDocs = docs.filter(d => getVersion(d.filename) === curVer)
      const nextDocs = docs.filter(d => getVersion(d.filename) === nextVer)
      const prevDocs = docs.filter(d => getVersion(d.filename) === prevVer)
      let addDocs = _.differenceBy(curDocs, prevDocs, d =>
        getRelPath(d['filename'])
      )
      console.log(addDocs)
      addDocs = addDocs.map(d => ({
        size: d.size,
        funcNum: d['func_Num'],
        data: [
          {
            version: 'next',
            ...d
          }
        ]
      }))
      /*       curDocs.forEach(d => console.log(d.filename))
      console.log('--------')
      prevDocs.forEach(d => console.log(d.filename)) */
      let delDocs = _.differenceBy(prevDocs, curDocs, d =>
        getRelPath(d['filename'])
      )
      delDocs = delDocs.map(d => ({
        size: d.size,
        funcNum: d['func_Num'],
        data: [
          {
            version: 'pre',
            ...d
          }
        ]
      }))
      // console.log(curDocs.length, prevDocs.length, prevDocs.concat(curDocs).length)
      /*       const editDocs = _.intersectionBy(prevDocs, curDocs, d =>
        getRelPath(d['filename'])
      ) */
      // console.log(prevDocs.concat(curDocs).map(d => d.filename))
      // 同名文件视为编辑状态
      const editDocsObj = _.groupBy(prevDocs.concat(curDocs), d =>
        getRelPath(d['filename'])
      )
      let editDocs = []
      let val, tmpArr, preData, nextData, version
      Object.keys(editDocsObj).forEach(key => {
        val = editDocsObj[key]
        if (val.length === 2) {
          tmpArr = []
          for (let i = 0; i < val.length; i++) {
            version = getVersion(val[i].filename)
            tmpArr.push({
              version: version === prevVer ? 'pre' : 'next',
              ...val[i]
            })
            if (version === prevVer) preData = val[i]
            else nextData = val[i]
          }
          editDocs.push({
            size: nextData.size - preData.size,
            funcNum: nextData['func_Num'] - preData['func_Num'],
            data: tmpArr
          })
        }
      })
      console.log(editDocs)
      return [
        {
          status: '增加',
          docs: addDocs,
          sizeColorMap: this.getColorMap(addDocs, 'size'),
          funcNumColorMap: this.getColorMap(addDocs, 'funcNum')
        },
        {
          status: '减少',
          docs: delDocs,
          sizeColorMap: this.getColorMap(delDocs, 'size'),
          funcNumColorMap: this.getColorMap(delDocs, 'funcNum')
        },
        {
          status: '修改',
          docs: editDocs,
          sizeColorMap: this.getColorMap(editDocs, 'size'),
          funcNumColorMap: this.getColorMap(editDocs, 'funcNum')
        }
      ]
    },
    getRelVersion (versions, curVer, step) {
      const idx = versions.indexOf(curVer)
      return versions[idx + step]
    },
    getColorMap (docs, attr) {
      const [minVal, maxVal] = d3.extent(docs, d => d[attr])
      return d3
        .scaleLinear()
        .domain([minVal, maxVal])
        .range(['#d73027', '#1a9850'])
        .interpolate(d3.interpolateHcl)
    }
  },
  created () {
    this.$bus.$on('version-selected', selectedVer => {
      this.fileGroup = this.groupFileByStatus(selectedVer)
    })
  }
}
</script>

<style lang="less">
.radar-chart-wrapper {
  display: flex;
  flex-direction: column;
  .radar-group {
    &:nth-child(n + 2) {
      margin-top: 20px;
    }
    flex: 1;
    display: flex;
    .title {
      flex: none;
      display: flex;
      writing-mode: vertical-lr;
      align-items: center;
      justify-content: center;
      border: 1px solid black;
    }
    .content {
      overflow: scroll;
      flex: auto;
      display: flex;
      flex-wrap: wrap;
      .radar {
        flex: none;
      }
    }
  }
}
</style>