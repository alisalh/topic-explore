<template>
  <div class="scatter-plot" ref="root"></div>
</template>

<script>
import * as d3 from "d3";
import * as d3Lasso from "d3-lasso"
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
      selectedDiffs: []
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

      var lasso = d3Lasso.lasso()
        .items(d3.selectAll('.marker')) 
        .targetArea(d3.select('.scatter-plot'))
        .on('start', function(){
          vm.selectedDiffs = []
        })
        .on('end', function(){
          lasso.selectedItems().each(d => {
            vm.selectedDiffs.push(d.id ? d.id : d.curId)
          })
          vm.$bus.$emit('selected-diffs-show', vm.selectedDiffs)
        })

      svg.call(lasso)
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
  .lasso path{
    fill: #00bbbb;
    fill-opacity: 0.1;
    stroke: #00b0bb;
    stroke-dasharray: 3,3;
  }
}
</style>