<template>
  <div class='sunburst'
       ref='root'>
    <!-- <svg></svg> -->
  </div>
</template>

<script>
import * as d3 from 'd3'
import d3tip from 'd3-tip'

export default {
  name: 'component_name',
  data () {
    return {
      // width: 600,
      height: 0,
      arcSvg: null,
      diffDocs: null,
      threshold: 0.1,
      dataRoot: null,
      selectedCluster: null,
      selectedDoc: null,
      links: [],
      linkG: null
      // doc: null,
    }
  },
  computed: {
    width () {
      return this.height
    }
  },
  props: ['topicColormap', 'docData', 'versions'],
  watch:{
    threshold(){
      this.arcSvg
        .attr('opacity', 1)
        .attr('stroke-width', 1)
      if(!this.diffDocs)
        return 
      var leafNodes = this.dataRoot.leaves()
      leafNodes.forEach(d => {
        let obj = this.diffDocs.find(doc => {
          return (d.data.id === doc.fileIds[0]) || (d.data.id === doc.fileIds[1])
        })
        d['norm'] = obj['norm']
        d['fileType'] = obj['type']
      })
      // 前后版本的差异较小的文件透明度降低(阈值为0.1)
      this.arcSvg
        .on('click', d => {
          if(d.data.type === 'file'){
            this.$bus.$emit('doc-selected', this.docData[d.data.id])
            this.arcSvg.filter(d => d.data.type === 'file')
              .attr('opacity', '0.1')
            if(this.linkG){
              this.links.forEach((d, i) =>{
                this.linkG.select('#node-link'+i).attr('stroke-opacity', 0)
              })
            }
            if(this.selectedDoc === d.data.id){
              this.selectedDoc = null
              if(this.selectedCluster){
                this.arcSvg.filter(d => this.selectedCluster.indexOf(d.data.id) != -1)
                  .attr('opacity', 1)
                if(this.linkG){
                  this.links.forEach((d, i) =>{
                    if(this.selectedCluster.indexOf(d.source.data.id) != -1 && this.selectedCluster.indexOf(d.target.data.id) != -1)
                      this.linkG.select('#node-link'+i).attr('stroke-opacity', 1)
                  })
                }
              }
              else{
                this.arcSvg.filter(d => d.data.type === 'file')
                  .attr('opacity', '1')
                this.arcSvg.filter(d => d.norm >= this.threshold && d.data.version === 'prev')
                  .attr('opacity', '0.5')
                this.arcSvg
                  .filter(d => d.norm < this.threshold)
                  .attr('opacity', '0')
                this.links.forEach((d, i) =>{
                  this.linkG.select('#node-link'+i).attr('stroke-opacity', 1)
                  if(d.source.norm < this.threshold || d.target.norm < this.threshold)
                    this.linkG.select('#node-link'+i).attr('stroke-opacity', 0)
                })
              }
            }
            else{
              this.selectedDoc = d.data.id
              this.arcSvg.filter(arc => arc.data.id === d.data.id)
                .attr('opacity', 1)
            }
          } 
        })
      this.arcSvg.filter(d => d.norm < this.threshold)
        .attr('opacity', '0')
        .on('click', null)
      this.arcSvg.filter(d => d.norm >= this.threshold && d.data.version === 'prev')
        .attr('opacity', '0.5')
      this.arcSvg
        .filter(d => d.norm >= this.threshold && d.fileType === 'edit' && d.data.version === 'curv')
        .attr('stroke-width', '2.5')
        .attr('stroke-opacity', 1)
      this.links.forEach((d, i) =>{
        this.linkG.select('#node-link'+i).attr('stroke-opacity', 1)
        if(d.source.norm < this.threshold || d.target.norm < this.threshold)
          this.linkG.select('#node-link'+i).attr('stroke-opacity', 0)
      })
    }
  },
  methods: {
    draw (data) {
      this.$refs.root.innerHTML = ''
      let root = d3.hierarchy(data)
      this.dataRoot = root
      // 后序遍历, value相加, 详情见https://github.com/xswei/d3-hierarchy
      root.sum(d => (d.children ? 0 : 1))
      let svg = d3
        .select(this.$refs.root)
        .append('svg')
        .attr('width', this.width-20)
        .attr('height', this.height)
        .append('g')
        .attr(
          'transform',
          'translate(' + (this.width / 2 - 5) + ',' + this.height / 2 + ')'
        )
      var x = d3.scaleLinear().range([0, 2 * Math.PI])
      var y = d3
        .scaleLinear()
        .range([100, this.height / 2])
        .domain([1, 0])
        
      var partition = d3.partition()
      var arc = d3
        .arc()
        .startAngle(function (d) {
          return Math.max(-Math.PI/2, Math.min(-Math.PI/2 + 2*Math.PI, -Math.PI/2 + x(d.x0)))
        })
        .endAngle(function (d) {
          return Math.max(-Math.PI/2, Math.min(-Math.PI/2 + 2*Math.PI, -Math.PI/2 + x(d.x1)))
        })
        .innerRadius(function (d) {
          return Math.max(0, y(d.y0))
        })
        .outerRadius(function (d) {
          return Math.max(0, y(d.y1))
        })
        // .padAngle(0.002)
      var node = svg
        .selectAll('.hierarchy-node')
        .data(
          partition(root)
            .descendants()
            .slice(1)
        )
        .enter()
        .append('g')
      this.arcSvg = node
        .append('path')
        .attr('class', 'hierarchy-node')
        .attr('id', (d, i) => 'hierarchy-node-'+i)
        .attr('d', arc)
        .style('stroke', function(){
            return 'black'
        })
        .attr('stroke-opacity', '0.5')
        .style('fill', d => {
          if (d.data.type === 'dir') {
            return '#f0f0f0'
          }
          // console.log(d.data.topic, this.topicColormap(parseInt(d.data.topic)))
          return this.topicColormap(parseInt(d.data.topic))
        })
        // 添加不可见的arc, text根据该arc显示(详情见https://www.visualcinnamon.com/2015/09/placing-text-on-arcs.html)
        .each((d, i) => {
          var firstArcSection = /(^.+?)L/
          var newArc = firstArcSection.exec(node.select('#hierarchy-node-'+i).attr('d'))[1]
          newArc = newArc.replace(/,/g, ' ')
          // if(newArc.split(' ')[7] > Math.PI/2){
          //   var startLoc = /M(.*?)A/,
          //     middleLoc = /A(.*?)0 0 1/,
          //     endLoc = /0 0 1 (.*?)$/
          //   var newStart = endLoc.exec(newArc)[1],
          //     newEnd = startLoc.exec(newArc)[1],
          //     middleSec = middleLoc.exec(newArc)[1]
          //   newArc = 'M' + newStart + 'A' + middleSec + '0 0 0' + newEnd 
          // }
          node.append('path')
            .attr('class', 'hiddenDonutArcs')
            .attr('id', 'donutArc'+i)
            .attr('d', newArc)
            .style('fill', 'none')
        })
        .on('click', d => {
          if(d.data.type === 'file'){
            this.$bus.$emit('doc-selected', this.docData[d.data.id])
            this.arcSvg.filter(d => d.data.type === 'file')
              .attr('opacity', '0.1')
            if(this.linkG){
              this.links.forEach((d, i) =>{
                this.linkG.select('#node-link'+i).attr('stroke-opacity', 0)
              })
            }
            if(this.selectedDoc === d.data.id){
              this.selectedDoc = null
              if(this.selectedCluster){
                this.arcSvg.filter(d => this.selectedCluster.indexOf(d.data.id) != -1)
                  .attr('opacity', 1)
                if(this.linkG){
                  this.links.forEach((d, i) =>{
                    if(this.selectedCluster.indexOf(d.source.data.id) != -1 && this.selectedCluster.indexOf(d.target.data.id) != -1)
                      this.linkG.select('#node-link'+i).attr('stroke-opacity', 1)
                  })
                }
              }
              else{
                this.arcSvg.filter(d => d.data.type === 'file')
                  .attr('opacity', '1')
                this.arcSvg.filter(d => d.norm >= this.threshold && d.data.version === 'prev')
                  .attr('opacity', '0.5')
                this.arcSvg
                  .filter(d => d.norm < this.threshold)
                  .attr('opacity', '0')
                this.links.forEach((d, i) =>{
                  this.linkG.select('#node-link'+i).attr('stroke-opacity', 1)
                  if(d.source.norm < this.threshold || d.target.norm < this.threshold)
                    this.linkG.select('#node-link'+i).attr('stroke-opacity', 0)
                })
              }
            }
            else{
              this.selectedDoc = d.data.id
              this.arcSvg.filter(arc => arc.data.id === d.data.id)
                .attr('opacity', 1)
            }
          } 
        })

      var tip = d3tip()
        .offset([2, 2])
        .attr('class', 'd3-tip')
        .html(function(d) { return d.data.name.substr(d.data.name.lastIndexOf('\\') + 1) })
      svg.call(tip)
      node
        .append('text')
        .style('cursor', 'default')
        .attr('id', (d, i) => 'text'+i)
        .attr('dy', 16)
        // .attr('dy', function(d) { 
        //   var angle = arc(d).split(',')[7].split('L')
        //   return (angle[0] > Math.PI/2 ? -6 : 18) 
        // })
        .append('textPath')
        .attr('startOffset','50%')
        .style('text-anchor','middle')
        .attr('xlink:href', (d, i) => '#donutArc'+i)
        .text(function(d, i){
          if(d.data.type === 'dir'){
            let firstArc = (/(^.+?)L/).exec(arc(d))[1]
            let startPoint = (/M(.*?)A/).exec(firstArc)[1].split(','),
              endPoint = firstArc.split(',').slice(-2)
            let distX = startPoint[0]-endPoint[0],
              distY = startPoint[1]-endPoint[1]
            let dist = Math.sqrt(distX * distX + distY * distY)
            let name = d.data.name.substr(d.data.name.lastIndexOf('\\') + 1)
            if(dist < name.length*10)
            {
              node.select('#text'+ i)
                .on('mouseenter', tip.show)
                .on('mouseout', tip.hide)
              return '...'
            }  
            else return name
          }
        })
        .attr('opacity', d => {
          if(d.data.version === 'prev')
            return 0.5
        })
      
    // // 添加虚线
    // node
    //     .each((d, i) => {
    //       var firstArcSection = /A(.*)L/,
    //         lineAndArcSection = /(L.*)Z/,
    //         curNode = node.select('#hierarchy-node-'+i).attr('d')
    //       var newArc1 = firstArcSection.exec(curNode)[1],
    //         newArc2 = lineAndArcSection.exec(curNode)[1]
    //       var list = newArc1.split(',')
    //       newArc1 = 'M' + list[5] + ',' + list[6] + newArc2
    //       newArc1 = newArc1.replace(/,/g, ' ')
    //       node.append('path').attr('d', newArc1)
    //         .attr('fill-opacity', '0')
    //         .style('stroke', 'black')
    //         .attr('stroke-dasharray', '5,5')
    //     })
       
      // this.arcSvg
      //   .append('title')
      //   .text(d => d.data.name)
      // 前一版本用虚线
      this.arcSvg
        .filter(d => d.data.version === 'prev')
        .attr('opacity', '0.5')
        .attr('stroke-dasharray', '5,5')
      
      if(this.diffDocs){
        var leafNodes = root.leaves()
        leafNodes.forEach(d => {
          let obj = this.diffDocs.find(doc => {
            return (d.data.id === doc.fileIds[0]) || (d.data.id === doc.fileIds[1])
          })
          d['norm'] = obj['norm']
          d['fileType'] = obj['type']
        })
        // 前后版本的差异较小的文件透明度降低(阈值为0.1)
        this.arcSvg
          .filter(d => d.norm < this.threshold)
          .attr('opacity', '0')
          .on('click', null)
        this.arcSvg
          .filter(d => d.norm >= this.threshold && d.fileType === 'edit'&& d.data.version === 'curv')
          .attr('stroke-width', '2.5')
          .attr('stroke-opacity', 1)
      
      // 绘制连线
      //   var cluster = d3.cluster().size([360, this.height / 2-110]).separation(() => 1)
      //   var linkLine = d3.radialLine()
      //     .curve(d3.curveBundle.beta(0.85))
      //     .radius(function(d) { return d.y })
      //     .angle(function(d) { return d.x / 180 * Math.PI -Math.PI/2})
      //  cluster(root)
      //   var linkG = svg.append('g')
      //   var link = linkG.selectAll('.link')
      //     .data(this.packageNodes(root.leaves(), this.diffDocs))
      //     .enter().append('path')
      //     .each(function(d){d.source = d[d.length-1], d.target = d[0]})
      //     .attr('class', 'link')
      //     .attr('id', d =>'link'+d[0].data.id)
      //     .attr('d', linkLine)
      //     .style('stroke', d => this.topicColormap(parseInt(d[0].data.topic)))
      //     .attr('stroke-width', 3)
        
       // 利用suorce, 圆心, target绘制连线
        this.links = []
        var editDocs = this.diffDocs.filter(doc => doc.type==='edit')
        editDocs.forEach(doc =>{
          let pre_node = leafNodes.filter(d => d.data.id === doc.fileIds[0])
          if(pre_node.length > 0) {
            let cur_node = leafNodes.filter(d => d.data.id === doc.fileIds[1])
            if(cur_node.length > 0) 
              this.links.push({source: pre_node[0], target: cur_node[0]}) 
          }
        })
        this.linkG = svg.append('g')
        this.links.forEach((d, i) =>{
          // let start = arc.centroid(d.source), 
          //   end = arc.centroid(d.target)
          let sourceOuterR = arc.outerRadius()(d.source),
            sourceAngle = (arc.startAngle()(d.source)+arc.endAngle()(d.source))/2,
            targetOuterR = arc.outerRadius()(d.target),
            targetAngle = (arc.startAngle()(d.target)+arc.endAngle()(d.target))/2
          let start = [Math.sin(sourceAngle)*sourceOuterR, Math.abs(Math.cos(sourceAngle)*sourceOuterR)],
            end = [Math.sin(targetAngle)*targetOuterR, -Math.cos(targetAngle)*targetOuterR]
          let linearGradient = svg.append('defs')
            .append('linearGradient')
            .attr('id', 'linear-gradient'+i)
            .attr('gradientUnits','userSpaceOnUse')
            .attr('x1', start[0])
            .attr('y1', start[1])
            .attr('x2', end[0])
            .attr('y2', end[1])
            
          linearGradient.append('stop')
            .attr('offset', '0%')
            .attr('stop-color', this.topicColormap(parseInt(d.source.data.topic)))
          linearGradient.append('stop')
            .attr('offset', '49%')
            .attr('stop-color', this.topicColormap(parseInt(d.source.data.topic)))
          linearGradient.append('stop')
            .attr('offset', '50%')
            .attr('stop-color', this.topicColormap(parseInt(d.target.data.topic)))
          linearGradient.append('stop')
            .attr('offset', '100%')
            .attr('stop-color', this.topicColormap(parseInt(d.target.data.topic)))
          this.linkG.append('path')
            .attr('id', 'node-link'+i)
            .attr('d', 'M'+start+'Q'+0+','+ 0+',' +end)
            .attr('fill', 'none')
            .attr('stroke', 'url(#linear-gradient'+i+')')
            .attr('stroke-width', 2)
            .attr('stroke-opacity', () =>{
              if(d.source.norm < this.threshold || d.target.norm < this.threshold)
                return 0
            })
        })
      }

      // svg
      //   .append('defs')
      //   .append('pattern')
      //   .attr('id', 'stripes')
      //   .attr('patternUnits', 'userSpaceOnUse')
      //   // .attr('width', 4)
      //   // .attr('height', 4)
      //   // .append('rect')
      //   // .attr('width', 0.1)
      //   // .attr('height', 8)
      //   .attr('width', 4)
      //   .attr('height', 4)
      //   .append('path')
      //   .attr('d', 'M-1,1 l2,-2M0,10 l10,-10M9,11 l2,-2')
      //   .style('stroke', 'black')

      // node
      //   .each((d, i) => {
      //     if(d.fileType === 'edit' && d.norm >= 0.1) {
      //       let curPath = node.select('#hierarchy-node-'+i).attr('d')
      //       node.append('path')
      //         .attr('d', curPath)
      //         .attr('fill', 'url(#stripes)')
      //     }
      //   })
        
    },
    packageNodes(nodes, diffDocs){
      var map= {}, links = []
      nodes.forEach(function(d){
        map[d.data.id] = d
      })
      var editDocs = diffDocs.filter(doc => doc.type==='edit')
      editDocs.forEach(doc =>{
        let pre_node = nodes.filter(d => d.data.id === doc.fileIds[0])
        if(pre_node.length > 0) {
          let cur_node = nodes.filter(d => d.data.id === doc.fileIds[1])
          if(cur_node.length > 0) 
            links.push(map[cur_node[0].data.id].path(map[pre_node[0].data.id]))
        }
      })
      return links
    },
    resetStatus () {
      this.arcSvg.attr('opacity', 1)
    },
    findNode(root, name){
      for(var i=0; i<root.children.length; i++) {
        let fpath = root.children[i].name
        var fname = fpath.substr(fpath.lastIndexOf('\\')+1)
        if(name === fname)
          return i
      }
      return -1
    }
  },
  created () {
    this.$bus.$on('topic-selected', topicId => {
      this.resetStatus()
      if (topicId === -1) {
        return
      }
      this.arcSvg
        .filter(
          d => d.data.type !== 'dir' && parseInt(d.data.topic) !== topicId
        )
        .attr('opacity', 0.1)
    })
    this.$bus.$on('cluster-selected', ids => {
      this.resetStatus()
      this.selectedCluster = ids
      this.arcSvg
        .filter(d => d.data.type !== 'dir' && ids.indexOf(d.data.id) === -1)
        .attr('opacity', 0.1)
      this.links.forEach((d, i) =>{
        this.linkG.select('#node-link'+i).attr('stroke-opacity', 0)
        if(ids.indexOf(d.source.data.id) != -1 && ids.indexOf(d.target.data.id) != -1)
          this.linkG.select('#node-link'+i).attr('stroke-opacity', 1)
      })
    })
  },
  mounted () {
    this.height = Math.floor(this.$refs.root.clientHeight)
    this.$bus.$on('version-selected', d => {
      // var prev = this.versions[this.versions.indexOf(d)-1]
      this.$refs.root.innerHTML = ''
      this.$axios
        .get('topics/getTopicDisByVersion', { curv: d, prev: null})
        .then(({ data }) => {
          this.draw(data)
        })
    })
    this.$bus.$on('version-range-selected', d => {
      this.$refs.root.innerHTML = ''
      this.$axios
        .get('topics/getTopicDisByVersion', d)
        .then(({ data }) => {
          this.diffDocs = data.diffDocs
          this.draw(data.root)
        })
    })
    this.$bus.$on('version-restored', () => {
      this.$refs.root.innerHTML = ''
    })
    this.$bus.$on('cluster-restored', () => {
      this.selectedCluster = null
      this.resetStatus ()
      this.arcSvg
        .filter(d => d.norm < this.threshold)
        .attr('opacity', '0')
      this.arcSvg.filter(d => d.norm >= this.threshold && d.data.version === 'prev')
        .attr('opacity', '0.5')
      this.arcSvg
        .filter(d => d.norm >= this.threshold && d.fileType === 'edit' && d.data.version === 'curv')
        .attr('stroke-width', '2.5')
        .attr('stroke-opacity', 1)
      this.links.forEach((d, i) =>{
        this.linkG.select('#node-link'+i).attr('stroke-opacity', 1)
        if(d.source.norm < this.threshold || d.target.norm < this.threshold)
          this.linkG.select('#node-link'+i).attr('stroke-opacity', 0)
      })
    })
    this.$bus.$on('threshold-selected', d => this.threshold=d)
  }
}
</script>

<style lang="less">
// .sunburst {
//   height: 100%;
// }
.d3-tip {
  line-height: 1;
  // font-weight: bold;
  padding: 5px;
  background: rgba(100, 98, 98, 0.8);
  color: #fff;
  border-radius: 3px;
}

/* Creates a small triangle extender for the tooltip */
.d3-tip:after {
  box-sizing: border-box;
  display: inline;
  font-size: 8px;
  width: 100%;
  line-height: 1;
  color: rgba(100, 98, 98, 0.8);
  content: "\25BC";
  position: absolute;
  text-align: center;
}

/* Style northward tooltips differently */
.d3-tip.n:after {
  margin: -2px 0 0 0;
  top: 100%;
  left: 0;
}
.link {
  stroke: steelblue;
  stroke-opacity: 0.5;
  fill: none;
  pointer-events: none;
}

</style>