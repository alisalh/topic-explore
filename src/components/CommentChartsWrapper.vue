<template>
  <div class='comment-charts-wrapper'>
    <file-bar-chart :docData="docData"
                    @doc-selected='docSelectedHandler'></file-bar-chart>
    <div class="comment-wrapper">
      <div class="title">
        注释信息
      </div>
      <div class="content">
        {{selectedDoc&&selectedDoc.comments}}
      </div>
    </div>
    <div class="identifier-wrapper"
         :doc='selectedDoc'>
      <div class="title">
        变量信息
      </div>
      <div class="content">
        {{selectedDoc&&selectedDoc.identifiers}}
      </div>
    </div>
  </div>
</template>

<script>
import FileBarChart from './FileBarChart.vue'
export default {
  name: 'component_name',
  props: ['docData'],
  data () {
    return {
      selectedDoc: null
    }
  },
  methods: {
    draw (data) {
      console.log(data)
    },
    docSelectedHandler (doc) {
      this.selectedDoc = doc
    }
  },
  components: {
    FileBarChart
  }
}
</script>

<style lang='less'>
.comment-charts-wrapper {
  height: 100%;
  display: flex;
  flex-direction: column;
  .file-bar-chart {
    flex: 2;
  }
  .comment-wrapper,
  .identifier-wrapper {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 10px;
    .title {
      font-weight: bold;
      margin-bottom: 10px;
      flex:none;
    }
    .content {
      flex:1;
      overflow: scroll;
    }
  }
}
</style>