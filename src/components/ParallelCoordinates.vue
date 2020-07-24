<template>
  <div class="parallel-coordinates" ref="root"></div>
</template>

<script>
import * as d3 from "d3";

export default {
  name: "component_name",
  data() {
    return {
      width: 0,
      height: 0
    };
  },
  props: ["topicNum", "topicColormap"],
  methods: {
    draw(data){
      d3.select('.parallel-coordinates>*').remove()

      var margin = {top: 10, right: 53, bottom: 60, left: 30}
      var svg = d3.select('.parallel-coordinates')
        .append('svg')
        .attr('width', this.width)
        .attr('height', this.height)
      
      var axisG = svg.append('g')
        .attr('class', 'axisG')
        .attr('transform', 'translate('+margin.left+','+margin.top+')')

      var lineG = svg.append('g')
        .attr('class', 'lineG')
        .attr('transform', 'translate('+margin.left+','+margin.top+')')

      let topicIds = [...new Array(this.topicNum).keys()]

      var xScale = d3.scalePoint()
        .domain(topicIds)
        .range([0, this.width - margin.right])
      
      var yScale = d3.scaleLinear()
        .domain([-1, 1])
        .range([this.height - margin.bottom, margin.top])

      axisG.selectAll('.axis')
        .data(topicIds)
        .enter()
        .append('g')
        .attr('class', 'axis')
        .attr('transform', d => 'translate('+xScale(d)+',0)')
        .each(function(d) { 
          if(d == 0)
            d3.select(this)
              .call(d3.axisLeft().scale(yScale)
                .tickValues([-1, 0, 1])
                .tickFormat(d3.format(".0f"))
              )
              .call(g => g.selectAll(".domain").remove())
          else
            d3.select(this)
              .call(d3.axisLeft().scale(yScale).tickValues([-1, 0, 1]))
              .call(g => g.selectAll(".domain").remove())
              .call(g => g.selectAll(".tick").selectAll('text').remove())
        })
        .append("text")
        .style("text-anchor", "start")
        .text(d => 'topic '+(d+1))
        .attr('dx', '1.0em')
        .attr('dy', '1.0em')
        .attr("transform", "translate(0, "+ (this.height-margin.bottom) +")rotate(65)")
        .attr('fill', 'black')

      lineG.selectAll('.line')
        .data(data)
        .enter()
        .append('path')
        .attr('class', 'p-line')
        .attr('d', d => d3.line()(d.vec.map((p,i) => [xScale(i), yScale(p)])))
        .style('fill', 'none')
        .attr('stroke', d => this.topicColormap(d.topic))
        .attr('stroke-width', 1)
    }
    
  },
  mounted() {
    this.height = Math.floor(this.$refs.root.clientHeight) - 20;
    this.width = Math.floor(this.$refs.root.clientWidth);

    // scatter plot响应事件
    this.$bus.$on('diffs-show', d =>{
      this.draw(d)
    })

    this.$bus.$on('selected-diffs-show', d =>{
      if(d.length == 0)
        d3.selectAll('.p-line').attr('opacity', 1)
      else{
        d3.selectAll('.p-line').attr('opacity', 0)
        d3.selectAll('.p-line').filter(line => d.indexOf(line.id) != -1).attr('opacity', 1)
      }
    })

    this.$bus.$on('diffs-off', () =>{
      d3.select('.parallel-coordinates>*').remove()
    })
  }
};
</script>

<style lang="less">
</style>