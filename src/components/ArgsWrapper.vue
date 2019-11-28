<template>
  <div class='args-wrapper' ref='root'>
    <div class='select'>
      <div class='select-wrapper'>
        <div class='title'>library</div>
          <el-select v-model="libraryName" size="mini"
            placeholder="please select"
            @change="selectLibraryTrigger(libraryName)"> 
            <el-option
              v-for="item in libraries"
              :key="item.value"
              :value="item.label"
              :label="item.label">
            </el-option>
          </el-select>
      </div>
      <div class='select-wrapper'>
        <div class='title'>cur-version</div>
          <el-select v-model="curVersion" size="mini"
            placeholder="please select"
            @change="selectCurTrigger(curVersion)"> 
            <el-option
              v-for="item in curOptions"
              :key="item.value"
              :value="item.label"
              :label="item.label">
            </el-option>
          </el-select>
      </div>
      <div class='select-wrapper'>
        <div class='title'>pre-version</div>
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
    </div>
    <div class='button'>
      <!-- <el-button size="mini">extract</el-button> -->
      <el-button size="mini"
        :disabled="disabled"
        @click="compareTrigger">compare</el-button>
    </div>
    <div class='input'>
      <div class='input-wrapper'>
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
      curVersion: '',
      preVersion: '',
      libraryName: 'Vue',
      curOptions: [],
      preOptions: [],
      libraries: [{value: 0, label: 'Vue'}, {value: 1, label: 'D3'}],
      disabled: true
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
      selectCurTrigger(val){
        this.preOptions = []
        let id = this.versions.indexOf(val)
        this.versions
          .slice(0, id)
          .forEach((d, i) =>{
            this.preOptions.push({value: i, label: d})
        })
        this.preOptions.sort(function(a, b){
          return b.value - a.value
        })
      },
      selectLibraryTrigger(val){
        this.libraryName = val
        this.$bus.$emit('library-selected', this.libraryName)
      },
      compareTrigger(){
        if(this.preVersion&&this.curVersion)
          this.$bus.$emit('version-range-selected', {curv: this.curVersion, prev: this.preVersion})
      }
  },
  watch:{
    threshold_val(){
      this.threshold = this.threshold_val/100
    },
    eps_val(){
      this.eps = this.eps_val/100
    }
  },
  created () {
    const requiredData = ['versions']
    let cnt = 0
    requiredData.forEach(d => {
      this.$watch(d, val => {
        if (val) cnt++
        if (cnt === requiredData.length)
          this.versions.forEach((d, i) => {
            this.preOptions.push({value: i, label: d })
            this.curOptions.push({value: i, label: d })
          })
      })
    })
    this.$bus.$on('version-selected', d => {
      this.curVersion = d.version
      this.selectCurTrigger(d.version)
      let i = this.versions.indexOf(d.version)
      if( i === 0){
        this.preVersion = ''
        this.disabled = true
      }
      else{
        this.preVersion = this.versions[i-1]
        this.disabled = false
      }
    })
    this.$bus.$on('version-restored', d=>{
      this.preVersion = ''
      this.curVersion = ''
      this.disabled = true
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
    .select{
      flex: 4;
      display: flex;
      flex-direction: column;
      .select-wrapper{
        margin-top: 10px;
        .title{
          margin-left: 13px;
        }
        .el-input{
          margin: 5px 13px 0 10px;
          width: 93%;
        }
      }
    }
    .button{
      flex: 1;
      margin-top: 10px;
      border-bottom: 5px solid rgba(66, 66, 66, 0.1);
      .el-button--mini, .el-button--small{
        margin-top: 3px;
        margin-left: 10px;
        font-size: 14px;
        width: 87%;
      }
    }
    .input{
      margin-top: 10px;
      margin-bottom: 10px;
      flex: 2;
      display: flex;
      flex-direction: column;
      .input-wrapper{
        .title{
          margin-left: 11px;
        }
        .slider-input{
          display: flex;
          .el-slider{
            flex: 1;
            margin: 0 10px 0 10px;
            .el-slider__button {
              width: 6.5px;
              height: 6.5px;
              border: 1.5px solid rgb(194, 194, 194);
            }
            .el-slider__runway{
              margin-top: 5px;
              margin-bottom: 5px;
              height: 5px;
            }
            .el-slider__bar {
              background-color: rgb(194, 194, 194); 
              height: 5px;
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
    }
}
</style>
