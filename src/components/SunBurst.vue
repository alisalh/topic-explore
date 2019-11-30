<template>
  <div class='sunburst'>
    <div class='cur-hierarchy' ref='root1'></div>
    <div class='cur-link-pre' ref='root2'></div>
    <div class='pre-hierarchy' ref='root3'></div>
  </div>
</template>

<script>
import * as d3 from 'd3'
import d3tip from 'd3-tip'

export default {
  name: 'component_name',
  data () {
    return {
      cur_svg: null,
      cur_width: 0,
      cur_height: 0,
      cur_node: null,
      cur_dataRoot: null,
      cur_version: null,
      pre_svg: null,
      pre_width: 0,
      pre_height: 0,
      pre_node: null,
      pre_dataRoot: null,
      diffDocs: null
    }
  },
  computed: {
  },
  props: ['topicColormap', 'docData', 'versions'],
  methods: {
    drawCurHierarchy(data) {
      this.cur_svg.selectAll('*').remove()

      let root = d3.hierarchy(data)
      this.cur_dataRoot = root
      root.sum(d => (d.children ? 0 : 1)) // 后序遍历, value相加, 详情见https://github.com/xswei/d3-hierarchy

      var x = d3.scaleLinear().range([0, this.cur_width])
      var y = d3.scaleLinear().range([0, this.cur_height]).domain([0, 1])
      
      var partition = d3.partition()
      this.cur_node = this.cur_svg
        .selectAll('rect')
        .data(
          partition(root)
            .descendants()
            .slice(1)  // 不绘制root节点
        )
        .enter()
        .append('rect')
        .attr('x', d => x(d.x0))
        .attr('y', d => y(d.y0))
        .attr('width', d => x(d.x1) - x(d.x0))
        .attr('height', d => y(d.y1) - y(d.y0))
        .style('stroke', 'black')
        .attr('stroke-opacity', '0.3')
        .attr('fill', d => {
          if (d.data.type === 'dir') {
            return '#f0f0f0'
          }
          return this.topicColormap(parseInt(d.data.topic))
        })
     },
    drawPreHierarchy(data) {
      this.pre_svg.selectAll('*').remove()

      let root = d3.hierarchy(data)
      this.pre_dataRoot = root
      root.sum(d => (d.children ? 0 : 1)) // 后序遍历, value相加, 详情见https://github.com/xswei/d3-hierarchy

      var x = d3.scaleLinear().range([0, this.pre_width])
      var y = d3.scaleLinear().range([0, this.pre_height]).domain([1, 0])
      
      var partition = d3.partition()
      this.pre_node = this.pre_svg
        .selectAll('rect')
        .data(
          partition(root)
            .descendants()
            .slice(1)  // 不绘制root节点
        )
        .enter()
        .append('rect')
        .attr('x', d => x(d.x0))
        .attr('y', d => y(d.y1))
        .attr('width', d => x(d.x1) - x(d.x0))
        .attr('height', d => y(d.y0) - y(d.y1))
        .style('stroke', 'black')
        .attr('stroke-opacity', '0.3')
        .attr('fill', d => {
          if (d.data.type === 'dir') {
            return '#f0f0f0'
          }
          return this.topicColormap(parseInt(d.data.topic))
        })
    },
    // 根据差异文件改变节点边框及颜色
    // drawDifference(data){
    //   let addDocs = data.add, delDocs = data.del, editDocs = data.edit
      
    // },
  },
  created(){
    // 选择单个版本进行查看
    this.$bus.$on('version-selected', d => {
      this.cur_version = d.version
      this.$axios
        .get('topics/getFileHierarchyByVersion', { version: d.version})
        .then(({ data }) => {
          this.drawCurHierarchy(data)
        })
    })

    // 选择两个版本进行比较
    this.$bus.$on('version-range-selected', d =>{
      let curv = d.curv, prev = d.prev
      this.diffDocs = d.diffDocs
      if(curv != this.cur_version){
        this.cur_version = curv
        this.$axios
        .get('topics/getFileHierarchyByVersion', { version: curv})
        .then(({ data }) => {
          this.drawCurHierarchy(data)
        })
      }
      this.$axios
        .get('topics/getFileHierarchyByVersion', { version: prev})
        .then(({ data }) => {
          this.drawPreHierarchy(data)
          // this.drawDifference(this.diffDocs)
        })
    })
  },
  mounted () {
    // 当前版本svg
    this.cur_height = Math.floor(this.$refs.root1.clientHeight)
    this.cur_width = Math.floor(this.$refs.root1.clientWidth)
    this.cur_svg = d3
      .select('.cur-hierarchy')
      .append('svg')
      .attr('width', this.cur_width)
      .attr('height', this.cur_height)
      .append('g')
      .attr('class', 'cur-hierarchy-node')

    //前一版本svg
    this.pre_height = Math.floor(this.$refs.root3.clientHeight)
    this.pre_width = Math.floor(this.$refs.root3.clientWidth)
    this.pre_svg = d3
      .select('.pre-hierarchy')
      .append('svg')
      .attr('width', this.pre_width)
      .attr('height', this.pre_height)
      .append('g')
      .attr('class', 'pre-hierarchy-node')
  }
   
}
</script>

<style lang="less">
.sunburst {
  height: 100%;
  font-size: 20px;
  display: flex;
  flex-direction: column;
  .cur-hierarchy{
    flex: 2;
  }
  .cur-link-pre{
    flex: 1;
  }
  .pre-hierarchy{
    flex: 2;
  }
}

</style>