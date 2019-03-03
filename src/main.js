import Vue from 'vue'
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'
import App from './App.vue'
import axios from './utils/http'
import './assets/common.less'
import Highlight from './directives/highlight.js'

Vue.config.productionTip = false
Vue.prototype.$axios = axios
Vue.prototype.$bus = new Vue()
Vue.use(ElementUI)
Vue.use(Highlight)
new Vue({
  render: h => h(App)
}).$mount('#app')
