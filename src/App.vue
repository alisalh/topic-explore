<template>
  <div id="app">
    <div class="left-panel">
      <radar-control-panel class="bl-card-shadow"
        :topicsGroup="topicsGroup"
        :versions="versions"></radar-control-panel>
      <word-cloud :topicData="topicData"
        class="bl-card-shadow"></word-cloud>
    </div>
    <div class="center-panel">
      <div class="first-row">
        <line-chart :topicColormap="topicColormap"
          :topicsGroup="topicsGroup"
          :versions="versions"
          class="bl-card-shadow"></line-chart>
        <!-- <div class="scatter-xx-wrapper">
          <bubble-chart :topicColormap="topicColormap"
            class="bl-card-shadow"></bubble-chart>
          <word-cloud :topicData="topicData"
            class="bl-card-shadow"></word-cloud>
        </div> -->
        <scatter-plot class="bl-card-shadow"
          :fileGroup="fileGroup"
          :topicData="topicData"
          :prevVer="prevVer"></scatter-plot>
      </div>
      <div class="second-row">
        <sunburst :topicColormap="topicColormap"
          class="bl-card-shadow"></sunburst>
        <div class="panel bl-card-shadow">
        </div>
        <!-- <parallel-coordinate :topicData="topicData"
          :docVerData="docVerData"
          class="bl-card-shadow"></parallel-coordinate>
        <div class="right-panel bl-card-shadow">
          <diff-files-wrapper :fileGroup="fileGroup"
            :prevVer="prevVer"
            :topicColormap="topicColormap"></diff-files-wrapper>
          <radar-control-panel class="bl-card"></radar-control-panel>
        </div> -->
      </div>
    </div>
    <div class="right-panel bl-card-shadow">
      <comment-charts-wrapper :docData="docVerData&&docVerData.files"
        :topicData="topicData"></comment-charts-wrapper>
    </div>
  </div>
</template>

<script>
import * as d3 from 'd3'
import _ from 'lodash'
// import HelloWorld from './components/HelloWorld.vue'
import LineChart from './components/LineChart'
import Sunburst from './components/SunBurst.vue'
import WordCloud from './components/WordCloud.vue'
// import BubbleChart from './components/BubbleChart.vue'
// import RadarChartWrapper from './components/RadarChartWrapper.vue'
// import DiffFilesWrapper from './components/DiffFilesWrapper.vue'
import RadarControlPanel from './components/RadarControlPanel.vue'
import CommentChartsWrapper from './components/CommentChartsWrapper.vue'
import ScatterPlot from './components/ScatterPlot.vue'
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
      prevVer: null
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
      const prevDocs = docs.filter(d => getVersion(d.filename) === prevVer)
      this.prevVer = prevVer
      let addDocs = _.differenceBy(curDocs, prevDocs, d =>
        getRelPath(d['filename'])
      )
      let delDocs = _.differenceBy(prevDocs, curDocs, d =>
        getRelPath(d['filename'])
      )
      // 同名文件视为编辑状态
      const editDocsObj = _.groupBy(prevDocs.concat(curDocs), d =>
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
  height: 98%;
  width: 100%;
  // text-align: center;
  color: #2c3e50;
  // margin-top: 60px;
  display: flex;
  .left-panel{
    flex:0.8;
    margin-right:5px;
    display: flex;
    flex-direction: column;
    .radar-control-panel{
      flex:5;
      margin-bottom: 5px;
    }
    .word-cloud{
      flex:1.5;
    }
  }
  .center-panel {
    margin-right: 5px;
    display: flex;
    flex-direction: column;
    flex: 5;
    .first-row {
      flex: 1;
      display: flex;
      .line-chart {
        flex: 1.5;
        margin-right: 5px;
      }
      // .scatter-xx-wrapper {
      //   flex: 0.8;
      //   margin-right: 10px;
      //   display: flex;
      //   flex-direction: column;
      //   .word-cloud,
      //   .bubble-chart {
      //     flex: 1;
      //   }
      //   .bubble-chart {
      //     margin-bottom: 10px;
      //   }
      // }
      .scatter-plot {
        flex: 1;
      }
    }
    .second-row {
      flex: 1.3;
      display: flex;
      margin-top: 5px;
      .sunburst {
        flex: 1;
        margin-right: 5px;
      }
      .panel{
        flex:1.5;
      }
      // .parallel-coordinate {
      //   flex: 0.5;
      //   margin-right: 10px;
      // }
      // .right-panel {
      //   flex: 1.2;
      //   display: flex;
      //   padding: 10px;
      //   .radar-chart-wrapper {
      //     flex: 3;
      //     margin-right: 10px;
      //   }
      //   .diff-files-wrapper {
      //     flex: 3;
      //     margin-right: 10px;
      //   }
      //   .radar-control-panel {
      //     flex: 1;
      //   }
      // }
    }
  }
  .right-panel {
    flex: 0.8;
  }
}
</style>
