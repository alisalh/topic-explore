<template>
  <div class="file-tree" ref="root">
    <div class="cur-tree" ref="root1"></div>
    <div class="move-line" ref="root3"></div>
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

      var margin = {top: 20, right: 10, bottom: 15, left: 10},
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

      // topic节点下最大的文件数
      var maxFileNum = d3.max(root.descendants().filter(d => d.data.type == 'topic'), 
        topic => topic.children.length);
      var rScale = d3.scaleLinear()
        .domain([1, maxFileNum])
        .range([25, 169])

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

        // node数据
        var node = svg.selectAll('g.node')
          .data(nodes, d => { return d.id || (d.id = ++nodeId)});
        
        // 为每一个新增的node添加g
        var nodeEnter = node.enter()
          .append('g')
          .attr('class', 'node')
          .attr('transform', 'translate('+source.x0+','+source.y0+')')
          .on('click', d => {
            click(d)
            nodeEnter.filter(node => node.children).select('.node-text').attr('opacity', 1)
            nodeEnter.filter(node => node._children).select('.node-text').attr('opacity', 0)
          });
        
        // 插入新增node
        nodeEnter.each(d =>{
          if(d.data.type == 'topic'){
            nodeEnter.filter(node => node == d)
              .append('circle')
              .attr('class', 'node-circle')
          }
          else{
            nodeEnter.filter(node => node == d)
              .append('text')
              .attr('class', 'node-logo')
          }
        }) 

        // 插入节点的label
        nodeEnter.filter(d => d.data.type == 'dir')
          .append('text')
          .attr('class', 'node-text')
          .attr('font-size', '10px')
          .attr('dy', '-0.7em')
          .text(d => d.data.name.slice(d.data.name.lastIndexOf('/')+1))
          .style("text-anchor", "middle")
          .attr('opacity', 0)

        // 更新进入的node
        var nodeUpdate = nodeEnter.merge(node);
        nodeUpdate.transition()
          .duration(750)
          .attr('transform', d => 'translate('+d.x+','+d.y+')')
          .on('end', function() {
            nodeEnter.filter(d => d.children)
              .select('.node-text')
              .attr('opacity', 1) 
          });
        nodeUpdate.select('.node-logo')
          .attr('font-family', 'FontAwesome')
          .attr('font-size', d =>{
            if(d.data.type == 'topic') return fontScale(d.data.children.length)+'px'
            else return '20px'
          })
          .attr('dx', '-0.5em')
          .attr('dy', '0.5em')
          .style('fill', d => {
            if(d.data.type == 'dir') return '#F5C175'
            if(d.data.type == 'file') return vm.topicColormap(d.data.topic)
          })
          .text(d => { 
            if(d.data.type == 'dir') return "\uf07b" 
            if(d.data.type == 'file') return "\uf1c9"
          })
        nodeUpdate.select('.node-circle')
          .attr('r', d => Math.sqrt(rScale(d.data.children.length)))
          .style('fill', d => vm.topicColormap(d.data.topicId))

        // 删除退出的node
        var nodeExit = node.exit().transition()
          .duration(750)
          .attr('transform', 'translate('+source.x+','+source.y+')')
          .remove()
        nodeExit.select('.node-logo') 
          .attr('font-size', '0px')
        // nodeExit.select('.node-text') 
        //   .attr('font-size', '0px')
        //   .attr('opacity', 0)
        nodeExit.select('.node-circle') 
          .attr('r', 0)
      
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

      var margin = {top: 20, right: 10, bottom: 20, left: 10},
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

      // topic节点下最大的文件数
      var maxFileNum = d3.max(root.descendants().filter(d => d.data.type == 'topic'), 
        topic => topic.children.length);
      var rScale = d3.scaleLinear()
        .domain([1, maxFileNum])
        .range([25, 169])

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

        // node数据
        var node = svg.selectAll('g.node')
          .data(nodes, d => { return d.id || (d.id = ++nodeId)});
        
        // 为每一个新增的node添加g
        var nodeEnter = node.enter()
          .append('g')
          .attr('class', 'node')
          .attr('transform', 'translate('+source.x0+','+(height-source.y0)+')')
          .on('click', d => {
            click(d)
            nodeEnter.filter(node => node.children).select('.node-text').attr('opacity', 1)
            nodeEnter.filter(node => node._children).select('.node-text').attr('opacity', 0)
          });
        
        // 插入新增node
        nodeEnter.each(d =>{
          if(d.data.type == 'topic'){
            nodeEnter.filter(node => node == d)
              .append('circle')
              .attr('class', 'node-circle')
          }
          else{
            nodeEnter.filter(node => node == d)
              .append('text')
              .attr('class', 'node-logo')
          }
        }) 

        // 插入节点的label
        nodeEnter.filter(d => d.data.type == 'dir')
          .append('text')
          .attr('class', 'node-text')
          .attr('font-size', '10px')
          .attr('dy', '1.8em')
          .text(d => d.data.name.slice(d.data.name.lastIndexOf('/')+1))
          .style("text-anchor", "middle")
          .attr('opacity', 0)

        // 更新进入的node
        var nodeUpdate = nodeEnter.merge(node);
        nodeUpdate.transition()
          .duration(750)
          .attr('transform', d => 'translate('+d.x+','+(height-d.y)+')')
          .on('end', function() {
            nodeEnter.filter(d => d.children)
              .select('.node-text')
              .attr('opacity', 1) 
          });
        nodeUpdate.select('.node-logo')
          .attr('font-family', 'FontAwesome')
          .attr('font-size', d =>{
            if(d.data.type == 'topic') return fontScale(d.data.children.length)+'px'
            else return '20px'
          })
          .attr('dx', '-0.5em')
          .attr('dy', '0.5em')
          .style('fill', d => {
            if(d.data.type == 'dir') return '#F5C175'
            if(d.data.type == 'file') return vm.topicColormap(d.data.topic)
          })
          .text(d => { 
            if(d.data.type == 'dir') return "\uf07b" 
            if(d.data.type == 'file') return "\uf1c9"
          })
        nodeUpdate.select('.node-circle')
          .attr('r', d => Math.sqrt(rScale(d.data.children.length)))
          .style('fill', d => vm.topicColormap(d.data.topicId))

        // 删除退出的node
        var nodeExit = node.exit().transition()
          .duration(750)
          .attr('transform', 'translate('+source.x+','+(height-source.y)+')')
          .remove()
        nodeExit.select('.node-logo') 
          .attr('font-size', '0px')
        // nodeExit.select('.node-text') 
        //   .attr('font-size', '0px')
        //   .attr('opacity', 0)
        nodeExit.select('.node-circle') 
          .attr('r', 0)
        
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
        var path = `M ${d.x} ${height-d.y}
                    C ${d.x + 15} ${(height-d.y) - 30},
                      ${s.x - 15} ${(height-s.y) + 30},
                      ${s.x} ${height-s.y}`
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
    // control panel响应事件
    this.$bus.$on('curVersion-selected', d =>{
      this.curVersion = d
      this.$axios
        .get("topics/getFileHierarchyByVersion", {version: d})
        .then(({data}) => {
          this.drawCurTree(data)
          d3.select('.pre-tree>*').remove();
        })
    })
    this.$bus.$on('version-compared', d =>{
      this.preVersion = d.preVer
      this.$axios
        .get("topics/getFileHierarchyByVersion", {version: this.preVersion})
        .then(({data}) => {
          this.drawPreTree(data)
        })
    })
    this.$bus.$on("curVersion-reseted", () =>{
      this.curVersion = null
      this.preVersion = null
      d3.select('.cur-tree>*').remove();
      d3.select('.pre-tree>*').remove();
    })

    // lineChart响应事件
    this.$bus.$on("lineVersion-selected", d => {
      this.curVersion = d
      this.$axios
        .get("topics/getFileHierarchyByVersion", {version: d})
        .then(({data}) => {
          this.drawCurTree(data)
          d3.select('.pre-tree>*').remove();
        })
    });
    this.$bus.$on("lineVersion-reseted", d => {
      this.curVersion = null
      this.preVersion = null
      d3.select('.cur-tree>*').remove();
      d3.select('.pre-tree>*').remove();
    });
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
    flex: 3;
    .link{
      fill: none;
      stroke: #ccc;
      stroke-width: 2px;
    }
  }
  .pre-tree{
    flex: 3;
    .link{
      fill: none;
      stroke: #ccc;
      stroke-width: 2px;
    }
  }
  .move-line{
    flex: 1;
  }
}
</style>