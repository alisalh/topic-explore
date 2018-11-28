<template>
  <div class='parallel-coordinate'
       ref='root'></div>
</template>

<script>
export default {
  name: 'component_name',
  data () {
    return {
      height: 0,
      width: 0
    }
  },
  created () {
    this.$bus.$on('cluster-selected', ids => {
      console.log(ids)
    })
  }
}
</script>

<style lang="less">
</style>