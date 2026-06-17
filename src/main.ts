import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'
import 'dayjs/locale/zh-cn'
import dayjs from 'dayjs'

// 设置 dayjs 为中文
dayjs.locale('zh-cn')

const app = createApp(App)
app.use(router)
app.use(Antd)
app.mount('#app')
