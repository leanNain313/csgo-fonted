import axios from 'axios'
import { message } from 'ant-design-vue'
import { getToken, logout } from './auth'
import router from '@/router'

declare module 'axios' {
  export interface AxiosRequestConfig {
    silent?: boolean
  }
}

const request = axios.create({
  baseURL: '/api',
  timeout: 10000
})

// 请求拦截器
request.interceptors.request.use(
  config => {
    const token = getToken()
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  response => {
    const res = response.data
    const silent = Boolean(response.config.silent)
    if (res.code !== 200) {
      if (!silent) {
        message.error(res.message || '请求失败')
      }
      return Promise.reject(new Error(res.message || '请求失败'))
    }
    return res.data
  },
  error => {
    if (error.code === 'ERR_CANCELED' || error.name === 'CanceledError') {
      return Promise.reject(error)
    }
    const silent = Boolean(error.config?.silent)
    if (error.response?.status === 401) {
      if (!silent) {
        message.error('登录已过期，请重新登录')
        logout()
        router.push('/login')
      }
    } else if (!silent) {
      if (error.response?.status === 403) {
        message.error(error.response?.data?.message || '无权限访问')
      } else {
        message.error(error.message || '网络错误')
      }
    }
    return Promise.reject(error)
  }
)

export default request
