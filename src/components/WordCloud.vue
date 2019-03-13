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
    this.$bus.$on('doc-selected', doc =>{
      d3.select('.word-cloud>svg *').remove()
      // weight关键字被占用，改为cost代替
      let keywords = this.topicData
        .find(d => d.index === parseInt(doc.Dominant_Topic))
        .keywords.map(d => ({
          keyword: d.keyword,
          cost: d.weight
        }))
      this.draw(keywords)
    })
  },
  methods: {
    draw (data) {
      let fontSizeScale = d3.scaleLinear().range([10, 40])
      let fontWeightScale = d3
        .scaleQuantize()
        .range([100, 200, 300, 400, 500, 600, 700, 800, 900])
      let [minVal, maxVal] = d3.extent(data, d => d.cost)
      fontSizeScale.domain([minVal, maxVal])
      fontWeightScale.domain([minVal, maxVal])
      var wordCloudG = this.svg
        .append('g')
        // .attr(
        //   'transform',
        //   'translate(' + this.width / 2 + ',' + this.height / 2 + ')')
      wordCloudG.selectAll('text')
        .data(data).enter()
        .append('text')
        .attr('class', 'word')
        .attr('id', (d, i)=>'word'+i)
        .style('font-family', 'Impact')
        .style('font-size', function (d) {
          return fontSizeScale(d.cost)+'px'
        })
        // .style('font-weight', d => fontWeightScale(d.cost))
        .style('fill', function (d) {
          return '#636363'
        })
        .text(function (d) {
          return d.keyword
        })
      
      var args = []
      wordCloudG.selectAll('text')
        .each((d, i) => {
         args.push(wordCloudG.select('#word'+i).node().getBoundingClientRect())
      })
      var positions = this.getPosition(args)
      console.log(positions)
      wordCloudG.selectAll('text')
        .each((d, i) => {
         wordCloudG.select('#word'+i)
          .attr('x', positions[i].x1)
          .attr('y', positions[i].y1)
      })
    },
    getPosition(args){
      var firstP = {x1: this.width/2-args[0].width/2, y1: this.height/2-args[0].height/2,
                    x2: this.width/2+args[0].width/2, y2: this.height/2+args[0].height/2}
      var positions = [firstP]
      const center_x = this.width/2, center_y = this.height/2
      for(let i=1; i<args.length; i++){
        let flag = true
        for(let r=3; r<this.width/2-10; r += 3){
          for(let angle = Math.random(); angle <=2*Math.PI; angle += Math.PI/6){
            let curP_x1 = center_x + r*Math.cos(angle) - args[i].width/2, 
              curP_y1 = center_y - r*Math.sin(angle) - args[i].height/2,
              curP_x2 = center_x + r*Math.cos(angle) + args[i].width/2, 
              curP_y2 = center_y - r*Math.sin(angle) + args[i].height/2
            flag = true
            for(let j=0; j<positions.length; j++){
              if(!(((positions[j].x1 > curP_x2+10) || (positions[j].y1 > curP_y2+10) || (curP_x1 > positions[j].x2+10) || (curP_y1 > positions[j].y2+10))
                  )){
                    flag = false
                    break
              }
            }
            if(flag) {
              positions.push({x1: curP_x1, y1: curP_y1, x2: curP_x2, y2: curP_y2})
              break
            }
          }
          if(flag) break
        }
      }
      return positions
    }
       

    //   let layout = d3Cloud()
    //     .timeInterval(10)
    //     .size([this.width, this.height])
    //     .words(data)
    //     .rotate(function (d) {
    //       return 0
    //     })
    //     .font('Impact')
    //     .fontSize(function (d, i) {
    //       return fontSizeScale(d.cost)
    //     })
    //     .fontWeight(d => fontWeightScale(d.cost))
    //     .text(function (d) {
    //       return d.keyword
    //     })
    //     .spiral('rectangular')
    //     // .random(d => 0.5)
    //     .padding(d => 6)
    //     .on('end', this.drawWords)
    //     .start()
    // },
    // drawWords (words) {
    //   let wordCloudG = this.svg
    //     .append('g')
    //     .attr(
    //       'transform',
    //       'translate(' + this.width / 2 + ',' + this.height / 2 + ')'
    //     )
    //   wordCloudG
    //     .selectAll('text')
    //     .data(words)
    //     .enter()
    //     .append('text')
    //     .attr('class', 'word')
    //     .attr('id', (d, i)=>'word'+i)
    //     .style('font-size', function (d) {
    //       return d.size + 'px'
    //     })
    //     .style('font-family', function (d) {
    //       return d.font
    //     })
    //     .style('fill', function (d) {
    //       // var paringObject = data.filter(function(obj) { return obj.password === d.text });
    //       // return color(paringObject[0].category);
    //       // return vm.colors[vm.selectedCluster+1]
    //       return '#636363'
    //     })
    //     .style('font-weight', d => d.weight)
    //     .attr('text-anchor', 'middle')
    //     .attr('transform', function (d) {
    //       return 'translate(' + [d.x, d.y] + ')rotate(' + d.rotate + ')'
    //     })
    //     .text(function (d) {
    //       return d.text
    //     })
    //     .on('click', (d, i) => {
    //       //获取字体的size
    //       console.log(wordCloudG.select('#word'+i).node().getComputedTextLength())
    //       /*           d3.selectAll('.word').style('fill', '#636363')
    //       d3.select(this).style('fill', '#f03b20') */
    //       // vm.$store.commit('SET_SELECTED_WORD', { word: d.text })
    //     })
    // }
  }
}
</script>

<style lang="less">
.word-cloud {
  height: 100%;
}
</style>