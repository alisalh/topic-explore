<template>
  <div class='diff-files-wrapper'>
    <diff-file-table-wrapper :filteredDiffFileGroup="filteredDiffFileGroup"
                             @file-selected="fileSelectedHandler"></diff-file-table-wrapper>
    <div class="file-bubble-chart-wrapper">
      <file-bubble-chart v-for="id in fileBubbleChartIdxArr"
                         :fileData="selectedFile"
                         class="bl-card"
                         :topicColormap="topicColormap"
                         :sizeColorMap="sizeColorMap"
                         :funcNumColorMap="funcNumColorMap"
                         :id="id"></file-bubble-chart>
    </div>
  </div>
</template>

<script>
import * as d3 from 'd3'
import { getVersion } from '../utils'
import DiffFileTableWrapper from './DiffFileTableWrapper.vue'
import FileBubbleChart from './FileBubbleChart.vue'
export default {
  name: 'component_name',
  data () {
    return {
      diffFileGroup: [],
      filteredDiffFileGroup: [],
      selectedFile: null,
      sizeColorMap: null,
      funcNumColorMap: null,
      fileBubbleChartIdxArr: [0, 1]
    }
  },
  props: ['fileGroup', 'prevVer', 'topicColormap'],
  components: {
    DiffFileTableWrapper,
    FileBubbleChart
  },
  watch: {
    fileGroup () {
      console.log(this.fileGroup, this.prevVer)
      const addDocs = this.fileGroup.addDocs.map(d => ({
        size: d.size,
        funcNum: d['func_Num'],
        fileIds: [d.id],
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
        fileIds: [d.id],
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
            fileIds: [preData.id, nextData.id],
            funcNum: nextData['func_Num'] - preData['func_Num'],
            data: tmpArr
          })
        }
      })
      this.diffFileGroup = [
        {
          status: '增加',
          docs: addDocs
        },
        {
          status: '减少',
          docs: delDocs
        },
        {
          status: '修改',
          docs: editDocs
        }
      ]
      this.filteredDiffFileGroup = this.diffFileGroup.slice()
      const allDocs = addDocs.concat(delDocs).concat(editDocs)
      this.sizeColorMap = this.getColorMap(allDocs, 'size')
      this.funcNumColorMap = this.getColorMap(allDocs, 'funcNum')
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
    },
    fileSelectedHandler (diffFile) {
      this.selectedFile = diffFile
      console.log(diffFile)
    }
  }
}
</script>

<style lang="less">
.diff-files-wrapper {
  display: flex;
  .diff-file-table-wrapper {
    flex: 1;
  }
  .file-bubble-chart-wrapper {
    flex: 1;
    display: flex;
    flex-direction: column;
    .file-bubble-chart {
      &:nth-child(n + 2) {
        margin-top: 10px;
      }
      flex: 1;
    }
  }
}
</style>