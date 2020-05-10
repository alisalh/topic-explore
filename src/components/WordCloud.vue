<template>
  <div class='word-cloud'
       ref='root'></div>
</template>

<script>
import * as d3 from 'd3'
import d3Cloud from 'd3-cloud'
export default {
  name: 'component_name',
  data () {
    return {
      width: 0,
      height: 0,
      svg: null
    }
  },
  props: ['topicData'],
  methods: {
  }
}
</script>

<style lang="less">
.word-cloud {
  height: 100%;
}
</style>