<template>
  <div class="">
    hey
  </div>
</template>

<script>
import * as d3 from 'd3'
export default {
  name: 'component_name',
  data () {
    return {
      topicsGroup: null
    }
  },
  methods: {
    groupBy (arr, prop) {
      const propType = typeof (prop)
      const cb = function (d) {
        if (propType === 'string') return d[prop]
        else return prop(d)
      }
      let propsCategory = [...new Set(arr.map(d => cb(d)))]; let res = []
      propsCategory.forEach(p => {
        res.push({
          key: p,
          val: arr.filter(d => cb(d) === p)
        })
      })
      return res
    },
    dataAdapter (rawData) {
      rawData.forEach(d => (d['Dominant_Topic'] = parseInt(d['Dominant_Topic'])))
      let topicsGroup = this.groupBy(rawData, 'Dominant_Topic')
      let verReg = /vue-\d*\.\d*\.\d*/
      topicsGroup.forEach(d => {
        d.val = this.groupBy(d.val, d => d.filename.match(verReg)[0])
      })
      return topicsGroup
    }
  },
  mounted () {
    this.$axios.get('topics/getAllDocs', {
    }).then(({ data }) => {
      // const versions=data.map(d=>d.)
      this.topicsGroup = this.dataAdapter(data)
      console.log(this.topicsGroup)
    })
  }
}
</script>

<style lang="scss" scoped>
</style>