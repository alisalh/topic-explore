<template>
  <div class='diff-files-wrapper'>
    <div class="left-panel">
      <diff-file-type-bar-chart class="bl-card"
                                :diffFileGroup="filteredDiffFileGroup"></diff-file-type-bar-chart>
      <diff-file-table :tableData="allDiffFiles"
                       @file-selected="fileSelectedHandler"></diff-file-table>

    </div>

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
import DiffFileTable from './DiffFileTable.vue'
import FileBubbleChart from './FileBubbleChart.vue'
import DiffFileTypeBarChart from './DiffFileTypeBarChart.vue'
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
    DiffFileTable,
    FileBubbleChart,
    DiffFileTypeBarChart
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
        ],
        type: 'add'
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
        ],
        type: 'del'
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
            data: tmpArr,
            type: 'edit'
          })
        }
      })
      this.diffFileGroup = [
        {
          type: 'add',
          docs: addDocs
        },
        {
          type: 'del',
          docs: delDocs
        },
        {
          type: 'edit',
          docs: editDocs
        }
      ]
      this.filteredDiffFileGroup = this.diffFileGroup.slice()
      const allDocs = addDocs.concat(delDocs).concat(editDocs)
      this.sizeColorMap = this.getColorMap(allDocs, 'size')
      this.funcNumColorMap = this.getColorMap(allDocs, 'funcNum')
    }
  },
  computed: {
    allDiffFiles () {
      return this.filteredDiffFileGroup.reduce((a, b) => ({
        docs: a.docs.concat(b.docs)
      }), { docs: [] }).docs
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
  },
  created () {
    this.$bus.$on('topic-selected', selectedTopic => {
      this.diffFileGroup.forEach((group, groupId) => {
        this.$set(this.filteredDiffFileGroup, groupId, {
          ...group,
          docs: group.docs.filter(doc =>
            doc['data'].some(d => {
              // console.log(d)
              return d['Dominant_Topic'] === selectedTopic
            })
          )
        })
      })
    })
  }
}
</script>

<style lang="less">
.diff-files-wrapper {
  display: flex;
  .left-panel {
    flex: 1 !important;
    margin-right: 10px;
    display: flex;
    flex-direction: column;
    .diff-file-table {
      flex: 3;
    }
    .diff-file-type-bar-chart {
      flex: 1;
      margin-bottom: 10px;
    }
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