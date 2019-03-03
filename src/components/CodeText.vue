<template>
  <div class='code-text' 
        v-highlight 
        v-html="codeText"
        v-show="isShow">
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
.code-text{
    height: 100%;
}
</style>
