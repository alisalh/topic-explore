<template>
  <div class="args-wrapper" ref="root">
    <div class="select">
      <div class="select-wrapper">
        <div class="title">library</div>
        <el-select
          v-model="libraryName"
          size="mini"
          placeholder="please select"
          @change="selectLibTrigger(libraryName)"
        >
          <el-option
            v-for="item in libraries"
            :key="item.value"
            :value="item.label"
            :label="item.label"
          ></el-option>
        </el-select>
      </div>
      <div class="select-wrapper">
        <div class="title">cur-version <i class="fa fa-undo" @click="resetCurTrigger"></i> </div>
        <el-select
          v-model="curVersion"
          size="mini"
          filterable
          placeholder="please select"
          @change="selectCurTrigger(curVersion)"
        >
          <el-option
            v-for="item in curOptions"
            :key="item.value"
            :value="item.label"
            :label="item.label"
          ></el-option>
        </el-select>
      </div>
      <div class="select-wrapper">
        <div class="title">pre-version <i class="fa fa-undo" @click="resetPreTrigger"></i> </div>
        <el-select
          v-model="preVersion"
          size="mini"
          filterable
          placeholder="please select"
          @change="selectPreTrigger(preVersion)"
        >
          <el-option
            v-for="item in preOptions"
            :key="item.value"
            :value="item.label"
            :label="item.label"
          ></el-option>
        </el-select>
      </div>
    </div>
    <div class="button">
      <el-button size="mini" :disabled="disabled" @click="compareTrigger">compare</el-button>
    </div>
  </div>
</template>

<script>
export default {
  name: "component_name",
  data() {
    return {
      curVersion: "",
      preVersion: "",
      libraryName: "vue",
      curOptions: [],
      preOptions: [],
      libraries: [{ value: 0, label: "vue" }, { value: 1, label: "d3" }],
      disabled: true,
      docTopics: null,
      fileData: null,
      curNormData: null
    };
  },
  props: ["versions"],
  methods: {
    // version选中事件
    selectCurTrigger(val) {
      this.curVersionSelected(val)
      this.$bus.$emit('curVersion-selected', val)
    },
    curVersionSelected(val){
      this.preOptions = [];
      this.curVersion = val;
      let id = this.versions.indexOf(val);

      // 设置preVersion的options
      if(id != 0){
        this.versions.slice(0, id).forEach((d, i) => {
          this.preOptions.push({ value: i, label: d });
        });
        this.preOptions.sort(function(a, b) {
          return b.value - a.value;
        });
        // 当前显示的preVersion
        this.preVersion = this.versions[id-1];
        this.disabled = false;
      }
      else{
        this.preVersion = ''
        this.disabled = true
      }
    },

    // lib选中事件
    selectLibTrigger(val) {
      this.libraryName = val;
      // this.$bus.$emit("library-selected", this.libraryName);
    },

    // 版本比较事件
    compareTrigger() {
      console.log('preVersion:', this.preVersion, 'curVersion:', this.curVersion)
    },
    
    // version重置事件
    resetCurTrigger(){
      this.curVersionReseted()
      this.$bus.$emit('curVersion-reseted', null)
    },
    curVersionReseted(){
      this.curVersion = ''
      this.preVersion = ''
      this.disabled = true
    },
    resetPreTrigger(){
      this.preVersion = ''
      this.disabled = true
      this.$bus.$emit('preVersion-reseted', null)
    }
  },
  watch: {
    
  },
  created() {
    const requiredData = ["versions"];
    let cnt = 0;
    requiredData.forEach(d => {
      this.$watch(d, val => {
        if (val) cnt++;
        if (cnt === requiredData.length)
          this.versions.forEach((d, i) => {
            this.preOptions.push({ value: i, label: d });
            this.curOptions.push({ value: i, label: d });
          });
      });
    });

    // lineChart响应事件
    this.$bus.$on("lineVersion-selected", d => {
      this.curVersionSelected(d);
    });
    this.$bus.$on("lineVersion-reseted", d => {
      this.curVersionReseted();
    });
  }
};
</script>

<style lang="less">
.args-wrapper {
  height: 100%;
  font-size: 14px;
  display: flex;
  flex-direction: column;
  .fa-undo{
    margin-left: 130px;
    font-size: 12px;
    color: gray;
  }
  .select {
    flex: 3.5;
    display: flex;
    flex-direction: column;
    .select-wrapper {
      margin-top: 5px;
      .title {
        margin-left: 13px;
      }
      .el-input {
        margin: 5px 13px 0 10px;
        width: 97%;
      }
    }
  }
  .button {
    flex: 1;
    margin-top: 15px;
    .el-button--mini,
    .el-button--small {
      margin-top: 3px;
      margin-left: 10px;
      font-size: 14px;
      width: 87%;
    }
  }
}
</style>
