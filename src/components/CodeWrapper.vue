<template>
    <div class="code-wrapper" ref="root">
        <div id="curtitle" v-html="curtitle"></div>
        <div id="pretitle" v-html="pretitle"></div>
        <div id="cur-code" style="visibility: hidden" v-highlight v-html="curCode"></div>
        <code-diff id="diff-code" style="visibility: hidden"
            :old-string="oldCode"
            :new-string="newCode"
            :context="10"/>
    </div>
</template>

<script>
import * as d3 from 'd3'
export default {
    name: 'component_name',
    data() {
        return{
            newCode: '',
            oldCode: '',
            curCode: '',
            curtitle: '',
            pretitle: ''
        }
    },
    props: ["libraryName"],
    created(){
        this.$bus.$on('file-selected', d =>{
            d3.select('#diff-code').style('visibility', 'hidden')
            d3.select('#cur-code').style('visibility', 'visible')
            this.newCode = ''
            this.oldCode = ''
            this.curCode = ''
            this.curtitle = ''
            this.pretitle = ''

            this.$axios.get('topics/getFileContent', {
                curName: d
            }).then(({ data }) => {
                this.curtitle = d.replace('../Data/'+this.libraryName+'/'+this.libraryName+'-all-versions/', '')
                this.curCode = `<pre><code>${data.curCode}</code></pre>`
            })
        })
        this.$bus.$on('compared-file-selected', d => {
            d3.select('#cur-code').style('visibility', 'hidden')
            d3.select('#diff-code').style('visibility', 'visible')
            this.newCode = ''
            this.oldCode = ''
            this.curCode = ''
            this.curtitle = ''
            this.pretitle = ''

            let curName = d.curName, preName = d.preName
            this.$axios.get('topics/getFileContent', {
                curName: curName, preName: preName
            }).then(({ data }) => {
                if(curName)
                    this.curtitle = curName.replace('../Data/'+this.libraryName+'/'+this.libraryName+'-all-versions/', '')
                if(preName)
                    this.pretitle = preName.replace('../Data/'+this.libraryName+'/'+this.libraryName+'-all-versions/', '')
                this.newCode = data.curCode
                this.oldCode = data.preCode
            }) 
        })
    }
}
</script>
 
<style lang='less'>
.code-wrapper{
    height: 100%;
    font-weight: bold;
    font-size: 15px;
    #curtitle{
        padding-top: 5px;
        background: #eee;
        text-align: center;
    }
    #pretitle{
        padding: 5px;
        background: #eee;
        text-align: center;
    }
    // #cur-code{
    //     padding: 10px;
    // }
    #diff-code{
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
                width: 0px;
            }
            .line-num2{
                width: 20px;
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
</style>
