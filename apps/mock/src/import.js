import Vue from 'vue'
import { pinia } from '@/plugins'
import Directives from '@/plugins/Directives'

import App from './App.vue'
import '@/plugins/vue/element-ui'

import '@assets/css/element-style.scss'

import '@/plugins/unocss.platform'

Vue.use(Directives)

new Vue({
  pinia,
  render: h => h(App),
}).$mount('#app')
