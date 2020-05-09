<template>
    <div class="code-wrapper" ref="root">
        <code-diff id="diff-lines" 
            :old-string="oldCode"
            :new-string="newCode"
            :context="10"/>
    </div>
</template>

<script>
import * as d3 from 'd3'
import { getRelPathWithVersion } from '../utils/index.js'
export default {
    name: 'component_name',
    data() {
        return{
            newCode: '',
            oldCode: '',
            height: 0,
            width: 0
        }
    },
    created(){
        this.$bus.$on('doc-selected', filename => {
            this.$axios.get('topics/getCode', {filename: filename}).then(({ data }) => {
                this.oldCode = ''
                this.newCode = data
            })
        })
    }
}
</script>
 
<style lang='less'>
.code-wrapper{
    height: 100%;
    font-weight: bold;
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
