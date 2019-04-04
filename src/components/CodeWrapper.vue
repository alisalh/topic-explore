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
    <div class="code"> 
        <div id="no-diff-lines" v-show="isShow1"
            v-highlight v-html="`<pre><code>${codeText}</code></pre>`"></div>
        <code-diff id="diff-lines" v-show="isShow2"
            :old-string="oldCodeText"
            :new-string="codeText"
            :context="10"/>
    </div>
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
            clientWidth: document.body.clientWidth,
            oldCodeText: '',
            isShow1: false,
            isShow2: false
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
            if(selectedDoc.length === 1){
                this.isShow1 = true
                this.isShow2 = false
                this.$axios
                .get('topics/getCode', { filepath: selectedDoc[0].filename})
                .then(({ data }) => {
                    this.codeText = data
                })
            }
            if(selectedDoc.length === 2){
                this.isShow1 = false
                this.isShow2 = true
                if(selectedDoc[0]){
                    this.$axios
                    .get('topics/getCode', { filepath: selectedDoc[0].filename})
                    .then(({ data }) => {
                        this.oldCodeText = data
                    })
                }
                else
                    this.oldCodeText = ''
                if(selectedDoc[1]){
                    this.$axios
                    .get('topics/getCode', { filepath: selectedDoc[1].filename})
                    .then(({ data }) => {
                        this.codeText = data
                    })
                }
                else
                    this.codeText = ''
            }
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
        width: 100%;
        #no-diff-lines{
            font-size: 15px;
            padding: 0 10px;
        }
        #diff-lines{
            .d2h-file-wrapper{
                margin-bottom: 0cm;
            }
            .d2h-diff-tbody > tr > td{
                height: 100%;
            }
            .d2h-code-linenumber {
                position: relative;
                display: flex;
                width: 100%;
                .line-num1{
                    width: 30px;
                }
                .line-num2{
                    width: 50px;
                }
            }
            .d2h-file-wrapper{
                border: 0cm;
            }
            .d2h-file-diff{
                overflow: unset;
            }
            .d2h-code-line {
                margin-left: 0;
                font-size: 15px;
            }
        }
    }
}
</style>
