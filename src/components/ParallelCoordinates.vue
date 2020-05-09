<template>
  <div class="parallel-coordinates" ref="root"></div>
</template>

<script>
import * as d3 from "d3";
import d3tip from "d3-tip";

export default {
  name: "component_name",
  data() {
    return {
      svg: null,
      width: 0,
      height: 0,
      cur_node: null,
      cur_dataRoot: null,
      cur_version: null,
      pre_node: null,
      pre_dataRoot: null,
      diffDocs: null,
      node_height: 40,
      vectorData: null,
      // dimensions: [
      //   "parameter",
      //   "template",
      //   "merge",
      //   "dom",
      //   "object",
      //   "observer",
      //   "SSR",
      //   "directives",
      //   "transition",
      //   "option",
      //   "watcher",
      //   "path",
      //   "vdom",
      //   "compiler",
      //   // "data",
      //   // "model"
      // ],
      dimensions: ['layout', 'touch', 'color', 'transition', 'selection', 'locale', 'element', 'attribute', 'event', 'scale', 'interpolate', 'time', 'geometry', 'chart'],
      y: {},
      file_id: null
    };
  },
  computed: {},
  props: ["topicColormap", "docData", "versions"],
  methods: {
    draw(data) {
      var margin = { top: 50, right: 30, bottom: 50, left: 30 };
      this.$refs.root.innerHTML = "";
      const height = this.height - margin.top - margin.bottom;
      const width = this.width - margin.left - margin.right;
      const svg = d3
        .select(this.$refs.root)
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      var dimensions = this.dimensions;

      // For each dimension, I build a linear scale. I store all in a y object
      var y = {};
      for (let i in dimensions) {
        name = dimensions[i];
        y[name] = d3
          .scaleLinear()
          .domain(
            // d3.extent(this.vectorData, function(d) {
            //   return +d[name];
            // })
            [-1, 1]
          )
          .range([height - 80, 0]);
      }

      // Build the X scale -> it find the best position for each Y axis
      var x = d3
        .scalePoint()
        .range([0, width - 30])
        .padding(1)
        .domain(dimensions);

      // The path function take a row of the csv as input, and return x and y coordinates of the line to draw for this raw.
      function path(d) {
        return d3.line()(
          dimensions.map(function(p) {
            return [x(p), y[p](d[p])];
          })
        );
      }

      // Draw the lines
      svg
        .selectAll("myPath")
        .data(this.vectorData)
        .enter()
        .append("path")
        .attr("d", path)
        .style("fill", "none")
        .style("stroke", d => {
          return this.topicColormap(d[0]);
        })
        .style("opacity", 1.0);

      // Draw the axis:
      svg
        .selectAll("myAxis")
        // For each dimension of the dataset I add a 'g' element:
        .data(dimensions)
        .enter()
        .append("g")
        // I translate this element to its right position on the x axis
        .attr("transform", function(d) {
          return "translate(" + x(d) + ")";
        })
        // And I build the axis with the call function
        .each(function(d) {
          d3.select(this).call(d3.axisLeft().scale(y[d]).tickValues([-1, 0, 1]));
        })
        // Add axis title
        .append("text")
        .style("text-anchor", "middle")
        .attr("y", -9)
        .attr("x", 17)
        .text(function(d) {
          return d;
        })
        .attr("transform", "rotate(-30)")
        .style("fill", "black")
        .style("opacity", 1.0);
      // svg
      //   .selectAll("text")
      //   .filter(d => {
      //     if (parseFloat(d).toString() != "NaN") {           
      //       return d;
      //     }
      //     else{
      //       console.log(d);
      //     }
      //   })
      //   .attr("y", 0)
      //   .attr("x", 9)
      //   .attr("dy", ".35em")
      //   .attr("transform", "rotate(30)")
      //   .style("opacity", 0.0);
    }
  },
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
    this.vectorData = [];
    this.file_id = [];
  },
  mounted() {
    this.height = Math.floor(this.$refs.root.clientHeight);
    this.width = Math.floor(this.$refs.root.clientWidth);

    this.$bus.$on("drawVector", d => {
      console.log(d);
      for(let index = 0; index < d.length; index++){
        var obj = new Object();
        obj[0] = d[index].topic;
        for (let i = 0; i < d[index].vector.length; i++) {
          obj[this.dimensions[i]] = d[index].vector[i];
        }
        this.vectorData.push(obj);
      }
    });

    this.$bus.$on("version-range-selected", d => {
      this.vectorData = [];
      this.file_id = [];
    });

    this.$bus.$on("clearVector", d => {
      this.vectorData = [];
      this.file_id = [];
    });
  },
  watch: {
    vectorData() {
      this.draw(this.vectorData);
    }
  }
};
</script>

<style lang="less">
</style>