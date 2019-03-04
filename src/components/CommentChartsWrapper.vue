<template>
  <div class='comment-charts-wrapper'>
    <!-- <file-bar-chart :docData="docData"
                    @doc-selected='docSelectedHandler'></file-bar-chart> -->
    <div class="selected-file-wrapper">
      <div class="title">the selected file: </div>
      <div class="content">{{relFilename}}</div>
    </div>
    <div class="comment-wrapper">
      <div class="title">
        <!-- comments(#{{selectedDoc&&selectedDoc.commentArr.length}}) -->
        comments:
      </div>
      <div class="content">
        <div class="comment"
          v-if="processedComments"
          v-for="comment in processedComments"
          :key="comment.id">
          <div v-for="token in comment"
            :key="token.id"
            :style="getWordStyle(token)"
            class="token">
            {{token.word}}
          </div>
        </div>
      </div>
    </div>
    <div class="identifier-wrapper">
      <div class="title">
        <!-- variables(#{{uniqueIdentifiers.length}}) -->
        variables:
      </div>
      <div class="content">
        <div v-for="word in uniqueIdentifiers"
          :key="word.id"
          :style="getWordStyle(word)"
          class="variable">
          {{word.identifier}}
        </div>
      </div>
    </div>
    <!-- <div class="code-wrapper">
      <div class="title">code:</div>
      <div class="content" v-highlight v-html="codeText">
      </div>
    </div> -->
  </div>
</template>

<script>
import * as d3 from 'd3'
import { getRelPathWithVersion } from '../utils/index.js'
// import FileBarChart from './FileBarChart.vue'

export default {
  name: 'component_name',
  props: ['docData', 'topicData'],
  data () {
    return {
      selectedDoc: {
        commentArr: [],
        identifiers: ''
      },
      // codeText: '',
      selectedTopicKeywords: null,
      uniqueIdentifiers: [],
      processedComments: null
    }
  },
  methods: {
    docSelectedHandler (doc) {
      console.log(doc)
      this.selectedDoc = doc
      this.getIdCnt(doc.identifiers).then(data => {
        this.uniqueIdentifiers = data
      })
      // 获得处理后的评论
      this.$axios
        .post(
          'http://localhost:5000/topic/getPreprocessedComments',
          this.selectedDoc.commentArr
        )
        .then(({ data }) => {
          // console.log(data)
          this.processedComments = data
        })
    },
    getWordStyle (word) {
      // console.log(word)
      if (!this.selectedTopicKeywords) return null
      const styleObj = {}
      // 将单词出现次数映射为字体粗细
      word.hasOwnProperty('cnt') &&
        (styleObj['fontWeight'] = this.fontWeightScale(word.cnt))
      // 若单词是主题关键词，则将关键词权重映射为背景色
      const keyword = this.selectedTopicKeywords.find(
        d => d.keyword === word.identifier
      )
      keyword &&
        (styleObj['backgroundColor'] = this.bgColorScale(keyword.cost))
      return styleObj
    },
    getIdCnt (idStr) {
      return this.$axios
        .post('http://localhost:5000/topic/getPreprocessedIds', idStr)
        .then(({ data }) => {
          /*           if (ids.length !== data.length) {
            console.error('different size')
            console.error(ids, data)
          } */
          const id2Cnt = {}
          data.forEach(val => {
            if (!id2Cnt.hasOwnProperty(val)) id2Cnt[val] = 1
            else id2Cnt[val]++
          })
          // 对象转数组
          let val = null
          let resArr = []
          Object.keys(id2Cnt).forEach(key => {
            val = id2Cnt[key]
            resArr.push({
              identifier: key,
              cnt: val
            })
          })
          return Promise.resolve(resArr)
        })
    }
  },
  components: {
    //  FileBarChart
  },
  computed: {
    bgColorScale () {
      const maxVal = d3.max(this.selectedTopicKeywords, d => d.cost)
      return d3
        .scaleLinear()
        .domain([0, maxVal])
        .range(['#f7fcf5', '#41ab5d'])
        .interpolate(d3.interpolateHcl)
    },
    fontWeightScale () {
      const maxVal = d3.max(this.uniqueIdentifiers, d => d.cnt)
      return d3
        .scaleQuantize()
        .range([100, 200, 300, 400, 500, 600, 700, 800, 900])
        .domain([0, maxVal])
    },
    relFilename () {
      return (
        this.selectedDoc.filename &&
        getRelPathWithVersion(this.selectedDoc.filename)
      )
    }
  },
  created () {
    // this.$bus.$on('topic-selected', topicIdx => {
    //   this.selectedTopicKeywords = this.topicData
    //     .find(d => d.index === topicIdx)
    //     .keywords.map(d => ({
    //       keyword: d.keyword,
    //       cost: d.weight
    //     }))
    // })
    // this.$bus.$on('file-selected', selectedDoc => {
    //   this.docSelectedHandler(selectedDoc)
    // })
    this.$bus.$on('doc-selected', selectedDoc => {
      this.selectedTopicKeywords = this.topicData
        .find(d => d.index === selectedDoc.Dominant_Topic)
        .keywords.map(d => ({
          keyword: d.keyword,
          cost: d.weight
        }))
      this.docSelectedHandler(selectedDoc)
      // this.$axios
      //   .get('topics/getCode', { filepath: selectedDoc.filename})
      //   .then(({ data }) => {
      //     this.codeText = `<pre><code>${data}</code></pre>`
      //   })
    })
  }
}
</script>

<style lang='less'>
.comment-charts-wrapper {
  height: 100%;
  display: flex;
  flex-direction: column;
  // .file-bar-chart {
  //   flex: 2;
  // }
  .selected-file-wrapper {
    flex: 0.5;
    .content {
      // font-size: 15px;
      word-break: break-all;
    }
  }
  .comment-wrapper,
  .identifier-wrapper {
    border-top: 1px solid rgb(156, 151, 151);
  }
  .selected-file-wrapper,
  .comment-wrapper,
  .identifier-wrapper,{
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
      overflow: auto;
    }
  }
  .comment-wrapper {
    flex: 1.2;
    .content {
      .comment {
        word-break: break-all;
        border-bottom: 1px dashed black;
        .token {
          display: inline-block;
          margin: 0 5px;
          border-radius: 5px;
        }
      }
    }
  }
  .identifier-wrapper {
    flex: 1.2;
    .content {
      .variable {
        display: inline-block;
        margin: 0 5px;
        border-radius: 5px;
      }
    }
  }
}
</style>