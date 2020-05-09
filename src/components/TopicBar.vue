<template>
  <div class="topic-bar">
    <div v-for="item in barData" :key="item.id" class="topic-bar-wrapper">
      <div class="idx" :style="{opacity:item.opacity}">{{item.topicId+1}}</div>
      <div class="bar">
        <div
          :style="{background: item.color, opacity: item.opacity, width:item.value+'px', height: '100%'}"
          @click="barClickHandler(item)"
        ></div>
      </div>
      <div class="text" :style="{opacity:item.opacity}">
        <input
          type="text"
          v-model="topics[item.topicId]"
          style="width: 72px; height: 15px; color: #4B4949; border: none; padding-left: 2px; font-family: Avenir, Helvetica, Arial, sans-serif; font-size: 14px;"/>
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
        color: d,
        opacity: 1,
        value: 0,
        topicId: i,
        isSelected: false
      })),
      selectedTopic: null,
      selectedVersion: "all",
      topics: [
        'parameter', 
        'template', 
        'merge',
        'dom', 
        'object',
        'observer',
        'SSR',
        'directives',
        'transition',
        'option',
        'watcher', 
        'path',
        'vdom',
        'compiler',
        'data', 
        'model'
      ]
      // topics: [
      //   "layout",
      //   "touch",
      //   "color",
      //   "transition",
      //   "selection",
      //   "locale",
      //   "element",
      //   "attribute",
      //   "event",
      //   "scale",
      //   "interpolate",
      //   "time",
      //   "geometry",
      //   "chart"
      // ]
    };
  },
  props: ["topicsGroup", "versions"],
  methods: {
    // topic bar的点击事件
    barClickHandler(selectedBar) {
      if (selectedBar.isSelected) {   //选中topic bar时, 再次点击还原
        this.$bus.$emit("topic-selected", -1);  
        this.barData.forEach(d => {
          d.isSelected = false;
          if (d.value > 0) d.opacity = 1;
        });
      } else {                       //未选中topic bar时, 点击选中
        this.barData.forEach(d => {
          d.isSelected = false;
          d.opacity = 0.2;
        });
        this.barData
          .filter(d => d === selectedBar)
          .forEach(d => {
            d.isSelected = true;
            d.opacity = 1;
          });
        this.$bus.$emit("topic-selected", selectedBar.topicId);
      }
    },
    // 版本选择
    selectTrigger(val) {
      this.selectedVersion = val;
      this.barData.forEach(d => {
        d.value = 0;
        d.opacity = 1;
        d.isSelected = false;
      });
      this.barData.sort(function(a, b) {
        return a.topicId - b.topicId;
      });

      if (this.selectedVersion === "all") {          //所有版本
        this.topicsGroup.forEach(topic => {
          let w = 0;
          for (let i = 0; i < topic.val.length; i++) {
            if (topic.val[i].val.length != 0) {
              w++;
            }
          }
          this.barData[topic.key].value = w;
        }); 
      } else {                                      //某个版本 
        this.topicsGroup.forEach(topic => {
          topic.val.forEach(d => {
            if (this.selectedVersion === d.key) {
              let w = 0;
              for (let i = 0; i < topic.val.length; i++) {
                if (topic.val[i].val.length != 0) {
                  w++;
                }
              }
              this.barData[topic.key].value += w;
            }
          });
        });

        this.barData.sort(function(a, b) {
          return b.value - a.value;
        });
        this.barData.filter(d => d.value === 0).map(d => d.opacity = 0.2)
      }

      var widthScale = d3.scaleLinear()
        .domain([0, d3.max(this.barData, d => d.value)])
        .range([0, 120]);
      this.barData.forEach(d => {
        d.value = widthScale(d.value);
      });
    }
  },
  created() {
    //当异步数据获取完后才开始渲染
    const requiredData = ["topicsGroup", "versions"];
    let cnt = 0;
    requiredData.forEach(d => {
      this.$watch(d, val => {
        if (val) cnt++;
        if (cnt === requiredData.length) {
          var widthScale = d3
            .scaleLinear()
            .domain([0, this.versions.length])
            .range([0, 120]);

          // bar长度与主题对应的版本数相关
          this.topicsGroup.forEach(topic => {
            let w = 0;
            for (let i = 0; i < topic.val.length; i++) {
              if (topic.val[i].val.length != 0) {
                w++;
              }
            }
            this.barData[topic.key].value = widthScale(w);
          });
        }
      });
    });

    this.$bus.$on("version-selected", obj => {
      this.selectTrigger(obj.version);
      this.barData.forEach(d => {
        if (d.topicId === obj.topic && d.value > 0) {
          d.opacity = 1;
          d.isSelected = true;
        } else {
          d.opacity = 0.2;
          d.isSelected = false;
        }
      });
    });
    this.$bus.$on("version-restored", d => {
      this.selectTrigger(d);
    });
    this.$bus.$on("version-range-selected", d => {
      this.selectTrigger("all");
    });
    this.$bus.$on("line-selected", topicId => {
      this.barData.forEach(d => {
        d.isSelected = false;
        d.opacity = 0.2;
      });
      this.barData
        .filter(d => d.topicId === topicId)
        .forEach(d => {
          d.isSelected = true;
          d.opacity = 1;
        });
    });
    this.$bus.$on("line-restored", () => {
      this.barData.forEach(d => {
        d.isSelected = false;
        if (d.value === 0) d.opacity = 0.2;
        else d.opacity = 1;
      });
    });
  }
};
</script>

<style lang="less">
.topic-bar {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 10px 5px;
  cursor: default;
  font-size: 14px;
  .topic-bar-wrapper {
    margin-top: 10px;
    overflow: auto;
    display: flex;
    align-items: center;
    .idx {
      flex: 0.7;
      text-align: right;
      margin-right: 5px;
    }
    .bar {
      flex: 5;
      height: 8px;
      margin-left: 3px;
      margin-right: 5px;
    }
    .text {
      flex: 3;
      text-align: left;
    }
  }
}
</style>