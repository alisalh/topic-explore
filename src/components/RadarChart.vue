<template>
    <div class='radar-chart'></div>
</template>

<script>
import { getVersion } from '../utils'
export default {
  name: 'component_name',
  data () {
    return {
      fileGroup: null
    }
  },
  props: ['docVerData'],
  methods: {
    groupFileByStatus (data) {}
  },
  created () {
    this.$bus.$on('version-selected', selectedVer => {
      this.fileGroup = this.groupFileByStatus(
        this.docVerData.filter(d => getVersion(d.filename) === selectedVer)
      )
    })
  }
}
</script>

<style lang="less">
</style>