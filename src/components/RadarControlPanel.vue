<template>
  <div class='radar-control-panel'>
    <div class="topic-slider-control-panel">
      <div v-for="item in sliderData"
           class='slider-control-wrapper'>
        <div class="legend"
             :style="{background:item.color}">
        </div>
        <el-slider v-model="item.value"
                   :min="0"
                   :max="1"
                   class='topic-slider'
                   :step="0.1"></el-slider>
      </div>
    </div>
    <hr class='divide-line' />
    <div class="dominant-topic-control-panel">
      <span class="title">Dominant Topic：</span>
      <span>null</span>
    </div>
  </div>
</template>

<script>
import { TOPIC_COLOR } from '../utils/constant.js'
export default {
  name: 'component_name',
  data () {
    return {
      sliderData: TOPIC_COLOR.map(d => ({
        color: d,
        value: 0
      }))
    }
  }
}
</script>

<style lang="less">
.radar-control-panel {
  padding: 0 10px;
  .topic-slider-control-panel {
    flex: 1;
    .slider-control-wrapper {
      display: flex;
      align-items: center;
      .legend {
        width: 50px;
        height: 10px;
        flex: none;
        margin-right: 15px;
      }
      .topic-slider {
        width: 50%;
      }
    }
  }
  .dominant-topic-control-panel {
    flex: none;
    .title {
      font-weight: bold;
    }
  }
}
</style>