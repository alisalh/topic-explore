<template>
    <div class='file-bar-chart'
         ref='root'>
        <div class="title">主题相关文件</div>
        <div class="content">
            <div v-for="doc in filteredDocData"
                 :style='getRectStyle(doc)'
                 class='file-rect'
                 @click="$emit('doc-selected',doc)"></div>
        </div>
    </div>
</template>

<script>
import * as d3 from 'd3'
export default {
  name: 'component_name',
  props: ['docData'],
  data () {
    return {
      filteredDocData: [],
      height: 0,
      width: 0,
      paddingLeft: 20
    }
  },
  computed: {
    xScale () {
      const maxX = d3.max(this.filteredDocData, d => d['Perc_Contribution'])
      return d3
        .scaleLinear()
        .domain([0, maxX])
        .nice()
        .range([0, this.width])
    }
  },
  methods: {
    getRectStyle (doc) {
      return {
        width: this.xScale(doc['Perc_Contribution']) + 'px'
      }
    }
  },
  created () {
    this.$bus.$on('topic-selected', topicId => {
      this.filteredDocData = this.docData
        .filter(d => d['Dominant_Topic'] === topicId)
        .sort((a, b) => b['Perc_Contribution'] - a['Perc_Contribution'])
      //   this.draw(this.filteredDocData)
    })
  },
  mounted () {
    this.height = Math.floor(this.$refs.root.clientHeight)
    this.width = Math.floor(this.$refs.root.clientWidth) - 2 * this.paddingLeft
    console.log(this.$refs.root.getBoundingClientRect())
    console.log(this.width)
  }
}
</script>

<style lang="less">
.file-bar-chart {
  display: flex;
  flex-direction: column;
  .title {
    font-weight: bold;
    flex: none;
    margin-bottom: 10px;
  }
  padding: 10px 10px 0 10px;
  .content {
    flex: 1;
    overflow: scroll;
    .file-rect {
      height: 5px;
      background: steelblue;
      &:nth-child(n + 2) {
        margin-top: 10px;
      }
      &:hover {
        border: 2px solid #fb9a99;
        width: 10px;
      }
    }
  }

  //   height: 100%;
}
</style>