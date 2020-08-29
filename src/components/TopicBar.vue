<template>
  <div class="topic-bar">
    <div v-for="item in barData" :key="item.id" class="topic-bar-wrapper">
      <!-- <div class="idx" :style="{opacity:item.opacity}">{{item.topicId+1}}</div> -->
      <div class="text" :style="{opacity:item.opacity}">
        <input
          type="text"
          v-model="topics[item.topicId]"
          style="width: 72px; height: 15px; color: #4B4949; border: none; padding-left: 2px; font-family: Georgia, serif; font-size: 14px;"/>
      </div>
      <div class="bar">
        <div 
          :style="{background: item.color, opacity: item.opacity, width:item.value+'px', height: '100%'}"
          @click="topicBarClicked(item)"
        ></div>
      </div>
    </div>
  </div>
</template>

<script>
import { TOPIC_COLOR } from "../utils/constant.js";
import * as d3 from "d3";
export default {
  name: "component_name",
  data() {
    return {
      barData: TOPIC_COLOR.map((d, i) => ({
        topicId: i,
        value: 0,
        color: d,
        opacity: 1,
        isSelected: false
      })),
      selectedTopic: null,
      selectedVersion: '',
      topics: ['topic 1', 'topic 2', 'topic 3', 'topic 4', 'topic 5', 'topic 6', 'topic 7', 'topic 8', 
               'topic 9', 'topic 10', 'topic 11', 'topic 12', 'topic 13', 'topic 14', 'topic 15']
    };
  },
  props: ["topicsGroup", "versions", "topicNum"],
  methods: {
    // topic bar的点击事件
    topicBarClicked(item) {
      if(item.isSelected){                   // 已选中再次点击取消
        this.selectedTopic = null;
        this.barData.forEach(d => {
          if (d.value > 0){
            d.opacity = 1; 
            d.isSelected = false;
          }
        });
        this.$bus.$emit('topic-reseted', null);
      }else{                                 // 未选中点击选中
        // 隐藏所有的topic bar
        this.barData.forEach(d => {
            d.opacity = 0.1; 
            d.isSelected = false;
        }) 
        // 显示当前选中的topic bar
        this.barData
          .filter(d => d.topicId === item.topicId)
          .map(d =>{
            d.opacity = 1; 
            d.isSelected = true
          });
        this.selectedTopic = item.topicId;
        this.$bus.$emit('topic-selected', item.topicId)
      }
    },

    // curVersion选中的响应事件
    curVersionSelected(val) {
      this.selectedVersion = val;
      this.barData.forEach(d => {
        d.value = 0;
        // d.opacity = 1;
        // d.isSelected = false;
      });

      // 按topic id排序
      this.barData.sort(function(a, b) {
        return a.topicId - b.topicId;
      });
      
      // 计算当前版本下各主题的文件数
      this.topicsGroup.forEach(topic => {
        if(topic.key == -1) return       // 不考虑-1主题
        
        // topic.val.val表示主题.版本.文件
        topic.val.forEach(d => {
          if (this.selectedVersion === d.key) {
            let fileNum = d.val.length
            this.barData[topic.key].value += fileNum;
          }
        });
      });

      // 按文件数排序
      this.barData.sort(function(a, b) {
        return b.value - a.value;
      });

      // 当前版本不存在的主题变暗 
      this.barData.filter(d => d.value === 0).map(d => d.opacity = 0.1);
      
      var widthScale = d3.scaleLinear()
        .domain([0, d3.max(this.barData, d => d.value)])
        .range([0, 120]);
      this.barData.forEach(d => {
        d.value = widthScale(d.value);
      });
    },

    // curVersion重置的响应事件
    curVersionReseted(){
      var widthScale = d3
        .scaleLinear()
        .domain([0, this.versions.length])
        .range([0, 120]);

      this.barData.sort(function(a, b) {
        return a.topicId - b.topicId;
      });
      
      if(this.selectedTopic != null)
        this.barData.forEach(d => {
          d.value = 0;
        });
      else
        this.barData.forEach(d => {
          d.value = 0;
          d.opacity = 1;
          d.isSelected = false;
        });

      // bar长度与主题对应的版本数相关
      this.topicsGroup.forEach(topic => {
        if(topic.key == -1) return     // 不考虑-1主题
        let verNum = topic.val.filter(ver => ver.val.length != 0).length;    // 版本对应的文件数不为0
        this.barData[topic.key].value = widthScale(verNum);
      });
    }
  },
  created() {
    //当异步数据获取完后才开始渲染
    const requiredData = ["topicsGroup", "versions", "topicNum"];
    let cnt = 0;
    requiredData.forEach(d => {
      this.$watch(d, val => {
        if (val) cnt++;
        if (cnt === requiredData.length) {
          this.barData = this.barData.slice(0, this.topicNum)
          this.curVersionReseted();
        }
      });
    });

    // control panel响应事件
    this.$bus.$on('curVersion-selected', d =>{
      this.curVersionSelected(d)
    })
    this.$bus.$on('curVersion-reseted', () =>{
      this.curVersionReseted()
    })
    this.$bus.$on('version-compared', () =>{
      this.curVersionReseted()
    })

    // lineChart响应事件
    this.$bus.$on("lineVersion-selected", d => {
      this.curVersionSelected(d);
    });
    this.$bus.$on("lineVersion-reseted", () => {
      this.curVersionReseted();
    });
    // this.$bus.$on("lineTopic-reseted", () => {
    //   this.selectedTopic = null;
    //   this.barData.forEach(d => {
    //     if(d.value > 0){
    //       d.opacity = 1;
    //       d.isSelected = false;
    //     }
    //   });
    // })
  }

};
</script>

<style lang="less">
.topic-bar {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 5px 5px;
  cursor: default;
  font-size: 14px;
  .topic-bar-wrapper {
    margin-top: 11px;
    overflow: auto;
    display: flex;
    align-items: center;
    // .idx {
    //   flex: 0.7;
    //   text-align: right;
    //   margin-right: 5px;
    // }
    .bar {
      flex: 2;
      height: 8px;
      margin-left: 3px;
      margin-right: 5px;
    }
    .text {
      flex: 1;
      text-align: left;
      margin-left: 10px;
    }
  }
}
</style>