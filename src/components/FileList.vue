<template>
  <div class='file-list'
       ref='root'>
  </div>
</template>

<script>
import * as d3 from 'd3'
import {getVersion} from '../utils/index.js'
export default {
    name: 'component_name',
    data() {
        return {
            width: 0,
            height: 0,
            changedFiles: []
        }
    },
    props:['fileGroup', 'prevVer'],
    methods:{
        draw(data){
            this.$refs.root.innerHTML = ''
            const margin = { top: 20, right: 20, bottom: 20, left: 20 }
            var svgWidth = this.width - margin.left - margin.right,
                svgHeight = this.height - margin.top - margin.bottom
            var barHeight = 23
            const svg = d3.select(this.$refs.root)
                .append('svg')
                .attr('width', svgWidth)
                .attr('height', svgHeight)
                .attr('transform', 'translate(' + [margin.left, margin.top] + ')')
            var y = d3.scaleLinear()
                .range([svgHeight, 0])
            var yAxis = d3.axisLeft(y)
                .tickFormat('')
                .tickSize(0)
            var leftTextG = svg.selectAll('g')
                .data(data)
                .enter().append('g')
                .attr('transform', (d, i) => {
                    return 'translate(0,' + i*barHeight + ')'
                })
            var rightTextG = svg.selectAll('g')
                .data(data)
                .enter().append('g')
                .attr('transform', (d, i) => {
                    return 'translate(' + [svgWidth/2, i*barHeight] + ')'
                })
            leftTextG.append('text')
                .text(d => {
                    if(d.type === 'del')
                        return d.fileName
                    if(d.type === 'edit')
                        return d.fileName[0]
                })
            rightTextG.append('text')
                .text(d => {
                    if(d.type === 'add')
                        return d.fileName
                    if(d.type === 'edit')
                        return d.fileName[1]
                }) 
            svg.append('g')
                .attr('class', 'y axis')
                .attr('transform', 'translate(' + [svgWidth/2, 0] + ')')
                .call(yAxis)  
        }
    },
    watch: {
        fileGroup(){
            this.fileGroup.addDocs.forEach(doc => {
                this.changedFiles.push({
                    fileIds: doc.id,
                    fileName: doc.filename.substr(doc.filename.lastIndexOf('\\') + 1),
                    type: 'add',
                    filePath: doc.filename
                }) 
            })
            this.fileGroup.delDocs.forEach(doc => {
                this.changedFiles.push({
                    fileIds: doc.id,
                    fileName: doc.filename.substr(doc.filename.lastIndexOf('\\') + 1),
                    type: 'del',
                    filePath: doc.filename
                }) 
            })
            Object.keys(this.fileGroup.editDocsObj).forEach(key => {
                let val = this.fileGroup.editDocsObj[key]
                if(val.length === 2) {
                    var preData, curData
                    let version = getVersion(val[0].filename)
                    if(version === this.prevVer) {
                        preData = val[0]
                        curData = val[1]
                    }
                    else {
                        preData = val[1]
                        curData = val[0]
                    }
                    this.changedFiles.push({
                        fileIds: [preData.id, curData.id],
                        fileName: preData.filename.substr(preData.filename.lastIndexOf('\\') + 1),
                        type: 'edit',
                        filePath: [preData.filename, curData.filename]
                    })
                }
            })
        }
    },
    mounted(){
        this.height = Math.floor(this.$refs.root.clientHeight)
        this.width = Math.floor(this.$refs.root.clientWidth)
        this.$bus.$on('cluster-selected', clusters => {
            if(!clusters)
                this.$refs.root.innerHTML = ''
            var selectedFiles = []
            clusters.forEach(d => {
                let doc = this.changedFiles.find(doc => {
                    return (doc.fileIds === d || doc.fileIds[0] === d)
                })
                if(doc) selectedFiles.push(doc)
            })
            this.draw(selectedFiles)
        })
    }
}
</script>

<style lang="less">
.file-list{
    height:100%;
    overflow: auto;
}
</style>
