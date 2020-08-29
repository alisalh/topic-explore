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
      svgWidth: 0,
      svgHeight: 0,
      selectedTopic: -1
    }
  },
  props: ['topicData', "topicColormap"],
  methods: {
    draw(data){
      // 单独保存word weight, d3Cloud布局中也有weight
      var weights = data.map(d => d.weight),
        minWeight = d3.min(weights),
        maxWeight = d3.max(weights);

      var fontSizeScale = d3.scaleLinear().domain([minWeight, maxWeight]).range([10, 30])

      // 词云布局
      var layout = d3Cloud()
        .timeInterval(10)
        .size([this.svgWidth, this.svgHeight])
        .words(data)
        .font('Georgia, serif')
        .fontSize((d, i) => fontSizeScale(weights[i]))
        .text(d => d.keyword)
        .spiral('archimedean') // "archimedean" or "rectangular"
        .padding(3)
        .rotate(0)
        .on('end', this.showWords)
        .start()
    },
    showWords(words){
      d3.select('.word-cloud>*').remove()

      var svg = d3.select('.word-cloud')
        .append('svg')
        .attr('width', this.width)
        .attr('height', this.height)
        .append('g')
        .attr('transform', 'translate('+this.width/2+','+this.height/2+')');
      
      svg.selectAll('text')
        .data(words)
        .enter()
        .append('text')
        .style('font-size', d => d.size + 'px')
        .style('font-family', d => d.font)
        .style('fill', (d,i) => {
          if(i == 0) return this.topicColormap(this.selectedTopic)
          else return 'black'
        })
        .attr('text-anchor', 'middle')
        .attr('transform', d => 'translate(' + [d.x, d.y] + ')rotate(' + d.rotate + ')')
        .text(d => d.text)
    },
    topicSelected(d){
      if(d != this.selectedTopic){
        this.selectedTopic = d
        let topicWords = [], fontColor = this.topicColormap(d)
        topicWords = this.topicData[d].words.map(d => ({
          'keyword': d.keyword, 
          'weight': d.weight, 
          'color': fontColor
        }))
        this.draw(topicWords)
      }
    }
  },
  mounted(){
    this.height = Math.floor(this.$refs.root.clientHeight);
    this.width = Math.floor(this.$refs.root.clientWidth);

    var margin = {top: 5, bottom: 5, left: 5, right: 5};
    this.svgWidth = this.width - margin.left - margin.right;
    this.svgHeight = this.height - margin.top - margin.bottom;

    // 主题bar响应事件
    this.$bus.$on('topic-selected', d =>{
      this.topicSelected(d)
    })

    // 文件sunburst响应事件
    this.$bus.$on('pieTopic-selected', d =>{
      this.topicSelected(d)
    })
   
    // 选中文件的响应事件
    this.$bus.$on('file-topic-selected', d =>{
      this.topicSelected(d)
    })
  }
}
</script>

<style lang="less">
.word-cloud {
  height: 100%;
}
</style>