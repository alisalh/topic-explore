<template>
    <div class=''></div>
</template>

<script>
import * as d3 from 'd3'
export default {
  name: 'component_name',
  data () {
    return {}
  },
  props: ['topicData'],
  mounted () {
    this.$bus.$on('topic-selected', (d) => {
      this.draw()
    })
  }
}
</script>

<style lang="scss" scoped>
</style>