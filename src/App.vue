<template>
  <div id="app">
    <div class="first-row">
      <sunburst :topicColormap="topicColormap" class="bl-card-shadow"></sunburst>
      <div class="right-panel bl-card-shadow">
        <radar-chart-wrapper :docVerData="docVerData">></radar-chart-wrapper>
        <radar-control-panel class="bl-card"></radar-control-panel>
      </div>
      
    </div>
    <div class="second-row">
      <line-chart :topicColormap="topicColormap" :docVerData="docVerData" class="bl-card-shadow"></line-chart>
      <word-cloud :topicData="topicData" class="bl-card-shadow"></word-cloud>
      <bubble-chart :topicColormap="topicColormap" class="bl-card-shadow"></bubble-chart>
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
import { TOPIC_COLOR } from './utils/constant.js'
export default {
  name: 'app',
  data () {
    return {
      topicData: null,
      docVerData: null
    }
  },
  components: {
    HelloWorld,
    LineChart,
    Sunburst,
    WordCloud,
    BubbleChart,
    RadarChartWrapper,
    RadarControlPanel
  },
  computed: {
    topicColormap () {
      if (this.topicData === null) return null
      const domain = Array(this.topicData.length).fill(null).map((d, i) => i)
      return d3.scaleOrdinal().domain(domain).range(TOPIC_COLOR)
    }
  },
  created () {
    this.$axios.get('topics/getTopicData', {}).then(({ data }) => {
      this.topicData = data
    })
    this.$axios.get('topics/getAllDocs', {}).then(({ data }) => {
      this.docVerData = data
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
  width:80%;
  // text-align: center;
  color: #2c3e50;
  // margin-top: 60px;
  display: flex;
  flex-direction: column;
  .first-row{
    flex:2;
    display: flex;
    .sunburst{
      flex:1;
      margin-right: 10px;
    }
    .right-panel{
      flex:2;
      display: flex;
      padding:10px;
      .radar-chart-wrapper{
        flex:3;
        margin-right: 10px;
      }
      .radar-control-panel{
        flex:1;
      }
    }
    margin-bottom: 10px;
  }
  .second-row{
    flex:1;
    display: flex;
    .line-chart{
      flex:2;
      margin-right: 10px;
    }
    .word-cloud{
      flex:1;
      margin-right: 10px;
    }
    .bubble-chart{
      flex:1
    }
  }
}
</style>
