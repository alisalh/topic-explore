<template>
  <div class='radar-chart-wrapper'>
    <div v-for='group in radarData'
         class='radar-group'>
      <div class="title">
        {{group.status}}
      </div>
      <div class="content">
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
import { getVersion } from '../utils'
import Radar from './Radar.vue'
export default {
  name: 'component_name',
  data () {
    return {
      height: null,
      radarData: []
    }
  },
  props: ['fileGroup', 'prevVer'],
  components: {
    Radar
  },
  watch: {
    fileGroup () {
      console.log(this.fileGroup, this.prevVer)
      const addDocs = this.fileGroup.addDocs.map(d => ({
        size: d.size,
        funcNum: d['func_Num'],
        data: [
          {
            version: 'next',
            ...d
          }
        ]
      }))
      const delDocs = this.fileGroup.delDocs.map(d => ({
        size: d.size,
        funcNum: d['func_Num'],
        data: [
          {
            version: 'pre',
            ...d
          }
        ]
      }))
      let editDocs = []
      let val, tmpArr, preData, nextData, version
      Object.keys(this.fileGroup.editDocsObj).forEach(key => {
        val = this.fileGroup.editDocsObj[key]
        if (val.length === 2) {
          tmpArr = []
          for (let i = 0; i < val.length; i++) {
            version = getVersion(val[i].filename)
            tmpArr.push({
              version: version === this.prevVer ? 'pre' : 'next',
              ...val[i]
            })
            if (version === this.prevVer) preData = val[i]
            else nextData = val[i]
          }
          editDocs.push({
            size: nextData.size - preData.size,
            funcNum: nextData['func_Num'] - preData['func_Num'],
            data: tmpArr
          })
        }
      })
      this.radarData = [
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
    }
  },
  methods: {
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
    /*     this.$bus.$on('version-selected', selectedVer => {
      this.fileGroup = this.groupFileByStatus(selectedVer)
      const allDocs = this.fileGroup
        .reduce(({ docs: a }, { docs: b }) => ({
          docs: a.concat(b)
        }))
        .docs.map(d => ({
          fileName: d['relFileName'],
          vec: d['diffVec'],
          type: d['type']
        }))
      this.$axios
        .post('http://localhost:5000/topic/', allDocs)
        .then(() => {
          console.log('hey123')
          // console.log(data)
        })
        .catch(e => {
          console.log(e)
        })
    }) */
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
      border: 1px solid#ebeef5;
      font-weight: bold;
    }
    .content {
      overflow: scroll;
      flex: auto;
      display: flex;
      flex-wrap: wrap;
      .radar {
        flex: none;
      }
      border: 1px solid #ebeef5;
      border-left: none;
    }
  }
}
</style>