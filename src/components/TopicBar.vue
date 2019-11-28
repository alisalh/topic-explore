<template>
  <div class='topic-bar'
    @click='globalClickHandler'>
    <div v-for="item in barData" :key="item.id" class='topic-bar-wrapper'>
      <div class="idx" :style="{opacity:item.opacity}">{{item.topicId+1}}</div>
      <div class="bar"
          :style="{background: 'white', opacity: item.opacity, width:item.value+'px'}"
          @click='barClickHandler(item)'
          :class='{selected:item.isSelected}'>
      </div>
      <div class="text" :style="{opacity:item.opacity}">{{topics[item.topicId]}}</div>
    </div>
  </div>
</template>

<script>
import { TOPIC_COLOR } from '../utils/constant.js'
import * as d3 from 'd3'
export default {
  name: 'component_name',
  data() {
    return {
      barData: TOPIC_COLOR.map((d, i) => ({
        color: d,
        opacity: 1,
        value: 0,
        topicId: i,
        isSelected: false
      })),
      selectedTopic: null,
      selectedVersion: 'all',
      topics: ['option', 'vdom', 'component','model', 'dom','template',
          'SSR','instance','directives','merge','watcher', 'html-parser',
          'text-parser','observer', 'transition', 'complier']
    }
  },
  props:['topicsGroup', 'versions'],
  methods: {
    barClickHandler(selectedBar) {
      if(selectedBar.isSelected){
        this.$bus.$emit('topic-selected', -1)
        this.barData
          .forEach(d => {
            d.isSelected = false
            if(d.value > 0)
              d.opacity = 1
          })
      }
      else {
        this.barData
          .forEach(d => {
            d.isSelected = false
            d.opacity = 0.2
          })
        this.barData
          .filter(d => d === selectedBar)
          .forEach(d => {
            d.isSelected = true
            d.opacity = 1
          })
        this.$bus.$emit('topic-selected', selectedBar.topicId)
      }
    },
    globalClickHandler() {
      console.log('global click')
    },
    selectTrigger(val){
      this.selectedVersion = val
      this.barData.forEach(d => {
        d.value = 0
      })
      this.barData.sort(function(a, b){
          return a.topicId - b.topicId
      })
      if(this.selectedVersion === 'all') {
        this.topicsGroup.forEach(topic => {
          // 过滤特殊值, 与linechat对应
          let w = topic.val.length
          this.barData[topic.key].value=w
        })
        this.barData.forEach(d => {
          d.opacity = 1
          d.isSelected = false
        })
      }
      else {
        this.topicsGroup.forEach(topic => {
          topic.val.forEach(d => {
            if(this.selectedVersion === d.key)
              this.barData[topic.key].value += d.val.length
          })
        })
        
        this.barData.sort(function(a, b){
          return b.value - a.value
        })
        this.barData.forEach(d => {
          if(d.value === 0)d.opacity = 0.2
          else d.opacity = 1
          d.isSelected = false
        })
      }
      var widthScale =  d3
        .scaleLinear()
        .domain([0, d3.max(this.barData, d => {
          return d.value
        })])
        .range([0, 120])
      this.barData.forEach(d => {
        d.value = widthScale(d.value) 
      })
    }
  },
  created(){
    //当异步数据获取完后才开始渲染
    const requiredData = ['topicsGroup', 'versions']
    let cnt = 0
    requiredData.forEach(d => {
      this.$watch(d,val => {
        if(val) cnt++
        if(cnt === requiredData.length) {
          var widthScale =  d3
            .scaleLinear()
            .domain([0, this.versions.length])
            .range([0, 120])
          this.topicsGroup.forEach(topic => {
            // 过滤特殊值, 与linechat对应
            let w = topic.val.length
            this.barData[topic.key].value=widthScale(w)
          })
        }
      })
    })

    this.$bus.$on('version-selected', obj => {
      this.selectTrigger(obj.version)
      this.barData.forEach(d =>{
        if(d.topicId === obj.topic && d.value > 0){
          d.opacity = 1
          d.isSelected = true
        }
        else{
          d.opacity = 0.2
          d.isSelected = false
        }
      })
    })
    this.$bus.$on('version-restored', d => {this.selectTrigger(d)})
    this.$bus.$on('version-range-selected', d=> {this.selectTrigger('all')})
    this.$bus.$on('line-selected', topicId =>{
      this.barData
        .forEach(d => {
          d.isSelected = false
          d.opacity = 0.2
        })
      this.barData
        .filter(d => d.topicId === topicId)
        .forEach(d => {
          d.isSelected = true
          d.opacity = 1
        })
    })
    this.$bus.$on('line-restored', () =>{
      this.barData
        .forEach(d => {
          d.isSelected = false
          if(d.value === 0) d.opacity = 0.2
          else d.opacity = 1
        })
    })
  }
}
</script>

<style lang="less">
.topic-bar {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 0 5px;
  cursor: default;
  font-size: 14px;
  .topic-bar-wrapper{
    margin-top:10px;
    overflow: auto;
    display: flex;
    align-items: center;
    .idx {
      flex: 0.2;
      text-align: right;
      margin-right: 5px;
    }
    .bar {
      flex: 1.7;
      height: 10px;
      margin-right: 2px;
        &.selected {
          border: 1px solid black;
        }
    }
    .text{
      flex: 1;
      text-align: left;
      margin-right: 5px;
    }
  }
}
</style>