<template>
  <div class="scatter-plot" ref="root"></div>
</template>

<script>
import * as d3 from "d3";
import { CLUSTER_COLOR } from "../utils/constant.js";
import TSNE from 'tsne-js';

export default {
  name: "component_name",
  data() {
    return {
      width: 0,
      height: 0,
      preVersion: null,
      preData: null,
      curData: null,
      curVersion: null,
      diffData: null,
      diffVecs: [],
      startPoint: null,
      endPoint: null,
      drawAreaFlag: false
    };
  },
  props: ["docData", "topicColormap"],
  methods: {
    getNorm(vec){
      let sum = 0
      vec.forEach(x =>{
          sum += x*x
      })
      return Math.sqrt(sum)
    },
    dataAdapter(){
      this.diffVecs = []
      this.preData = this.docData.filter(d => d.version == this.preVersion);
      this.curData = this.docData.filter(d => d.version == this.curVersion);

      let addIds = this.diffData.add,
        delIds = this.diffData.del,
        editIds = this.diffData.edit;

      // 删除文件均为负值
      delIds.forEach(id => {
        let doc = this.preData.find(d => d.id == id);
        let norm = 0;
        if(doc) norm = this.getNorm(doc.topicDistribution);
        if(norm >= 0.1)
          this.diffVecs.push({
            id: doc.id,
            name: doc.filename,
            topic: doc.main_topic,
            vec: doc.topicDistribution.map(d => -d),
            type: 'del'
          });
      })

      // 增加文件均为正值
      addIds.forEach(id => {
        let doc = this.curData.find(d => d.id == id);
        let norm = 0;
        if(doc) norm = this.getNorm(doc.topicDistribution);
        if(norm >= 0.1)
          this.diffVecs.push({
            id: doc.id,
            name: doc.filename,
            topic: doc.main_topic,
            vec: doc.topicDistribution,
            type: 'add'
          });
      })

      // 修改文件前后版本相减
      editIds.forEach(item =>{
        let preDoc = this.preData.find(d => d.id == item[0]);
        let curDoc = this.curData.find(d => d.id == item[1]);
        let norm = 0, vec, main_topic;
        if(preDoc && curDoc){
          vec = curDoc.topicDistribution.map((d, i) => d - preDoc.topicDistribution[i]);
          norm = this.getNorm(vec);
          // main_topic = vec.indexOf(d3.max(vec, d => Math.abs(d)))
        }
        if(norm >= 0.1)
          this.diffVecs.push({
              preId: preDoc.id,
              preName: preDoc.filename,
              curId: curDoc.id,
              curName: curDoc.filename,
              topic: curDoc.main_topic,
              vec: vec,
              type: 'edit'
            })
      })
    },
    draw(data){
      let vm = this
      var svg = d3.select('.scatter-plot')
        .append('svg')
        .attr('width', this.width)
        .attr('height', this.height)
      
      var margin = {top: 15, right: 10, bottom: 10, left: 10}
      var xScale = d3.scaleLinear()
        .domain(d3.extent(data, d => d.point.x))
        .nice()
        .range([margin.left, this.width - margin.right])
      var yScale = d3.scaleLinear()
        .domain(d3.extent(data, d => d.point.y))
        .nice()
        .range([this.height - margin.bottom, margin.top])

      var marker = svg.append('g')
        .attr('class', 'points')
        .selectAll('.marker')
        .data(data)
        .enter()
        .append('text')
        .attr('class', 'marker')
        .attr('font-family', 'FontAwesome')
        .attr('x', d => xScale(d.point.x))
        .attr('y', d => yScale(d.point.y))
        .text(d => {
          if(d.type == 'add') return "\uf055"
          if(d.type == 'del') return "\uf056"
          if(d.type == 'edit') return "\uf111"
        })
        .attr('font-size', '10px')
        .style('fill', d => this.topicColormap(d.topic))

      var area = svg.append('g')
        .attr('class', 'area')
        .append('circle')
        .attr('cx', 0)
        .attr('cy', 0)
        .attr('r', 0)
        .attr('fill', '#babdb6')
        .attr('opacity', '0.6')

      svg
        .on('mousedown', function() {
          this.startPoint = d3.mouse(this)
          this.drawAreaFlag = true
          area.transition().duration(20)
            .attr('cx', this.startPoint[0])
            .attr('cy', this.startPoint[1])
        })
        .on('mousemove', function() {
          if(!this.drawAreaFlag) return
          this.endPoint = d3.mouse(this)
          let dx = this.endPoint[0] - this.startPoint[0],
            dy = this.endPoint[1] - this.startPoint[1],
            cx = (this.startPoint[0] + this.endPoint[0]) / 2,
            cy = (this.startPoint[1] + this.endPoint[1]) / 2
          area.transition().duration(20)
            .attr('cx', cx)
            .attr('cy', cy)
            .attr('r', Math.sqrt(dx*dx + dy*dy) / 2)
        })
        .on('mouseup', function(){
          this.drawAreaFlag = false
          this.endPoint = d3.mouse(this)
          let cx = (this.startPoint[0] + this.endPoint[0]) / 2,
            cy = (this.startPoint[1] + this.endPoint[1]) / 2,
            dx = this.endPoint[0] - this.startPoint[0],
            dy = this.endPoint[1] - this.startPoint[1],
            r = Math.sqrt(dx*dx + dy*dy) / 2
          
          let selectedDiffs = []
          marker.each(d =>{
            let x = xScale(d.point.x), y = yScale(d.point.y)
            let dist = Math.sqrt((x-cx)*(x-cx) + (y-cy)*(y-cy)) / 2
            if(dist <= r) {
              selectedDiffs.push(d)
            }
          })
          // vm.$bus.$emit('diffs-selected', selectedDiffs)
        })
    }
  },
  created() {
    this.$bus.$on("version-compared", d =>{
      this.preVersion = d.preVer
      this.curVersion = d.curVer
      d3.select('.scatter-plot>*').remove()

      this.$axios
        .get("topics/getDiffDocs", {preVer: this.preVersion, curVer: this.curVersion})
        .then(({data}) => {
          this.diffData = data
          this.dataAdapter()
          if(this.diffVecs.length < 2) return
          this.$axios
            .post('http://localhost:8000/topic/TSNE', {diffVecs: this.diffVecs})
            .then(({data}) =>{
              data.forEach((point,i) => {
                this.diffVecs[i]['point'] = point
              })
              this.draw(this.diffVecs)
              this.$bus.$emit('diffs-show', this.diffVecs)
            })
      });
    })
  },
  mounted() {
    this.height = Math.floor(this.$refs.root.clientHeight);
    this.width = Math.floor(this.$refs.root.clientWidth);
  },
};
</script>

<style lang="less">
.scatter-plot{
  height: 100%;
}
</style>