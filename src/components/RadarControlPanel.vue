<template>
  <div class='radar-control-panel'
    @click='globalClickHandler'>
    <div class="topic-slider-control-panel">
      <div v-for="(item,idx) in sliderData"
        :key="item.id"
        class='slider-control-wrapper'>
        <div class="cluster-idx">{{idx}}</div>
        <div class="legend"
          :style="{background:item.color}"
          @click='legendClickHandler(item)'
          :class='{selected:item.isSelected}'>
        </div>
        <el-slider v-model="item.value"
          :min="0"
          :max="1"
          class='topic-slider'
          :step="0.1"></el-slider>
      </div>
    </div>
    <el-button type="info"
      plain
      class='reset-btn'
      @click='resetBtnClickHandler'>重置</el-button>
    <div class="dominant-topic-control-panel">
      <span class="title">Dominant Topic：</span>
      <span>{{selectedTopic}}</span>
    </div>
  </div>
</template>

<script>
import { TOPIC_COLOR } from '../utils/constant.js'
export default {
  name: 'component_name',
  data() {
    return {
      sliderData: TOPIC_COLOR.map((d, i) => ({
        color: d,
        value: 0,
        topicId: i,
        isSelected: false
      })),
      selectedTopic: null
    }
  },
  methods: {
    legendClickHandler(selectedTopic) {
      this.sliderData
        .filter(d => d !== selectedTopic)
        .forEach(d => (d.isSelected = false))
      selectedTopic.isSelected = true
      this.$bus.$emit('topic-selected', selectedTopic.topicId)
      this.selectedTopic = selectedTopic.topicId
    },
    globalClickHandler() {
      console.log('global click')
    },
    resetBtnClickHandler() {
      this.sliderData.forEach(d => (d.isSelected = false))
      this.$bus.$emit('topic-selected', -1)
      this.selectedTopic = null
    }
  }
}
</script>

<style lang="less">
.radar-control-panel {
  display: flex;
  flex-direction: column;
  padding: 0 10px;
  .topic-slider-control-panel {
    flex: 1;
    overflow: scroll;
    // border-bottom: 1px solid black;
    .slider-control-wrapper {
      display: flex;
      align-items: center;
      .cluster-idx {
        // flex:none;
        flex: 0 0 20px;
        text-align: right;
        margin-right: 10px;
      }
      .legend {
        width: 40px;
        height: 10px;
        flex: none;
        margin-right: 15px;
        &.selected {
          border: 1px solid black;
        }
      }
      .topic-slider {
        width: 50%;
      }
    }
    .reset-btn {
      width: 100%;
    }
  }
  .dominant-topic-control-panel {
    margin: 10px;
    flex: none;
    border-top: 1px solid black;
    padding-top: 5px;
    .title {
      font-weight: bold;
    }
  }
}
</style>