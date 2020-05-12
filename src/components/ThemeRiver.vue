<template>
  <div class="theme-river" ref="root">
    <div class="diff-line" ref="root1"></div>
    <div class="topic-flow" ref="root2"></div>
  </div>
</template>

<script>
import * as d3 from "d3";
export default {
  name: "component_name",
  data() {
    return {
      diffWidth: 0,
      diffHeight: 0,
      diffVersions: [],
      flowWidth: 0,
      flowHeight: 0
    };
  },
  props: ["topicColormap", "topicsGroup", "versions", "normData"],
  methods: {
    drawDiffLine(){
      var margin = {top: 10, right: 25, bottom: 10, left: 30},
        height = this.diffHeight - margin.top - margin.bottom,
        width = this.diffWidth - margin.left - margin.right,
        brushHeight = 30;

      var svg = d3.select(this.$refs.root1)
        .append('svg')
        .attr('width', this.diffWidth)
        .attr('height', this.diffHeight)
      
      // x轴和y轴的比例尺
      var xScale = d3.scalePoint()
        .domain(this.versions)
        .range([0, width]);
      var yScale = d3.scaleLinear()
        .domain([0, d3.max(this.normData.map(d => d.val))])
        .range([brushHeight, 0])

      // 绘制x轴
      var xAxis = g =>
        g
          .attr("transform", "translate("+ margin.left+","+(brushHeight+margin.top)+")")
          .call(d3.axisBottom(xScale).tickValues(this.diffVersions))
          .call(g => g.select(".domain").remove())
          .call(g =>
            g
              .selectAll("text:not(.x-label)")
              .style("text-anchor", "start")
              .attr("dx", "1em")
              .attr("dy", ".2em")
              .attr("transform", "rotate(60)")
          );
      svg.append('g')
        .attr('class', 'diff-axis')
        .call(xAxis)

      // 绘制折线
      var line = d3.line()
        .curve(d3.curveMonotoneX)
        .x(d => xScale(d.ver))
        .y(d => yScale(d.val))
      svg.append('g')
        .attr("class", "norm-line")
        .attr("transform", "translate("+ margin.left+","+margin.top+")")
        .attr("fill", "none")
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .append("path")
        .attr("stroke", "grey")
        .attr("d", line(this.normData));
      
    },
    getVersionsOfNorm(){
      let sum = d3.sum(this.normData.map(d => d.val)),
        mean = sum / this.normData.length;
      
      // 添加第一个版本
      this.diffVersions.push(this.versions[0])
      // 添加中间版本 (与前后差值均大于mean)
      for(let i=1; i<this.normData.length-1; i++){
        if(this.normData[i].val - this.normData[i-1].val > mean &&
          this.normData[i].val - this.normData[i+1].val > mean)
          this.diffVersions.push(this.versions[i])
      }
      // 添加最后一个版本
      this.diffVersions.push(this.versions[this.versions.length-1])
    },
    drawTopicFlow(){
      var margin = {top: 20, right: 25, bottom: 50, left: 30},
        width = this.flowWidth - margin.left - margin.right,
        height = this.flowHeight - margin.top - margin.bottom;
      
      var svg = d3.select(this.$refs.root2)
        .append('svg')
        .attr('width', this.flowWidth)
        .attr('height', this.flowHeight)
      
      var n = this.topicsGroup.length,   // number of layers
        m = this.versions.length,        // number of samples per layer
        stack = d3.stack().keys(d3.range(n).map(d => "topic_"+d)).offset(d3.stackOffsetWiggle);

      // 创建二维数组
      var topicMatrixs = new Array(m);
      for(let i =0; i<m; i++){
        topicMatrixs[i] = new Array(n)
        for(let j=0; j<n; j++){
          topicMatrixs[i]["topic_"+j] = 0
        }
        topicMatrixs[i]["ver"] = this.versions[i]
      }

      // topic.val.val表示主题.版本.文件
      Object.keys(this.topicsGroup).forEach(key =>{
        this.topicsGroup[key].val.forEach(d =>{
          let idx = this.versions.indexOf(d.key);
          topicMatrixs[idx]["topic_"+key] = d.val.length;
        })
      });

      var topicLayers = stack(topicMatrixs);

      var xScale = d3.scalePoint()
        .domain(this.versions)
        .range([0, width]);
      var yScale = d3.scaleLinear()
        .domain([d3.min(topicLayers, layer => d3.min(layer, d =>d[0])), 
          d3.max(topicLayers, layer => d3.max(layer, d =>d[1]))])
        .range([height, 0]);

      var area = d3.area()
        .x(d => xScale(d.data.ver))
        .y0(d => yScale(d[0]))
        .y1(d => yScale(d[1]))

      var flowG =  svg.append('g')
        .attr('class', 'flow-area')
        .attr('transform', 'translate('+margin.top+','+margin.left+')')
      flowG.selectAll('path')
        .data(topicLayers)
        .enter()
        .append('path')
        .attr('d', area)
        .style('fill', d => this.topicColormap(d.index))
    }
  },
  created(){
     // 当所有异步数据都获取完以后才开始渲染(类Promise.all实现)
    const requiredData = ["topicColormap", "topicsGroup", "versions", "normData"];
    let cnt = 0;
    requiredData.forEach(d => {
      this.$watch(d, val => {
        if (val) cnt++;
        if (cnt === requiredData.length) {
          this.getVersionsOfNorm()
          this.drawDiffLine()
          this.drawTopicFlow()
        }
      });
    });
  },
  mounted(){
    this.diffWidth = Math.floor(this.$refs.root1.clientWidth);
    this.diffHeight = Math.floor(this.$refs.root1.clientHeight);
    this.flowWidth = Math.floor(this.$refs.root2.clientWidth);
    this.flowHeight = Math.floor(this.$refs.root2.clientHeight);
  }
}
</script>

<style lang="less">
.theme-river{
  height: 100%;
  display: flex;
  flex-direction: column;
  .diff-line{
    flex: 1;
  }
  .topic-flow{
    flex: 4;
  }
}
</style>