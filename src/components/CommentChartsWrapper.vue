<template>
  <div class='comment-charts-wrapper'>
    <file-bar-chart :docData="docData"
                    @doc-selected='docSelectedHandler'></file-bar-chart>
    <div class="comment-wrapper">
      <div class="title">
        注释信息(#{{selectedDoc&&selectedDoc.commentArr.length}})
      </div>
      <div class="content">
        <div class="comment"
             v-for="comment in selectedDoc.commentArr">
          {{comment}}
        </div>
      </div>
    </div>
    <div class="identifier-wrapper">
        <div class="title">
          变量信息(#{{selectedDoc&&selectedDoc.identifiers.split(' ').length}})
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
      selectedDoc: {
        commentArr: [],
        identifiers: ''
      }
    }
  },
  methods: {
    docSelectedHandler (doc) {
      console.log(doc)
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
      flex: none;
    }
    .content {
      flex: 1;
      overflow: scroll;
      .comment {
        border-bottom: 1px solid black;
      }
    }
  }
}
</style>