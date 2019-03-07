<template>
  <div class="code-wrapper"  v-show="isShow"
        v-highlight 
        v-html="codeText">
  </div>
</template>

<script>
import * as d3 from 'd3'
export default {
    name: 'component_name',
    data() {
        return{
            isShow: false,
            codeText: '',
            height: 0,
            width: 0
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
        this.$bus.$on('code-radio-selected', d =>{
            if(d === '1')
                this.isShow = true
            if(d === '2')
                this.isShow = false
        })
    }
}
</script>
 
<style lang='less'>
.code-wrapper{
    height: 100%;
    // width: 100%;
    font-weight: bold;
}
</style>
