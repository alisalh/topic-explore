<template>
  <div class="file-tree" ref="root">
    <div class="cur-tree" ref="root1"></div>
    <div class="pre-tree" ref="root2"></div>
  </div>
</template>

<script>
import * as d3 from "d3";
import d3tip from "d3-tip";
import folderPng from "../assets/folder.png";

export default {
  name: "component_name",
  data() {
    return {
     curWidth: 0,
     curHeight: 0,
     curVersion: null,
     preWidth: 0,
     preHeight: 0,
     preVersion: null,
    };
  },
  computed: {},
  props: ["topicColormap"],
  methods: {
    drawCurTree(data){
      d3.select('.cur-tree>*').remove();
      let vm = this

      var margin = {top: 20, right: 15, bottom: 20, left: 15},
        width = this.curWidth - margin.left - margin.right,
        height = this.curHeight - margin.top - margin.bottom;
      
      var svg = d3.select(".cur-tree").append("svg")
        .attr("width", this.curWidth)
        .attr("height", this.curHeight)
        .append('g')
        .attr('class', 'nodes-links')
        .attr('transform', 'translate('+margin.left+','+margin.top+')');

      var treemap = d3.tree().size([width, height]);
      var root = d3.hierarchy(data, d => d.children);
      root.x0 = width / 2, root.y0 = 0;
      var maxDepth = d3.max(root.leaves(), d => d.depth);

      // 为文件夹节点添加collapse事件
      root.children.forEach(collapse);
      update(root);

      // 节点id
      var nodeId = 0;

      function collapse(d){
        if(d.children){
          d._children = d.children;
          d._children.forEach(collapse)
          d.children = null
        }
      }

      function update(source){
        var treeData = treemap(root),
          nodes = treeData.descendants(),
          links = treeData.descendants().slice(1);

        nodes.forEach(d => d.y = d.depth * (height/maxDepth) - 10);

        // node数据
        var node = svg.selectAll('g.node')
          .data(nodes, d => { return d.id || (d.id = ++nodeId)});
        
        // 为每一个新增的node添加g
        var nodeEnter = node.enter()
          .append('g')
          .attr('class', 'node')
          .attr('transform', 'translate('+source.x0+','+source.y0+')')
          .on('click', click);
        
        // 插入新增node
        nodeEnter.append('text')
          .attr('font-family', 'FontAwesome')
          .attr('font-size', '20px')
          .attr('dx', '-0.5em')
          .attr('dy', '0.5em')

        // 更新进入的node
        var nodeUpdate = nodeEnter.merge(node);
        nodeUpdate.transition()
          .duration(750)
          .attr('transform', d => 'translate('+d.x+','+d.y+')');
        nodeUpdate.select('text')
          .attr('font-family', 'FontAwesome')
          .attr('font-size', '20px')
          .attr('dx', '-0.5em')
          .attr('dy', '0.5em')
          .style('fill', d => {
            if(d.data.type == 'dir') return '#f19309'
            if(d.data.type == 'file') return vm.topicColormap(d.data.topic)
            if(d.data.type == 'topic') return vm.topicColormap(d.data.topicId)
          })
          .text(d => { 
            if(d.data.type == 'dir') return "\uf07b" 
            if(d.data.type == 'file') return "\uf1c9"
            if(d.data.type == 'topic') return "\uf111"
          })
        
        // 删除退出的node
        var nodeExit = node.exit().transition()
          .duration(750)
          .attr('transform', 'translate('+source.x+','+source.y+')')
          .remove()
        nodeExit.select('text') 
          .attr('font-size', '0px')

        // link数据
        var link = svg.selectAll('path.link')
          .data(links, d => d.id)
        
        // 为每一条新增的link添加g
        var linkEnter = link.enter().insert('path', 'g')
          .attr('class', 'link')
          .attr('d', () => {
            let p = {x: source.x0, y: source.y0}
            return diagonal(p, p)    // link的平滑transition
          })
        
        // 更新新增的link
        var linkUpdate = linkEnter.merge(link);
        linkUpdate.transition()
          .duration(750)
          .attr('d', d => diagonal(d, d.parent))

        // 删除退出的link
        var linkExit = link.exit().transition()
          .duration(750)
          .attr('d', () => {
            let p = {x: source.x, y: source.y}
            return diagonal(p, p)
          })
          .remove()
        
        // 保存node的位置
        nodes.forEach(d => {
          d.x0 = d.x;
          d.y0 = d.y;
        }) 
      }

      function diagonal(s, d){
        var path = `M ${s.x} ${s.y}
                    C ${s.x + 15} ${s.y - 30},
                      ${d.x - 15} ${d.y + 30},
                      ${d.x} ${d.y}`
        return path
      }

      function click(d) {
        if (d.children) {
          d._children = d.children;
          d.children = null;
        } else {
          d.children = d._children;
          d._children = null;
        }
        update(d); 
      }
    },
    drawPreTree(data){
      d3.select('.pre-tree>*').remove();
      let vm = this

      var margin = {top: 5, right: 15, bottom: 30, left: 15},
        width = this.preWidth - margin.left - margin.right,
        height = this.preHeight - margin.top - margin.bottom;
      
      var svg = d3.select(".pre-tree").append("svg")
        .attr("width", this.preWidth)
        .attr("height", this.preHeight)
        .append('g')
        .attr('class', 'nodes-links')
        .attr('transform', 'translate('+margin.left+','+margin.top+')');

      var treemap = d3.tree().size([width, height]);
      var root = d3.hierarchy(data, d => d.children);
      root.x0 = width / 2, root.y0 = 0;
      var maxDepth = d3.max(root.leaves(), d => d.depth);

      // 为文件夹节点添加collapse事件
      root.children.forEach(collapse);
      update(root);

      // 节点id
      var nodeId = 0;

      function collapse(d){
        if(d.children){
          d._children = d.children;
          d._children.forEach(collapse)
          d.children = null
        }
      }

      function update(source){
        var treeData = treemap(root),
          nodes = treeData.descendants(),
          links = treeData.descendants().slice(1);

        nodes.forEach(d => d.y = height - d.depth * (height/maxDepth) + 10);

        // node数据
        var node = svg.selectAll('g.node')
          .data(nodes, d => { return d.id || (d.id = ++nodeId)});
        
        // 为每一个新增的node添加g
        var nodeEnter = node.enter()
          .append('g')
          .attr('class', 'node')
          .attr('transform', 'translate('+source.x0+','+source.y0+')')
          .on('click', click);
        
        // 插入新增node
        nodeEnter.append('text')
          .attr('font-family', 'FontAwesome')
          .attr('font-size', '20px')
          .attr('dx', '-0.3em')
          .attr('dy', '0.2em')

        // 更新进入的node
        var nodeUpdate = nodeEnter.merge(node);
        nodeUpdate.transition()
          .duration(750)
          .attr('transform', d => 'translate('+d.x+','+d.y+')');
        nodeUpdate.select('text')
          .attr('font-family', 'FontAwesome')
          .attr('font-size', '20px')
          .attr('dx', '-0.3em')
          .attr('dy', '0.2em')
          .style('fill', d => {
            if(d.data.type == 'dir') return '#f19309'
            if(d.data.type == 'file') return vm.topicColormap(d.data.topic)
            if(d.data.type == 'topic') return vm.topicColormap(d.data.topicId)
          })
          .text(d => { 
            if(d.data.type == 'dir') return "\uf07b" 
            if(d.data.type == 'file') return "\uf1c9"
            if(d.data.type == 'topic') return "\uf111"
          })
        
        // 删除退出的node
        var nodeExit = node.exit().transition()
          .duration(750)
          .attr('transform', 'translate('+source.x+','+source.y+')')
          .remove()
        nodeExit.select('text') 
          .attr('font-size', '0px')

        // link数据
        var link = svg.selectAll('path.link')
          .data(links, d => d.id)
        
        // 为每一条新增的link添加g
        var linkEnter = link.enter().insert('path', 'g')
          .attr('class', 'link')
          .attr('d', d => {
            let p = {x: source.x0, y: source.y0}
            return diagonal(p, p)    // link的平滑transition
          })
        
        // 更新新增的link
        var linkUpdate = linkEnter.merge(link);
        linkUpdate.transition()
          .duration(750)
          .attr('d', d => diagonal(d, d.parent))

        // 删除退出的link
        var linkExit = link.exit().transition()
          .duration(750)
          .attr('d', d => {
            let p = {x: source.x, y: source.y}
            return diagonal(p, p)
          })
          .remove()
        
        // 保存node的位置
        nodes.forEach(d => {
          d.x0 = d.x;
          d.y0 = d.y;
        }) 
      }

      function diagonal(s, d){
        var path = `M ${d.x} ${d.y}
                    C ${d.x + 15} ${d.y - 30},
                      ${s.x - 15} ${s.y + 30},
                      ${s.x} ${s.y}`
        return path
      }

      function click(d) {
        if (d.children) {
          d._children = d.children;
          d.children = null;
        } else {
          d.children = d._children;
          d._children = null;
        }
        update(d); 
      }
    }
  },
  created() {
    this.$bus.$on('curVersion-selected', d =>{
      this.curVersion = d
      this.$axios
        .get("topics/getFileHierarchyByVersion", {version: d})
        .then(({data}) => {
          console.log('curVersion file hierarchy:', data)
          this.drawCurTree(data)
        })
    })
    this.$bus.$on('version-compared', d =>{
      this.preVersion = d.preVer
      this.$axios
        .get("topics/getFileHierarchyByVersion", {version: this.preVersion})
        .then(({data}) => {
          console.log('preVersion file hierarchy:', data)
          this.drawPreTree(data)
        })
    })
   
  },
  mounted() {
    this.curHeight = Math.floor(this.$refs.root1.clientHeight);
    this.curWidth = Math.floor(this.$refs.root1.clientWidth);
    this.preHeight = Math.floor(this.$refs.root2.clientHeight);
    this.preWidth = Math.floor(this.$refs.root2.clientWidth);
  }
};
</script>

<style lang='less'>
.file-tree {
  height: 100%;
  display: flex;
  flex-direction: column;
  .cur-tree{
    flex: 1;
    .link{
      fill: none;
      stroke: #ccc;
      stroke-width: 2px;
    }
  }
  .pre-tree{
    flex: 1;
    .link{
      fill: none;
      stroke: #ccc;
      stroke-width: 2px;
    }
  }
}
</style>