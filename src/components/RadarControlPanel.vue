<template>
  <div class='radar-control-panel'
    @click='globalClickHandler'>
    <!-- <div class='version-select-box'>
      <div class='version-title'>version</div>
      <el-select v-model="selectedVersion" size='small'
        @change="selectTrigger(selectedVersion)"
        class='version-id'>
        <el-option
          v-for="item in options"
          :key="item.value"
          :value="item.label"
          :label="item.label">
        </el-option>
      </el-select>
    </div> -->
    <div class="topic-select-control-panel">
      <div v-for="item in sliderData"
        :key="item.id"
        class='select-control-wrapper'>
        <div class="topic-idx">
          <div :style="{opacity:item.opacity}">{{item.topicId+1}}</div>
        </div>
        <div class="topic-text">
           <div :style="{opacity:item.opacity}">{{topics[item.topicId]}}</div>
        </div>
        <div class="legend">
          <div class="bar"
            :style="{background:item.color, opacity: item.opacity, width:item.value+'px'}"
            @click='legendClickHandler(item)'
            :class='{selected:item.isSelected}'></div>
        </div>
        <!-- <el-slider v-model="item.value"
          :min="0"
          :max="1"
          class='topic-slider'
          :step="0.1"></el-slider> -->
      </div>
    </div>
    <!-- <el-button type="info"
      plain
      class='reset-btn'
      @click='resetBtnClickHandler'>重置</el-button>
    <div class="dominant-topic-control-panel">
      <span class="title">Dominant Topic：</span>
      <span>{{selectedTopic}}</span>
    </div> -->
  </div>
</template>

<script>
import { TOPIC_COLOR } from '../utils/constant.js'
import * as d3 from 'd3'
export default {
  name: 'component_name',
  data() {
    return {
      sliderData: TOPIC_COLOR.map((d, i) => ({
        color: d,
        opacity: 1,
        value: 0,
        topicId: i,
        isSelected: false
      })),
      selectedTopic: null,
      selectedVersion: 'all',
      // legendWdith: [],
      // options:[{value:0, label: 'all'}],
      topics: ['option', 'vdom', 'component','model', 'dom','template',
          'SSR','instance','directives','merge','watcher', 'html-parser',
          'text-parser','observer', 'transition', 'complier']
    }
  },
  props:['topicsGroup', 'versions'],
  methods: {
    legendClickHandler(selectedSlider) {
      if(selectedSlider.isSelected){
        this.$bus.$emit('topic-selected', -1)
        this.sliderData
          .forEach(d => {
            d.isSelected = false
            if(d.value > 0)
              d.opacity = 1
          })
      }
      else {
        this.sliderData
          .forEach(d => {
            d.isSelected = false
            d.opacity = 0.2
          })
        this.sliderData
          .filter(d => d === selectedSlider)
          .forEach(d => {
            d.isSelected = true
            d.opacity = 1
          })
        this.$bus.$emit('topic-selected', selectedSlider.topicId)
      }
    },
    globalClickHandler() {
      console.log('global click')
    },
    selectTrigger(val){
      this.selectedVersion = val
      this.sliderData.forEach(d => {
        d.value = 0
      })
      this.sliderData.sort(function(a, b){
          return a.topicId - b.topicId
      })
      if(this.selectedVersion === 'all') {
        this.topicsGroup.forEach(topic => {
          // 过滤特殊值, 与linechat对应
          let w = topic.val.length
          if(topic.key===1 || topic.key===6){
              topic.val.forEach(d => {
              if(this.versions.indexOf(d.key) < this.versions.indexOf('2.0.0'))
                w--
            })
          }
          this.sliderData[topic.key].value=w
        })
        this.sliderData.forEach(d => {
          d.opacity = 1
          d.isSelected = false
        })
      }
      else {
        this.topicsGroup.forEach(topic => {
          topic.val.forEach(d => {
            if(this.selectedVersion === d.key)
              this.sliderData[topic.key].value += d.val.length
          })
        })

        // // 过滤特殊值, 与linechat对应
        // if(this.versions.indexOf(this.selectedVersion) < this.versions.indexOf('2.0.0')){
        //   this.sliderData.forEach((d, i) =>{
        //     if(i === 1 || i === 6)
        //       d.value = 0
        //   })
        // }
        
        this.sliderData.sort(function(a, b){
          return b.value - a.value
        })
        this.sliderData.forEach(d => {
          if(d.value === 0)d.opacity = 0.2
          else d.opacity = 1
          d.isSelected = false
        })
      }
      var widthScale =  d3
        .scaleLinear()
        .domain([0, d3.max(this.sliderData, d => {
          return d.value
        })])
        .range([0, 120])
      this.sliderData.forEach(d => {
        d.value = widthScale(d.value) 
      })
      // this.$bus.$emit('topic-selected', -1) 
    }
    // resetBtnClickHandler() {
    //   this.sliderData.forEach(d => (d.isSelected = false))
    //   this.$bus.$emit('topic-selected', -1)
    //   this.selectedTopic = null
    // }
  },
  created(){
    //当异步数据获取完后才开始渲染
    const requiredData = ['topicsGroup', 'versions']
    let cnt = 0
    requiredData.forEach(d => {
      this.$watch(d,val => {
        if(val) cnt++
        if(cnt === requiredData.length) {
          // this.versions.forEach((d, i) => {
          //   this.options.push({value: i+1, label: d })
          // })
          var widthScale =  d3
            .scaleLinear()
            .domain([0, this.versions.length])
            .range([0, 120])
          this.topicsGroup.forEach(topic => {
            // 过滤特殊值, 与linechat对应
            let w = topic.val.length
            if(topic.key===1 || topic.key===6){
               topic.val.forEach(d => {
                if(this.versions.indexOf(d.key) < this.versions.indexOf('2.0.0'))
                  w--
              })
            }
            this.sliderData[topic.key].value=widthScale(w)
          })
        }
      })
    })

    this.$bus.$on('version-selected', obj => {
      this.selectTrigger(obj.version)
      this.sliderData.forEach(d =>{
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
      this.sliderData
        .forEach(d => {
          d.isSelected = false
          d.opacity = 0.2
        })
      this.sliderData
        .filter(d => d.topicId === topicId)
        .forEach(d => {
          d.isSelected = true
          d.opacity = 1
        })
    })
    this.$bus.$on('line-restored', () =>{
      this.sliderData
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
.radar-control-panel {
  display: flex;
  flex-direction: column;
  padding: 0 5px;
  cursor: default;
  font-size: 14px;
  // .version-select-box{
  //   flex: 0.8;
  //   display: flex;
  //   padding: 10px 5px;
  //   border-bottom: 1px solid rgb(156, 151, 151); 
  //   .version-title{
  //     flex:1;
  //     font-size: 17px;
  //     text-align: center;
  //     margin:auto;
  //   }
  //   .version-id{
  //     flex:1.5;
  //   }
  // }
  .topic-select-control-panel {
    flex: 15;
    margin-top:20px;
    overflow: auto;
    // border-bottom: 1px solid black;
    .select-control-wrapper {
      display: flex;
      align-items: center;
      margin-bottom: 17px;
      .topic-idx {
        // flex:none;
        flex: 0.2;
        text-align: right;
        margin-right: 5px;
      }
      .topic-text{
        flex: 1;
        text-align: left;
        margin-right: 5px;
      }
      .legend {
        // width: 40px;
        flex: 1.7;
        height: 10px;
        margin-right: 2px;
        .bar{
          height: 100%;
          &.selected {
            border: 1px solid black;
          }
        }
      }
      // .topic-slider {
      //   width: 50%;
      // }
    }
    // .reset-btn {
    //   width: 100%;
    // }
  }
  // .dominant-topic-control-panel {
  //   margin: 10px;
  //   flex: none;
  //   border-top: 1px solid black;
  //   padding-top: 5px;
  //   .title {
  //     font-weight: bold;
  //   }
  // }
}
</style>