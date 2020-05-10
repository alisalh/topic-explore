import Vue from 'vue'
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'
import App from './App.vue'
import axios from './utils/http'
import vueCodeDiff from 'vue-code-diff'
import Highlight from './directives/highlight.js'
import './assets/common.less'
import 'font-awesome/scss/font-awesome.scss'

Vue.config.productionTip = false
Vue.prototype.$axios = axios
Vue.prototype.$bus = new Vue()
Vue.use(ElementUI)
Vue.use(Highlight)
Vue.use(vueCodeDiff)
new Vue({
  render: h => h(App)
}).$mount('#app')
