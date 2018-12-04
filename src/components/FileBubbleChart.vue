<template>
  <div class='file-bubble-chart'></div>
</template>

<script>
export default {
  name: 'component_name',
  props: ['fileData'],
  data () {
    return {
    }
  },
  mounted () {
    console.log(this.fileData)
  },
  watch: {
    fileData () {
      console.log(this.fileData)
    }
  }
}
</script>

<style lang="less">
</style>