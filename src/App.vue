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
      ></word-cloud>
    </div>
    <div class="center-panel">
      <div class="first-row">
        <line-chart
          :topicColormap="topicColormap"
          :topicsGroup="topicsGroup"
          :versions="versions"
          :normData="normData"
          class="bl-card-shadow"
        ></line-chart>
      </div>
      <div class="second-row">
        <sunburst
          :topicColormap="topicColormap"
          :docData="docVerData&&docVerData.files"
          :versions="versions"
          class="bl-card-shadow"
        ></sunburst>
        <scatter-plot
          :topicColormap="topicColormap"
          :docData="docVerData&&docVerData.files"
          :topicData="topicData"
          class="bl-card-shadow"
        ></scatter-plot>
      </div>
    </div>
    <div class="right-panel">
      <!-- <word-cloud :topicData="topicData" class="bl-card-shadow"></word-cloud> -->
      <code-wrapper class="bl-card-shadow"></code-wrapper>
      <parallel-coordinates
        :topicColormap="topicColormap"
        :docData="docVerData&&docVerData.files"
        :topicData="topicData"
        class="bl-card-shadow"
      ></parallel-coordinates>
    </div>
    <aspect-tip
      :topicColormap="topicColormap"
      :topicData="topicData"
      :docData="docVerData&&docVerData.files"
      class="bl-card-shadow"
    ></aspect-tip>
  </div>
</template>

<script>
import * as d3 from "d3";
import _ from "lodash";
import LineChart from "./components/LineChart.vue";
import Sunburst from "./components/SunBurst.vue";
import WordCloud from './components/WordCloud.vue'
import TopicBar from "./components/TopicBar.vue";
import ScatterPlot from "./components/ScatterPlot.vue";
import CodeWrapper from "./components/CodeWrapper.vue";
import ArgsWrapper from "./components/ArgsWrapper.vue";
import AspectTip from "./components/AspectTip.vue";
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
      docTopics: null
    };
  },
  components: {
    LineChart,
    Sunburst,
    WordCloud,
    TopicBar,
    ScatterPlot,
    CodeWrapper,
    ArgsWrapper,
    AspectTip,
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
          this.docVerData = data;
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
    /**
     * 根据选中的版本获取将文件分为：修改的、新增的、删除的
     */
    groupFileByStatus(curVer) {
      const docs = this.docVerData.files;
      const versions = this.docVerData.versions;
      const prevVer = this.getRelVersion(versions, curVer, -1);
      const curDocs = docs.filter(d => getVersion(d.filename) === curVer);
      this.prevDocs = docs.filter(d => getVersion(d.filename) === prevVer);
      this.prevVer = prevVer;
      let addDocs = _.differenceBy(curDocs, this.prevDocs, d =>
        getRelPath(d["filename"], this.libraryName)
      );
      let delDocs = _.differenceBy(this.prevDocs, curDocs, d =>
        getRelPath(d["filename"], this.libraryName)
      );
      // 同名文件视为编辑状态
      const editDocsObj = _.groupBy(this.prevDocs.concat(curDocs), d =>
        getRelPath(d["filename"], this.libraryName)
      );
      return {
        addDocs,
        delDocs,
        editDocsObj
      };
    },
    getRelVersion(versions, curVer, step) {
      const idx = versions.indexOf(curVer);
      return versions[idx + step];
    },
    // 版本排序
    verCompare({ key: a }, { key: b }) {
      // console.log(a)
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
      let topicsGroup = groupBy(rawData, "main_topic");
      let verReg = new RegExp(this.libraryName + "-(\\d*\\.\\d*\\.\\d*)");
      var minTopic = [], maxTopic = [];
      topicsGroup.forEach(d => {
        d.val = groupBy(d.val, d => d.filename.match(verReg)[1]).sort(this.verCompare);
        minTopic.push({key: d.val[0].key});
        maxTopic.push({key: d.val[d.val.length - 1].key});
      });
      for (let ii = 0; ii < this.versions.length; ii++) {
        var version = {key: this.versions[ii]};
        var index = 0;
        topicsGroup.forEach(node => {
          if (
            this.verCompare(version, minTopic[index]) == 1 &&
            this.verCompare(version, maxTopic[index]) == -1
          ) {
            var flag = false;
            for (let i = 0; i < node.val.length; i++) {
              if (node.val[i].key == version.key) {
                flag = true;
                break;
              }
            }
            if (!flag) {
              var obj = { key: version.key, val: [] };
              node.val.push(obj);
            }
          }
          index++;
        });
      }
      topicsGroup.forEach(d => {
        d.val = d.val.sort(this.verCompare);
      });
      return topicsGroup;
    }
  },
  created() {
    // this.$bus.$on('version-selected', selectedVer => {
    //   this.fileGroup = this.groupFileByStatus(selectedVer)
    // })
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
      margin-top: 5px;
      overflow: auto;
      .sunburst {
        flex: 1.5;
        margin-right: 3px;
      }
      .scatter-plot {
        flex: 1;
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
