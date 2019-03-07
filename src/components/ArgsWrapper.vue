<template>
  <div class='args-wrapper'
       ref='root'>
  <div class='th-input-wrapper'>
    <div class='title'>threshold</div>
    <div class='slider-input'>
      <el-slider v-model="threshold_val" 
        :format-tooltip="formatTooltip"
        @change="sendThreshold"></el-slider>
      <el-input v-model="threshold" size="mini"></el-input>
    </div>
  </div>
  <div class='sam-input-wrapper'>
    <div class='title'>min_samples</div>
    <div class='slider-input'>
      <el-slider v-model="min_samples"
        :step="1"
        :min='2'
        :max="10"
        @change="sendMinSamples"></el-slider>
      <el-input v-model="min_samples" size="mini"></el-input>
    </div>
  </div>
  <div class='eps-input-wrapper'>
    <div class='title'>eps</div>
    <div class='slider-input'>
      <el-slider v-model="eps_val"
        :format-tooltip="formatTooltip"
        @change="sendEps"></el-slider>
      <el-input v-model="eps" size="mini"></el-input>
    </div>
  </div>
  <div class="radio-wrapper">
    <div class='title'>code</div>
    <div class='radios'>
      <el-radio v-model="radio" label="1" size="mini">show</el-radio>
      <el-radio v-model="radio" label="2" size="mini">hidden</el-radio>
    </div>
  </div>
  </div>
</template>

<script>
export default {
  name: 'component_name',
  data() {
    return{
      threshold_val: 10,
      threshold: 0.1,
      min_samples: 2,
      eps_val: 5,
      eps: 0.05,
      radio: '2'
    }
  },
  methods: {
      formatTooltip(val) {
        return val / 100
      },
      sendThreshold(){
        this.threshold = this.threshold_val/100
        this.$bus.$emit('threshold-selected', this.threshold)
      },
      sendMinSamples(){
        this.$bus.$emit('min-samples-selected', this.min_samples)
      },
      sendEps(){
        this.$bus.$emit('eps-selected', this.eps)
      }
  },
  watch:{
    threshold_val(){
      this.threshold = this.threshold_val/100
    },
    // min_samples(){
    //   this.$bus.$emit('min-samples-selected', this.min_samples)
    // },
    eps_val(){
      this.eps = this.eps_val/100
    },
    radio(){
      this.$bus.$emit('code-radio-selected', this.radio)
    }
  }
}
</script>

<style lang="less">
.args-wrapper{
    height: 100%;
    font-size: 14px;
    display: flex;
    flex-direction: column;
    .th-input-wrapper,
    .sam-input-wrapper,
    .eps-input-wrapper{
      margin-top: 10px;
      .title{
        margin-left: 10px;
      }
      .slider-input{
        display: flex;
        .el-slider{
          flex: 1;
          margin-right: 10px;
          margin-left: 10px;
          .el-slider__button {
            width: 10px;
            height: 10px;
          }
        }
        .el-input{
          flex: 0.3;
          .el-input__inner {
            width: 80%;
            padding: 0 2px;
          }
        }
      }
    }
    .radio-wrapper{
      display: flex;
      flex-direction: column;
      .title{
        margin-left: 10px;
        margin-top: 10px;
      }
      .radios{
        margin-top: 10px;
        margin-left: 20px;
      }
    }
}
</style>
