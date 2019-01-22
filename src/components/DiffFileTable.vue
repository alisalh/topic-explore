<template>
  <div class='diff-file-table'
       ref="root">
    <el-table :data="tableData"
              border
              size="mini"
              highlight-current-row
              @row-click="rowClickHandler"
              stripe
              style="width: 100%"
              :max-height="height">
      <el-table-column type="index"
                       width="40">
      </el-table-column>
      <el-table-column label="文件名"
                       :formatter="fileNameFormat">
      </el-table-column>
      <el-table-column label="类型"
                       prop="type"
                       width="60"
                       :filters="[{ text: '增加', value: 'add' }, { text: '删除', value: 'del' },{text:'修改',value:'edit'}]"
                       :filter-method="filterType"
                       filter-placement="bottom-end">
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
    return {
      height: 0
    }
  },
  methods: {
    filterType (value, row) {
      return row.type === value
    },
    fileNameFormat (row) {
      // console.log(row)
      return getRelPath(row.data[0].filename)
    },
    typeFormat (row) {
      return row.type
    },
    rowClickHandler (row) {
      this.$emit('file-selected', row)
      this.$bus.$emit('file-selected', row.data[0])
    }
  },
  mounted () {
    this.height = Math.floor(this.$refs.root.clientHeight)
  }
}
</script>

<style lang="less" >
</style>