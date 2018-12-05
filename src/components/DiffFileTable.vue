<template>
  <div class='diff-file-table'>
    <el-table :data="tableData"
              max-height="200"
              border
              size="mini"
              highlight-current-row
              @row-click="rowClickHandler"
              stripe
              style="width: 100%">
      <el-table-column type="index"
                       width="40">
      </el-table-column>
      <el-table-column label="文件名"
                       :formatter="fileNameFormat">
      </el-table-column>
      <el-table-column 
                       label="类型"
                       :formatter="typeFormat"
                       width="60">
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
import { getRelPath } from '../utils'
export default {
  name: 'component_name',
  props: ['filteredDiffFileGroup', 'tableData'],
  data () {
    return {}
  },
  methods: {
    fileNameFormat (row) {
      // console.log(row)
      return getRelPath(row.data[0].filename)
    },
    typeFormat (row) {
      return row.type
    },
    rowClickHandler (row) {
      this.$emit('file-selected', row)
    }
  }
}
</script>

<style lang="less" >

</style>