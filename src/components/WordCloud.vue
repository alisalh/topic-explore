<template>
  <div class='word-cloud'
       ref='root'></div>
</template>

<script>
import * as d3 from 'd3'
import d3Cloud from 'd3-cloud'
export default {
  name: 'component_name',
  data () {
    return {
      width: 0,
      height: 0,
      svg: null
    }
  },
  props: ['topicData'],
  mounted () {
    // note: 10 offset?
    this.height = Math.floor(this.$refs.root.clientHeight - 10)
    this.width = Math.floor(this.$refs.root.clientWidth)
    this.svg = d3
      .select(this.$refs.root)
      .append('svg')
      .attr('width', this.width)
      .attr('height', this.height)
    this.$bus.$on('topic-selected', topicIdx => {
      d3.select('.word-cloud>svg *').remove()
      if (topicIdx === -1) {
        return
      }
      // weight关键字被占用，改为cost代替
      let keywords = this.topicData
        .find(d => d.index === topicIdx)
        .keywords.map(d => ({
          keyword: d.keyword,
          cost: d.weight
        }))
      this.draw(keywords)
    })
  },
  methods: {
    draw (data) {
      console.log('draw wordcloud', data)

      let fontSizeScale = d3.scaleLinear().range([10, 70])
      let fontWeightScale = d3
        .scaleQuantize()
        .range([100, 200, 300, 400, 500, 600, 700, 800, 900])
      let [minVal, maxVal] = d3.extent(data, d => d.cost)
      fontSizeScale.domain([minVal, maxVal])
      fontWeightScale.domain([minVal, maxVal])
      let layout = d3Cloud()
        .timeInterval(10)
        .size([this.width, this.height])
        .words(data)
        .rotate(function (d) {
          return 0
        })
        .font('Impact')
        .fontSize(function (d, i) {
          return fontSizeScale(d.cost)
        })
        .fontWeight(d => fontWeightScale(d.cost))
        .text(function (d) {
          return d.keyword
        })
        .spiral('rectangular')
        // .random(d => 0.5)
        .padding(d => 6)
        .on('end', this.drawWords)
        .start()
    },
    drawWords (words) {
      let wordCloudG = this.svg
        .append('g')
        .attr(
          'transform',
          'translate(' + this.width / 2 + ',' + this.height / 2 + ')'
        )
      console.log(words)
      wordCloudG
        .selectAll('text')
        .data(words)
        .enter()
        .append('text')
        .attr('class', 'word')
        .style('font-size', function (d) {
          return d.size + 'px'
        })
        .style('font-family', function (d) {
          return d.font
        })
        .style('fill', function (d) {
          // var paringObject = data.filter(function(obj) { return obj.password === d.text });
          // return color(paringObject[0].category);
          // return vm.colors[vm.selectedCluster+1]
          return '#636363'
        })
        .style('font-weight', d => d.weight)
        .attr('text-anchor', 'middle')
        .attr('transform', function (d) {
          return 'translate(' + [d.x, d.y] + ')rotate(' + d.rotate + ')'
        })
        .text(function (d) {
          return d.text
        })
        .on('click', function (d) {
          /*           d3.selectAll('.word').style('fill', '#636363')
          d3.select(this).style('fill', '#f03b20') */
          // vm.$store.commit('SET_SELECTED_WORD', { word: d.text })
        })
    }
  }
}
</script>

<style lang="less">
.word-cloud {
  height: 100%;
}
</style>