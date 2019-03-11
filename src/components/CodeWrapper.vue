<template>
  <div class="code-wrapper" v-show="isShow"
    @pointerdown="handleDown"
    @pointerup="handleUp"
    @pointercancel="handleUp"
    :style="style"
    ref="root">
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
            left: 0,
            top: 0,
            x: 1632,
            y: 370,
            height: 550, 
            width: 400,
            clientHeight: document.body.clientHeight,
            clientWidth: document.body.clientWidth
        }
    },
    methods:{
        iconClick(){
            this.isShow = false
            this.x = 1632
            this.y = 370
        },
        handleMove({ pageX, pageY, clientX, clientY }) {
            if (this.$refs.root) {
                this.x = pageX + this.left
                this.y = pageY + this.top
                if(this.x > this.clientWidth - this.width)
                    this.x = this.clientWidth - this.width
                if(this.x < 0)
                    this.x = 0
                if(this.y > this.clientHeight - this.height)
                    this.y= this.clientHeight - this.height
                if(this.y < 0)
                    this.y = 0
            }
        },
        handleDown(event) {
            const { pageX, pageY } = event;
            const { left, top } = this.$refs.root.getBoundingClientRect()
            this.left = left - pageX;
            this.top = top - pageY;
            document.addEventListener("pointermove", this.handleMove)
        },
        handleUp() {
            document.removeEventListener("pointermove", this.handleMove)
        }   
    }, 
    computed: {
        style() {
            return {
                left: `${this.x}px`,
                top: `${this.y}px`
            }
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
