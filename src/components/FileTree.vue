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

export default {
  name: "component_name",
  data() {
    return {
     curWidth: 0,
     curHeight: 0,
     curVersion: null,
     curTreeData:null,
     curLeaves: null,
     curDepth: -1,
     preWidth: 0,
     preHeight: 0,
     preVersion: null,
     preTreeData: null,
     preLeaves: null,
     preDepth: -1,
     mWidth: 0,
     mHeight: 0,
     mSvg: null,
     diffData: null,
     selectedTopic: -1,
     allEditIds: null,
     linePoints: null
    };
  },
  computed: {},
  props: ["topicColormap"],
  methods: {
    drawCurTree(data){
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
          .text(d => {
            let dirName = d.data.name.slice(d.data.name.lastIndexOf('/')+1)
            if (dirName == 'src') return dirName + ' (' + d.data.version + ')'
            else return dirName
          })
          .style("text-anchor", "middle")
          .attr('opacity', 0)

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
        var nodeExit = node.exit().transition()
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
    drawCurTreeCompared(data){
      d3.select('.cur-tree>*').remove();
      let vm = this

      var margin = {top: 20, right: 10, bottom: 20, left: 10},
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
        
        vm.curDepth = d3.max(nodes, d => d.depth)
        vm.curLeaves = nodes

        // node数据
        var node = svg.selectAll('g.node')
          .data(nodes, d => { return d.id || (d.id = ++nodeId)});
        
        // 为每一个新增的node添加g
        var nodeEnter = node.enter()
          .append('g')
          .attr('class', 'node')
          .attr('transform', 'translate('+source.x0+','+source.y0+')')
          .on('click', d => {
            d3.selectAll('.move-lines path').attr('opacity', 0)
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
        
        // 插入节点的diff label
        nodeEnter.filter(d => d.data.diffs.length > 0)
          .append('text')
          .attr('class', 'node-diff')

        // 插入节点的label
        nodeEnter.filter(d => d.data.type == 'dir')
          .append('text')
          .attr('class', 'node-text')
          .attr('font-size', '10px')
          .attr('dy', '-0.8em')
          .text(d => {
            let dirName = d.data.name.slice(d.data.name.lastIndexOf('/')+1)
            if (dirName == 'src') return dirName + ' (' + d.data.version + ')'
            else return dirName
          })
          .style("text-anchor", "middle")
          .attr('opacity', 0)

        // 更新进入的node
        var nodeUpdate = nodeEnter.merge(node);
        nodeUpdate.transition()
          .duration(750)
          .attr('transform', d => 'translate('+d.x+','+d.y+')')
          .on('end', function(d, i) {
            if(i == nodes.length - 1){
              nodeEnter.filter(d => d.children)
                .select('.node-text')
                .attr('opacity', 1) 
              vm.updateMoveLine(vm.linePoints)
            }
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
        nodeUpdate.select('.node-diff')
          .attr('font-family', 'FontAwesome')
          .attr('font-size', '8px')
          .attr('dy', d =>{
            if(d.data.type == 'file') return '2.5em'
            else return '2.2em'
          })
          .text(d => {
            let showText = ""
            if(d.data.diffs.indexOf('add') != -1) showText += "\uf067"
            if(d.data.diffs.indexOf('move') != -1) showText += "\uf062"
            return showText
          })
          .style("text-anchor", "middle")

        // 删除退出的node
        var nodeExit = node.exit().transition()
          .duration(750)
          .attr('transform', 'translate('+source.x+','+source.y+')')
          .remove()
        nodeExit.select('.node-logo') 
          .attr('font-size', '0px')
        nodeExit.select('.node-circle') 
          .attr('r', 0)
        nodeExit.select('.node-diff') 
          .attr('font-size', '0px')
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
    drawPreTreeCompared(data){
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

      var rScale = d3.scaleLinear()
        .domain([1, 34])     
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
        
        vm.preDepth = d3.max(nodes,  d => d.depth)
        vm.preLeaves = nodes

        // node数据
        var node = svg.selectAll('g.node')
          .data(nodes, d => { return d.id || (d.id = ++nodeId)});
        
        // 为每一个新增的node添加g
        var nodeEnter = node.enter()
          .append('g')
          .attr('class', 'node')
          .attr('transform', 'translate('+source.x0+','+(height-source.y0)+')')
          .on('click', d => {
            d3.selectAll('.move-lines path').attr('opacity', 0)
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

        // 插入节点的diff label
        nodeEnter.filter(d => d.data.diffs.length > 0)
          .append('text')
          .attr('class', 'node-diff')

        // 插入节点的label
        nodeEnter.filter(d => d.data.type == 'dir')
          .append('text')
          .attr('class', 'node-text')
          .attr('font-size', '10px')
          .attr('dy', '1.3em')
          .text(d => {
            let dirName = d.data.name.slice(d.data.name.lastIndexOf('/')+1)
            if (dirName == 'src') return dirName + ' (' + d.data.version + ')'
            else return dirName
          })
          .style("text-anchor", "middle")
          .attr('opacity', 0)

        // 更新进入的node
        var nodeUpdate = nodeEnter.merge(node);
        nodeUpdate.transition()
          .duration(750)
          .attr('transform', d => 'translate('+d.x+','+(height-d.y)+')')
          .on('end', function(d, i) {
            if(i == nodes.length - 1){
              nodeEnter.filter(d => d.children)
                .select('.node-text')
                .attr('opacity', 1) 
              vm.updateMoveLine(vm.linePoints)
            }
          });
        nodeUpdate.select('.node-logo')
          .attr('font-family', 'FontAwesome')
          .attr('font-size', d =>{
            if(d.data.type == 'topic') return fontScale(d.data.children.length)+'px'
            else return '20px'
          })
          .attr('dx', '-0.5em')
          .attr('dy', '0.2em')
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
        nodeUpdate.select('.node-diff')
          .attr('font-family', 'FontAwesome')
          .attr('font-size', '8px')
          .attr('dy', d =>{
            if(d.data.type == 'file') return '-1.8em'
            else return '-1.6em'
          })
          .text(d => {
            let showText = ""
            if(d.data.diffs.indexOf('del') != -1) showText += "\uf068"
            if(d.data.diffs.indexOf('move') != -1) showText += "\uf062"
            return showText
          })
          .style("text-anchor", "middle")

        // 删除退出的node
        var nodeExit = node.exit().transition()
          .duration(750)
          .attr('transform', 'translate('+source.x+','+(height-source.y)+')')
          .remove()
        nodeExit.select('.node-logo') 
          .attr('font-size', '0px')
        nodeExit.select('.node-circle') 
          .attr('r', 0)
        nodeExit.select('.node-diff') 
          .attr('font-size', '0px')
        nodeExit.select('.node-text') 
          .attr('font-size', '0px')
          .attr('opacity', 0)
        
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
    },
    updateMoveLine(data){
      d3.selectAll('.move-lines path').attr('opacity', 1)

      // line数据
      var line = this.mSvg.selectAll('path.line')
        .data(data, d => d)
    
      var lineEnter = line.enter().insert('path', 'g')
        .attr('class', 'line')
        .attr('d', d =>{
          return `M ${d[0]} ${d[1]}
                  L ${d[2]} ${d[3]}`
        })
        .attr('stroke', 'black')
        .attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '6, 6')
        .attr('opacity', 1)

      var lineExit = line.exit().remove()
    },
    dataAdapter(){
      let addIds = this.diffData.add,
        delIds = this.diffData.del,
        editIds = this.diffData.edit;
      this.allEditIds = editIds;
      let vm = this;

      insertDiffType(this.curTreeData)
      insertDiffType(this.preTreeData)
      function insertDiffType(root) {
        for(let i=0; i<root.children.length; i++){
          if(root.children[i].type != 'file'){
            insertDiffType(root.children[i])
            if(root.type == 'dir'){
              root.diffs = root.diffs.concat(root.children[i].diffs)
              root.diffs = Array.from(new Set(root.diffs))
            }
          }
          else{
            let id = root.children[i].id
            let diff = null
            if(addIds.indexOf(id) != -1) diff = 'add'
            if(delIds.indexOf(id) != -1) diff = 'del'
            if(editIds.find(d => d.indexOf(id) != -1 && d.indexOf('move')!=-1)) diff = 'move'
            if(diff){
              root.children[i].diffs.push(diff)
              if(root.diffs.indexOf(diff) == -1) root.diffs.push(diff)
            }
          }
        }
      }
    },
    clearDataAndView(){
      this.curVersion = null
      this.preVersion = null
      this.curTreeData = null
      this.preTreeData = null
      this.curDepth = -1
      this.preDepth = -1
      this.linePoints = null
      this.selectedTopic = -1
      d3.select('.cur-tree>*').remove();
      d3.select('.pre-tree>*').remove();
      d3.select('.move-line g>*').remove();
    },
    curVersionSelected(d){
      this.clearDataAndView()
      this.curVersion = d
      this.$axios
        .get("topics/getFileHierarchyByVersion", {version: d})
        .then(({data}) => {
          this.curTreeData = data
          this.drawCurTree(data)
        })
    },
  },
  watch: {
    curLeaves(val){
      var points = [], newPoints = []
      this.curLeaves.filter(curd => curd.depth == this.curDepth)
        .forEach(curd =>{
          for(let i=0; i<curd.data.fileIds.length; i++){
            let cur = this.allEditIds.find(d => 
              d[1] == curd.data.fileIds[i] 
              && d[2] == "move");
            if(cur){
              this.preLeaves.filter(pred => pred.depth == this.preDepth)
                .forEach(pred => {
                  for(let j=0; j<pred.data.fileIds.length; j++){
                    let pre = this.allEditIds.find(d => 
                      d[0] == pred.data.fileIds[j] 
                      && d[1] == cur[1]
                      && d[2] == "move");
                    if(pre){
                      points.push([pred.x, this.mHeight, curd.x, 0])
                      newPoints.push([pred.x, this.mHeight, curd.x, 0])
                    }
                  }
                })
            }
          }
        })
      
      // 去重
      for(let i=0; i<points.length; i++){
        for(let j=i+1; j<points.length; j++){
          if(points[i][0] == points[j][0] &&
            points[i][1] == points[j][1] &&
            points[i][2] == points[j][2] &&
            points[i][3] == points[j][3]){
              delete newPoints[j]     // delete后元素变为undefined
            }
        }
      }
      newPoints = newPoints.filter(d => d)
      this.linePoints = newPoints
    }, 
    preLeaves(val){
      var points = [], newPoints = []
      this.preLeaves.filter(pred => pred.depth == this.preDepth)
        .forEach(pred =>{
          for(let i=0; i<pred.data.fileIds.length; i++){
            let pre = this.allEditIds.find(d => 
              d[0] == pred.data.fileIds[i] 
              && d[2] == "move");
            if(pre){
              this.curLeaves.filter(curd => curd.depth == this.curDepth)
                .forEach(curd => {
                  for(let j=0; j<curd.data.fileIds.length; j++){
                    let cur = this.allEditIds.find(d => 
                      d[0] == pre[0]
                      && d[1] == curd.data.fileIds[j] 
                      && d[2] == "move");
                    if(cur){
                      points.push([pred.x, this.mHeight, curd.x, 0])
                      newPoints.push([pred.x, this.mHeight, curd.x, 0])
                    }
                  }
                })
            }
          }
        })
      
      // 去重
      for(let i=0; i<points.length; i++){
        for(let j=i+1; j<points.length; j++){
          if(points[i][0] == points[j][0] &&
            points[i][1] == points[j][1] &&
            points[i][2] == points[j][2] &&
            points[i][3] == points[j][3]){
              delete newPoints[j]     // delete后元素变为undefined
            }
        }
      }
      newPoints = newPoints.filter(d => d)
      this.linePoints = newPoints
    }
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
      this.preVersion = d.preVer
      d3.select('.cur-tree>*').remove();
      d3.select('.move-line g>*').remove();
      this.$axios
        .get("topics/getFileHierarchyByVersion", {version: this.preVersion})
        .then(({data}) => {
          this.preTreeData = data
          this.$axios
            .get("topics/getDiffDocs", {preVer: this.preVersion, curVer: this.curVersion})
            .then(({data}) => {
              this.diffData = data
              this.dataAdapter()
              this.drawCurTreeCompared(this.curTreeData)
              this.drawPreTreeCompared(this.preTreeData)
            })
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
    this.curHeight = Math.floor(this.$refs.root1.clientHeight);
    this.curWidth = Math.floor(this.$refs.root1.clientWidth);
    this.preHeight = Math.floor(this.$refs.root2.clientHeight);
    this.preWidth = Math.floor(this.$refs.root2.clientWidth);
    this.mWidth = Math.floor(this.$refs.root3.clientWidth);
    this.mHeight = Math.floor(this.$refs.root3.clientHeight) - 20;

     this.mSvg = d3.select('.move-line')
        .append('svg')
        .attr('width', this.mWidth)
        .attr('height', this.mHeight)
        .append('g')
        .attr('class', 'move-lines')
        .attr('transform', 'translate('+10+',0)')
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
    flex: 1.2;
  }
}
</style>