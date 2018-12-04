<template>
  <div class='diff-file-table-wrapper'>
    <div class="group-wrapper"
         v-for="group in filteredDiffFileGroup">
      <div class="title">
        {{group.status}}
      </div>
      <div class="content">
        <el-table :data="group.docs"
                  style="width: 100%"
                  max-height="200"
                  border
                  size="mini"
                  highlight-current-row
                  @row-click="rowClickHandler"
                  stripe
                  class='diff-file-table'>
          <el-table-column type="index"
                           width="40">
          </el-table-column>
          <el-table-column prop="data.filename"
                           label="文件名"
                           :formatter="fileNameFormat">
          </el-table-column>
        </el-table>
      </div>
    </div>
  </div>
</template>

<script>
import { getRelPath } from '../utils'
export default {
  name: 'component_name',
  props: ['filteredDiffFileGroup'],
  data () {
    return {}
  },
  methods: {
    fileNameFormat (row) {
      // console.log(row)
      return getRelPath(row.data[0].filename)
    },
    rowClickHandler (row) {
      this.$emit('file-selected', row)
    }
  }
}
</script>

<style lang="less" >
.diff-file-table-wrapper {
  display: flex;
  flex-direction: column;
  .group-wrapper {
    &:nth-child(n + 2) {
      margin-top: 20px;
    }
    flex: 1;
    display: flex;
    .title {
      flex: none;
      display: flex;
      writing-mode: vertical-lr;
      align-items: center;
      justify-content: center;
      border: 1px solid#ebeef5;
      font-weight: bold;
    }
    .content {
      flex: auto;
    }
  }
}
</style>