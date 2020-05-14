<template>
  <div class="scatter-plot" ref="root"></div>
</template>

<script>
import * as d3 from "d3";
import { CLUSTER_COLOR } from "../utils/constant.js";

export default {
  name: "component_name",
  data() {
    return {
      height: 0,
      width: 0,
      clusterNum: 0,
      diffDocs: null,
      docTopics: null,
      diffDocVecs: null,
      fileData: null,
      curDocTopics: null,
      curNormData: null,
      min_samples: 2,
      eps: 0.07,
      threshold: 0.1,
      // markerG: null,
      selectedCluster: null,
      chartData: null,
      dom_args: null,
      allCircle: null,
      xScale: null,
      yScale: null,
      percentSum: null,
      topicNum: 0,
      maxVal: 0,
      drawArea: false,
      click_circle: null
    };
  },
  props: ["topicColormap", "docData", "topicData"],

  created() {
    const requiredData = ["topicColormap", "docData", "topicData"];
    let cnt = 0;
    requiredData.forEach(d => {
      this.$watch(d, val => {
        if (val) cnt++;
        if (cnt === requiredData.length) {
        }
      });
    });

    // this.$bus.$on("version-range-selected", d => {
    //   this.diffDocs = d.diffDocs;
    // });

    // this.$bus.$on("get-doc-topic", d => {
    //   this.docTopics = d.docTopics;
    //   this.fileData = d.fileData;
    //   this.curNormData = d.curNormData;
    // });

    // this.$bus.$on("topic-selected", d => {
    //   console.log(this.chartData);
    //   if (d == -1) {
    //     this.resetStatus();
    //   } else {
    //     this.highlightMarker(d);
    //   }
    // });
  },
  watch: {
    diffDocs() {
      // 监测差异数据有无变化
      // 需要一个数据处理函数，根据差异文件计算向量
      // 需要一个函数去获取类，参考getCluster
      // 绘制
      this.getCluster();
    }
  },
  mounted() {
    this.dom_args = this.$refs.root.getBoundingClientRect();
    this.height = Math.floor(this.$refs.root.clientHeight);
    this.width = Math.floor(this.$refs.root.clientWidth);

    // 放在compare的响应事件中
    this.$bus.$on("version-range-selected", d => {
      this.diffDocs = d.diffDocs;
    });

    this.$bus.$on("get-doc-topic", d => {
      this.docTopics = d.docTopics;
      this.fileData = d.fileData;
      this.curNormData = d.curNormData;
    });
  },
  methods: {
    getCluster() {
      this.curDocTopics = this.getDocTopicsByID(
        this.docTopics,
        this.diffDocs,
        this.curNormData
      );
      console.log(this.curDocTopics);

      this.$axios
        .post("http://localhost:8000/topic/getClusterDrInfo", {
          diffDocs: this.diffDocs,
          threshold: this.threshold,
          min_samples: this.min_samples,
          eps: this.eps,
          docTopics: this.curDocTopics
        })
        .then(({ data }) => {
          console.log(data);
          this.getChartData(data["data"]);
          this.drawData(this.chartData);
        });
    },
    getDocTopicsByID(docTopics, diffDocs, curNormData) {
      var id = [];
      var types = [];
      var newDocTopics = [];
      var addDocTopics = [];
      var delDocTopics = [];
      var editDocTopics = [];
      this.diffDocVecs = [];
      var editIds = [];
      console.log(diffDocs);
      for (let i = 0; i < diffDocs["edit"].length; i++) {
        editIds.push(diffDocs["edit"][i][1]);
        editIds.push(diffDocs["edit"][i][0]);
        var sum = 0;
        for (let j = 0; j < docTopics[diffDocs["edit"][i][1]].length; j++) {
          sum += Math.pow(
            docTopics[diffDocs["edit"][i][1]][j] -
              docTopics[diffDocs["edit"][i][0]][j],
            2
          );
        }
        sum = Math.sqrt(sum);
        if (sum > this.threshold) {
          id.push(diffDocs["edit"][i][1]);
          types.push("edit");
          var vec = [];
          for (let j = 0; j < docTopics[diffDocs["edit"][i][1]].length; j++) {
            vec.push(
              docTopics[diffDocs["edit"][i][1]][j] -
                docTopics[diffDocs["edit"][i][0]][j]
            );
          }
          editDocTopics.push(vec);
          this.diffDocVecs.push(vec);
        }
      }
      for (let i = 0; i < diffDocs["add"].length; i++) {
        if (editIds.indexOf(diffDocs["add"][i]) == -1) {
          if (curNormData[diffDocs["add"][i]] > this.threshold) {
            id.push(diffDocs["add"][i]);
            types.push("add");
            addDocTopics.push(docTopics[diffDocs["add"][i]]);
            this.diffDocVecs.push(docTopics[diffDocs["add"][i]]);
          }
        }
      }
      for (let i = 0; i < diffDocs["del"].length; i++) {
        if (editIds.indexOf(diffDocs["del"][i]) == -1) {
          if (curNormData[diffDocs["del"][i]] > this.threshold) {
            id.push(diffDocs["del"][i]);
            types.push("del");
            var vec = [];
            for (let j = 0; j < docTopics[diffDocs["del"][i]].length; j++) {
              vec.push(-docTopics[diffDocs["del"][i]][j]);
            }
            delDocTopics.push(vec);
            this.diffDocVecs.push(vec);
          }
        }
      }
      newDocTopics.push(addDocTopics);
      newDocTopics.push(delDocTopics);
      newDocTopics.push(editDocTopics);
      return { id: id, curDocTopics: newDocTopics, types: types };
    },
    getChartData(data) {
      var list = [];
      console.log(data);
      for (let i = 0; i < data.length; i++) {
        var id_ = this.curDocTopics["id"][data[i]["index"]];
        var object = {
          x: data[i]["x"],
          y: data[i]["y"],
          id: id_,
          type: this.curDocTopics["types"][data[i]["index"]],
          topic: this.fileData[id_]["main_topic"],
          cluster: data[i]["cluster"]
        };
        list.push(object);
      }
      this.chartData = list;
      console.log(this.chartData);
    },
    drawData(data) {
      this.$refs.root.innerHTML = "";
      const margin = { top: 60, right: 10, bottom: 30, left: 10 };
      const height = this.height;
      const width = this.width;
      const svg = d3
        .select(this.$refs.root)
        .append("svg")
        .attr("width", width)
        .attr("height", height);

      var x = d3
        .scaleLinear()
        .domain(d3.extent(data, d => d.x))
        .nice()
        .range([margin.left, width - margin.right]);

      var y = d3
        .scaleLinear()
        .domain(d3.extent(data, d => d.y))
        .nice()
        .range([height - margin.bottom, margin.top]);

      var xAxis = g =>
        g
          .attr("transform", `translate(0,${height - margin.bottom})`)
          .call(g => g.select(".domain").remove())
          .call(
            g =>
              g
                .append("text")
                .attr("x", width)
                .attr("y", margin.bottom - 4)
                .attr("fill", "currentColor")
            //.attr("text-anchor", "end")
            //.text(data.x)
          );

      var yAxis = g =>
        g
          .attr("transform", `translate(${margin.left},0)`)
          .call(g => g.select(".domain").remove())
          .call(
            g =>
              g
                .append("text")
                .attr("x", -margin.left)
                .attr("y", 10)
                .attr("fill", "currentColor")
            //.attr("text-anchor", "start")
            //.text(data.y)
          );
      // var grid = g =>
      //   g
      //     .attr("stroke", "currentColor")
      //     .attr("stroke-opacity", 0.1)
      //     .call(g =>
      //       g
      //         .append("g")
      //         .selectAll("line")
      //         .data(x.ticks())
      //         .join("line")
      //         .attr("x1", d => 0.5 + x(d))
      //         .attr("x2", d => 0.5 + x(d))
      //         .attr("y1", margin.top)
      //         .attr("y2", height - margin.bottom)
      //     )
      //     .call(g =>
      //       g
      //         .append("g")
      //         .selectAll("line")
      //         .data(y.ticks())
      //         .join("line")
      //         .attr("y1", d => 0.5 + y(d))
      //         .attr("y2", d => 0.5 + y(d))
      //         .attr("x1", margin.left)
      //         .attr("x2", width - margin.right)
      //     );

      // svg.append("g").call(xAxis);

      // svg.append("g").call(yAxis);

      // svg.append("g").call(grid);

      const markerSize = 3;
      // 圆形(删除文件)
      svg
        .append("defs")
        .append("g")
        .attr("id", "marker-circle")
        .append("circle")
        .attr("r", markerSize)
        .style("stroke", "#999494")
        .attr("stroke-width", "1");

      // 正方形(增加文件)
      svg
        .append("defs")
        .append("g")
        .attr("id", "marker-square")
        .append("rect")
        .attr("width", markerSize * 2)
        .attr("height", markerSize * 2)
        .style("stroke", "#999494")
        .attr("stroke-width", "1");
      // 三角形(修改文件)
      svg
        .append("defs")
        .append("svg")
        .attr("id", "marker-triangle")
        .attr("viewBox", "0 0 1024 1024")
        .attr("width", markerSize * 3)
        .attr("height", markerSize * 3)
        .append("path")
        .attr("d", "M71.675 893.33l440.325-762.683 440.325 762.683z")
        .style("stroke", "#999494")
        .attr("stroke-width", "120");

      const type2Shape = {
        add: "#marker-square",
        del: "#marker-circle",
        edit: "#marker-triangle"
      };

      var circle = svg
        .append("g")
        .selectAll("marker")
        .data(data)
        .enter()
        .append("use")
        .attr("href", d => type2Shape[d.type])
        .attr("x", d => x(d.x))
        .attr("y", d => y(d.y))
        .attr("fill", d => {
          var topicID = d => d.topic;
          // if (d.cluster < 0) return "grey";
          // else return this.topicColormap(topicID(d));
          return this.topicColormap(topicID(d));
        })
        .on("click", d => {
          this.$bus.$emit("doc-selected", this.fileData[d.id]["filename"]);
          console.log(this.fileData[d.id]["filename"]);
        });
      // .on('click', d => {
      //   this.$bus.$emit('doc-selected', this.fileData[d.id]['filename'])
      // });

      this.allCircle = circle;

      var coords, centerX, centerY, radius;
      var click_circle = svg
        .append("circle")
        .attr("cx", 0)
        .attr("cy", 0)
        .attr("r", 0)
        .attr("fill", "#babdb6")
        .attr("opacity", 0.6);
      var curDocTopics = this.curDocTopics;
      var that = this;

      svg
        .on("mousedown", function() {
          that.$bus.$emit("clearVector");
          this.drawArea = true;
          coords = d3.mouse(this);
          click_circle
            .transition()
            .duration(20)
            .attr("cx", coords[0])
            .attr("cy", coords[1])
            .attr("r", 0);
        })
        .on("mousemove", function() {
          if (!this.drawArea) {
            return;
          }
          var tmp_coords = d3.mouse(this);
          drawCircle(
            coords[0],
            coords[1],
            distance(coords[0], coords[1], tmp_coords[0], tmp_coords[1]),
            click_circle
          );
        })
        .on("mouseup", function() {
          this.drawArea = false;
          centerX = coords[0];
          centerY = coords[1];
          var tmp_coords = d3.mouse(this);
          radius = distance(coords[0], coords[1], tmp_coords[0], tmp_coords[1]);
          var getInfluenced = d => {
            var ids = [];
            var vector = getVector(d);
            for (let i = 0; i < vector.length; i++) {
              if (Math.abs(vector[i]) > this.threshold) {
                ids.push(i);
              }
            }
            return ids;
          };
          var getVector = d => {
            for (let i = 0; i < curDocTopics["id"].length; i++) {
              if (curDocTopics["id"][i] === d.id) {
                return that.diffDocVecs[i];
              }
            }
          };
          var vectorData = [];
          for (let i = 0; i < data.length; i++) {
            var tmp = data[i];
            console.log(radius);
            if (distance(centerX, centerY, x(tmp.x), y(tmp.y)) <= radius) {
              var tmp_data = {
                topic: tmp.topic,
                cluster: tmp.cluster,
                vector: getVector(tmp),
                influenced: getInfluenced(tmp),
                norm: that.curNormData[tmp.id],
                id: tmp.id
              };
              vectorData.push(tmp_data);
            }
          }
          that.$bus.$emit("drawVector", vectorData);
        });

      function drawCircle(x, y, size, click_circle) {
        click_circle
          .transition()
          .duration(20)
          .attr("r", size);
      }

      function distance(x1, y1, x2, y2) {
        return Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));
      }

      // 添加legend
      var legend = svg.append("g").attr("transform", "translate(10,10)");
      legend
        .append("use")
        .attr("href", "#marker-square")
        .attr("fill", "none")
        .attr("x", 10)
        .attr("y", 10)
        .attr("stroke-width", "1");
      legend
        .append("text")
        .attr("x", 30)
        .attr("y", 18)
        .attr("font-size", "13px")
        .text("add");
      legend
        .append("use")
        .attr("href", "#marker-circle")
        .attr("fill", "none")
        .attr("x", 80)
        .attr("y", 15)
        .attr("stroke-width", "1");
      legend
        .append("text")
        .attr("x", 93)
        .attr("y", 20)
        .attr("font-size", "13px")
        .text("delete");
      legend
        .append("use")
        .attr("href", "#marker-triangle")
        .attr("fill", "none")
        .attr("x", 150)
        .attr("y", 8)
        .style("stroke", "#999494")
        .attr("stroke-width", "120");
      legend
        .append("text")
        .attr("x", 170)
        .attr("y", 20)
        .attr("font-size", "13px")
        .text("edit");

      // svg
      //   .append("g")
      //   .attr("stroke-width", 1.5)
      //   .attr("font-family", "sans-serif")
      //   .attr("font-size", 10)
      //   .selectAll("g")
      //   .data(data)
      //   .join("g")
      //   .attr("transform", d => `translate(${x(d.x)},${y(d.y)})`)
      //   .call(g =>
      //     g
      //       .append("circle")
      //       .attr('href', d => type2Shape[d.type])
      //       .attr("stroke", "steelblue")
      //       .attr("fill", "none")
      //       .attr("r", 3)
      //   );
    },
    // getCluster(){
    //   this.$axios
    //     .post('http://localhost:8000/topic/getClusterDrInfo', {
    //       docs: this.diffDocs, threshold: this.threshold,
    //       min_samples: this.min_samples, eps: this.eps
    //     })
    //     .then(({ data: { data: chartData, cluster_num: clusterNum } }) => {
    //       this.clusterNum = clusterNum
    //       this.selectedCluster = null
    //       let step = 0
    //       this.percentSum = []
    //       chartData.forEach(d => {
    //         if(d.cluster === -1) {
    //           d.cluster = d.cluster - step
    //           step = step + 1
    //         }
    //         let temp = this.percentSum.filter(item => item.cluster === d.cluster)
    //         if(temp.length === 0)
    //           this.percentSum.push({cluster: d.cluster, type: d.type, vec:[]})
    //       })
    //       let max = 0
    //       this.percentSum.forEach(item =>{
    //         let curData = chartData.filter(data => data.cluster === item.cluster)
    //         item.vec = this.getChartData(curData)
    //         item.vec.forEach(vec => {
    //           if(vec.val.length === 1){
    //             if(max < vec.val[0])
    //               max = vec.val[0]
    //           }
    //           if(vec.val.length === 2){
    //             if(max < Math.max(vec.val[0], vec.val[1]))
    //               max = Math.max(vec.val[0], vec.val[1])
    //           }
    //         })
    //       })
    //       this.maxVal = max
    //       this.chartData = chartData
    //       this.draw(chartData)
    //     })
    // },
    // getChartData(data){
    //   let preVec = Array(this.topicNum).fill(0),
    //       curVec = Array(this.topicNum).fill(0)
    //   let chartData = []
    //   data.forEach(doc => {
    //     if(doc.type === 'edit'){
    //         let preId = doc.fileIds[0], curId = doc.fileIds[1]
    //         let preDoc = this.docData[preId], curDoc = this.docData[curId]
    //         let edit_preVec = preDoc['main_topic'].map(topic => topic['percent']),
    //             edit_curVec = curDoc['main_topic'].map(topic => topic['percent'])
    //         preVec = preVec.map((d, i) => d+edit_preVec[i])
    //         curVec = curVec.map((d, i) => d+edit_curVec[i])
    //     }
    //     if(doc.type === 'add'){
    //         let curId = doc.fileIds[0]
    //         let curDoc = this.docData[curId]
    //         let add_preVec = Array(this.topicNum).fill(0),
    //             add_curVec = curDoc['Topic_Contribution'].map(topic => topic['percent'])
    //         preVec = preVec.map((d, i) => d+add_preVec[i])
    //         curVec = curVec.map((d, i) => d+add_curVec[i])
    //     }
    //     if(doc.type === 'del'){
    //         let preId = doc.fileIds[0]
    //         let preDoc = this.docData[preId]
    //         let del_preVec = preDoc['Topic_Contribution'].map(topic => topic['percent']),
    //             del_curVec = Array(this.topicNum).fill(0)
    //         preVec = preVec.map((d, i) => d+del_preVec[i])
    //         curVec = curVec.map((d, i) => d+del_curVec[i])
    //     }
    //   })
    //   if(data[0].type === 'add'){
    //     curVec.forEach((d, i) => {
    //         if(d != 0) chartData.push({topic: i, val: [d], type: 'add'})
    //     })
    //   }
    //   if(data[0].type === 'del'){
    //     preVec.forEach((d, i) => {
    //         if(d != 0) chartData.push({topic: i, val: [d], type: 'del' })
    //     })
    //   }
    //   if(data[0].type === 'edit'){
    //     preVec.forEach((d, i) => {
    //         if(d!=0 || curVec[i]!=0)
    //             chartData.push({topic: i, val: [d, curVec[i]], type: 'edit'})
    //     })
    //   }
    //   return chartData
    // },
    // draw (data) {
    //   this.$refs.root.innerHTML = ''
    //   const margin = { top: 60, right: 10, bottom: 30, left: 10 }
    //   const height = this.height
    //   const width = this.width
    //   const svg = d3
    //     .select(this.$refs.root)
    //     .append('svg')
    //     .attr('width', width)
    //     .attr('height', height)
    //   const x = d3
    //     .scaleLinear()
    //     .domain(d3.extent(data, d => d.x))
    //     .nice()
    //     .range([margin.left, width - margin.right])
    //   this.xScale = x
    //   const y = d3
    //     .scaleLinear()
    //     .domain(d3.extent(data, d => d.y))
    //     .nice()
    //     .range([height - margin.bottom, margin.top])
    //   this.yScale = y

    //   // 添加marker形状定义
    //   const markerSize = 5
    //   // <defs>元素用于存储图形对象, 但并不立即渲染, 根据<use>中的设置进行渲染
    //   // 虚线圆(del)
    //   // svg
    //   //   .append('defs')
    //   //   .append('g')
    //   //   .attr('id', 'marker-dashedCircle')
    //   //   .append('circle')
    //   //   .attr('r', markerSize)
    //   //   .style('stroke', function() {
    //   //     return 'black'
    //   //   })
    //   //   .attr('stroke-dasharray', '3,3')
    //   //   .attr('stroke-width', '2')
    //   // // 实线圆(add)
    //   // svg
    //   //   .append('defs')
    //   //   .append('g')
    //   //   .attr('id', 'marker-solidCircle')
    //   //   .append('circle')
    //   //   .attr('r', markerSize)
    //   //   .style('stroke', function() {
    //   //     return 'black'
    //   //   })
    //   //   .attr('stroke-width', '2')
    //   // // 半虚半实圆(edit)
    //   // var g = svg
    //   //   .append('defs')
    //   //   .append('g')
    //   //   .attr('id', 'marker-otherCircle')
    //   // g.append('circle')
    //   //   .attr('r', markerSize)
    //   // g.append('path')
    //   //   .attr('d', d3.arc()({
    //   //     innerRadius: markerSize,
    //   //     outerRadius: markerSize,
    //   //     startAngle: 0,
    //   //     endAngle: Math.PI
    //   //   }))
    //   //   .style('stroke', function() {
    //   //     return 'black'
    //   //   })
    //   //   .attr('stroke-width', '2')
    //   // g.append('path')
    //   //   .attr('d', d3.arc()({
    //   //     innerRadius: markerSize,
    //   //     outerRadius: markerSize,
    //   //     startAngle: Math.PI,
    //   //     endAngle: 2*Math.PI
    //   //   }))
    //   //   .style('stroke', function() {
    //   //     return 'black'
    //   //   })
    //   //   .attr('stroke-dasharray', '3,3')
    //   //   .attr('stroke-dashoffset', '3')
    //   //   .attr('stroke-width', '2')

    //   // const type2Shape = {
    //   //   add: '#marker-solidCircle',
    //   //   del: '#marker-dashedCircle',
    //   //   edit: '#marker-otherCircle'
    //   // }

    // // 圆形(删除文件)
    //   svg
    //     .append('defs')
    //     .append('g')
    //     .attr('id', 'marker-circle')
    //     .append('circle')
    //     .attr('r', markerSize)
    //     .style('stroke', '#999494')
    //   // 正方形(增加文件)
    //   svg
    //     .append('defs')
    //     .append('g')
    //     .attr('id', 'marker-square')
    //     .append('rect')
    //     .attr('width', markerSize * 2)
    //     .attr('height', markerSize * 2)
    //     .style('stroke', '#999494')
    //   // 三角形(修改文件)
    //   svg
    //     .append('defs')
    //     .append('svg')
    //     .attr('id', 'marker-triangle')
    //     .attr('viewBox', '0 0 1024 1024')
    //     .attr('width', markerSize * 3)
    //     .attr('height', markerSize * 3)
    //     .append('path')
    //     .attr('d', 'M71.675 893.33l440.325-762.683 440.325 762.683z')
    //     .style('stroke', '#999494')

    //   const type2Shape = {
    //     add: '#marker-square',
    //     del: '#marker-circle',
    //     edit: '#marker-triangle'
    //   }

    //   var circle = svg
    //     .append('g')
    //     .selectAll('marker')
    //     .data(data)
    //     .enter()
    //     .append('use')
    //     .attr('href', d => type2Shape[d.type])
    //     .attr('x', d => x(d.x))
    //     .attr('y', d => y(d.y))
    //     .attr('fill', d => {
    //       if(d.cluster < 0)
    //         return 'grey'
    //       else{
    //         if(d.type === 'edit')
    //           return this.topicColormap(this.docData[parseInt(d.fileIds[1])].Dominant_Topic)
    //         else
    //           return this.topicColormap(this.docData[parseInt(d.fileIds[0])].Dominant_Topic)
    //       }
    //     })
    //     .on('mouseenter', (d) => {
    //       let x = d3.event.pageX, y = d3.event.pageY
    //       if (this.selectedCluster || this.selectedCluster === 0) return
    //       this.resetStatus()
    //       this.highlightMarker(d.cluster)
    //       let selectedDocs = this.chartData.filter(doc => doc.cluster === d.cluster)
    //       this.$bus.$emit('tip-show', {x: x, y: y,
    //         args: this.dom_args,
    //         max: this.maxVal,
    //         docs: this.percentSum.filter(item=>item.cluster===d.cluster)})
    //     })
    //     .on('mouseleave', () => {
    //        if(!this.selectedCluster)
    //         this.resetStatus()
    //        this.$bus.$emit('tip-close', {})
    //     })
    //     .on('click', ({ cluster: selectedCluster }) => {
    //       // 解绑mouseleave事件
    //       circle.on('mouseleave', null)
    //       if(this.selectedCluster && this.selectedCluster != selectedCluster){
    //         let x = d3.event.pageX, y = d3.event.pageY
    //         let selectedDocs = this.chartData.filter(doc => doc.cluster === selectedCluster)
    //         this.$bus.$emit('tip-show', {x: x, y: y,
    //           args: this.dom_args,
    //           max: this.maxVal,
    //           docs: this.percentSum.filter(item=>item.cluster===selectedCluster)})
    //       }
    //       this.selectedCluster = selectedCluster
    //       let clusters = [], selectedDocs = []
    //       circle
    //         .filter(d => d.cluster === selectedCluster)
    //         .each(d => {
    //           // 合并数组concat
    //           clusters = clusters.concat(d['fileIds'])
    //           selectedDocs.push(d)
    //         })
    //       // 多事件结合使用时，可以阻止其他事件的发生，避免产生多个动作
    //       d3.event.stopPropagation()
    //       this.highlightMarker(selectedCluster)
    //       this.$bus.$emit('cluster-selected', clusters)
    //       this.$bus.$emit('docs-selected', selectedDocs)
    //     })
    //   this.allCircle = circle
    //   svg.on('click', () => {
    //     this.selectedCluster = null
    //     this.$bus.$emit('cluster-restored', {})
    //     this.$bus.$emit('docs-selected', null)
    //     this.$bus.$emit('tip-close', {})
    //     this.resetStatus()
    //     circle.on('mouseenter', (d) => {
    //         let x = d3.event.pageX, y = d3.event.pageY
    //         if (this.selectedCluster || this.selectedCluster === 0) return
    //         this.resetStatus()
    //         this.highlightMarker(d.cluster)
    //         let selectedDocs = this.chartData.filter(doc => doc.cluster === d.cluster)
    //         this.$bus.$emit('tip-show', {x: x, y: y,
    //           args: this.dom_args,
    //           max: this.maxVal,
    //           docs: this.percentSum.filter(item=>item.cluster===d.cluster)})
    //         })
    //       .on('mouseleave', () => {
    //         if(!this.selectedCluster)
    //           this.resetStatus()
    //         this.$bus.$emit('tip-close', {})
    //       })
    //       .on('click', ({ cluster: selectedCluster }) => {
    //         // 解绑mouseleave事件
    //         circle.on('mouseleave', null)
    //         if(this.selectedCluster && this.selectedCluster != selectedCluster){
    //           let x = d3.event.pageX, y = d3.event.pageY
    //           let selectedDocs = this.chartData.filter(doc => doc.cluster === selectedCluster)
    //           this.$bus.$emit('tip-show', {x: x, y: y,
    //             args: this.dom_args,
    //             max: this.maxVal,
    //             docs: this.percentSum.filter(item=>item.cluster===selectedCluster)})
    //         }
    //         this.selectedCluster = selectedCluster
    //         let clusters = [], selectedDocs = []
    //         circle
    //           .filter(d => d.cluster === selectedCluster)
    //           .each(d => {
    //             // 合并数组concat
    //             clusters = clusters.concat(d['fileIds'])
    //             selectedDocs.push(d)
    //           })
    //         // 多事件结合使用时，可以阻止其他事件的发生，避免产生多个动作
    //         d3.event.stopPropagation()
    //         this.highlightMarker(selectedCluster)
    //         this.$bus.$emit('cluster-selected', clusters)
    //         this.$bus.$emit('docs-selected', selectedDocs)
    //       })
    //     })

    //   // 添加legend
    //   var legend = svg.append('g')
    //     .attr('transform', 'translate(10,10)')
    //   legend
    //     .append('use')
    //     .attr('href', '#marker-square')
    //     .attr('fill', 'none')
    //     .attr('x', 10)
    //     .attr('y', 10)
    //     .attr('stroke-width', '2')
    //   legend.append('text')
    //     .attr('x', 30)
    //     .attr('y', 18)
    //     .attr('font-size', '13px')
    //     .text('add')
    //   legend
    //     .append('use')
    //     .attr('href', '#marker-circle')
    //     .attr('fill', 'none')
    //     .attr('x', 80)
    //     .attr('y', 15)
    //     .attr('stroke-width', '2')
    //   legend.append('text')
    //     .attr('x', 93)
    //     .attr('y', 20)
    //     .attr('font-size', '13px')
    //     .text('delete')
    //   legend
    //     .append('use')
    //     .attr('href', '#marker-triangle')
    //     .attr('fill', 'none')
    //     .attr('x', 150)
    //     .attr('y', 8)
    //     .style('stroke','#999494')
    //     .attr('stroke-width', '120')
    //   legend.append('text')
    //     .attr('x', 170)
    //     .attr('y', 20)
    //     .attr('font-size', '13px')
    //     .text('edit')
    // },
    // 状态重置和高亮
    resetStatus() {
      this.allCircle.attr("opacity", 1);
    },
    highlightMarker(selectedTopic) {
      this.allCircle.attr("opacity", 0.2);
      this.allCircle.filter(d => d.topic === selectedTopic).attr("opacity", 1);
    },
    fieldAdapter(doc) {
      return {
        fileName: doc["relFileName"],
        vec: doc["diffVec"],
        type: doc["type"],
        fileIds: doc["fileIds"]
      };
    }
  }
};
</script>

<style lang="less">
.scatter-plot{
  height: 100%;
}
</style>