<template>
  <div id="app">
    <div class="left-panel">
      <args-wrapper 
        class="bl-card-shadow" 
        :versions="versions" 
        style="flex-shrink: 0"
      ></args-wrapper>
      <topic-bar
        class="bl-card-shadow"
        :topicsGroup="topicsGroup"
        :versions="versions"
        :topicNum="topicNum"
        style="flex-shrink: 0"
      ></topic-bar>
      <word-cloud 
        class="bl-card-shadow"
        :topicData="topicData"
        :topicColormap="topicColormap"
      ></word-cloud>
    </div>
    <div class="center-panel">
      <div class="first-row bl-card-shadow">
        <line-chart
          :topicColormap="topicColormap"
          :topicsGroup="topicsGroup"
          :versions="versions"
          :normData="normData"
        ></line-chart>
      </div>
      <div class="second-row bl-card-shadow">
        <file-tree
          :topicColormap="topicColormap"
          :docData="docVerData&&docVerData.files"
        ></file-tree>
        <div class="cluster">
          <scatter-plot
            :docData="docVerData&&docVerData.files"
            :topicColormap="topicColormap"
          ></scatter-plot>
          <parallel-coordinates
            :topicNum="topicNum"
            :topicColormap="topicColormap"
          >
          </parallel-coordinates>
        </div>
      </div>
    </div>
    <div class="right-panel bl-card-shadow">
      <code-wrapper></code-wrapper>
    </div>
  </div>
</template>

<script>
import * as d3 from "d3";
import _ from "lodash";
import LineChart from "./components/LineChart.vue";
import FileTree from "./components/FileTree.vue";
import WordCloud from './components/WordCloud.vue'
import TopicBar from "./components/TopicBar.vue";
import ScatterPlot from "./components/ScatterPlot.vue";
import CodeWrapper from "./components/CodeWrapper.vue";
import ArgsWrapper from "./components/ArgsWrapper.vue";
import ParallelCoordinates from "./components/ParallelCoordinates.vue";
import { TOPIC_COLOR } from "./utils/constant.js";
import { groupBy, getVersion, getRelPath } from "./utils/index.js";
export default {
  name: "app",
  data() {
    return {
      topicNum: 0,
      topicData: null,
      docVerData: null,
      topicsGroup: null,
      fileGroup: null,
      prevVer: null,
      prevDocs: null,
      normData: null,
      editFileIds: null,
      libraryName: "vue",
      flag: false, // true向后台请求数据
    };
  },
  components: {
    LineChart,
    FileTree,
    WordCloud,
    TopicBar,
    ScatterPlot,
    CodeWrapper,
    ArgsWrapper,
    ParallelCoordinates
  },
  computed: {
    topicColormap() {
      if (this.topicData === null) return null;
      const domain = Array(this.topicData.length)
        .fill(null)
        .map((d, i) => i);
      return d3
        .scaleOrdinal()
        .domain(domain)
        .range(TOPIC_COLOR);
    },
    versions() {
      if (this.docVerData) return this.docVerData.versions;
      return null;
    }
  },
  watch: {
    flag() {
      if (this.flag) {
        this.$axios.get("topics/getTopicData", {}).then(({ data }) => {
          this.topicData = data;
          this.topicNum = data.length
          console.log('topicNum:', this.topicNum)
          console.log('topicData:', this.topicData)
        });
        this.$axios.get("topics/getAllDocs", {}).then(({ data }) => {
          this.docVerData = data;   //包含file信息和version信息
          console.log("docData:", this.docVerData.files)
          this.topicsGroup = this.getTopicsGroup(this.docVerData.files);
          console.log('topicsGroup:', this.topicsGroup)
        });
        this.$axios.get("topics/getNormOfDiffVecs", {}).then(({ data }) => {
          this.normData = data;
          console.log('normData:', this.normData)
        });
      }
    }
  },
  methods: {
    // 版本排序
    verCompare({ key: a }, { key: b }) {
      let arr = a.split(".").map(d => parseInt(d));
      let brr = b.split(".").map(d => parseInt(d));
      for (let i = 0, len = arr.length; i < len; i++) {
        if (arr[i] < brr[i]) {
          return -1;
        } else if (arr[i] > brr[i]) {
          return 1;
        }
      }
    },
    // 按照主题对文件进行分组
    getTopicsGroup(rawData) {
      rawData.forEach(d => (d["main_topic"] = parseInt(d["main_topic"])));
      let topicsGroup = groupBy(rawData, "main_topic");                                  //按主题分类文件
      let verReg = new RegExp(this.libraryName + "-(\\d*\\.\\d*\\.\\d*)");

      topicsGroup.forEach(topic => {
        topic.val = groupBy(topic.val, d => d.filename.match(verReg)[1]).sort(this.verCompare);  //按版本分类文件   
        let minVer = topic.val[0].key, 
          maxVer = topic.val[topic.val.length - 1].key,
          verNum = this.versions.length
        
        // 缺少版本数据
        if(topic.val.length != verNum){
          let start = this.versions.indexOf(minVer),
            end = this.versions.indexOf(maxVer)
          for(let i=start+1; i<=end-1; i++){
            let curVer = this.versions[i]
            if(!topic.val.find(ver => ver.key == curVer)){
              topic.val.push({key: curVer, val: []});
            }
          }
        }

        topic.val = topic.val.sort(this.verCompare);
      });
      return topicsGroup;
    }
  },
  created() {
    this.$bus.$on("library-selected", lib => {
      this.libraryName = lib;
      this.$axios
        .get("topics/getLibName", { libName: this.libraryName })
        .then(({ data }) => {
          if (data.flag) this.flag = true;
        });
    });
    this.$axios
      .get("topics/getLibName", { libName: this.libraryName })
      .then(({ data }) => {
        if (data.flag) this.flag = true;
      });
  }
};
</script>

<style lang="less">
html {
  height: 100%;
  body {
    height: 90%;
  }
}
#app {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  -moz-user-select: none;
  -khtml-user-select: none;
  user-select: none;
  height: 100%;
  width: 100%;
  color: #2c3e50;
  display: flex;
  .left-panel {
    height: 100%;
    flex: 1;
    margin-right: 3px;
    display: flex;
    flex-direction: column;
    .args-wrapper {
      flex: 1;
    }
    .topic-bar {
      margin-top:3px;
      flex: 2;
    }
    .word-cloud{
      margin-top: 3px;
      flex: 1;
    }
  }
  .center-panel {
    margin-right: 3px;
    display: flex;
    flex-direction: column;
    flex: 5;
    .first-row {
      flex: 1;
    }
    .second-row {
      flex: 1.3;
      display: flex;
      margin-top: 3px;
      overflow: auto;
      box-shadow: 0 2px 12px 0 rgba(0, 0, 0, .1);
      .file-tree {
        flex: 1.2;
        border-right: 5px solid #ececec;
        box-shadow: 0 0 0 0 rgba(0, 0, 0, .2);
      }
      .cluster {
        flex: 1;
        display: flex;
        flex-direction: column;
        .scatter-plot{
          flex: 1.5;
        }
        .parallel-coordinates{
          flex: 1;
        }
      }
    }
  }
  .right-panel {
    display: flex;
    flex-direction: column;
    flex: 2;
    overflow: auto;
    .code-wrapper {
      flex: 1.5;
    }
    .parallel-coordinates {
      flex: 1;
    }
  }
}
</style>
