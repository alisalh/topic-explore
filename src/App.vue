<template>
  <div id="app">
    <div class="left-panel">
      <args-wrapper class="bl-card-shadow"
        :versions='versions'>
      </args-wrapper>
      <radar-control-panel class="bl-card-shadow"
        :topicsGroup="topicsGroup"
        :versions="versions"></radar-control-panel>
    </div>
    <div class="center-panel">
      <div class="first-row">
        <line-chart :topicColormap="topicColormap"
          :topicsGroup="topicsGroup"
          :versions="versions"
          :normData="normData"
          class="bl-card-shadow"></line-chart>
        <word-cloud :topicData="topicData" 
          class="bl-card-shadow"></word-cloud>
      </div>
      <div class="second-row">
        <sunburst :topicColormap="topicColormap"
          :docData="docVerData&&docVerData.files"
          :versions="versions"
          class="bl-card-shadow"></sunburst>
        <scatter-plot :topicColormap="topicColormap"
          :docData="docVerData&&docVerData.files"
          :topicData="topicData"
          class="bl-card-shadow"></scatter-plot>
        <comment-charts-wrapper :docData="docVerData&&docVerData.files"
        :topicData="topicData" class="bl-card-shadow"></comment-charts-wrapper>
      </div>
    </div>
    <code-wrapper class="bl-card-shadow"></code-wrapper>
    <!-- <aspect-bar-chart 
      :topicColormap="topicColormap"
      :docData="docVerData&&docVerData.files"
      class="bl-card-shadow"></aspect-bar-chart> -->
    <aspect-tip :topicColormap="topicColormap"
      :topicData="topicData"
      :docData="docVerData&&docVerData.files"
      class="bl-card-shadow"></aspect-tip>
  </div>
</template>

<script>
import * as d3 from 'd3'
import _ from 'lodash'
// import HelloWorld from './components/HelloWorld.vue'
import LineChart from './components/LineChart.vue'
import Sunburst from './components/SunBurst.vue'
import WordCloud from './components/WordCloud.vue'
// import BubbleChart from './components/BubbleChart.vue'
// import RadarChartWrapper from './components/RadarChartWrapper.vue'
// import DiffFilesWrapper from './components/DiffFilesWrapper.vue'
import RadarControlPanel from './components/RadarControlPanel.vue'
import CommentChartsWrapper from './components/CommentChartsWrapper.vue'
import ScatterPlot from './components/ScatterPlot.vue'
import AspectBarChart from './components/AspectBarChart.vue'
import CodeWrapper from './components/CodeWrapper.vue'
import ArgsWrapper from './components/ArgsWrapper.vue'
import AspectTip from './components/AspectTip.vue'
// import FileList from './components/FileList.vue'
// import ParallelCoordinate from './components/ParallelCoordinate.vue'
import { TOPIC_COLOR } from './utils/constant.js'
import { groupBy, getVersion, getRelPath } from './utils/index.js'
export default {
  name: 'app',
  data() {
    return {
      topicData: null,
      docVerData: null,
      topicsGroup: null,
      fileGroup: null,
      prevVer: null,
      prevDocs: null,
      normData: null,
      editFileIds: null
    }
  },
  components: {
    // HelloWorld,
    LineChart,
    Sunburst,
    WordCloud,
    // BubbleChart,
    // RadarChartWrapper,
    RadarControlPanel,
    CommentChartsWrapper,
    ScatterPlot,
    // ParallelCoordinate,
    // DiffFilesWrapper
    AspectBarChart,
    CodeWrapper,
    ArgsWrapper,
    AspectTip
    // FileList
  },
  computed: {
    topicColormap() {
      if (this.topicData === null) return null
      const domain = Array(this.topicData.length)
        .fill(null)
        .map((d, i) => i)
      return d3
        .scaleOrdinal()
        .domain(domain)
        .range(TOPIC_COLOR)
    },
    versions() {
      if (this.docVerData) return this.docVerData.versions
      return null
    }
  },
  methods: {
    /**
     * 根据选中的版本获取将文件分为：修改的、新增的、删除的
     */
    groupFileByStatus(curVer) {
      const docs = this.docVerData.files
      const versions = this.docVerData.versions
      const prevVer = this.getRelVersion(versions, curVer, -1)
      const curDocs = docs.filter(d => getVersion(d.filename) === curVer)
      this.prevDocs = docs.filter(d => getVersion(d.filename) === prevVer)
      this.prevVer = prevVer
      let addDocs = _.differenceBy(curDocs, this.prevDocs, d =>
        getRelPath(d['filename'])
      )
      let delDocs = _.differenceBy(this.prevDocs, curDocs, d =>
        getRelPath(d['filename'])
      )
      // 同名文件视为编辑状态
      const editDocsObj = _.groupBy(this.prevDocs.concat(curDocs), d =>
        getRelPath(d['filename'])
      )
      return {
        addDocs,
        delDocs,
        editDocsObj
      }
    },
    getRelVersion(versions, curVer, step) {
      const idx = versions.indexOf(curVer)
      return versions[idx + step]
    },
    verCompare({ key: a }, { key: b }) {
      let arr = a.split('.').map(d => parseInt(d))
      let brr = b.split('.').map(d => parseInt(d))
      for (let i = 0, len = arr.length; i < len; i++) {
        if (arr[i] < brr[i]) {
          return -1
        } else if (arr[i] > brr[i]) {
          return 1
        }
      }
    },
    getTopicsGroup(rawData) {
      rawData.forEach(
        d => (d['Dominant_Topic'] = parseInt(d['Dominant_Topic']))
      )
      let topicsGroup = groupBy(rawData, 'Dominant_Topic')
      let verReg = /vue-(\d*\.\d*\.\d*)/
      topicsGroup.forEach(d => {
        d.val = groupBy(d.val, d => d.filename.match(verReg)[1]).sort(
          this.verCompare
        )
      })
      return topicsGroup
    }
  },
  created() {
    this.$bus.$on('version-selected', selectedVer => {
      this.fileGroup = this.groupFileByStatus(selectedVer)
    })
    this.$axios.get('topics/getTopicData', {}).then(({ data }) => {
      this.topicData = data
    })
    this.$axios.get('topics/getAllDocs', {}).then(({ data }) => {
      this.docVerData = data
      this.topicsGroup = this.getTopicsGroup(this.docVerData.files)
    })
    this.$axios.get('topics/getNormOfDiffVecs', {}).then(({data}) => {
      this.normData = data
    })
    this.$axios.get('topics/getEditFileIds', {}).then(({data}) => {
      this.editFileIds = data
    })
  }
}
</script>

<style lang="less">
html {
  height: 100%;
  body {
    height: 90%;
  }
}
#app {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  -moz-user-select: none; 
  -khtml-user-select: none; 
  user-select: none;
  height: 98%;
  width: 80%;
  // text-align: center;
  color: #2c3e50;
  // margin-top: 60px;
  display: flex;
  .left-panel{
    flex: 1;
    margin-right:5px;
    display: flex;
    flex-direction: column;
    .radar-control-panel{
      flex: 5.5;
    }
    .args-wrapper{
      flex: 3;
      margin-bottom: 5px;
    }
  }
  .center-panel {
    margin-right: 5px;
    display: flex;
    flex-direction: column;
    flex: 6;
    .first-row {
      flex: 1;
      display: flex;
      .line-chart {
        flex: 5;
        margin-right: 5px;
      }
      .word-cloud{
        flex: 1.3;
      }
    }
    .second-row {
      flex: 1.3;
      display: flex;
      margin-top: 5px;
      .sunburst {
        flex: 1.2;
        margin-right: 5px;
      }
      .scatter-plot{
        flex: 1.3;
        margin-right: 5px;
      }
      .comment-charts-wrapper
      {
        flex: 0.8;
      }
    }
  }
  // .code-panel{
  //   flex: 1.9;
  //   margin-left: 5px;
  //   overflow-x: auto;
  //   overflow-y: auto;
  //   // overflow: scroll;
  //   display: flex;
  // }
}
</style>
