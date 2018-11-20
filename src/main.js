import Vue from 'vue'
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'
import App from './App.vue'
import axios from './utils/http'
import './assets/common.less'
Vue.config.productionTip = false
Vue.prototype.$axios = axios
Vue.prototype.$bus = new Vue()
Vue.use(ElementUI)
new Vue({
  render: h => h(App)
}).$mount('#app')
