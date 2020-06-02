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
     diffRoot: null
    };
  },
  computed: {},
  props: ["topicColormap", "docData"],
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
      var margin = {top: 20, right: 5, bottom: 40, left: 5},
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
          else if(d.data.type == 'topic'){
            nodeEnter.filter(node => node == d)
              .append('circle')
              .attr('class', 'node-topic')
          }
          else{
            if(Array.isArray(d.data)){     // 文件内容有改动(数据中有两个文件)
              nodeEnter.filter(node => node == d)
                .append('text')
                .attr('class', 'node-add')
              nodeEnter.filter(node => node == d)
                .append('text')
                .attr('class', 'node-add copy')
            }
            else{                         // 新增文件(数据中只有一个文件)
              nodeEnter.filter(node => node == d)
                .append('text')
                .attr('class', 'node-add')
            }
          }
        })

        // 更新进入的node
        var nodeUpdate = nodeEnter.merge(node);
        nodeUpdate.transition()
          .duration(750)
          .attr('transform', d => 'translate('+d.x+','+d.y+')')
        nodeUpdate.select('.node-topic')
          .attr('r', d => Math.sqrt(rScale(d.data.children.length)))
          .style('fill', d => vm.topicColormap(d.data.topic))
        nodeUpdate.select('.node-add')
          .attr('font-family', 'FontAwesome')
          .attr('font-size', '20px')
          .attr('dx', '-0.5em')
          .attr('dy', '0.5em')
          .style('fill', d => vm.topicColormap(d.data.main_topic || d.data[0].main_topic))
          .text("\uf1c9")
        nodeUpdate.select('.node-add copy')
          .attr('dy', '2em')
          .style('fill', d => vm.topicColormap(d.data[1].main_topic))
        
        // 删除退出的node
        var nodeExit = node.exit()
          .transition()
          .duration(750)
          .attr('transform', 'translate('+source.x+','+source.y+')')
          .remove()
        nodeExit.select('.node-add')
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
      var margin = {top: 20, right: 5, bottom: 40, left: 5},
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
          .attr('dx', '-0.4em')
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
    dataAdapter(data){
      let addFile = data.add, delFile = data.del, editFile = data.edit

      let addRoot = { type: 'root', children:[], topics: [], fileIds: []}
      addFile.forEach(d =>{
        let file = this.docData.find(doc => doc.id == d)
        if(addRoot.topics.indexOf(file.main_topic) == -1){
          let topicNode = {
            type: 'topic',
            topic: file.main_topic,
            children: [file]
          }
          addRoot.children.push(topicNode)
          addRoot.topics.push(file.main_topic)
          addRoot.fileIds.push(file.id)
        }
        else{
          addRoot.children.find(t => t.topic == file.main_topic).children.push(file)
          addRoot.fileIds.push(file.id)
        }
      })

      let delRoot = { type: 'root', children:[], topics: [], fileIds: []}
      delFile.forEach(d =>{
        let file = this.docData.find(doc => doc.id == d)
        if(delRoot.topics.indexOf(file.main_topic) == -1){
          let topicNode = {
            type: 'topic',
            topic: file.main_topic,
            children: [file]
          }
          delRoot.children.push(topicNode)
          delRoot.topics.push(file.main_topic)
          delRoot.fileIds.push(file.id)
        }
        else{
          delRoot.children.find(t => t.topic == file.main_topic).children.push(file)
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
          if(addRoot.topics.indexOf(curfile.main_topic) == -1){
            let topicNode = {
              type: 'topic',
              topic: curfile.main_topic,
              children: [[curfile, prefile]]
            }
            addRoot.children.push(topicNode)
            addRoot.topics.push(curfile.main_topic)
            addRoot.fileIds.push(curfile.id)
          }
          else{
            addRoot.children.find(t => t.topic == curfile.main_topic)
              .children.push([curfile, prefile])
            addRoot.fileIds.push(curfile.id)
          }
        }
        if(d.type == 'modify_del'){
          if(delRoot.topics.indexOf(curfile.main_topic) == -1){
            let topicNode = {
              type: 'topic',
              topic: prefile.main_topic,
              children: [[curfile, prefile]]
            }
            delRoot.children.push(topicNode)
            delRoot.topics.push(curfile.main_topic)
            delRoot.fileIds.push(curfile.id)
          }
          else{
            delRoot.children.find(t => t.topic == curfile.main_topic)
              .children.push([curfile, prefile])
            delRoot.fileIds.push(curfile.id)
          }
        } 
      })

      this.diffRoot = { addRoot: addRoot, delRoot: delRoot, moveRoot: moveRoot}
      console.log('diffRoot:', this.diffRoot)
    },
    clearDataAndView(){
      this.curVersion = null
      this.curTreeData = null
      this.selectedTopic = -1
      this.diffRoot = null
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