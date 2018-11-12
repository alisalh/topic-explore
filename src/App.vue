<template>
  <div id="app">
    <div class="first-row">
      <sunburst></sunburst>
    </div>
    <div class="second-row">
      <line-chart :test="test"></line-chart>
    </div>
  </div>
</template>

<script>
import HelloWorld from './components/HelloWorld.vue'
import LineChart from './components/LineChart'
import Sunburst from './components/Sunburst.vue'
export default {
  name: 'app',
  data () {
    return {
      test: null
    }
  },
  components: {
    HelloWorld,
    LineChart,
    Sunburst
  },
  created () {
    setTimeout(() => {
      this.test = 3
    }, 0)
  }
}
</script>

<style lang="less">
#app {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  // text-align: center;
  color: #2c3e50;
  // margin-top: 60px;
/*   display: flex;
  flex-direction: column;
  .first-row{
    flex:1;
  }
  .second-row{
    flex:1;
  } */
}
</style>
