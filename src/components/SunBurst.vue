<template>
  <div class="sunburst" ref="root"></div>
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
      fileData: null,
      pre_svg: null,
      pre_gNode: null,
      pre_gLink: null,
      cur_svg: null,
      cur_gNode: null,
      cur_gLink: null,
      pre_nodeUpdate: null,
      cur_nodeUpdate: null,
      cur_nodeTotal: null,
      pre_nodeTotal: null,
      margin: { top: 20, right: 90, bottom: 30, left: 90 },
      pre_Data: null,
      cur_Data: null,
      left_move: 0,
      right_move: 0,
      left_start: 0,
      right_start: 0,
      move_curnode: null,
      move_prenode: null,
      max_cur_depth: 0,
      max_pre_depth: 0,
      topics: [
        "layout",
        "touch",
        "color",
        "transition",
        "selection",
        "locale",
        "element",
        "attribute",
        "event",
        "scale",
        "interpolate",
        "time",
        "geometry",
        "chart"
      ]
    };
  },
  computed: {},
  props: ["topicColormap", "docData", "versions"],
  methods: {
    drawCurHierarchy(data) {
      this.svg.select(".cur-hierarchy-node").remove();

      var margin = { top: 20, right: 90, bottom: 30, left: 90 };
      this.cur_svg = this.svg
        .append("g")
        .attr("class", "cur-hierarchy-node")
        .attr("width", this.width / 2)
        .attr("height", this.height)
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .style("font", "10px sans-serif")
        .style("user-select", "none");

      this.cur_dataRoot = d3.hierarchy(data);
      this.cur_dataRoot.x0 = this.height / 2;
      this.cur_dataRoot.y0 = this.width;
      this.cur_dataRoot.descendants().forEach((d, i) => {
        d.id = i;
        d._children = d.children;
        // if (d.depth && d.data.name.length !== 7) d.children = null;
        if (d.data.type !== "dir") d.children = null;
      });

      this.cur_gLink = this.cur_svg
        .append("g")
        .attr("fill", "none")
        .attr("stroke", "#555")
        .attr("stroke-opacity", 0.4)
        .attr("stroke-width", 1.5);

      this.cur_gNode = this.cur_svg
        .append("g")
        .attr("cursor", "pointer")
        .attr("pointer-events", "all");

      this.cur_dataRoot.children.forEach(collapse);
      this.update(
        this.cur_dataRoot,
        this.cur_svg,
        this.cur_gLink,
        this.cur_gNode,
        this.cur_dataRoot,
        true
      );

      function collapse(d) {
        if (d.children) {
          d._children = d.children;
          d._children.forEach(collapse);
          d.children = null;
        }
      }
      // let root = d3.hierarchy(data);
      // this.cur_dataRoot = root;
      // root.sum(d => (d.children ? 0 : 1)); // 后序遍历, value相加, 详情见https://github.com/xswei/d3-hierarchy

      // let maxDepth = d3.max(root.leaves(), d => d.depth);
      // var x = d3.scaleLinear().range([0, this.width]);
      // var y = d3
      //   .scaleLinear()
      //   .range([0, this.node_height * maxDepth])
      //   .domain([0, 1]);

      // var partition = d3.partition();
      // this.cur_node = cur_svg
      //   .selectAll('rect')
      //   .data(
      //     partition(root)
      //       .descendants()
      //       .slice(1)  // 不绘制root节点
      //   )
      //   .enter()
      //   .append('rect')
      //   .attr('x', d => x(d.x0))
      //   .attr('y', d => y(d.y0))
      //   .attr('width', d => x(d.x1) - x(d.x0))
      //   .attr('height', d => y(d.y1) - y(d.y0))
      //   .style('stroke', 'black')
      //   .attr('stroke-opacity', '0.3')
      //   .attr('fill', d => {
      //     if (d.data.type === 'dir') {
      //       return '#f0f0f0'
      //     }
      //     return this.topicColormap(parseInt(d.data.topic))
      //   })
      //   .on('click', d => {
      //     this.$bus.$emit('doc-selected', d.data.filename)
      //   })
    },
    update(
      source,
      svg,
      gLink,
      gNode,
      dataRoot,
      bReverse,
      bCollapse = false,
      bFold = 0
    ) {
      const duration = d3.event && d3.event.altKey ? 2500 : 250;
      const nodes = dataRoot.descendants().reverse();
      const links = dataRoot.links();
      var tree = d3.tree().nodeSize([15, 50]);
      // Compute the new tree layout.
      tree(dataRoot);

      this.left_start = 0;
      this.right_start = 0;
      if (
        bFold != 0 &&
        this.cur_dataRoot != null &&
        this.pre_dataRoot != null
      ) {
        // var cur_nodes = this.cur_dataRoot.descendants().reverse();
        // var pre_nodes = this.pre_dataRoot.descendants().reverse();
        // cur_nodes.forEach(source => {
        if (
          source.children != null
          // && source.children.length > 20
          // && source.data.name.slice(source.data.name.indexOf('src')) != 'src'
        ) {
          var count = 0;
          console.log(bFold)
          source.children.forEach(d => {
            if(bFold == 1){
              d.x = -this.height / 2 - 10 + count * 14;
            }
            else if(bFold == 2){
              d.x = this.height / 2 - this.margin.bottom - count * 14;
            }
            count++;
          });
        }
        //

        this.svg.selectAll("line").remove();
        this.drawDifference(this.diffDocs);
        // });
      }

      if (this.cur_dataRoot != null && this.pre_dataRoot != null) {
        var cur_nodes = this.cur_dataRoot.descendants().reverse();
        var pre_nodes = this.pre_dataRoot.descendants().reverse();
        var max_pre_depth = 0;
        pre_nodes.forEach(node => {
          if (node.depth > max_pre_depth) {
            max_pre_depth = node.depth;
          }
        });
        if (max_pre_depth >= 2) {
          this.left_move = this.left_start + (max_pre_depth - 2) * 50;
        } else {
          this.left_move = this.left_start;
        }
        var max_cur_depth = 0;
        cur_nodes.forEach(node => {
          if (node.depth > max_cur_depth) {
            max_cur_depth = node.depth;
          }
        });
        if (max_cur_depth >= 2) {
          this.right_move = this.right_start + (max_cur_depth - 2) * 50;
        } else {
          this.right_move = this.right_start;
        }
        this.max_cur_depth = max_cur_depth;
        this.max_pre_depth = max_pre_depth;
      }

      let left = dataRoot;
      let right = dataRoot;
      dataRoot.eachBefore(node => {
        if (node.x < left.x) left = node;
        if (node.x > right.x) right = node;
      });

      // const margin = { top: 10, right: 120, bottom: 10, left: 40 };
      var margin = { top: 20, right: 90, bottom: 30, left: 90 };
      this.margin = margin;
      const height = right.x - left.x + margin.top + margin.bottom;

      if (bReverse) {
        const transition = svg
          .transition()
          .duration(duration)
          .attr("viewBox", [
            -margin.left,
            left.x - margin.top,
            this.width,
            this.height
          ])
          .tween(
            "resize",
            window.ResizeObserver ? null : () => () => svg.dispatch("toggle")
          );

        // Update the nodes…
        const node = this.cur_gNode.selectAll("g").data(nodes, d => d.id);

        // Enter any new nodes at the parent's curvious position.
        this.cur_node = node
          .enter()
          .append("g")
          .attr(
            "transform",
            d =>
              `translate(${this.width -
                this.margin.right -
                source.y0 +
                this.right_move},${source.x0 + this.height / 2})`
          )
          .attr("fill-opacity", 0)
          .attr("stroke-opacity", 0)
          .on("click", d => {
            if (d.data.type == "file") {
              this.$bus.$emit(
                "doc-selected",
                this.fileData[d.data.id]["filename"]
              );
            } else {
              this.svg.selectAll("line").remove();
              // var cur_nodes = this.cur_dataRoot.descendants().reverse();
              // var fit_node;
              // cur_nodes.filter(node => {
              //   if (
              //     node.data.type === 'dir' &&
              //     node.data.name.slice(node.data.name.indexOf('src')) ===
              //       d.data.name.slice(d.data.name.indexOf('src'))
              //   ) {
              //     node.children = d.children ? null : node._children;
              //     fit_node = node;
              //     this.update(
              //       fit_node,
              //       this.cur_svg,
              //       this.cur_gLink,
              //       this.cur_gNode,
              //       this.cur_dataRoot,
              //       !bReverse
              //     );
              //   }
              // });
              // }
              d.children = d.children ? null : d._children;
              this.update(
                d,
                this.cur_svg,
                this.cur_gLink,
                this.cur_gNode,
                this.cur_dataRoot,
                bReverse
              );
              this.drawDifference(this.diffDocs, d.depth);
            }
            // else {
            //   var addFile = [];
            //   d.children = d.children ? null : d._children;
            //   d.children.forEach(ch => {
            //     if (ch.data.filetype == "add") {
            //       addFile.push({ Add: ch.data.filename });
            //     }
            //   });
            //   var table = this.tabulate(addFile, ["Add"]);
            // }
          });

        this.cur_node
          .append("circle")
          .attr("r", 5)
          .attr("fill", d => {
            if (d.data.topic != null) {
              return this.topicColormap(d.data.topic);
            }
            return "#555";
          })
          .attr("fill", d => {
            if (d.data.type == "topic") {
              return "white";
            } else if (d.data.type == "file") {
              return this.topicColormap(d.data.topic);
            }
            return "#555";
          })
          .attr("stroke", d => {
            if (d.data.type == "topic") {
              return this.topicColormap(d.data.id);
            }
          })
          .attr("stroke-width", d => {
            if (d.data.type == "topic") {
              return 3;
            } else {
              return 1;
            }
          });

        this.cur_node
          .append("text")
          .attr("dy", "0.31em")
          .attr("x", d => (d._children ? 6 : -6))
          .attr("text-anchor", d => (d._children ? "start" : "end"))
          .text(function(d) {
            if (d.data.type == "dir") {
              return d.data.name.slice(d.data.name.lastIndexOf("\\") + 1);
            }
          })
          .clone(true)
          .lower()
          .attr("stroke-linejoin", "round")
          .attr("stroke-width", 3)
          .attr("stroke", "white");

        // Transition nodes to their new position.
        this.cur_nodeUpdate = node
          .merge(this.cur_node)
          .transition(transition)
          .attr(
            "transform",
            d =>
              `translate(${this.width -
                this.margin.right * 2 -
                d.y +
                this.right_move},${d.x + this.height / 2})`
          )
          .attr("fill-opacity", 1)
          .attr("stroke-opacity", 1);

        // Transition exiting nodes to the parent's new position.
        const nodeExit = node
          .exit()
          .transition(transition)
          .remove()
          .attr(
            "transform",
            d =>
              `translate(${this.width -
                this.margin.right * 2 -
                source.y +
                this.right_move},${source.x + this.height / 2})`
          )
          .attr("fill-opacity", 0)
          .attr("stroke-opacity", 0);

        // Update the links…
        var diagonal = d3
          .linkHorizontal()
          .x(d => this.width - this.margin.right * 2 - d.y + this.right_move)
          .y(d => d.x + this.height / 2);
        const link = gLink.selectAll("path").data(links, d => d.target.id);

        // Enter any new links at the parent's curvious position.
        const linkEnter = link
          .enter()
          .append("path")
          .attr("d", d => {
            const o = { x: source.x0, y: source.y0 };
            return diagonal({ source: o, target: o });
          });

        // Transition links to their new position.
        link
          .merge(linkEnter)
          .transition(transition)
          .attr("d", diagonal);

        // Transition exiting nodes to the parent's new position.
        link
          .exit()
          .transition(transition)
          .remove()
          .attr("d", d => {
            const o = { x: source.x, y: source.y };
            return diagonal({ source: o, target: o });
          });

        // Stash the old positions for transition.
        dataRoot.eachBefore(d => {
          d.x0 = d.x;
          d.y0 = d.y;
        });

        this.cur_nodeTotal = node;
      } else {
        const transition = svg
          .transition()
          .duration(duration)
          .attr("viewBox", [
            -margin.left,
            left.x - margin.top,
            this.width,
            this.height
          ])
          .tween(
            "resize",
            window.ResizeObserver ? null : () => () => svg.dispatch("toggle")
          );

        // Update the nodes…
        const node = this.pre_gNode.selectAll("g").data(nodes, d => d.id);

        // Enter any new nodes at the parent's previous position.
        this.pre_node = node
          .enter()
          .append("g")
          .attr(
            "transform",
            d =>
              `translate(${source.y0 - this.left_move},${source.x0 +
                this.height / 2})`
          )
          .attr("fill-opacity", 0)
          .attr("stroke-opacity", 0)
          .on("click", d => {
            if (d.data.type == "file") {
              this.$bus.$emit(
                "doc-selected",
                this.fileData[d.data.id]["filename"]
              );
            } else {
              this.svg.selectAll("line").remove();
              //   var pre_nodes = this.pre_dataRoot.descendants().reverse();
              //   var pre_nodes = this.pre_dataRoot.descendants().reverse();
              //   var fit_node;
              //   pre_nodes.filter(nn => {
              //     if (
              //       nn.data.type === 'dir' &&
              //       nn.data.name.slice(nn.data.name.indexOf('src')) ===
              //         d.data.name.slice(d.data.name.indexOf('src'))
              //     ) {
              //       nn.children = d.children ? null : nn._children;
              //       fit_node = nn;
              //       this.update(
              //         fit_node,
              //         this.pre_svg,
              //         this.pre_gLink,
              //         this.pre_gNode,
              //         this.pre_dataRoot,
              //         !bReverse
              //       );
              //     }
              //   });
              d.children = d.children ? null : d._children;
              this.update(
                d,
                this.pre_svg,
                this.pre_gLink,
                this.pre_gNode,
                this.pre_dataRoot,
                bReverse
              );
              this.drawDifference(this.diffDocs, d.depth);
            }
            // else {
            //   var addFile = [];
            //   d.children = d.children ? null : d._children;
            //   d.children.forEach(ch => {
            //     if (ch.data.filetype == "add") {
            //       addFile.push({ Add: ch.data.filename });
            //     }
            //   });
            //   var table = this.tabulate(addFile, ["Add"]);
            // }

            // var max_pre_depth = 0;
            // pre_nodes.forEach(node => {
            //   if (node.depth > max_pre_depth) {
            //     max_pre_depth = node.depth;
            //   }
            // });
            // if (max_pre_depth >= 2) {
            //   this.left_move = (max_pre_depth - 2) * 50;
            // } else {
            //   this.left_move = 0;
            // }
            // var max_pre_depth = 0;
            // pre_nodes.forEach(node => {
            //   if (node.depth > max_pre_depth) {
            //     max_pre_depth = node.depth;
            //   }
            // });
            // if (max_pre_depth >= 2) {
            //   this.right_move = (max_pre_depth - 2) * 50;
            // } else {
            //   this.right_move = 0;
            // }
          });

        this.pre_node
          .append("circle")
          .attr("r", 5)
          .attr("fill", d => {
            if (d.data.type == "topic") {
              return "white";
            } else if (d.data.type == "file") {
              return this.topicColormap(d.data.topic);
            }
            return "#555";
          })
          .attr("stroke", d => {
            if (d.data.type == "topic") {
              return this.topicColormap(d.data.id);
            }
          })
          .attr("stroke-width", d => {
            if (d.data.type == "topic") {
              return 3;
            } else {
              return 1;
            }
          });

        this.pre_node
          .append("text")
          .attr("dy", "0.31em")
          .attr("x", d => (d._children ? -6 : 6))
          .attr("text-anchor", d => (d._children ? "end" : "start"))
          .text(function(d) {
            if (d.data.type == "dir") {
              return d.data.name.slice(d.data.name.lastIndexOf("\\") + 1);
            }
          })
          .clone(true)
          .lower()
          .attr("stroke-linejoin", "round")
          .attr("stroke-width", 3)
          .attr("stroke", "white");

        // Transition nodes to their new position.
        this.pre_nodeUpdate = node
          .merge(this.pre_node)
          .transition(transition)
          .attr(
            "transform",
            d => `translate(${d.y - this.left_move},${d.x + this.height / 2})`
          )
          .attr("fill-opacity", 1)
          .attr("stroke-opacity", 1);

        // Transition exiting nodes to the parent's new position.
        const nodeExit = node
          .exit()
          .transition(transition)
          .remove()
          .attr(
            "transform",
            d =>
              `translate(${source.y - this.left_move},${source.x +
                this.height / 2})`
          )
          .attr("fill-opacity", 0)
          .attr("stroke-opacity", 0);

        // Update the links…
        var diagonal = d3
          .linkHorizontal()
          .x(d => d.y - this.left_move)
          .y(d => d.x + this.height / 2);
        const link = gLink.selectAll("path").data(links, d => d.target.id);

        // Enter any new links at the parent's previous position.
        const linkEnter = link
          .enter()
          .append("path")
          .attr("d", d => {
            const o = { x: source.x0, y: source.y0 };
            return diagonal({ source: o, target: o });
          });

        // Transition links to their new position.
        link
          .merge(linkEnter)
          .transition(transition)
          .attr("d", diagonal);

        // Transition exiting nodes to the parent's new position.
        link
          .exit()
          .transition(transition)
          .remove()
          .attr("d", d => {
            const o = { x: source.x, y: source.y };
            return diagonal({ source: o, target: o });
          });

        // Stash the old positions for transition.
        dataRoot.eachBefore(d => {
          d.x0 = d.x;
          d.y0 = d.y;
        });
        this.pre_nodeTotal = node;
      }

      if (!bCollapse && this.cur_gNode != null && this.pre_gNode != null) {
        var cur_nodes = this.cur_gNode
          .selectAll("g")
          .data(this.cur_dataRoot.descendants().reverse(), d => d.id);
        var pre_nodes = this.pre_gNode
          .selectAll("g")
          .data(this.pre_dataRoot.descendants().reverse(), d => d.id);
        let collapsed = 0;
        if (cur_nodes != null && bReverse) {
          cur_nodes.filter(node => {
            let curX = node.x,
              curY = node.y;
            if (
              curX < -this.height / 2 ||
              curX > this.height / 2 - this.margin.bottom
            ) {
              var collapseNode = null;
              let count = 1;
              var temp_nodes = cur_nodes;
              temp_nodes.filter(d => {
                if (
                  d.data.type !== "file" &&
                  d.children != null &&
                  source.data.name.indexOf(
                    d.data.name.slice(d.data.name.indexOf("src"))
                  ) == -1 &&
                  count == 1
                ) {
                  collapseNode = d;
                  count++;
                }
              });
              if (count == 1) {
                console.log(curX)
                if (curX < -this.height / 2) {
                  this.update(
                    source,
                    this.cur_svg,
                    this.cur_gLink,
                    this.cur_gcollapseNode,
                    this.cur_dataRoot,
                    true,
                    true,
                    1
                  );
                } else {
                  this.update(
                    source,
                    this.cur_svg,
                    this.cur_gLink,
                    this.cur_gcollapseNode,
                    this.cur_dataRoot,
                    true,
                    true,
                    2
                  );
                }
              }
              if (collapseNode != null) {
                collapsed = 1;
                collapseNode.children = null;
                this.update(
                  collapseNode,
                  this.cur_svg,
                  this.cur_gLink,
                  this.cur_gcollapseNode,
                  this.cur_dataRoot,
                  true,
                  true
                );
                // var pre_collapseNodes = this.pre_dataRoot
                //   .descendants()
                //   .reverse();
                // pre_collapseNodes.filter(nn => {
                //   if (
                //     nn.data.type === 'dir' &&
                //     nn.data.name.slice(nn.data.name.indexOf('src')) ===
                //       collapseNode.data.name.slice(
                //         collapseNode.data.name.indexOf('src')
                //       )
                //   ) {
                //     nn.children = null;
                //     this.update(
                //       nn,
                //       this.pre_svg,
                //       this.pre_gLink,
                //       this.pre_gcollapseNode,
                //       this.pre_dataRoot,
                //       true,
                //       true
                //     );
                //   }
                // });
              }
              return true;
            }
          });
        }
        if (pre_nodes != null && !bReverse) {
          pre_nodes.filter(node => {
            let preX = node.x,
              preY = node.y;
            if (
              preX < -this.height / 2 ||
              preX > this.height / 2 - this.margin.bottom
            ) {
              var collapseNode = null;
              let count = 1;
              var temp_nodes = pre_nodes;
              var fit_node;
              temp_nodes.filter(d => {
                if (
                  d.data.type !== "file" &&
                  d.children != null &&
                  source.data.name.indexOf(
                    d.data.name.slice(d.data.name.indexOf("src"))
                  ) == -1 &&
                  count == 1
                ) {
                  collapseNode = d;
                  count++;
                }
              });
              if (count == 1) {
                if (preX < -this.height / 2) {
                  this.update(
                    source,
                    this.pre_svg,
                    this.pre_gLink,
                    this.pre_gcollapseNode,
                    this.pre_dataRoot,
                    false,
                    true,
                    1
                  );
                } else {
                  this.update(
                    source,
                    this.pre_svg,
                    this.pre_gLink,
                    this.pre_gcollapseNode,
                    this.pre_dataRoot,
                    false,
                    true,
                    2
                  );
                }
              }
              if (collapseNode != null) {
                collapseNode.children = null;
                this.update(
                  collapseNode,
                  this.pre_svg,
                  this.pre_gLink,
                  this.pre_gcollapseNode,
                  this.pre_dataRoot,
                  false,
                  true
                );
                // var cur_collapseNodes = this.cur_dataRoot
                //   .descendants()
                //   .reverse();
                // cur_collapseNodes.filter(nn => {
                //   if (
                //     nn.data.type === 'dir' &&
                //     nn.data.name.slice(nn.data.name.indexOf('src')) ===
                //       collapseNode.data.name.slice(
                //         collapseNode.data.name.indexOf('src')
                //       )
                //   ) {
                //     nn.children = null;
                //     this.update(
                //       nn,
                //       this.cur_svg,
                //       this.cur_gLink,
                //       this.cur_gcollapseNode,
                //       this.cur_dataRoot,
                //       true,
                //       true
                //     );
                //   }
                // });
              }
              return true;
            }
          });
        }
      }

      // pre_nodes.filter(node => {
      //   let preX = node.x,
      //     preY = node.y;
      //   if (preX < -this.height / 2 + margin.top) {
      //     if (node.data.type === 'dir' && node.data.name != source.data.name) {
      //       node.children = node.children ? null : node._children;
      //       this.update(
      //         node,
      //         this.pre_svg,
      //         this.pre_gLink,
      //         this.pre_gNode,
      //         this.pre_dataRoot,
      //         true
      //       );
      //     }
      //     return true;
      //   }
      // });
    },
    drawPreHierarchy(data, bInitial = true) {
      this.svg.selectAll(".pre-hierarchy-node").remove();

      let root = d3.hierarchy(data);
      if (bInitial) {
        this.pre_dataRoot = root;
      }

      var margin = { top: 20, right: 90, bottom: 30, left: 90 };
      this.pre_svg = this.svg
        .append("g")
        .attr("class", "pre-hierarchy-node")
        .attr("width", this.width / 2)
        .attr("height", this.height)
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .style("font", "10px sans-serif")
        .style("user-select", "none");

      // this.pre_dataRoot = d3.hierarchy(data);

      this.pre_dataRoot.x0 = 0;
      this.pre_dataRoot.y0 = this.height / 2;
      this.pre_dataRoot.descendants().forEach((d, i) => {
        d.id = i;
        d._children = d.children;
        // if (d.depth && d.data.name.length !== 7) d.children = null;
        if (d.data.type !== "dir") d.children = null;
      });

      this.pre_gLink = this.pre_svg
        .append("g")
        .attr("fill", "none")
        .attr("stroke", "#555")
        .attr("stroke-opacity", 0.4)
        .attr("stroke-width", 1.5);

      this.pre_gNode = this.pre_svg
        .append("g")
        .attr("presor", "pointer")
        .attr("pointer-events", "all");

      this.pre_dataRoot.children.forEach(collapse);
      if (bInitial) {
        this.update(
          this.pre_dataRoot,
          this.pre_svg,
          this.pre_gLink,
          this.pre_gNode,
          this.pre_dataRoot,
          false
        );
      } else {
        this.update(
          this.pre_dataRoot,
          this.pre_svg,
          this.pre_gLink,
          this.pre_gNode,
          this.pre_dataRoot,
          false,
          true
        );
      }

      function collapse(d) {
        if (d.children) {
          d._children = d.children;
          d._children.forEach(collapse);
          d.children = null;
        }
      }
    },
    findMove(dataRoot, fileID, bCur) {
      var nodes = dataRoot.descendants().reverse();
      nodes.forEach(node => {
        if (node.data.type == "file") {
          if (node.data.id == fileID) {
            if (bCur) {
              this.move_curnode = node;
              return;
            } else {
              this.move_prenode = node;
              return;
            }
          }
        } else {
          node._children.forEach(d => {
            if (d.data.type == "file") {
              if (d.data.id == fileID) {
                if (bCur) {
                  this.move_curnode = d;
                  return;
                } else {
                  this.move_prenode = d;
                  return;
                }
              }
            } else {
              this.findMove(d, fileID, bCur);
            }
          });
        }
      });
    },
    // 根据差异文件改变节点边框及颜色
    drawDifference(data) {
      let addDocs = data.add,
        delDocs = data.del,
        editDocs = data.edit;

      this.cur_node
        .filter(node => {
          if (addDocs.indexOf(node.data.id) != -1) {
            var flag = true;
            editDocs.forEach(doc => {
              if (doc.length === 3) {
                if (doc[0] == node.data.id || doc[1] == node.data.id) {
                  flag = false;
                  return false;
                }
              }
            });
            return flag;
          }
        })
        .style("stroke", "black")
        .attr("stroke-width", 1)
        .attr("stroke-opacity", 1);

      this.pre_node
        .filter(node => {
          if (delDocs.indexOf(node.data.id) != -1) {
            var flag = true;
            editDocs.forEach(doc => {
              if (doc.length === 3) {
                if (doc[0] == node.data.id || doc[1] == node.data.id) {
                  flag = false;
                  return false;
                }
              }
            });
            return flag;
          }
        })
        // .style('stroke', 'grey')
        // .attr('stroke-dasharray', '5,5')
        .attr("opacity", 0.5);

      editDocs.forEach(doc => {
        if (doc.length === 3) {
          var cur_nodes = this.cur_gNode
            .selectAll("g")
            .data(this.cur_dataRoot.descendants().reverse(), d => d.id);
          var pre_nodes = this.pre_gNode
            .selectAll("g")
            .data(this.pre_dataRoot.descendants().reverse(), d => d.id);
          // var cur_nodes = this.cur_dataRoot.descendants().reverse();
          // var pre_nodes = this.pre_dataRoot.descendants().reverse();
          this.move_curnode = null;
          this.move_prenode = null;
          this.findMove(this.cur_dataRoot, doc[1], true);
          this.findMove(this.pre_dataRoot, doc[0], false);
          let find_cur = false,
            find_pre = false;
          let tempcur_node = null,
            temppre_node = null;
          while (tempcur_node == null) {
            cur_nodes.filter(node => {
              if (
                node.id == this.move_curnode.id &&
                node.type == this.move_curnode.type &&
                tempcur_node == null
              ) {
                tempcur_node = node;
                find_cur = true;
              }
            });
            this.move_curnode = this.move_curnode.parent;
          }
          while (temppre_node == null) {
            pre_nodes.filter(node => {
              if (
                node.id == this.move_prenode.id &&
                node.type == this.move_prenode.type &&
                temppre_node == null
              ) {
                temppre_node = node;
                find_pre = true;
              }
            });
            this.move_prenode = this.move_prenode.parent;
          }
          if (tempcur_node.data.type != "file") {
            var tempcur_node_name = tempcur_node.data.name.slice(
              tempcur_node.data.name.indexOf("src")
            );
          } else {
            var tempcur_node_name = tempcur_node.data.filename.slice(
              tempcur_node.data.filename.indexOf("src")
            );
          }
          if (temppre_node.data.type == "file") {
            var temppre_node_name = temppre_node.data.filename.slice(
              temppre_node.data.filename.indexOf("src")
            );
          } else {
            var temppre_node_name = temppre_node.data.name.slice(
              temppre_node.data.name.indexOf("src")
            );
          }
          if (
            tempcur_node != null &&
            temppre_node != null &&
            tempcur_node.depth == this.max_cur_depth &&
            temppre_node.depth == this.max_pre_depth &&
            tempcur_node_name != temppre_node_name
          ) {
            let startX, startY, endX, endY;
            startX = temppre_node.y + this.margin.left - this.left_move;
            startY = temppre_node.x + this.height / 2 + 20;
            endX =
              this.width - tempcur_node.y - this.margin.left + this.right_move;
            endY = tempcur_node.x + this.height / 2 + 20;
            // console.log(startX, startY, endX, endY);
            if (startX != null && endX != null) {
              this.svg
                .append("line")
                .style("stroke", "grey")
                .style("opacity", 0.7)
                .style("stroke-dasharray", "10,3")
                .attr("x1", startX)
                .attr("y1", startY)
                .attr("x2", endX)
                .attr("y2", endY);
            }
          }
        }
      });
    }
  },
  created() {
    // 选择单个版本进行查看
    this.$bus.$on("version-selected", d => {
      this.cur_version = d.version;
      this.$axios
        .get("topics/getFileHierarchyByVersion", { version: d.version })
        .then(({ data }) => {
          this.drawCurHierarchy(data);
        });
    });

    this.$bus.$on("version-selected", d => {
      this.svg.selectAll("line").remove();
    });

    // 选择两个版本进行比较
    this.$bus.$on("version-range-selected", d => {
      this.svg.selectAll("line").remove();
      this.left_move = 0;
      this.right_move = 0;
      let curv = d.curv,
        prev = d.prev;
      this.diffDocs = d.diffDocs;
      if (curv != this.cur_version) {
        this.cur_version = curv;
        this.$axios
          .get("topics/getFileHierarchyByVersion", { version: curv })
          .then(({ data }) => {
            this.cur_Data = data;
            this.drawCurHierarchy(data);
          });
      }
      this.$axios
        .get("topics/getFileHierarchyByVersion", { version: prev })
        .then(({ data }) => {
          this.drawPreHierarchy(data);
          this.pre_Data = data;
          this.drawDifference(this.diffDocs);
        });
    });
  },
  mounted() {
    this.$bus.$on("get-doc-topic", d => {
      this.fileData = d.fileData;
    });
    this.height = Math.floor(this.$refs.root.clientHeight);
    this.width = Math.floor(this.$refs.root.clientWidth);
    this.svg = d3
      .select(".sunburst")
      .append("svg")
      .attr("width", this.width)
      .attr("height", this.height)
      .append("g")
      .attr("class", "main_svg");
  }
};
</script>

<style lang='less'>
.sunburst {
  height: 100%;
  width: 100%;
  font-size: 20px;
  overflow: unset;
}
</style>