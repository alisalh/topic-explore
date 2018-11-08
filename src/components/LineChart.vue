<template>
  <div class="">
  </div>
</template>

<script>
export default {
  name: 'component_name',
  data () {
    return {
    }
  },
  mounted () {
    console.log('linechart mounted')
    this.$axios.get('data/vue-all-versions-topic.csv', {
    }).then(({ data }) => {
      console.log(data)
    })
  }
}
</script>

<style lang="scss" scoped>
</style>