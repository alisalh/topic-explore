<template>
  <div class='diff-files-wrapper'>
    <diff-file-table-wrapper :filteredDiffFileGroup="filteredDiffFileGroup"
                             @file-selected="fileSelectedHandler"></diff-file-table-wrapper>
    <div class="file-bubble-chart-wrapper">
      <file-bubble-chart :fileData="selectedFile&&selectedFile.data[0]"
                         class="bl-card"
                         :topicColormap="topicColormap"></file-bubble-chart>
      <file-bubble-chart :fileData="selectedFile&&selectedFile.data[1]"
                         class="bl-card"
                         :topicColormap="topicColormap"></file-bubble-chart>
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
      selectedFile: null
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
      this.filteredDiffFileGroup = this.diffFileGroup.slice()
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