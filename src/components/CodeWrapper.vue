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
            this.isShow = true
            this.$axios
            .get('topics/getCode', { filepath: selectedDoc.filename})
            .then(({ data }) => {
                this.codeText = `<pre><code>${data}</code></pre>`
            })
        })
    }
}
</script>
 
<style lang='less'>
.code-wrapper{
    height: 100%;
    width: 100%;
    font-weight: bold;
}
</style>
