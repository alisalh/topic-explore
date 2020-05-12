<template>
  <div class="line-chart" ref="root"></div>
</template>

<script>
import * as d3 from "d3";
export default {
  name: "component_name",
  data() {
    return {
      height: 0,
      width: 0,
      lineSvg: null,
      gridLineG: null,
      strokeWidth: 1.5,
      curData: [],
      showVersions: [],
      selectedVersion: null,
      selectedTopic: null,
      tickValues: [],
      selectFlag: false
    };
  },
  props: ["topicColormap", "topicsGroup", "versions", "normData"],
  methods: {
    // linchart的纵坐标为每个主题下每个版本对应的文件数
    draw(data) {
      const margin = { top: 10, right: 25, bottom: 50, left: 40 }, 
        brushHeight = 30,
        gap = 40; //gap表示brush和linechart之间的间隔

      // 整体的svg
      const svg = d3.select(this.$refs.root)
        .append("svg")
        .attr("width", this.width)
        .attr("height", this.height);

      // 纵坐标的最大值
      var maxY = d3.max(data, topic =>
        d3.max(topic.val, version => version.val.length)
      );

      // x和y的比例尺
      var y = d3.scaleLinear()
        .domain([0, maxY])
        .nice()
        .range([this.height - margin.bottom, margin.top + brushHeight + gap]);
      var x = d3.scalePoint()
        .domain(this.versions)
        .range([margin.left, this.width - margin.right]);

      // 设置linechart刻度
      this.getTickValuesOfLine(this.versions);
      
      // x轴
      var xAxis = g =>
        g
          .attr("transform", `translate(0,${this.height - margin.bottom})`)
          .call(d3.axisBottom(x).tickValues(this.tickValues))
          .call( g =>                           // 设置tick
            g
              .style("cursor", "default")
              .selectAll("text:not(.x-label)")
              .style("text-anchor", "end")
              .attr("dx", "-.8em")
              .attr("dy", ".15em")
              .attr("transform", "rotate(-65)"));
      // y轴
      var yAxis = g =>
        g
          .attr("transform", `translate(${margin.left},0)`)
          .call(d3.axisLeft(y))
          .call(g => g.select(".domain").remove())
          .call(g =>
            g
              .select(".tick:last-of-type text")
              .clone()
              .attr("x", 3)
              .attr("text-anchor", "start")
              .attr("font-weight", "bold")
              .text("number of files"));
      svg
        .append("g")
        .attr("class", "axis lineaxis--x")
        .call(xAxis);
      svg
        .append("g")
        .attr("class", "axis lineaxis--y")
        .call(yAxis);
      svg
        .append("g")
        .attr("class", "x-label")
        .attr("transform", "translate("+(this.width-60)+","+this.height+")")
        .append("text")
        .text("versions")
        .attr("text-anchor", "start")
        .attr("font-weight", "bold")
        .attr("font-size", "12px")
        .attr('color', "#2c3e50")


      // 画线
      const line = d3
        .line()
        .curve(d3.curveMonotoneX)
        .x(d => x(d.key))
        .y(d => y(d.val.length))

      this.lineSvg = svg.append("g")
        .attr("class", "line-chart")
        .attr("fill", "none")
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .selectAll("path")
        .data(data)
        .enter()
        .append("path")
        .attr("class", "topic-line")
        .attr("stroke-width", 1.5)
        .attr("d", d => line(d.val))
        .attr("stroke", d => this.topicColormap(parseInt(d.key)))
        // .on("click", d => {
        //   d3.event.stopPropagation()
        //   this.selectedTopic = d.key
        //   this.resetLineStatus()
        //   this.highlightLine(d.key)
        //   this.$bus.$emit('line-selected', d.key)
        // });

      // 画版本定位辅助线
      let xOffset = 0;
      this.gridLineG = svg.append("g").attr("class", "grid-line");
      var gridLine = this.gridLineG
        .attr("fill", "none")
        .attr("stroke-width", 2)
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .attr("stroke", "black")
        .attr("stroke-dasharray", "5,5")
        .selectAll(".x-grid-line")
        .data(this.versions)
        .enter()
        .append("path")
        .attr("class", "x-grid-line")
        .attr("id", d => "grid-line-" + d.replace(/\./g, ""))
        .attr("opacity", 0)
        .attr("d", d => {
          xOffset = x(d);
          return d3.line()([
            [xOffset, margin.top + brushHeight + gap],
            [xOffset, this.height - margin.bottom]
          ]);
        });

      // 点击tick显示辅助线
      svg.select(".axis")
        .selectAll(".tick")
        .on("mouseenter", d => {
          gridLine.filter(ver => ver === d).attr("opacity", 0.7);
        })
        .on("mouseleave", () => {
          gridLine.attr("opacity", 0.0);
          gridLine
            .filter(ver => ver === this.selectedVersion)
            .attr("opacity", 0.7);
        })
        .on("click", d => {
          gridLine.attr("opacity", 0.0);
          // 点击当前选中版本表示取消选择
          if (d === this.selectedVersion) {
            this.selectedVersion = null;
             this.$bus.$emit('lineVersion-reseted', null);      // 取消选择当前版本
          } else {
            gridLine.filter(ver => ver === d).attr("opacity", 0.7);
            this.selectedVersion = d;
            // if(this.selectedTopic || this.selectedTopic === 0) this.selectFlag = true
            this.$bus.$emit('lineVersion-selected', d);        // 选中当前版本
          }
        });

      // // 点击空白处还原
      // svg.on("click", () => {
      //   if (!this.selectFlag) {
      //     this.resetLineStatus();
      //     this.selectedTopic = null;
      //     this.$bus.$emit("line-restored", {});
      //   } else {
      //     this.flag = false;
      //   }
      // });

      // 添加brush的折线图
      // 设置norm显示的刻度
      this.getTickValuesOfNorm(this.normData, this.versions);

      const maxBrushY = d3.max(this.normData.map(d => d.val));
      const brushY = d3.scaleLinear()
        .domain([0, maxBrushY])
        .range([margin.top + brushHeight, margin.top]);
      const brushX = d3.scalePoint()
        .domain(this.versions)
        .range([margin.left, this.width - margin.right]);
      var brushXAxis = g =>
        g
          .attr("transform", `translate(0,${margin.top + brushHeight})`)
          .call(d3.axisBottom(brushX).tickValues(this.showVersions))
          .call(g => g.select(".domain").remove())
          .call(g =>
            g
              .selectAll("text:not(.x-label)")
              .style("text-anchor", "middle")
              .attr("dy", "1em"));
      svg.append("g")
        .attr("class", "axis normaxis--x")
        .call(brushXAxis);

      const brushLine = d3
        .line()
        .curve(d3.curveMonotoneX)
        .x(d => brushX(d.ver))
        .y(d => brushY(d.val));
      svg.append("g")
        .attr("class", "norm-line")
        .attr("fill", "none")
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .append("path")
        .attr("stroke", "grey")
        .attr("d", brushLine(this.normData));

      // 添加brush
      var brush = d3
        .brushX()
        .extent([
          [margin.left, 0],
          [this.width - margin.right, brushHeight]
        ])
        .on("start", brushstarted.bind(this))
        .on("brush", brushed.bind(this))
        .on("end", brushended.bind(this));
      svg.append("g")
        .attr("class", "brush")
        .attr("transform", `translate(0,${brushY(maxBrushY)})`)
        .call(brush);

      // 画刷开始时还原选择的版本
      function brushstarted() {
        gridLine.attr("opacity", 0.0);
        this.selectedVersion = null;
        this.$bus.$emit("lineVersion-reseted", null);
      }

      // 画刷结束时更新linechart
      function brushended() {
        let s = d3.event.selection;
        // 点击brush恢复到原始状态
        if (!s) {
          // 还原x定义域
          x.domain(brushX.domain());
          // 还原刻度
          this.getTickValuesOfLine(brushX.domain());
          // 还原x轴
          xAxis = g =>
            g
              .call(d3.axisBottom(x).tickValues(this.tickValues))
              .call(g =>                              // 设置tick
                g
                  .style("cursor", "default")
                  .selectAll("text:not(.x-label)")
                  .style("text-anchor", "end")
                  .attr("dx", "-.8em")
                  .attr("dy", ".15em")
                  .attr("transform", "rotate(-65)"));
          svg.select(".lineaxis--x").call(xAxis);

          // 还原
          this.lineSvg = svg
            .selectAll(".topic-line")
            .data(data)
            .attr("d", d => line(d.val));

          // 还原辅助线
          gridLine.attr("opacity", 0.0).attr("transform", d => {
            let reg = /M(.*)L/;
            let pos = reg.exec(
              this.gridLineG
                .select("#grid-line-" + d.replace(/\./g, ""))
                .attr("d")
            )[1];
            xOffset = x(d) - pos.split(",")[0];
            return `translate(${xOffset},0)`;
          });
        } else {
          let eachBand = brushX.step();
          let prevIndex = Math.round((s[0] - margin.left) / eachBand),
            curvIndex = Math.round((s[1] - margin.left) / eachBand);

          // 更新x轴
          this.showVersions = [];
          for (let i = prevIndex; i <= curvIndex; i++)
            this.showVersions.push(brushX.domain()[i]);
          x.domain(this.showVersions);
          svg.select(".lineaxis--x").call(xAxis);

          // 更新辅助线
          gridLine
            .filter(d => this.showVersions.indexOf(d) === -1)
            .attr("opacity", 0.0)
            .attr("transform", d => {
              let reg = /M(.*)L/;
              let curLine = this.gridLineG.select("#grid-line-" + d.replace(/\./g, ""));
              let pos = reg.exec(curLine.attr("d"))[1];
              xOffset = 0 - pos.split(",")[0];
              return `translate(${xOffset},0)`;
            });
          gridLine
            .filter(d => this.showVersions.indexOf(d) != -1)
            .attr("transform", d => {
              let reg = /M(.*)L/;
              let curLine = this.gridLineG.select("#grid-line-" + d.replace(/\./g, ""));
              let pos = reg.exec(curLine.attr("d"))[1];
              xOffset = x(d) - pos.split(",")[0];
              return `translate(${xOffset},0)`;
            });
        }

        // 重新绑定tick事件
        svg.select(".axis")
          .selectAll(".tick")
          .on("mouseenter", d => {
            gridLine.filter(ver => ver === d).attr("opacity", 0.7);
          })
          .on("mouseleave", () => {
            gridLine.attr("opacity", 0.0);
            gridLine.filter(ver => ver === this.selectedVersion)
              .attr("opacity", 0.7);
          })
          .on("click", d => {
            gridLine.attr("opacity", 0.0);
            if (d === this.selectedVersion) {
              this.selectedVersion = null;
              this.$bus.$emit("lineVersion-reseted", null);
            } else {
              gridLine.filter(ver => ver === d).attr("opacity", 0.7);
              this.selectedVersion = d;
              // if(this.selectedTopic || this.selectedTopic === 0) this.selectFlag = true
              this.$bus.$emit("lineVersion-selected", d);
            }
          });
      }

      // 画刷正在使用时
      function brushed() {
        let s = d3.event.selection;
        if (s != null) {
          let eachBand = brushX.step();
          let prevIndex = Math.round((s[0] - margin.left) / eachBand),
            curvIndex = Math.round((s[1] - margin.left) / eachBand);
          // 更新x轴
          this.showVersions = [];
          for (let i = prevIndex; i <= curvIndex; i++)
            this.showVersions.push(brushX.domain()[i]);
          x.domain(this.showVersions);
          // 更新刻度
          this.getTickValuesOfLine(this.showVersions);
          xAxis = g =>
            g.call(d3.axisBottom(x).tickValues(this.tickValues))
              .call(g =>                         // 设置tick
                g
                  .style("cursor", "default")
                  .selectAll("text:not(.x-label)")
                  .style("text-anchor", "end")
                  .attr("dx", "-.8em")
                  .attr("dy", ".15em")
                  .attr("transform", "rotate(-65)"));
          svg.select(".lineaxis--x").call(xAxis);
          // 更新折线
          this.curData = [];
          data.forEach(topic => {
            let item = topic.val.filter(d => this.showVersions.indexOf(d.key) != -1);
            this.curData.push({ key: topic.key, val: item });
          });
          this.lineSvg = svg
            .selectAll(".topic-line")
            .data(this.curData)
            .attr("d", d => line(d.val));
        }
      }
    },
    resetLineStatus() {
      this.lineSvg.attr("opacity", 1).attr("stroke-width", this.strokeWidth);
    },
    highlightLine(topicId) {
      this.lineSvg
        .filter(d => parseInt(d.key) === topicId)
        .attr("stroke-width", 3);
      this.lineSvg
        .filter(d => parseInt(d.key) !== topicId)
        .attr("opacity", 0.1);
    },
    getTickValuesOfLine(versions) {
      this.tickValues = [];
      let version_num = versions.length;
      if (version_num > 40) {
        let step = Math.round(version_num / 30);
        this.tickValues = versions.filter((d, i) => i % step === 0);
        this.tickValues.push(versions[version_num - 1]);
      } else {
        this.tickValues = versions;
      }
    },
    getTickValuesOfNorm(normData, versions) {
      // 计算norm的均值
      let sum = 0,
        mean = 0;
      this.normData.forEach(d => (sum += d.val));
      mean = sum / this.normData.length;
      // 默认添加第一个版本
      this.showVersions.push(this.versions[0]);
      // 与前后版本的差值大于均值则显示
      for (let i = 1; i < this.normData.length - 1; i++) {
        if (
          this.normData[i].val - this.normData[i - 1].val > (mean+1.5) &&
          this.normData[i].val - this.normData[i + 1].val > (mean+1.5)
        ) {
          this.showVersions.push(this.versions[i]);
        }
      }
      // 默认添加最后一个版本
      this.showVersions.push(this.versions[this.normData.length - 1]);
    }
  },
  created() {
    // 当所有异步数据都获取完以后才开始渲染(类Promise.all实现)
    const requiredData = ["topicColormap", "topicsGroup", "versions", "normData"];
    let cnt = 0;
    requiredData.forEach(d => {
      this.$watch(d, val => {
        if (val) cnt++;
        if (cnt === requiredData.length) this.draw(this.topicsGroup);
      });
    });
  },
  mounted() {
    this.height = Math.floor(this.$refs.root.clientHeight);
    this.width = Math.floor(this.$refs.root.clientWidth);
    // this.$bus.$on("topic-selected", topicId => {
    //   this.resetLineStatus();
    //   this.selectedTopic = topicId;
    //   if (topicId != -1) this.highlightLine(topicId);
    //   else this.selectedTopic = null;
    // });
    // this.$bus.$on("version-range-selected", d => {
    //   this.selectedVersion = null;
    //   this.gridLineG.selectAll(".x-grid-line").attr("opacity", 0);
    // });

    // control panel响应事件
    this.$bus.$on("curVersion-selected", d =>{
      this.selectedVersion = d;
      this.gridLineG.selectAll(".x-grid-line").attr("opacity", 0);
      this.gridLineG.select("#grid-line-" + d.replace(/\./g, "")).attr("opacity", 0.7);
    })
    this.$bus.$on("curVersion-reseted", () =>{
      this.selectedVersion = null;
      this.gridLineG.selectAll(".x-grid-line").attr("opacity", 0);
    })
  }
};
</script>

<style lang="less">
.line-chart {
  height: 100%;
}
</style>