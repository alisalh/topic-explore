<template>
  <div class="file-tree" ref="root">
    <div class="cur-tree" ref="root1" ></div> 
    <div class="diff-tree" ref="root2">
      <el-tabs type="card" v-model="activeName" @tab-click="drawDiffTree">
        <el-tab-pane label="content" name="first">
            <div class='add-tree'></div>
            <div class='del-tree'></div>
        </el-tab-pane>
        <el-tab-pane label="structure" name="second">
          <div class='move-tree'></div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script>
import * as d3 from "d3";
import d3tip from "d3-tip";
import {getRelPath} from "../utils/index.js";

export default {
  name: "component_name",
  data() {
    return {
     activeName: 'first',
     curWidth: 0,
     curHeight: 0,
     diffWidth: 0,
     diffHeight: 0,
     curVersion: null,
     curTreeData:null,
     diffData: null,
     selectedTopic: -1,
     curSelectedFileId: -1,
     preSelectedFileId: -1,
     diffRoot: null
    };
  },
  computed: {},
  props: ["topicColormap", "docData", "libraryName"],
  methods: {
    drawCurTree(data){
      let vm = this

      var svgHeight = this.curHeight / 2, svgWidth = this.curWidth
      var margin = {top: 20, right: 5, bottom: 15, left: 5},
        width = svgWidth - margin.left - margin.right,
        height = svgHeight - margin.top - margin.bottom;

      var svg = d3.select(".cur-tree").append("svg")
        .attr("width", svgWidth)
        .attr("height", svgHeight)
        .append('g')
        .attr('class', 'nodes-links')
        .attr('transform', 'translate('+margin.left+','+margin.top+')');

      var treemap = d3.tree().size([width, height]);
      var root = d3.hierarchy(data, d => d.children);
      root.x0 = width / 2, root.y0 = 0;

      var rScale = d3.scaleLinear()  
        .domain([1, 55])      // d3中topic节点下最大的文件数为34
        .range([16, 169])     

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
            
            // 添加点击文件显示代码事件
            if(d.data.type == 'file'){
              vm.curSelectedFileId = d.data.id
              vm.$bus.$emit('file-selected', d.data.name)
              d3.selectAll('.link').style('stroke', '#ccc')
              d3.selectAll('.link').filter(link => link.data.fileIds.indexOf(d.data.id) != -1)
                .style('stroke', link => vm.topicColormap(d.data.topic))
            }
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
          .attr('dy', '-0.8em')
          .text(d => d.data.name.slice(d.data.name.lastIndexOf('/')+1))
          .style("text-anchor", "middle")
          .attr('opacity', 0)
        
        nodeEnter.append('title').text(d => d.data.name.slice(d.data.name.lastIndexOf('/')+1))

        // 更新进入的node
        var nodeUpdate = nodeEnter.merge(node);
        nodeUpdate.transition()
          .duration(750)
          .attr('transform', d => 'translate('+d.x+','+d.y+')')
          .on('end', function(d, i) {
            // 绑定在最后一个transition上
            if(i == nodes.length - 1){
              nodeEnter.filter(d => d.children)
                .select('.node-text')
                .attr('opacity', 1) 
            }
          });
        nodeUpdate.select('.node-logo')
          .attr('font-family', 'FontAwesome')
          .attr('font-size', '20px')
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
         .attr('stroke', d =>{
            if(vm.selectedTopic != -1){
              if(d.data.type == 'dir' && 
                d.data.topics.indexOf(vm.selectedTopic) != -1) 
                return vm.topicColormap(vm.selectedTopic)
            }
          })
          .attr('stroke-width', d =>{
            if(vm.selectedTopic != -1){
              if(d.data.type == 'dir' && 
                d.data.topics.indexOf(vm.selectedTopic) != -1) 
                return 3
            }
          })
        nodeUpdate.select('.node-circle')
          .attr('r', d => Math.sqrt(rScale(d.data.children.length)))
          .style('fill', d => vm.topicColormap(d.data.topicId))

        // 删除退出的node
        var nodeExit = node.exit()
          .each(d => {
            if(d.data.type == 'file' && d.data.id == vm.curSelectedFileId){
              d3.selectAll('.link').style('stroke', '#ccc')
              vm.curSelectedFileId = -1
            }
          })
          .transition()
          .duration(750)
          .attr('transform', 'translate('+source.x+','+source.y+')')
          .remove()
        nodeExit.select('.node-logo')
          .attr('font-size', '0px')
        nodeExit.select('.node-circle') 
          .attr('r', 0)
        nodeExit.select('.node-text') 
          .attr('font-size', '0px')
          .attr('opacity', 0)
        
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
    drawDiffTree(data){
      if(data.addRoot.children.length > 0) this.drawAddTree(data.addRoot)
      if(data.delRoot.children.length > 0) this.drawDelTree(data.delRoot)
      if(data.moveRoot.children.length > 0) this.drawMoveTree(data.moveRoot)
    },
    drawAddTree(data){
      d3.select(".add-tree>svg").remove()
      let vm = this

      var svgHeight = this.diffHeight / 2, svgWidth = this.diffWidth
      var margin = {top: 20, right: 5, bottom: 80, left: 5},
        width = svgWidth - margin.left - margin.right,
        height = svgHeight - margin.top - margin.bottom;

      var svg = d3.select(".add-tree").append("svg")
        .attr("width", svgWidth)
        .attr("height", svgHeight)
        .append('g')
        .attr('class', 'nodes-links')
        .attr('transform', 'translate('+margin.left+','+margin.top+')');

      var treemap = d3.tree().size([width, height]);
      var root = d3.hierarchy(data, d => d.children);
      root.x0 = width / 2, root.y0 = 0;

      var rScale = d3.scaleLinear()  
        .domain([1, 34])      // d3中topic节点下最大的文件数为34
        .range([16, 169])

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
            if(d.data.type == 'file'){
              let preName = d.data.prefile ? d.data.prefile.filename : null, curName = d.data.curfile.filename
              vm.curSelectedFileId =d.data.curfile.id
              vm.$bus.$emit('compared-file-selected', {preName: preName, curName: curName})
              d3.select('.add-tree').selectAll('.link').style('stroke', '#ccc')
              d3.select('.add-tree').selectAll('.link').filter(link => link.data.fileIds.indexOf(d.data.curfile.id) != -1)
                .style('stroke', link => vm.topicColormap(d.data.curfile.main_topic))
            }
            else{
              d3.selectAll('.node-add-dir').remove()
            }
          });
        // 插入新增node
        nodeEnter.each(d =>{
          if(d.data.type == 'root'){
            nodeEnter.filter(node => node == d)
              .append('circle')
              .attr('class', 'node-root')
              .attr('r', 12)
              .style('fill', 'white')
              .attr('stroke', 'black')
            nodeEnter.filter(node => node == d)
              .append('text')
              .text('A')
              .attr('font-size', '14px')
              .attr('dx', '-0.4em')
              .attr('dy', '0.3em')
          }
          if(d.data.type == 'topic'){
            nodeEnter.filter(node => node == d)
              .append('circle')
              .attr('class', 'node-topic')
          }
          if(d.data.type == 'file'){
            nodeEnter.filter(node => node == d)
              .append('text')
              .attr('class', 'node-add')
            if(d.data.prefile){     // 文件内容有改动(数据中有两个文件)
              nodeEnter.filter(node => node == d)
                .append('text')
                .attr('class', 'node-copy')
            }
          }
        })

        // 更新进入的node
        var nodeUpdate = nodeEnter.merge(node);
        nodeUpdate.transition()
          .duration(750)
          .attr('transform', d => 'translate('+d.x+','+d.y+')')
          .on('end', function(d, i){
            if(i == nodes.length - 1){
              // 打开的主题节点
              let topicNodes = nodes.filter(node => !node._children && node.data.type == 'topic')
              if(topicNodes.length == 0) return 
              d3.selectAll('.node-add-dir').remove()
              topicNodes.forEach(node =>{
                let leafs = node.children
                vm.drawDiffDir(leafs, svg, 'add')
              })
            }
          })
        nodeUpdate.select('.node-topic')
          .attr('r', d => Math.sqrt(rScale(d.data.children.length)))
          .style('fill', d => vm.topicColormap(d.data.topic))
        nodeUpdate.select('.node-add')
          .attr('font-family', 'FontAwesome')
          .attr('font-size', '20px')
          .attr('dx', '-0.5em')
          .attr('dy', '0.5em')
          .style('fill', d => vm.topicColormap(d.data.curfile.main_topic))
          .text("\uf1c9")
        nodeUpdate.select('.node-copy')
          .attr('font-family', 'FontAwesome')
          .attr('font-size', '8px')
          .attr('dx', '1em')
          .attr('dy', '1.5em')
          .style('fill', d => vm.topicColormap(d.data.prefile.main_topic))
          .text("\uf15b")
        
        // 删除退出的node
        var nodeExit = node.exit()
          .each(d => {
            if(d.data.type == 'file' && d.data.curfile.id == vm.curSelectedFileId){
              d3.select('.add-tree').selectAll('.link').style('stroke', '#ccc')
              vm.curSelectedFileId = -1
            }
          })
          .transition()
          .duration(750)
          .attr('transform', 'translate('+source.x+','+source.y+')')
          .remove()
        nodeExit.select('.node-add')
          .attr('font-size', '0px')
        nodeExit.select('.node-copy')
          .attr('font-size', '0px')
        nodeExit.select('.node-topic') 
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
    drawDelTree(data){
      d3.select(".del-tree>svg").remove()
      let vm = this

      var svgHeight = this.diffHeight / 2, svgWidth = this.diffWidth
      var margin = {top: 30, right: 5, bottom: 70, left: 5},
        width = svgWidth - margin.left - margin.right,
        height = svgHeight - margin.top - margin.bottom;

      var svg = d3.select(".del-tree").append("svg")
        .attr("width", svgWidth)
        .attr("height", svgHeight)
        .append('g')
        .attr('class', 'nodes-links')
        .attr('transform', 'translate('+margin.left+','+margin.top+')');

      var treemap = d3.tree().size([width, height]);
      var root = d3.hierarchy(data, d => d.children);
      root.x0 = width / 2, root.y0 = 0;

      var rScale = d3.scaleLinear()  
        .domain([1, 34])      // d3中topic节点下最大的文件数为34
        .range([16, 169])

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
            if(d.data.type == 'file'){
              let curName = d.data.curfile ? d.data.curfile.filename : null, preName = d.data.prefile.filename
              vm.preSelectedFileId =d.data.prefile.id
              vm.$bus.$emit('compared-file-selected', {preName: preName, curName: curName})
              d3.select('.del-tree').selectAll('.link').style('stroke', '#ccc')
              d3.select('.del-tree').selectAll('.link').filter(link => link.data.fileIds.indexOf(d.data.prefile.id) != -1)
                .style('stroke', link => vm.topicColormap(d.data.prefile.main_topic))
            }
            else{
              d3.selectAll('.node-del-dir').remove()
            }
          });
        // 插入新增node
        nodeEnter.each(d =>{
          if(d.data.type == 'root'){
            nodeEnter.filter(node => node == d)
              .append('circle')
              .attr('class', 'node-root')
              .attr('r', 12)
              .style('fill', 'white')
              .attr('stroke', 'black')
            nodeEnter.filter(node => node == d)
              .append('text')
              .text('D')
              .attr('font-size', '14px')
              .attr('dx', '-0.4em')
              .attr('dy', '0.3em')
          }
          if(d.data.type == 'topic'){
            nodeEnter.filter(node => node == d)
              .append('circle')
              .attr('class', 'node-topic')
          }
          if(d.data.type == 'file'){
            nodeEnter.filter(node => node == d)
              .append('text')
              .attr('class', 'node-del')
            if(d.data.curfile){     // 文件内容有改动(数据中有两个文件)
              nodeEnter.filter(node => node == d)
                .append('text')
                .attr('class', 'node-copy')
            }
          }
        })

        // 更新进入的node
        var nodeUpdate = nodeEnter.merge(node);
        nodeUpdate.transition()
          .duration(750)
          .attr('transform', d => 'translate('+d.x+','+d.y+')')
          .on('end', function(d, i){
            if(i == nodes.length - 1){
              // 打开的主题节点
              let topicNodes = nodes.filter(node => !node._children && node.data.type == 'topic')
              if(topicNodes.length == 0) return 
              d3.selectAll('.node-del-dir').remove()
              topicNodes.forEach(node =>{
                let leafs = node.children
                vm.drawDiffDir(leafs, svg, 'del')
              })
            }
          })
        nodeUpdate.select('.node-topic')
          .attr('r', d => Math.sqrt(rScale(d.data.children.length)))
          .style('fill', d => vm.topicColormap(d.data.topic))
        nodeUpdate.select('.node-del')
          .attr('font-family', 'FontAwesome')
          .attr('font-size', '20px')
          .attr('dx', '-0.5em')
          .attr('dy', '0.5em')
          .style('fill', d => vm.topicColormap(d.data.prefile.main_topic))
          .text("\uf1c9")
        nodeUpdate.select('.node-copy')
          .attr('font-family', 'FontAwesome')
          .attr('font-size', '8px')
          .attr('dx', '1em')
          .attr('dy', '1.5em')
          .style('fill', d => vm.topicColormap(d.data.curfile.main_topic))
          .text("\uf15b")

        // 删除退出的node
        var nodeExit = node.exit()
          .each(d => {
            if(d.data.type == 'file' && d.data.prefile.id == vm.preSelectedFileId){
              d3.select('.del-tree').selectAll('.link').style('stroke', '#ccc')
              vm.preSelectedFileId = -1
            }
          })
          .transition()
          .duration(750)
          .attr('transform', 'translate('+source.x+','+source.y+')')
          .remove()
        nodeExit.select('.node-del')
          .attr('font-size', '0px')
        nodeExit.select('.node-copy')
          .attr('font-size', '0px')
        nodeExit.select('.node-topic') 
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
    drawMoveTree(data){
      d3.select(".move-tree>svg").remove()
      let vm = this

      var svgHeight = this.diffHeight / 2, svgWidth = this.diffWidth
      var margin = {top: 30, right: 5, bottom: 30, left: 5},
        width = svgWidth - margin.left - margin.right,
        height = svgHeight - margin.top - margin.bottom;

      var svg = d3.select(".move-tree").append("svg")
        .attr("width", svgWidth)
        .attr("height", svgHeight)
        .append('g')
        .attr('class', 'nodes-links')
        .attr('transform', 'translate('+margin.left+','+margin.top+')');

      var treemap = d3.tree().size([width, height]);
      var root = d3.hierarchy(data, d => d.children);
      root.x0 = width / 2, root.y0 = 0;

      var rScale = d3.scaleLinear()  
        .domain([1, 34])      // d3中topic节点下最大的文件数为34
        .range([16, 169])

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
          });
        // 插入新增node
        nodeEnter.each(d =>{
          if(d.data.type == 'root'){
            nodeEnter.filter(node => node == d)
              .append('circle')
              .attr('class', 'node-root')
              .attr('r', 12)
              .style('fill', 'white')
              .attr('stroke', 'black')
            nodeEnter.filter(node => node == d)
              .append('text')
              .text('M')
              .attr('font-size', '14px')
              .attr('dx', '-0.5em')
              .attr('dy', '0.3em')
          }
          else if(d.data.type == 'topic'){
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

        // 更新进入的node
        var nodeUpdate = nodeEnter.merge(node);
        nodeUpdate.transition()
          .duration(750)
          .attr('transform', d => 'translate('+d.x+','+d.y+')')
        nodeUpdate.select('.node-logo')
          .attr('font-family', 'FontAwesome')
          .attr('font-size', '20px')
          .attr('dx', '-0.5em')
          .attr('dy', '0.5em')
          .style('fill', d => vm.topicColormap(d.data.main_topic))
          .text("\uf1c9")
        nodeUpdate.select('.node-circle')
          .attr('r', d => Math.sqrt(rScale(d.data.children.length)))
          .style('fill', d => vm.topicColormap(d.data.topic))

        // 删除退出的node
        var nodeExit = node.exit()
          .transition()
          .duration(750)
          .attr('transform', 'translate('+source.x+','+source.y+')')
          .remove()
        nodeExit.select('.node-logo')
          .attr('font-size', '0px')
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
    drawDiffDir(leafs, svg, type){
      let curDirs = []
      for(let j=0; j<leafs.length; j++){
        let dirs = leafs[j].data.dirs
        let temp = curDirs.find(item => item.name == (dirs.length == 2 ? dirs[0] : dirs[1]))
        if(!temp) curDirs.push({
          name: dirs.length == 2 ? dirs[0] : dirs[1], 
          nodeX: leafs[j].x, 
          nodeY: leafs[j].y, 
          num: 1, 
          startX: leafs[j].x,
          endX: leafs[j].x
        })
        else{
          temp.nodeX += leafs[j].x
          temp.num += 1
          if(temp.startX > leafs[j].x) temp.startX = leafs[j].x
          if(temp.endX < leafs[j].x) temp.endX = leafs[j].x
        }
      }

      let dirG = svg.append('g').attr('class', 'node-'+type+'-dir')
      curDirs.forEach(item => {
        dirG.append('text')
          .attr('font-family', 'FontAwesome')
          .attr('font-size', '20px')
          .attr('x', item.nodeX/item.num)
          .attr('y', item.nodeY)
          .attr('dy', '2.5em')
          .style('text-anchor', 'middle')
          .style('fill',  '#F5C175')
          .text("\uf07b")
        dirG.append('text')
          .attr('font-size', '10px')
          .attr('x', item.nodeX/item.num)
          .attr('y', item.nodeY)
          .attr('dy', '6em')
          .text(() =>{
            if(curDirs.length > 5){
              if(item.name.length > 5) return item.name.slice(0, 4)+'...'
            } 
            return item.name
          })
          .style('text-anchor', 'middle')
        if(item.num > 1){
          dirG.append('line')
            .attr('x1', item.startX)
            .attr('y1', item.nodeY+20)
            .attr('x2', item.endX)
            .attr('y2', item.nodeY+20)
            .attr('stroke', 'black')
          dirG.append('line')
            .attr('x1', item.startX)
            .attr('y1', item.nodeY+15)
            .attr('x2', item.startX)
            .attr('y2', item.nodeY+20)
            .attr('stroke', 'black')
          dirG.append('line')
            .attr('x1', item.endX)
            .attr('y1', item.nodeY+15)
            .attr('x2', item.endX)
            .attr('y2', item.nodeY+20)
            .attr('stroke', 'black')
          dirG.append('line')
            .attr('x1', item.nodeX/item.num)
            .attr('y1', item.nodeY+20)
            .attr('x2', item.nodeX/item.num)
            .attr('y2', item.nodeY+25)
            .attr('stroke', 'black')
        }else{
          dirG.append('line')
            .attr('x1', item.nodeX/item.num)
            .attr('y1', item.nodeY+15)
            .attr('x2', item.nodeX/item.num)
            .attr('y2', item.nodeY+25)
            .attr('stroke', 'black')
        }
      })
    },
    dataAdapter(data){
      let addFile = data.add, delFile = data.del, editFile = data.edit

      let addRoot = { type: 'root', children:[], topics: [], fileIds: []}
      addFile.forEach(d =>{
        let file = this.docData.find(doc => doc.id == d),
          filePath = getRelPath(file.filename, this.libraryName),
          dirs = filePath.split('/').slice(1);

        if(addRoot.topics.indexOf(file.main_topic) == -1){
          let topicNode = {
            type: 'topic',
            topic: file.main_topic,
            children: [{curfile: file, prefile: null, type: 'file', fileIds: [file.id], dirs: dirs}],
            fileIds: [file.id]
          }
          addRoot.children.push(topicNode)
          addRoot.topics.push(file.main_topic)
          addRoot.fileIds.push(file.id)
        }
        else{
          let topicNode = addRoot.children.find(t => t.topic == file.main_topic)
          topicNode.children.push({curfile: file, prefile: null, type: 'file', fileIds: [file.id], dirs: dirs})
          topicNode.fileIds.push(file.id)
          addRoot.fileIds.push(file.id)
        }
      })

      let delRoot = { type: 'root', children:[], topics: [], fileIds: []}
      delFile.forEach(d =>{
        let file = this.docData.find(doc => doc.id == d),
          filePath = getRelPath(file.filename, this.libraryName),
          dirs = filePath.split('/').slice(1);
        
        if(delRoot.topics.indexOf(file.main_topic) == -1){
          let topicNode = {
            type: 'topic',
            topic: file.main_topic,
            children: [{prefile: file, curfile: null, type: 'file', fileIds: [file.id], dirs: dirs}],
            fileIds: [file.id]
          }
          delRoot.children.push(topicNode)
          delRoot.topics.push(file.main_topic)
          delRoot.fileIds.push(file.id)
        }
        else{
          let topicNode = delRoot.children.find(t => t.topic == file.main_topic)
          topicNode.children.push({prefile: file, curfile: null, type: 'file', fileIds: [file.id], dirs: dirs})
          topicNode.fileIds.push(file.id)
          delRoot.fileIds.push(file.id)
        }
      })

      let moveRoot = { type: 'root', children:[], topics: [], fileIds: []}
      editFile.forEach(d =>{
        if(d.type == '') return
        let curfile = this.docData.find(doc => doc.id == d.curid),
          prefile = this.docData.find(doc => doc.id == d.preid)
        
        if(d.type == 'move'){
          if(moveRoot.topics.indexOf(curfile.main_topic) == -1){
            let topicNode = {
              type: 'topic',
              topic: curfile.main_topic,
              children: [[curfile, prefile]]
            }
            moveRoot.children.push(topicNode)
            moveRoot.topics.push(curfile.main_topic)
            moveRoot.fileIds.push(curfile.id)
          }
          else{
            moveRoot.children.find(t => t.topic == curfile.main_topic)
              .children.push([curfile, prefile])
            moveRoot.fileIds.push(curfile.id)
          }
        }
        if(d.type == 'modify_add'){
          let filePath = getRelPath(curfile.filename, this.libraryName),
            dirs = filePath.split('/').slice(1)
          if(addRoot.topics.indexOf(curfile.main_topic) == -1){
            let topicNode = {
              type: 'topic',
              topic: curfile.main_topic,
              children: [{curfile: curfile, prefile: prefile, type: 'file', fileIds: [curfile.id], dirs: dirs}],
              fileIds: [curfile.id]
            }
            addRoot.children.push(topicNode)
            addRoot.topics.push(curfile.main_topic)
            addRoot.fileIds.push(curfile.id)
          }
          else{
            let topicNode = addRoot.children.find(t => t.topic == curfile.main_topic)
            let index = 0
            topicNode.children.forEach((f,i) =>{
              if(f.dirs[1] == dirs[1]) index = i
            })
            if(index == 0) topicNode.children.push({curfile: curfile, prefile: prefile, type: 'file', fileIds: [curfile.id], dirs: dirs})
            else topicNode.children.splice(index+1, 0, {curfile: curfile, prefile: prefile, type: 'file', fileIds: [curfile.id], dirs: dirs})
            topicNode.fileIds.push(curfile.id)
            addRoot.fileIds.push(curfile.id)
          }
        }
        if(d.type == 'modify_del'){
          let filePath = getRelPath(prefile.filename, this.libraryName),
            dirs = filePath.split('/').slice(1)
          if(delRoot.topics.indexOf(prefile.main_topic) == -1){
            let topicNode = {
              type: 'topic',
              topic: prefile.main_topic,
              children: [{prefile: prefile, curfile: curfile, type: 'file', fileIds: [prefile.id], dirs: dirs}],
              fileIds: [prefile.id]
            }
            delRoot.children.push(topicNode)
            delRoot.topics.push(prefile.main_topic)
            delRoot.fileIds.push(prefile.id)
          }
          else{
            let topicNode = delRoot.children.find(t => t.topic == prefile.main_topic)
            let index = -1
            topicNode.children.forEach((f,i) =>{
              if(f.dirs[1] == dirs[1]) index = i
            })
            if(index == -1) topicNode.children.push({prefile: prefile, curfile: curfile, type: 'file', fileIds: [prefile.id], dirs: dirs})
            else topicNode.children.splice(index+1, 0, {prefile: prefile, curfile: curfile, type: 'file', fileIds: [prefile.id], dirs: dirs})
            topicNode.fileIds.push(prefile.id)
            delRoot.fileIds.push(prefile.id)
          }
        } 
      })

      // 对主题进行排序
      addRoot.children.sort(function(a, b){return a.topic - b.topic})
      let negTopicNode = addRoot.children.filter(d => d.topic == -1)
      if(negTopicNode.length > 0){
        addRoot.children = addRoot.children.filter(d => d.topic != -1)
        addRoot.children.push(negTopicNode[0])
      }

      delRoot.children.sort(function(a, b){return a.topic - b.topic})
      negTopicNode = delRoot.children.filter(d => d.topic == -1)
      if(negTopicNode.length > 0){
        delRoot.children = delRoot.children.filter(d => d.topic != -1)
        delRoot.children.push(negTopicNode[0])
      }

      // 将直接在src文件夹下的文件放到最后
      addRoot.children.forEach(d =>{
        let srcfiles = d.children.filter(f => f.dirs.length == 2)
        d.children = d.children.filter(f => f.dirs.length > 2)
        d.children = srcfiles.concat(d.children)
      })

      delRoot.children.forEach(d =>{
        let srcfiles = d.children.filter(f => f.dirs.length == 2)
        d.children = d.children.filter(f => f.dirs.length > 2)
        d.children = srcfiles.concat(d.children)
      })
      
      this.diffRoot = { addRoot: addRoot, delRoot: delRoot, moveRoot: moveRoot}
      console.log('diffRoot:', this.diffRoot)
    },
    clearDataAndView(){
      this.curVersion = null
      this.curTreeData = null
      this.selectedTopic = -1
      this.diffRoot = null
      this.curSelectedFileId = -1
      this.preSelectedFileId = -1
      d3.select('.cur-tree').style('visibility','hidden')
      d3.select('.cur-tree').style('padding','0px')
      d3.select('.diff-tree').style('visibility','hidden')
      d3.select('.diff-tree').style('padding','0px')
      d3.select('.cur-tree>*').remove();
      this.clearDiffTree()
    },
    clearDiffTree(){
      d3.select('.add-tree>svg').remove();
      d3.select('.del-tree>svg').remove();
      d3.select('.move-tree>svg').remove();
    },
    curVersionSelected(d){
      this.clearDataAndView()
      d3.select('.cur-tree').style('visibility','visible')
      d3.select('.cur-tree').style('padding','5px')
      this.curVersion = d
      this.$axios
        .get("topics/getFileHierarchyByVersion", {version: d})
        .then(({data}) => {
          console.log('hierarchyData:', data)
          this.curTreeData = data
          this.drawCurTree(data)
        })
    },
  },
  created() {
    // control panel响应事件
    this.$bus.$on('curVersion-selected', d =>{
      this.curVersionSelected(d)
    })
    this.$bus.$on("curVersion-reseted", () =>{
      this.clearDataAndView()
    })
    this.$bus.$on('version-compared', d =>{
      this.clearDataAndView()
      d3.select('.diff-tree').style('visibility','visible')
      d3.select('.diff-tree').style('padding','5px')
      this.$axios
        .get("topics/getDiffDocs", {preVer: d.preVer, curVer: d.curVer})
        .then(({data}) => {
          console.log('diffData:', data)
          this.diffData = data
          this.dataAdapter(data)
          this.drawDiffTree(this.diffRoot)
        })
    })

    // lineChart响应事件
    this.$bus.$on("lineVersion-selected", d => {
      this.curVersionSelected(d)
    });
    this.$bus.$on("lineVersion-reseted", d => {
      this.clearDataAndView()
    });

    // topic bar响应事件
    this.$bus.$on("topic-selected", d => {
      this.selectedTopic = d
      d3.selectAll(".node-logo").attr('stroke', node =>{
        if(this.selectedTopic != -1){
          if(node.data.type == 'dir' && 
             node.data.topics.indexOf(this.selectedTopic) != -1) 
            return this.topicColormap(this.selectedTopic)
        }
      })
      .attr('stroke-width', node =>{
        if(this.selectedTopic != -1){
          if(node.data.type == 'dir' && 
             node.data.topics.indexOf(this.selectedTopic) != -1) 
            return 3
        }
      })
    });
    this.$bus.$on('topic-reseted', () =>{
      this.selectedTopic = -1
      d3.selectAll(".node-logo").attr('stroke', 'none')
      .attr('stroke-width', 0)
    });
  },
  mounted() {
    this.curHeight = Math.floor(this.$refs.root.clientHeight) - 15;
    this.curWidth = Math.floor(this.$refs.root.clientWidth) - 10;
    this.diffHeight = Math.floor(this.$refs.root.clientHeight) - 60;
    this.diffWidth = Math.floor(this.$refs.root.clientWidth) - 10;
  }
};
</script>

<style lang='less'>
.file-tree {
  height: 100%;
  .cur-tree{
    padding: 5px;
    .link{
      fill: none;
      stroke: #ccc;
      stroke-width: 2px;
    }
  }
  .diff-tree{
    padding: 5px;
    visibility: hidden;
    .el-tabs__header {
      margin: 0;
    }
    .el-tabs__item{
      height: 30px;
      line-height: 30px;
    }
    .link{
      fill: none;
      stroke: #ccc;
      stroke-width: 2px;
    }
  }
}
</style>