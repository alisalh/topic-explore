<template>
  <div id="app">
    <div class="first-row">
      <sunburst :topicColormap="topicColormap"></sunburst>
    </div>
    <div class="second-row">
      <line-chart :topicColormap="topicColormap"></line-chart>
      <word-cloud :topicData="topicData"></word-cloud>
    </div>
  </div>
</template>

<script>
import * as d3 from 'd3'
import HelloWorld from './components/HelloWorld.vue'
import LineChart from './components/LineChart'
import Sunburst from './components/Sunburst.vue'
import WordCloud from './components/WordCloud.vue'
import { TOPIC_COLOR } from './utils/constant.js'
export default {
  name: 'app',
  data () {
    return {
      topicData: null
    }
  },
  components: {
    HelloWorld,
    LineChart,
    Sunburst,
    WordCloud
  },
  computed: {
    topicColormap () {
      if (this.topicData === null) return null
      const domain = Array(this.topicData.length).map((d, i) => i)
      return d3.scaleOrdinal().domain(domain).range(TOPIC_COLOR)
    }
  },
  created () {
    this.$axios.get('topics/getTopicData', {}).then(({ data }) => {
      this.topicData = data
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
  height: 80%;
  // text-align: center;
  color: #2c3e50;
  // margin-top: 60px;
  display: flex;
  flex-direction: column;
  .first-row{
    flex:2;
  }
  .second-row{
    flex:1;
  }
}
</style>
