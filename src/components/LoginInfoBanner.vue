<template>
  <Transition name="login-banner">
    <div v-if="visible" class="login-info-banner">
      <div class="banner-header">
        <div class="banner-title">
          <CheckCircleFilled class="success-icon" />
          <span>登录成功</span>
        </div>
        <button type="button" class="close-btn" aria-label="关闭" @click="close">×</button>
      </div>
      <div class="banner-body">
        <div class="info-row">
          <span class="info-label">登录时间</span>
          <span class="info-value">{{ formattedTime || '-' }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">登录 IP</span>
          <span class="info-value">{{ info?.ip || '-' }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">登录地点</span>
          <span class="info-value">{{ info?.location || '-' }}</span>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { CheckCircleFilled } from '@ant-design/icons-vue'

const LOGIN_INFO_KEY = 'loginInfo'

export interface LoginInfoPayload {
  ip: string
  location?: string
  country?: string
  region?: string
  city?: string
  isp?: string
  loginTime?: string
}

const visible = ref(false)
const info = ref<LoginInfoPayload | null>(null)

const formattedTime = computed(() => {
  if (!info.value?.loginTime) return ''
  const date = new Date(info.value.loginTime)
  if (Number.isNaN(date.getTime())) return info.value.loginTime

  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
})

let timer: ReturnType<typeof setTimeout> | null = null

const close = () => {
  visible.value = false
  sessionStorage.removeItem(LOGIN_INFO_KEY)
  if (timer) {
    clearTimeout(timer)
    timer = null
  }
}

onMounted(() => {
  const raw = sessionStorage.getItem(LOGIN_INFO_KEY)
  if (!raw) return

  try {
    info.value = JSON.parse(raw) as LoginInfoPayload
  } catch {
    sessionStorage.removeItem(LOGIN_INFO_KEY)
    return
  }

  sessionStorage.removeItem(LOGIN_INFO_KEY)
  requestAnimationFrame(() => {
    visible.value = true
  })

  timer = setTimeout(close, 5000)
})
</script>

<style scoped>
.login-info-banner {
  position: fixed;
  left: 20px;
  bottom: 20px;
  z-index: 1100;
  width: 300px;
  max-width: calc(100vw - 40px);
  padding: 12px 14px;
  background: #1a2332;
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.28);
  color: #e8edf5;
}

.banner-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.banner-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: #52c41a;
}

.success-icon {
  font-size: 16px;
  color: #52c41a;
}

.close-btn {
  border: none;
  background: transparent;
  color: #8c98a9;
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  padding: 0 2px;
}

.close-btn:hover {
  color: #c5cedb;
}

.banner-body {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.info-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  font-size: 12px;
  line-height: 1.5;
}

.info-label {
  flex-shrink: 0;
  color: #9aa7b8;
}

.info-value {
  text-align: right;
  color: #eef2f7;
  word-break: break-all;
}

.login-banner-enter-active,
.login-banner-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.login-banner-enter-from,
.login-banner-leave-to {
  opacity: 0;
  transform: translateY(12px);
}

@media (max-width: 768px) {
  .login-info-banner {
    left: 12px;
    bottom: 12px;
    width: min(280px, calc(100vw - 24px));
    padding: 10px 12px;
  }
}
</style>
