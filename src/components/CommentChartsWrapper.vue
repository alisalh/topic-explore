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
        <div v-for="word in uniqueIdentifiers"
             :style="getWordStyle(word)"
             class="variable">
          {{word.identifier}}
        </div>
        {{selectedDoc&&selectedDoc.identifiers}}
      </div>
    </div>
  </div>
</template>

<script>
import FileBarChart from './FileBarChart.vue'
import * as d3 from 'd3'
export default {
  name: 'component_name',
  props: ['docData', 'topicData'],
  data () {
    return {
      selectedDoc: {
        commentArr: [],
        identifiers: ''
      },
      selectedTopicKeywords: null,
      uniqueIdentifiers: []
    }
  },
  methods: {
    docSelectedHandler (doc) {
      console.log(doc)
      this.selectedDoc = doc
      this.uniqueIdentifiers = this.getIdCnt(doc.identifiers)
      console.log(this.uniqueIdentifiers)
    },
    getWordStyle (word) {
      if (!this.selectedTopicKeywords) return null
      const styleObj = {
        fontWeight: this.fontWeightScale(word.cnt)
      }
      const keyword = this.selectedTopicKeywords.find(
        d => d.keyword === word.identifier
      )
      if (keyword) styleObj['backgroundColor'] = this.bgColorScale(keyword.cost)
      return styleObj
    },
    getIdCnt (idStr) {
      const ids = idStr.split(' ')
      const id2Cnt = {}
      ids.forEach(id => {
        if (!id2Cnt[id]) id2Cnt[id] = 1
        else id2Cnt[id]++
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
      return resArr
    }
  },
  components: {
    FileBarChart
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
    }
  },
  created () {
    this.$bus.$on('topic-selected', topicIdx => {
      this.selectedTopicKeywords = this.topicData
        .find(d => d.index === topicIdx)
        .keywords.map(d => ({
          keyword: d.keyword,
          cost: d.weight
        }))
    })
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
    }
  }
  .comment-wrapper {
    .content {
      .comment {
        border-bottom: 1px solid black;
      }
    }
  }
  .identifier-wrapper {
    .content {
      .variable {
        display: inline-block;
        margin: 0 5px;
      }
    }
  }
}
</style>