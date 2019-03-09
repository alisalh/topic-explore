<template>
  <div class='args-wrapper'
       ref='root'>
  <div class='select-wrapper'>
    <div class='title'>previous version</div>
      <el-select v-model="preVersion" size="mini"
        placeholder="please select"
        @change="selectPreTrigger(preVersion)">
        <el-option
          v-for="item in preOptions"
          :key="item.value"
          :value="item.label"
          :label="item.label">
        </el-option>
      </el-select>
  </div>
  <div class='select-wrapper'>
    <div class='title'>current version</div>
      <el-select v-model="curVersion" size="mini"
        placeholder="please select"
        @change="selectCurTrigger()"> 
        <el-option
          v-for="item in curOptions"
          :key="item.value"
          :value="item.label"
          :label="item.label">
        </el-option>
      </el-select>
  </div>
  <div class='input-wrapper th'>
    <div class='title'>threshold</div>
    <div class='slider-input'>
      <el-slider v-model="threshold_val" 
        :format-tooltip="formatTooltip"
        @change="sendThreshold"></el-slider>
      <el-input v-model="threshold" size="mini"></el-input>
    </div>
  </div>
  <div class='input-wrapper'>
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
  <div class='input-wrapper'>
    <div class='title'>eps</div>
    <div class='slider-input'>
      <el-slider v-model="eps_val"
        :format-tooltip="formatTooltip"
        @change="sendEps"></el-slider>
      <el-input v-model="eps" size="mini"></el-input>
    </div>
  </div>
  <!-- <div class="radio-wrapper">
    <div class='title'>code</div>
    <div class='radios'>
      <el-radio v-model="radio" label="1" size="mini">show</el-radio>
      <el-radio v-model="radio" label="2" size="mini">hidden</el-radio>
    </div>
  </div> -->
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
      curVersion: '',
      preVersion: '',
      // radio: '2'
      curOptions: [],
      preOptions: []
    }
  },
  props: ['versions'],
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
      },
      selectPreTrigger(val){
        this.curOptions = []
        let id = this.versions.indexOf(val)+1
        this.versions
          .slice(id, -1)
          .forEach((d, i) =>{
            this.curOptions.push({value: i, label: d})
          })
      },
      selectCurTrigger(){
        this.$bus.$emit('version-range-selected', {curv: this.curVersion, prev: this.preVersion})
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
    // radio(){
    //   this.$bus.$emit('code-radio-selected', this.radio)
    // }
  },
  created () {
    const requiredData = ['versions']
    let cnt = 0
    requiredData.forEach(d => {
      this.$watch(d, val => {
        if (val) cnt++
        if (cnt === requiredData.length) {
          this.versions.forEach((d, i) => {
            this.preOptions.push({value: i, label: d })
          })
        }
      })
    })
  }
}
</script>

<style lang="less">
.args-wrapper{
    height: 100%;
    font-size: 14px;
    display: flex;
    flex-direction: column;
    .select-wrapper{
      margin-top: 10px;
      .title{
        margin-left: 10px;
      }
      .el-input{
        margin: 5px 10px 0 10px;
        width: 93%;
      }
    }
    .input-wrapper{
      margin-top: 5px;
      .title{
        margin-left: 10px;
      }
      .slider-input{
        display: flex;
        .el-slider{
          flex: 1;
          margin: 0 10px 0 10px;
          .el-slider__button {
            width: 8px;
            height: 8px;
          }
          .el-slider__runway{
            margin-top: 5px;
            margin-bottom: 5px;
          }
        }
        .el-input{
          flex: 0.3;
          .el-input__inner {
            width: 80%;
            height: 20px;
            padding: 0 2px;
          }
        }
      }
    }
    .th{
      margin-top: 10px;
    }
    // .radio-wrapper{
    //   display: flex;
    //   flex-direction: column;
    //   .title{
    //     margin-left: 10px;
    //     margin-top: 10px;
    //   }
    //   .radios{
    //     margin-top: 10px;
    //     margin-left: 20px;
    //   }
    // }
}
</style>
