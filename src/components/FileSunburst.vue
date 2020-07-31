<template>
  <div class="file-sunburst" ref="root">
    <div class="pre" ref="root1"></div>
    <div class="cur" ref="root2"></div>
    <div class="other" ref="root3"></div>
  </div>
</template>

<script>
import * as d3 from "d3";
import d3tip from "d3-tip";
import d3Cloud from 'd3-cloud';
import {getRelPath, getVerPath} from "../utils/index.js";

export default {
  name: "component_name",
  data() {
    return {
     curWidth: 0,
     curHeight: 0,
     preWidth: 0,
     preHeight: 0,
     othWidth: 0,
     othHeight: 0,
     preVersion: null,
     curVersion: null,
     diffData: null,
     addFlag: false,
     delFlag: false,
     editFlag: false,
     moveFlag: false,
     curInfo: null,
     preInfo: null,
     curClickFlag: false,
     preClickFlag: false,
     selectedTopic: null,
     addedTopic: null,
     deletedTopic: null,
     editedTopic: null,
     movedTopic: null,
     noCompareOpacity: 0.5,
     hiddenOpacity: 0.1
    };
  },
  computed: {},
  props: ["topicColormap", "docData", "libraryName", "topicNum"],
  methods: {
    drawCurHierarchy(data){
      d3.select('.cur > svg').remove()
      const margin = {left: 0, top: 10, right: 10, bottom: 10};
      var svg = d3.select('.cur').append('svg')
        .attr('width', this.curWidth-margin.left-margin.right)
        .attr('height', this.curHeight-margin.top-margin.bottom)
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

      //sunburst
      var nodeG = svg.append('g').attr('class', 'nodes')
        .attr('transform', 'translate(' + this.curWidth / 2 + ',' + this.curHeight / 2 + ')')

      //word cloud
      var textG = svg.append('g').attr('class', 'words')

      //version
      var versionG = svg.append('g').attr('class', 'version')
        .attr('transform', 'translate(' + this.curWidth / 2 + ',' + (this.curHeight/2-15) + ')')

      //file path
      var pathG = svg.append('g').attr('class', 'path')
        .attr('transform', 'translate(' + this.curWidth / 2 + ',' + (this.curHeight - 4*margin.bottom) + ')')
      
      //pie chart
      var pieG = svg.append('g').attr('class', 'pie')

      var root = d3.hierarchy(data);
      root.sum(function(d) { return !d.children && d.type=='file' ? 1 : 0;})
        .sort(function(a, b) { 
          if(a.depth == b.depth){
            if(a.data.type != b.data.type) {
              if(a.data.type == 'dir') return -1    //文件夹在前, 文件在后
              if(a.data.type == 'file') return 1
            }
            else{
              if(a.data.type == 'dir') return b.value-a.value    //文件数多的文件夹在前
            }
          }
        })
      
      var files = root.value, folders = root.children.filter(d => d.data.type=='dir').length
      this.curInfo = {'version': this.curVersion, 'folders': folders, 'files': files}
      this.drawInfomation(this.curInfo, versionG)

      var maxDepth = root.height, perHeight = 25;    //文件结构层数和每层高度
      var nodeHeight = maxDepth * perHeight;         //总高度

      var x = d3.scaleLinear().range([0, 2*Math.PI]),
        y = d3.scaleLinear().domain([1, 0]);
      
      if(this.libraryName == 'vue'){
        y.range([this.curWidth/4.5, this.curWidth/4.5+nodeHeight])
        textG.attr('transform', 'translate(' + (this.curWidth / 2 - 15) + ',' + this.curHeight / 2 + ')')  
        pieG.attr('transform', 'translate(' + (this.curWidth / 2 - 10) + ',' + this.curHeight / 2 + ')')
      }
      if(this.libraryName == 'd3'){
        y.range([this.curWidth/3, this.curWidth/3+nodeHeight])
        textG.attr('transform', 'translate(' + this.curWidth / 2 + ',' + this.curHeight / 2 + ')')
        pieG.attr('transform', 'translate(' + this.curWidth / 2 + ',' + this.curHeight / 2 + ')')
      }

      var partition = d3.partition();
      var arc = d3.arc()
        .startAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x0))); })
        .endAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x1))); })
        .innerRadius(function(d) { return Math.max(0, y(d.y0)); })
        .outerRadius(function(d) { return Math.max(0, y(d.y1)); })

      var nodes = nodeG.selectAll('.node')
        .data(partition(root).descendants().slice(1))
        .enter().append('g')
        .attr('class', 'slice')
        .append('path')
        .attr('class', 'node')
        .attr('d', arc)
        .style("stroke", '#111')
        .style("stroke-width", 0.5)
        .style("fill", d => {
          if (d.data.type == "dir") return "white"
          else return this.topicColormap(d.data.topic)
        })
        .attr("opacity", d =>{
          if(this.selectedTopic != null){
            if(d.data.type == 'file'){
              if(d.data.topic != this.selectedTopic) return this.hiddenOpacity
              else return 1
            }
            else return 1
          }
        })
        .on('mouseover', d => {
          if(!this.curClickFlag){
            let path = this.calFilePath(d.data.name)
            pathG.append('text').attr('font-family', 'Georgia, serif').style("text-anchor", "middle")
              .attr('font-size', '15px').text(path)
            
            if(this.editFlag){
              for(let item of this.diffData.edit){
                if(item.curid == d.data.id){
                  let preDoc = this.docData.find(doc => doc.id == item.preid)
                  let path = this.calFilePath(preDoc.filename)
                  d3.select('.pre').select('.path').append('text').attr('font-family', 'Georgia, serif').style("text-anchor", "middle").attr('font-size', '15px').text(path)
                  let preNode = d3.select('.pre').selectAll('.node').filter(n => n.data.id == item.preid).style("stroke-width", 2)
                }
              }
            }
            
          } 
        })
        .on('mouseleave', d =>{
          if(!this.curClickFlag){
            pathG.selectAll('text').remove()
            if(this.editFlag)
              d3.select('.pre').select('.path').selectAll('text').remove()
          } 
        })
        .on('click', d => {
          this.curClickFlag = true

          let path = this.calFilePath(d.data.name)
          pathG.selectAll('text').remove()
          pathG.append('text').attr('font-family', 'Georgia, serif').style("text-anchor", "middle")
            .attr('font-size', '15px').text(path)

          // 高亮选中的文件
          if(this.selectedTopic != null){
            nodes.style("stroke-width", 0.5).attr('opacity', n =>{
              if(n.data.topic == this.selectedTopic || n.data.type == 'dir') return this.noCompareOpacity
              else return this.hiddenOpacity
            })
          }
          else if(this.addFlag){
            let add = this.diffData.add
            nodes.style("stroke-width", 0.5).attr('opacity', n =>{
              if(this.addedTopic != null){
                if((add.indexOf(n.data.id)!=-1 && n.data.topic == this.addedTopic) || n.data.type == 'dir') return this.noCompareOpacity
                else return this.hiddenOpacity
              }else{
                if(add.indexOf(n.data.id)!=-1 || n.data.type == 'dir') return this.noCompareOpacity
                else return this.hiddenOpacity
              } 
            })
            d3.select('.other').select('.lineG').selectAll('.line')
              .attr('opacity', l => {
                if(l.id != d.data.id) return 0
              })
            if(d.data.type == 'file') 
              this.$bus.$emit('compared-file-selected', {'preName': null, 'curName': d.data.name})
            this.drawWords(d.data.words, textG)
          }
          else if(this.editFlag){
            this.drawWords(d.data.words, textG)
            let edit = this.diffData.edit
            for(let item of edit){
              if(item.curid == d.data.id){
                // 显示前一个版本对应的文件
                d3.select('.pre').selectAll('.node').attr('opacity', n=>{
                  if(n.data.id != item.preid) return this.hiddenOpacity
                  else{
                    this.preClickFlag = true
                    for(let node of n.ancestors())
                      d3.select('.pre').selectAll('.node').filter(n => n == node).style('stroke-width', 1).attr('opacity', 1)
                    d3.select('.pre').select('.pie').selectAll('*').remove()
                    this.drawWords(n.data.words,  d3.select('.pre').select('.words'))
                    d3.select('.pre').select('.path').append('text').attr('font-family', 'Georgia, serif').style("text-anchor", "middle").attr('font-size', '15px').text(this.calFilePath(n.data.name))
                    this.$bus.$emit('compared-file-selected', {'preName': n.data.name, 'curName': d.data.name})
                  }
                })
              }
            }
            // 平行坐标
            d3.select('.other').select('.lineG').selectAll('.line')
              .attr('opacity', l =>{
                //平行坐标的id组成：preid-curid
                if(l.id.split('-')[1] == d.data.id) return 1
                else return 0
              })
          }
          else{
            nodes.style("stroke-width", 0.5).attr('opacity', this.noCompareOpacity)

            // 关键字和平行坐标数据
            let vecs = [], words = []
            for(let node of d.leaves()){
              vecs.push({'id': node.data.id, 'vec': node.data.vec, 'topic': node.data.topic})              
              words = words.concat(node.data.words)  //只传递单词
            }
            this.drawParallel(vecs)
            this.drawWords(words, textG)
            if(d.data.type == 'file')this.$bus.$emit('file-selected', d.data.name)
          }
        
          for(let node of d.descendants())
            nodes.filter(n => n == node).style("stroke-width", 1.5).attr('opacity', 1)
          for(let node of d.ancestors())
            nodes.filter(n => n == node).style("stroke-width", 1.5).attr('opacity', 1)
          
          pieG.selectAll('*').remove()
          versionG.selectAll('text').remove()
          
          d3.event.stopPropagation()
        })
      
      svg.on('click', ()=>{
        this.curClickFlag = false
        textG.selectAll('text').remove()
        pathG.selectAll('text').remove()
        nodes.style("stroke-width", 0.5).attr('opacity', 1)

        if(this.addFlag){
          this.addedTopic = null
          let add = this.diffData.add
          this.drawPieChart(add, pieG, 'add') 
          nodes.filter(n => n.data.type == 'file' && add.indexOf(n.data.id) == -1).attr('opacity', this.hiddenOpacity)
          d3.select('.other').select('.lineG').selectAll('.line').attr('opacity', 1)
        }
        else if(this.editFlag){
          let edit = this.diffData.edit, curid = [], preid = []
          for(let item of edit) {curid.push(item.curid); preid.push(item.preid)}
          nodes.filter(n => n.data.type == 'file' && curid.indexOf(n.data.id) == -1).attr('opacity', this.hiddenOpacity)
          this.drawPieChart(curid, pieG, 'edit')

          // 恢复前一个版本
          this.preClickFlag = false
          d3.select('.pre').select('.words').selectAll('text').remove()
          d3.select('.pre').select('.path').selectAll('text').remove()
          d3.select('.pre').selectAll('.node').style("stroke-width", 0.5).attr('opacity', n =>{
            if(n.data.type == 'dir') return 1
            else{
              if(preid.indexOf(n.data.id) != -1) return 1
              else return this.hiddenOpacity
            }
          })
          this.drawPieChart(preid, d3.select('.pre').select('.pie'), 'edit')

          d3.select('.other').select('.lineG').selectAll('.line').attr('opacity', 1)
        }
        else{
          this.drawParallel(null)
          this.drawInfomation(this.curInfo, versionG)
          if(this.selectedTopic != null){
            nodes.filter(n => n.data.type == 'file' && n.data.topic != this.selectedTopic)
              .attr('opacity', this.hiddenOpacity)
          }
        }
      })

    },
    drawPreHierarchy(data){
      d3.select('.pre > svg').remove()
      const margin = {left: 0, top: 10, right: 10, bottom: 10};
      var svg = d3.select('.pre').append('svg')
        .attr('width', this.preWidth-margin.left-margin.right)
        .attr('height', this.preHeight-margin.top-margin.bottom)
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

      //sunburst
      var nodeG = svg.append('g').attr('class', 'nodes')
        .attr('transform', 'translate(' + this.preWidth / 2 + ',' + this.preHeight / 2 + ')')

      //word cloud
      var textG = svg.append('g').attr('class', 'words')

      //version
      var versionG = svg.append('g').attr('class', 'version')
        .attr('transform', 'translate(' + this.preWidth / 2 + ',' + (this.preHeight/2-15) + ')')
      
      //file path
      var pathG = svg.append('g').attr('class', 'path')
        .attr('transform', 'translate(' + this.preWidth / 2 + ',' + (this.preHeight - 4*margin.bottom) + ')')

      //pie chart
      var pieG = svg.append('g').attr('class', 'pie')

      var root = d3.hierarchy(data);
      root.sum(function(d) { return !d.children && d.type=='file' ? 1 : 0;})
        .sort(function(a, b) { 
          if(a.depth == b.depth){
            if(a.data.type != b.data.type) {
              if(a.data.type == 'dir') return -1    //文件夹在前, 文件在后
              if(a.data.type == 'file') return 1
            }
            else{
              if(a.data.type == 'dir') return b.value-a.value    //文件数多的文件夹在前
            }
          }
        })

      var files = root.value, folders = root.children.filter(d => d.data.type=='dir').length
      this.preInfo = {'version': this.preVersion, 'folders': folders, 'files': files}
      this.drawInfomation(this.preInfo, versionG)

      var maxDepth = root.height, perHeight = 25;    //文件结构层数和每层高度
      var nodeHeight = maxDepth * perHeight;         //总高度

      var x = d3.scaleLinear().range([0, 2*Math.PI]),
        y = d3.scaleLinear().domain([1, 0]);
      
      if(this.libraryName == 'vue'){
        y.range([this.preWidth/4.5, this.preWidth/4.5+nodeHeight])
        textG.attr('transform', 'translate(' + (this.preWidth / 2 - 15) + ',' + this.preHeight / 2 + ')')
        pieG.attr('transform', 'translate(' + (this.curWidth / 2 - 10) + ',' + this.curHeight / 2 + ')')
      }
      if(this.libraryName == 'd3'){
        y.range([this.preWidth/3, this.preWidth/3+nodeHeight])
        textG.attr('transform', 'translate(' + this.preWidth / 2 + ',' + this.preHeight / 2 + ')')
        pieG.attr('transform', 'translate(' + this.curWidth / 2 + ',' + this.curHeight / 2 + ')')
      }

      var partition = d3.partition();
      var arc = d3.arc()
        .startAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x0))); })
        .endAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x1))); })
        .innerRadius(function(d) { return Math.max(0, y(d.y0)); })
        .outerRadius(function(d) { return Math.max(0, y(d.y1)); })

      var nodes = nodeG.selectAll('.node')
        .data(partition(root).descendants().slice(1))
        .enter().append('g')
        .attr('class', 'slice')
        .append('path')
        .attr('class', 'node')
        .attr('d', arc)
        .style("stroke", '#111')
        .style("stroke-width", 0.5)
        .style("fill", d => {
          if (d.data.type == "dir") return "white"
          else return this.topicColormap(d.data.topic)
        })
        .on('mouseover', d => {
          if(!this.preClickFlag){
            let path = this.calFilePath(d.data.name)
            pathG.append('text').attr('font-family', 'Georgia, serif').style("text-anchor", "middle")
              .attr('font-size', '15px').text(path)

            if(this.editFlag){
              for(let item of this.diffData.edit){
                if(item.preid == d.data.id){
                  let curDoc = this.docData.find(doc => doc.id == item.curid)
                  let path = this.calFilePath(curDoc.filename)
                  d3.select('.cur').select('.path').append('text').attr('font-family', 'Georgia, serif').style("text-anchor", "middle").attr('font-size', '15px').text(path)
                }
              }
            }
          }
        })
        .on('mouseleave', d =>{
          if(!this.preClickFlag){
            pathG.selectAll('text').remove()
            if(this.editFlag)
              d3.select('.cur').select('.path').selectAll('text').remove()
          }
        })
        .on('click', d => {
          this.preClickFlag = true

           // 高亮选中的文件
          if(this.selectedTopic != null){
            nodes.style("stroke-width", 0.5).attr('opacity', n =>{
              if(n.data.topic == this.selectedTopic || n.data.type == 'dir') return this.noCompareOpacity
              else return this.hiddenOpacity
            })
          }
          else if(this.delFlag){
            let del = this.diffData.del
            nodes.style("stroke-width", 0.5).attr('opacity', n =>{
              if(this.deletedTopic != null){
                if((del.indexOf(n.data.id)!=-1 && n.data.topic == this.deletedTopic) || n.data.type == 'dir') return this.noCompareOpacity
                else return this.hiddenOpacity
              }else{
                if(del.indexOf(n.data.id)!=-1 || n.data.type == 'dir') return this.noCompareOpacity
                else return this.hiddenOpacity
              } 
            })
            d3.select('.other').select('.lineG').selectAll('.line')
              .attr('opacity', l => {
                if(l.id != d.data.id) return 0
              })
            if(d.data.type == 'file') this.$bus.$emit('compared-file-selected', {'preName': d.data.name, 'curName': null})
            this.drawWords(d.data.words, textG)
          }
          else if(this.editFlag){
            this.drawWords(d.data.words, textG)
            let edit = this.diffData.edit
            for(let item of edit){
              if(item.preid == d.data.id){
                // 显示后一个版本对应的文件
                d3.select('.cur').selectAll('.node').attr('opacity', n=>{
                  if(n.data.id != item.curid) return this.hiddenOpacity
                  else{
                    this.curClickFlag = true
                    for(let node of n.ancestors())
                      d3.select('.cur').selectAll('.node').filter(n => n == node).style('stroke-width', 1).attr('opacity', 1)
                    d3.select('.cur').select('.pie').selectAll('*').remove()
                    this.drawWords(n.data.words,  d3.select('.cur').select('.words'))
                    d3.select('.cur').select('.path').append('text').attr('font-family', 'Georgia, serif').style("text-anchor", "middle").attr('font-size', '15px').text(this.calFilePath(n.data.name))
                    this.$bus.$emit('compared-file-selected', {'preName': d.data.name, 'curName': n.data.name})
                  }
                })
              }
            }
            // 平行坐标
            d3.select('.other').select('.lineG').selectAll('.line')
              .attr('opacity', l =>{
                //平行坐标的id组成：preid-curid
                if(l.id.split('-')[0] == d.data.id) return 1
                else return 0
              })
          }
          else{
            nodes.style("stroke-width", 0.5).attr('opacity', this.noCompareOpacity)

            // 关键字和平行坐标数据
            let vecs = [], words = []
            for(let node of d.leaves()){
              vecs.push({'id': node.data.id, 'vec': node.data.vec, 'topic': node.data.topic})  
              words = words.concat(node.data.words)  //只传递单词
            }
            this.drawParallel(vecs)
            this.drawWords(words, textG)

            if(d.data.type == 'file') this.$bus.$emit('file-selected', d.data.name)

          }

          for(let node of d.descendants())
            nodes.filter(n => n == node).style("stroke-width", 1.5).attr('opacity', 1)
          for(let node of d.ancestors())
            nodes.filter(n => n == node).style("stroke-width", 1.5).attr('opacity', 1)
          
          pieG.selectAll('*').remove()  
          versionG.selectAll('text').remove()

          d3.event.stopPropagation()
        })

        svg.on('click', ()=>{
          this.preClickFlag = false
          textG.selectAll('text').remove()
          pathG.selectAll('text').remove()
          nodes.style("stroke-width", 0.5).attr('opacity', 1)

          if(this.delFlag){
            this.deletedTopic = null
            let del = this.diffData.del
            this.drawPieChart(del, pieG, 'del') 
            nodes.filter(n => n.data.type == 'file' && del.indexOf(n.data.id) == -1).attr('opacity', this.hiddenOpacity)
            d3.select('.other').select('.lineG').selectAll('.line').attr('opacity', 1)
          }
          else if(this.editFlag){
            let edit = this.diffData.edit, preid = [], curid = []
            for(let item of edit) {preid.push(item.preid); curid.push(item.curid)}
            nodes.filter(n => n.data.type == 'file' && preid.indexOf(n.data.id) == -1).attr('opacity', this.hiddenOpacity)
            this.drawPieChart(preid, pieG, 'edit')
            
            // 恢复后一个版本
            this.curClickFlag = false
            d3.select('.cur').select('.words').selectAll('text').remove()
            d3.select('.cur').select('.path').selectAll('text').remove()
            d3.select('.cur').selectAll('.node').style("stroke-width", 0.5).attr('opacity', n =>{
              if(n.data.type == 'dir') return 1
              else{
                if(curid.indexOf(n.data.id) != -1) return 1
                else return this.hiddenOpacity
              }
            })
            this.drawPieChart(curid, d3.select('.cur').select('.pie'), 'edit')

            d3.select('.other').select('.lineG').selectAll('.line').attr('opacity', 1)
          }
          else{
            this.drawParallel(null)
            this.drawInfomation(this.preInfo, versionG)
            if(this.selectedTopic != null){
              nodes.filter(n => n.data.type == 'file' && n.data.topic != this.selectedTopic)
                .attr('opacity', this.hiddenOpacity)
            }
          }
        })
    },
    drawParallel(data){
       d3.select('.other > svg').remove()

      var margin = {top: 20, right: 30, bottom: 20, left: 20},
        height = this.othHeight-margin.top-margin.bottom,
        width = this.othWidth-margin.left-margin.right

      var svg = d3.select('.other').append('svg')
        .attr('width', width)
        .attr('height', height)
        .attr('transform', 'translate('+margin.left+','+margin.top+')')
      
      var axisG = svg.append('g').attr('class', 'axisG')
      var lineG = svg.append('g').attr('class', 'lineG')
    
      let topicIds = [...new Array(this.topicNum).keys()]

      var yScale = d3.scalePoint()
        .domain(topicIds)
        .range([margin.top+10, height-10])
      
      var xScale = d3.scaleLinear()
        .domain([-1, 1])
        .range([margin.left+40, width-10])

      axisG.selectAll('.axis')
        .data(topicIds)
        .enter()
        .append('g')
        .attr('class', 'axis')
        .attr('transform', d => 'translate(0,'+yScale(d)+')')
        .each(function(d) { 
          if(d == 0)
            d3.select(this)
              .call(d3.axisTop().scale(xScale)
                .tickValues([-1, 0, 1])
                .tickFormat(d3.format(".0f"))
              )
              .call(g => g.selectAll(".domain").remove())
          else
            d3.select(this)
              .call(d3.axisTop().scale(xScale).tickValues([-1, 0, 1]))
              .call(g => g.selectAll(".domain").remove())
              .call(g => g.selectAll(".tick").selectAll('text').remove())
        })
        .append("text")
        .attr('dx', '4.5em')
        .style("text-anchor", "end")
        .text(d => 'topic '+(d+1))
        .attr('fill', 'black')

      if(data != null)
        lineG.selectAll('.line')
          .data(data)
          .enter()
          .append('path')
          .attr('class', 'line')
          .attr('d', d => d3.line()(d.vec.map((p,i) => [xScale(p), yScale(i)])))
          .style('fill', 'none')
          .attr('stroke', d => this.topicColormap(d.topic))
          .attr('stroke-width', 2)
    },
    drawWords(data, textG){
      textG.selectAll('text').remove()

      var width = 0, height = 0;
      if(this.libraryName == 'vue') width = 180, height = 180;
      if(this.libraryName == 'd3') width = 220, height = 220;

      // 词云布局
      var layout = d3Cloud()
        .timeInterval(10)
        .size([width, height])
        .words(data.map(d => ({'keyword': d})))
        .font('Georgia, serif')
        .fontSize(d => Math.floor(Math.random() * (30 - 10) ) + 10)
        .text(d => d.keyword)
        .spiral('archimedean') // "archimedean" or "rectangular"
        .padding(4)
        .rotate(0)
        .on('end', show)
        .start()
      
      function show(words){
        textG.selectAll('text')
          .data(words)
          .enter()
          .append('text')
          .style('font-size', d => d.size + 'px')
          .style('font-family', d => d.font)
          .style('fill', 'black')
          .attr('text-anchor', 'middle')
          .attr('transform', d => 'translate(' + [d.x, d.y] + ')rotate(' + d.rotate + ')')
          .text(d => d.text)
      }
    },
    drawIcons(data){
      let addFile = data.add, delFile = data.del, editFile = data.edit, moveFile = data.edit
      let icons = [{type: 'added', val: addFile.length, text: "\uf067"}, 
        {type: 'deleted', val: delFile.length, text: "\uf068"},
        {type: 'edited', val: editFile.length, text: "\uf040"}, 
        {type: 'moved', val: moveFile.length, text: "\uf074"},
        {type: 'undo', val: 0, text: "\uf0e2"},]

      var total = addFile.length + delFile.length + editFile.length
      var preSvg = d3.select('.pre').select('svg'), curSvg = d3.select('.cur').select('svg')
      var iconG = preSvg.append('g').attr('class', 'icons')
      var rectWidth = 60, rectHeight = 30, startX = 20, startY = 20, step = 80

      for(let i=0; i<5; i++){    // 四类文件+还原操作
        let groupG = iconG.append('g').attr('class', icons[i].type)
          .attr('transform', 'translate('+(startX+i*step)+','+startY+')')
          .on('click', () =>{
            if(icons[i].type == 'undo'){                   //还原
              iconG.selectAll('g').attr('opacity', 1)
              d3.select('.other').select('.lineG').selectAll('.line').remove()

              // 前一版本
              d3.select('.pre').selectAll('.node').style("stroke-width", 0.5).attr('opacity', 1)
              d3.select('.pre').select('.pie').selectAll('*').remove()
              d3.select('.pre').select('.words').selectAll('text').remove()
              d3.select('.pre').select('.path').selectAll('text').remove()
              this.drawInfomation(this.preInfo, d3.select('.pre').select('.version'))

              // 后一版本
              d3.select('.cur').selectAll('.node').style("stroke-width", 0.5).attr('opacity', 1)
              d3.select('.cur').select('.pie').selectAll('*').remove()
              d3.select('.cur').select('.words').selectAll('text').remove()
              d3.select('.cur').select('.path').selectAll('text').remove()
              this.drawInfomation(this.curInfo, d3.select('.cur').select('.version'))
            }else{                                         //查看一类文件
              iconG.selectAll('g').attr('opacity', 0.2)
              iconG.select('.'+icons[i].type).attr('opacity', 1)
              if(icons[i].type == 'added' && this.delFlag)
                iconG.select('.deleted').attr('opacity', 1)
              if(icons[i].type == 'deleted' && this.addFlag)
                iconG.select('.added').attr('opacity', 1)
            }
            this.changeFlags(icons[i].type)
            d3.event.stopPropagation()
          })
        groupG.append('text').attr('font-family', 'FontAwesome')
          .attr('font-size', '20px').text(icons[i].text)
        groupG.append('text').attr('font-family', 'Avenir')
          .attr('font-size', '12px').attr('dx', '2em').attr('dy', '-0.3em').text(icons[i].type)

        if(icons[i].type != 'undo') {         //添加每一类文件的数目
          let perc = icons[i].val / total    //占文件总数的比例
          groupG.append('rect').attr('x', 0).attr('y', 5).attr('width', rectWidth).attr('height', 4)
            .attr('rx', 2).attr('ry', 2).attr('fill', '#e6e6e6')
          groupG.append('rect').attr('x', 0).attr('y', 5).attr('width', perc*rectWidth).attr('height', 4)
            .attr('rx', 2).attr('ry', 2).attr('fill', '#409eff')
        }      
      } 
    },
    drawInfomation(data, versionG){
      versionG.selectAll('text').remove()
      versionG.append('text').attr('font-family', 'Georgia, serif').style("text-anchor", "middle")
        .attr('font-size', '23px').text('v'+data.version)
      versionG.append('text').attr('font-family', 'Georgia, serif').style("text-anchor", "middle")
        .attr('dy', '1.5em').attr('font-size', '22px').text("folders: "+ data.folders)
      versionG.append('text').attr('font-family', 'Georgia, serif').style("text-anchor", "middle")
        .attr('dy', '3em').attr('font-size', '22px').text("files: "+data.files)
    },
    changeFlags(type){
      if(type == 'undo'){
        this.addFlag = false
        this.delFlag = false
        this.editFlag = false
        this.moveFlag = false
      }
      else{
        this.addFlag = (type=='added' || (this.addFlag && type=='deleted')) ? true : false
        this.delFlag = ((this.delFlag && type=='added') || type=='deleted') ? true : false
        this.editFlag = type=='edited' ? true : false
        this.moveFlag = type=='moved' ? true : false
      }
    },
    clearDataAndView(){
      d3.select('.cur > svg').remove()
      d3.select('.pre > svg').remove()
      this.preVersion = null
      this.curVersion = null
      this.diffData = null
      this.addFlag = false
      this.delFlag = false
      this.editFlag = false
      this.moveFlag = false
      this.curInfo = null
      this.preInfo = null
      this.curClickFlag = false
      this.preClickFlag = false
      this.addedTopic = null
      this.deletedTopic = null
    },
    calFilePath(data){
      let strs = data.split('/'), path ='' 
      for(let i=4; i<strs.length; i++){
        path = path + strs[i]
        path = i==strs.length-1 ? path : (path+'/') 
      }
      return path
    },
    drawPieChart(data, pieG, type){
      pieG.selectAll('*').remove()
      var topicDict = {}
      for(let id of data){
        let doc = this.docData.find(d => d.id == id), topic = doc.main_topic
        if(!topicDict.hasOwnProperty(topic))
          topicDict[topic] = [doc]
        else topicDict[topic].push(doc)
      }

      let topics = Object.keys(topicDict).sort(function(a, b){return parseInt(a) - parseInt(b)})
      var arc = d3.arc().outerRadius(70).innerRadius(40)
      var pie = d3.pie().sort(null).value(function(d){return topicDict[d].length})

      pieG.selectAll('.arc').data(pie(topics))
        .enter().append('g').attr('class', 'arc')
        .append('path').attr('d', arc)
        .style('fill', d => this.topicColormap(parseInt(d.data)))
        .on('click', d =>{
          if(this.addFlag || this.delFlag){
            let ids = [], version
            for(let doc of topicDict[d.data]) {
              version = doc.version
              ids.push(doc.id)
            }
            d3.select('.other').select('.lineG').selectAll('.line')
              .attr('opacity', l =>{
                if(ids.indexOf(l.id) != -1) return 1
                else return 0
              })
            if(version == this.curVersion){
              this.addedTopic = parseInt(d.data)
              d3.select('.cur').selectAll('.node')
                .attr('opacity', n =>{
                  if(n.data.type == 'dir') return 1
                  else{
                    if(ids.indexOf(n.data.id) != -1) return 1
                    else return this.hiddenOpacity
                  }
                })
            }
              
            if(version == this.preVersion){
              this.deletedTopic = parseInt(d.data)
              d3.select('.pre').selectAll('.node')
                .attr('opacity', n =>{
                  if(n.data.type == 'dir') return 1
                  else{
                    if(ids.indexOf(n.data.id) != -1) return 1
                    else return this.hiddenOpacity
                  }
                })
            }
          }
          if(this.editFlag){
            let ids = []
            for(let doc of topicDict[d.data]) ids.push(doc.id)
            let preid = [], curid = []
            
            // 平行坐标
            d3.select('.other').select('.lineG').selectAll('.line')
              .attr('opacity', l =>{
                let lid = l.id.split('-')   //平行坐标的id组成：preid-curid
                if(ids.indexOf(parseInt(lid[0])) != -1 || ids.indexOf(parseInt(lid[1])) != -1) {
                  preid.push(parseInt(lid[0]))
                  curid.push(parseInt(lid[1]))
                  return 1
                }
                else return 0
              })
            
            // 高亮前一版本的文件
            d3.select('.pre').selectAll('.node')
              .attr('opacity', n =>{
                if(n.data.type == 'dir') return 1
                else{
                  if(preid.indexOf(n.data.id) != -1) return 1
                  else return this.hiddenOpacity
                }
              })
            
            // 高亮前一版本的文件
            d3.select('.cur').selectAll('.node')
              .attr('opacity', n =>{
                if(n.data.type == 'dir') return 1
                else{
                  if(curid.indexOf(n.data.id) != -1) return 1
                  else return this.hiddenOpacity
                }
              })
          }
          if(parseInt(d.data) != -1) this.$bus.$emit('pieTopic-selected', parseInt(d.data))

          d3.event.stopPropagation()
        })
      pieG.append('text').attr('font-family', 'Georgia, serif').style("text-anchor", "middle")
        .attr('dy', '0.5em').attr('font-size', '20px').text(type+": "+data.length)
    }
  },
  watch:{
    addFlag(val){
      if(val){       
        let add = this.diffData.add, vecs = []
        d3.select('.cur').selectAll('.node')
          .attr('opacity', n => {
            if(n.data.type == 'dir') return 1
            else{
              if(add.indexOf(n.data.id) != -1){
                vecs.push({'id': n.data.id, 'vec': n.data.vec, 'topic': n.data.topic})  // 平行坐标数据
                return 1
              } 
              else return this.hiddenOpacity
            }
          })
        d3.select('.cur').select('.version').selectAll('text').remove()
        let pieG = d3.select('.cur').select('.pie')
        this.drawPieChart(add, pieG, 'add')
        this.drawParallel(vecs)
      }
      else{
        d3.select('.cur').select('.pie').selectAll('*').remove()
      }
    },
    delFlag(val){ 
      if(val){  
        let del = this.diffData.del, vecs = []
        d3.select('.pre').selectAll('.node')
          .attr('opacity', n => {
            if(n.data.type == 'dir') return 1
            else{
              if(del.indexOf(n.data.id) != -1) {
                vecs.push({'id': n.data.id, 'vec': n.data.vec.map(v => -v), 'topic': n.data.topic})  // 平行坐标数据
                return 1
              }
              else return this.hiddenOpacity
            }
          }) 
        d3.select('.pre').select('.version').selectAll('text').remove()
        let pieG = d3.select('.pre').select('.pie')
        this.drawPieChart(del, pieG, 'del')
        this.drawParallel(vecs)
      }
      else{
        d3.select('.pre').select('.pie').selectAll('*').remove()
      }
    },
    editFlag(val){
      if(val){       
        let edit = this.diffData.edit, pre = [], cur = [], vecs = []
        for(let item of edit){
          let preDoc = this.docData.find(doc => doc.id == item.preid),
            curDoc = this.docData.find(doc => doc.id == item.curid)
          // 后台数据处理
          let vec = curDoc.topicDistribution.map((p, i) => p - preDoc.topicDistribution[i])
          if((new Set(vec)).size != 1){
            pre.push(item.preid)
            cur.push(item.curid)
            let vecAbs = vec.map(v => Math.abs(v))
            vecs.push({'id': item.preid+'-'+item.curid, 'vec': vec, 'topic': vecAbs.indexOf(Math.max(...vecAbs))})
          }
        }
        d3.select('.cur').selectAll('.node')
          .attr('opacity', n => {
            if(n.data.type == 'dir') return 1
            else{
              if(cur.indexOf(n.data.id) != -1) return 1
              else return this.hiddenOpacity
            }
          })
        d3.select('.pre').selectAll('.node')
          .attr('opacity', n => {
            if(n.data.type == 'dir') return 1
            else{
              if(pre.indexOf(n.data.id) != -1) return 1
              else return this.hiddenOpacity
            }
          })
        
        d3.select('.pre').select('.version').selectAll('text').remove()
        d3.select('.cur').select('.version').selectAll('text').remove()
        this.drawPieChart(pre, d3.select('.pre').select('.pie'), 'edit')
        this.drawPieChart(cur, d3.select('.cur').select('.pie'), 'edit')
        this.drawParallel(vecs)
      }
      else{
        if(this.delFlag){
          d3.select('.cur').selectAll('.node').attr('opacity', 1)
          d3.select('.cur').select('.pie').selectAll('*').remove()
          this.drawInfomation(this.curInfo, d3.select('.cur').select('.version'))
        }
        if(this.addFlag){
          d3.select('.pre').selectAll('.node').attr('opacity', 1)
          d3.select('.pre').select('.pie').selectAll('*').remove()
          this.drawInfomation(this.preInfo, d3.select('.pre').select('.version'))
        }
        if(this.moveFlag){
          d3.select('.cur').selectAll('.node').attr('opacity', 1)
          d3.select('.pre').selectAll('.node').attr('opacity', 1)
        }
      }
    },
    moveFlag(val){
      if(val){
        let move = this.diffData.edit, pre = [], cur = []
        for(let item of move){
          let preDoc = this.docData.find(doc => doc.id == item.preid),
            curDoc = this.docData.find(doc => doc.id == item.curid)

          pre.push(item.preid)
          cur.push(item.curid)
        }
        d3.select('.cur').selectAll('.node')
          .attr('opacity', n => {
            if(n.data.type == 'dir') return 1
            else{
              if(cur.indexOf(n.data.id) != -1) return 1
              else return this.hiddenOpacity
            }
          })
        d3.select('.pre').selectAll('.node')
          .attr('opacity', n => {
            if(n.data.type == 'dir') return 1
            else{
              if(pre.indexOf(n.data.id) != -1) return 1
              else return this.hiddenOpacity
            }
          })
        d3.select('.other').select('.lineG').selectAll('.line').remove()
        d3.select('.pre').select('.version').selectAll('text').remove()
        d3.select('.cur').select('.version').selectAll('text').remove()
      }
      else{
        if(this.delFlag){
          d3.select('.cur').selectAll('.node').attr('opacity', 1)
          d3.select('.cur').select('.pie').selectAll('*').remove()
          this.drawInfomation(this.curInfo, d3.select('.cur').select('.version'))
        }
        if(this.addFlag){
          d3.select('.pre').selectAll('.node').attr('opacity', 1)
          d3.select('.pre').select('.pie').selectAll('*').remove()
          this.drawInfomation(this.preInfo, d3.select('.pre').select('.version'))
        }
        if(this.editFlag){
          d3.select('.cur').selectAll('.node').attr('opacity', 1)
          d3.select('.cur').select('.pie').selectAll('*').remove()
          d3.select('.pre').selectAll('.node').attr('opacity', 1)
          d3.select('.pre').select('.pie').selectAll('*').remove()
        }
      }
    }
  },
  created(){
    const requiredData = ["topicColormap", "docData", "topicNum"];
    let cnt = 0;
    requiredData.forEach(d => {
      this.$watch(d, val => {
        if (val) cnt++;
        if (cnt === requiredData.length) {
          this.drawParallel(null)
        }
      })
    });

    // linechart响应事件
    this.$bus.$on('lineVersion-selected', d =>{
      this.clearDataAndView()
      this.curVersion = d
      this.$axios
        .get("topics/getFileHierarchyByVersion", {version: d})
        .then(({data}) => {
          console.log('hierarchyData:', data)
          this.drawCurHierarchy(data)
        })
    })
    this.$bus.$on("lineVersion-reseted", d => {
      this.clearDataAndView()
      this.drawParallel(null)
    });

    // control panel响应事件
    this.$bus.$on('curVersion-selected', d =>{
      this.clearDataAndView()
      this.curVersion = d
      this.$axios
        .get("topics/getFileHierarchyByVersion", {version: d})
        .then(({data}) => {
          console.log('hierarchyData:', data)
          this.drawCurHierarchy(data)
        })
    })
    this.$bus.$on("curVersion-reseted", () =>{
      this.clearDataAndView()
      this.drawParallel(null)
    })
    this.$bus.$on('version-compared', d =>{
      this.curVersion = d.curVer
      this.preVersion = d.preVer
      this.$axios
        .get("topics/getFileHierarchyByVersion", {version: d.preVer})
        .then(({data}) => {
          this.drawPreHierarchy(data)
        })
      this.$axios
        .get("topics/getDiffDocs", {preVer: d.preVer, curVer: d.curVer})
        .then(({data}) => {
          console.log('diffData:', data)
          this.diffData = data
          this.drawIcons(data)
        })
    })

    // topic bar响应事件
    this.$bus.$on("topic-selected", d => {
      this.selectedTopic = d
      if(this.selectedTopic != null){
        d3.select('.cur').selectAll('.node')
          .attr('opacity', n => {
            if(n.data.type == 'dir') return 1
            else{
              if(n.data.topic == this.selectedTopic) return 1
              else return this.hiddenOpacity
            }
          })
      }
    });
    this.$bus.$on('topic-reseted', () =>{
      this.selectedTopic = null
      d3.select('.cur').selectAll('.node').attr('opacity', 1).attr('stoke-width', 0.5)
    });

  },
  mounted(){
    this.preHeight = Math.floor(this.$refs.root1.clientHeight);
    this.preWidth = Math.floor(this.$refs.root1.clientWidth);
    this.curHeight = Math.floor(this.$refs.root2.clientHeight);
    this.curWidth = Math.floor(this.$refs.root2.clientWidth);
    this.othHeight = Math.floor(this.$refs.root3.clientHeight);
    this.othWidth = Math.floor(this.$refs.root3.clientWidth);
  }
}

</script>

<style lang='less'>
.file-sunburst {
  height: 100%;
  width: 100%;
  display: flex;
  .pre{
    flex: 2;
  }
  .cur{
    flex: 2;
    border-right: 5px solid #ececec;
  }
  .other{
    flex: 1;
  }
}
</style>