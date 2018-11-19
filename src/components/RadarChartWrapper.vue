<template>
  <div class='radar-chart-wrapper'>
    <div v-for='group in fileGroup' class='radar-group'>
      <div class="title">
        {{group.status}}
      </div>
      <div class="content">
        <radar v-for="doc in group.docs" :doc='doc'></radar>
      </div>
    </div>
  </div>
</template>

<script>
import _ from 'lodash'
import { getVersion, getRelPath } from '../utils'
import Radar from './Radar.vue'
export default {
  name: 'component_name',
  data () {
    return {
      fileGroup: [],
      height: null
    }
  },
  props: ['docVerData'],
  components: {
    Radar
  },
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
      /*       curDocs.forEach(d => console.log(d.filename))
      console.log('--------')
      prevDocs.forEach(d => console.log(d.filename)) */
      const delDocs = _.differenceBy(prevDocs, curDocs, d =>
        getRelPath(d['filename'])
      )
      // console.log(curDocs.length, prevDocs.length, prevDocs.concat(curDocs).length)
      /*       const editDocs = _.intersectionBy(prevDocs, curDocs, d =>
        getRelPath(d['filename'])
      ) */
      // console.log(prevDocs.concat(curDocs).map(d => d.filename))
      // 同名文件视为编辑状态
      const editDocsObj = _.groupBy(prevDocs.concat(curDocs), d => getRelPath(d['filename']))
      let editDocs = []; let val, tmpArr
      Object.keys(editDocsObj).forEach(key => {
        val = editDocsObj[key]
        if (val.length === 2) {
          tmpArr = []
          for (let i = 0; i < val.length; i++) {
            tmpArr.push({
              version: getVersion(val[i].filename) === prevVer ? 'pre' : 'next',
              data: val[i]
            })
          }
          editDocs.push({
            filename: key,
            data: tmpArr
          })
        }
      })
      console.log(editDocs)
      return [
        { status: '增加', docs: addDocs },
        { status: '减少', docs: delDocs },
        { status: '修改', docs: editDocs }
      ]
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
.radar-chart-wrapper {
  display: flex;
  flex-direction: column;
  .radar-group {
    flex: 1;
    display: flex;
    .title {
      flex: none;
    }
    .content {
      overflow: scroll;
      flex: auto;
      display: flex;
      flex-wrap: wrap;
      .radar {
        flex: none;
      }
    }
  }
}
</style>