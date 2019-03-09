<template>
  <div class="code-wrapper" v-show="isShow">
    <div class="header">
        <div class="title">The Source Code</div>
        <i class="el-icon-close"
         @click="iconClick"></i>
    </div>
    <div class="code" v-highlight 
        v-html="codeText"></div>
  </div>
</template>

<script>
import * as d3 from 'd3'
import { getRelPathWithVersion } from '../utils/index.js'
export default {
    name: 'component_name',
    data() {
        return{
            isShow: false,
            codeText: '',
            height: 0,
            width: 0,
            path: ''
        }
    },
    methods:{
        iconClick(){
            this.isShow = false
        }
    },
    created(){
        this.$bus.$on('doc-selected', selectedDoc => {
            this.$axios
            .get('topics/getCode', { filepath: selectedDoc.filename})
            .then(({ data }) => {
                this.codeText = `<pre><code>${data}</code></pre>`
            })
        })
        this.$bus.$on('show-code', d => this.isShow = d)
    }
}
</script>
 
<style lang='less'>
.code-wrapper{
    position: absolute;
    height: 550px;
    width: 400px;
    display: flex;
    flex-direction: column;
    font-weight: bold;
    left: 80%;
    top: 36%;
    .header{
        flex: 0.6;
        background-color:rgb(245, 245, 245);
        padding-top: 8px;
        padding-left: 10px;
        display: flex;
        .title{
            flex: 6;
        }
        .el-icon-close{
            flex: 0.5;
        }
    }
    .code{
        flex: 10;
        overflow: auto;
    }
}
</style>
