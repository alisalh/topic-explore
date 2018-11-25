<template>
  <div id="app">
    <div class="left-panel">
      <div class="first-row">
        <sunburst :topicColormap="topicColormap"
                  class="bl-card-shadow"></sunburst>
        <scatter-plot></scatter-plot>
        <div class="right-panel bl-card-shadow">
          <radar-chart-wrapper :docVerData="docVerData">></radar-chart-wrapper>
          <radar-control-panel class="bl-card"></radar-control-panel>
        </div>
      </div>
      <div class="second-row">
        <line-chart :topicColormap="topicColormap"
                    :topicsGroup="topicsGroup"
                    :versions="versions"
                    class="bl-card-shadow"></line-chart>
        <word-cloud :topicData="topicData"
                    class="bl-card-shadow"></word-cloud>
        <bubble-chart :topicColormap="topicColormap"
                      class="bl-card-shadow"></bubble-chart>
      </div>
    </div>
    <div class="right-panel bl-card-shadow">
      <comment-charts-wrapper :docData="docVerData&&docVerData.files"></comment-charts-wrapper>
    </div>
  </div>
</template>

<script>
import * as d3 from 'd3'
import HelloWorld from './components/HelloWorld.vue'
import LineChart from './components/LineChart'
import Sunburst from './components/Sunburst.vue'
import WordCloud from './components/WordCloud.vue'
import BubbleChart from './components/BubbleChart.vue'
import RadarChartWrapper from './components/RadarChartWrapper.vue'
import RadarControlPanel from './components/RadarControlPanel.vue'
import CommentChartsWrapper from './components/CommentChartsWrapper.vue'
import ScatterPlot from './components/ScatterPlot.vue'
import { TOPIC_COLOR } from './utils/constant.js'
import { groupBy } from './utils/index.js'
export default {
  name: 'app',
  data () {
    return {
      topicData: null,
      docVerData: null,
      topicsGroup: null
    }
  },
  components: {
    HelloWorld,
    LineChart,
    Sunburst,
    WordCloud,
    BubbleChart,
    RadarChartWrapper,
    RadarControlPanel,
    CommentChartsWrapper,
    ScatterPlot
  },
  computed: {
    topicColormap () {
      if (this.topicData === null) return null
      const domain = Array(this.topicData.length)
        .fill(null)
        .map((d, i) => i)
      return d3
        .scaleOrdinal()
        .domain(domain)
        .range(TOPIC_COLOR)
    },
    versions () {
      if (this.docVerData) return this.docVerData.versions
      return null
    }
  },
  methods: {
    verCompare ({ key: a }, { key: b }) {
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
    getTopicsGroup (rawData) {
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
  created () {
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
    height: 100%;
  }
}
#app {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  height: 90%;
  width: 100%;
  // text-align: center;
  color: #2c3e50;
  // margin-top: 60px;
  display: flex;
  .left-panel {
    margin-right: 10px;
    display: flex;
    flex-direction: column;
    flex: 5;
    .first-row {
      flex: 2;
      display: flex;
      .sunburst {
        flex: 1;
        margin-right: 10px;
      }
      .scatter-plot{
        flex:0.5;
      }
      .right-panel {
        flex: 2;
        display: flex;
        padding: 10px;
        .radar-chart-wrapper {
          flex: 3;
          margin-right: 10px;
        }
        .radar-control-panel {
          flex: 1;
        }
      }
      margin-bottom: 10px;
    }
    .second-row {
      flex: 1.5;
      display: flex;
      .line-chart {
        flex: 2;
        margin-right: 10px;
      }
      .word-cloud {
        flex: 1;
        margin-right: 10px;
      }
      .bubble-chart {
        flex: 1;
      }
    }
  }
  .right-panel {
    flex: 1;
  }
}
</style>
