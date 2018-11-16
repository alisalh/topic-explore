<template>
  <div class='radar-chart'></div>
</template>

<script>
import { getVersion, getRelPath } from '../utils'
import _ from 'lodash'
export default {
  name: 'component_name',
  data () {
    return {
      fileGroup: null
    }
  },
  props: ['docVerData'],
  methods: {
    /**
     * 根据选中的版本获取将文件分为：修改的、新增的、删除的
     */
    groupFileByStatus (curVer) {
      const docs = this.docVerData.files
      const versions = this.docVerData.versions
      const prevVer = this.getRelVersion(versions, curVer, -1)
      const nextVer = this.getRelVersion(versions, curVer, 1)
      const curDocs = docs.filter(d => getVersion(d.filename) === curVer)
      const nextDocs = docs.filter(d => getVersion(d.filename) === nextVer)
      const prevDocs = docs.filter(d => getVersion(d.filename) === prevVer)
      const addDocs = _.differenceBy(curDocs, prevDocs, d =>
        getRelPath(d['filename'])
      )
      const delDocs = _.differenceBy(prevDocs, curDocs, d =>
        getRelPath(d['filename'])
      )
      const editDocs = _.intersectionBy(prevDocs, curDocs, d =>
        getRelPath(d['filename'])
      )
      console.log(addDocs)
      console.log(delDocs)
      console.log(editDocs)
    },
    getRelVersion (versions, curVer, step) {
      const idx = versions.indexOf(curVer)
      return versions[idx + step]
    }
  },
  created () {
    this.$bus.$on('version-selected', selectedVer => {
      this.fileGroup = this.groupFileByStatus(selectedVer)
    })
  }
}
</script>

<style lang="less">
</style>