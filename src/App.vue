<template>
  <div id="app">
    <div class="first-row">

    </div>
    <div class="second-row">
      <line-chart></line-chart>
    </div>
  </div>
</template>

<script>
import HelloWorld from './components/HelloWorld.vue'
import LineChart from './components/LineChart'
export default {
  name: 'app',
  components: {
    HelloWorld,
    LineChart
  }
}
</script>

<style lang="less">
#app {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
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
