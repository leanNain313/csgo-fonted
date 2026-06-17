<template>
  <div class="login-page" ref="pageRef">
    <section class="brand-panel">
      <div class="brand-mark">
        <span class="brand-mark-icon"><LineChartOutlined /></span>
        <span>CS:GO Trading</span>
      </div>

      <div class="brand-copy">
        <p class="brand-kicker">饰品资产管理台</p>
        <h1>用更清晰的视角管理库存与收益</h1>
        <p class="brand-subtitle">统一记录购入、出售、市价刷新与浮动盈亏，让每一次交易都有迹可循。</p>
      </div>

      <div class="insight-board">
        <div class="insight-main">
          <div class="insight-label">今日浮动盈亏</div>
          <div class="insight-value positive">+¥ 2,486.80</div>
          <div class="insight-meta">较昨日 +3.42%</div>
        </div>
        <div class="insight-grid">
          <div class="insight-item">
            <DatabaseOutlined />
            <span>库存估值</span>
            <strong>¥86,240</strong>
          </div>
          <div class="insight-item">
            <RiseOutlined />
            <span>活跃饰品</span>
            <strong>128</strong>
          </div>
        </div>
      </div>
    </section>

    <section class="auth-panel">
      <a-card class="login-card" :bordered="false">
        <div class="card-head">
          <div>
            <p class="card-kicker">Welcome back</p>
            <h2>{{ activeTabTitle }}</h2>
          </div>
          <a-tag color="processing">Secure</a-tag>
        </div>

        <a-tabs v-model:activeKey="activeTab" centered class="auth-tabs">
          <a-tab-pane key="login" tab="登录">
            <a-form :model="loginForm" layout="vertical" @finish="handleLogin">
              <a-form-item label="用户名" name="username" :rules="[{ required: true, message: '请输入用户名' }]">
                <a-input v-model:value="loginForm.username" size="large" placeholder="请输入用户名" autocomplete="username">
                  <template #prefix><UserOutlined /></template>
                </a-input>
              </a-form-item>
              <a-form-item label="密码" name="password" :rules="[{ required: true, message: '请输入密码' }]">
                <a-input-password
                  v-model:value="loginForm.password"
                  size="large"
                  placeholder="请输入密码"
                  autocomplete="current-password"
                >
                  <template #prefix><LockOutlined /></template>
                </a-input-password>
              </a-form-item>
              <a-button type="primary" html-type="submit" block size="large" class="submit-btn" :loading="loading">
                登录
              </a-button>
              <div class="login-links">
                <a @click="setTab('register')">注册账号</a>
                <a @click="setTab('forgot')">忘记密码</a>
              </div>
            </a-form>
          </a-tab-pane>

          <a-tab-pane key="register" tab="注册">
            <a-form :model="registerForm" layout="vertical" @finish="handleRegister">
              <a-form-item label="用户名" name="username" :rules="[{ required: true, message: '请输入用户名' }]">
                <a-input v-model:value="registerForm.username" size="large" placeholder="设置用户名" autocomplete="username">
                  <template #prefix><UserOutlined /></template>
                </a-input>
              </a-form-item>
              <a-form-item label="邮箱" name="email" :rules="[{ required: true, type: 'email', message: '请输入有效邮箱' }]">
                <a-input v-model:value="registerForm.email" size="large" placeholder="name@example.com" autocomplete="email">
                  <template #prefix><MailOutlined /></template>
                </a-input>
              </a-form-item>
              <a-form-item label="验证码" name="verificationCode" :rules="[{ required: true, message: '请输入验证码' }]">
                <a-input-group compact class="code-group">
                  <a-input
                    v-model:value="registerForm.verificationCode"
                    size="large"
                    placeholder="邮箱验证码"
                    autocomplete="one-time-code"
                  >
                    <template #prefix><SafetyCertificateOutlined /></template>
                  </a-input>
                  <a-button size="large" class="code-btn" :disabled="registerCountdown > 0" @click="sendRegisterCode">
                    {{ registerCountdown > 0 ? `${registerCountdown}s` : '获取验证码' }}
                  </a-button>
                </a-input-group>
              </a-form-item>
              <a-form-item label="密码" name="password" :rules="[{ required: true, message: '请输入密码' }]">
                <a-input-password
                  v-model:value="registerForm.password"
                  size="large"
                  placeholder="设置登录密码"
                  autocomplete="new-password"
                >
                  <template #prefix><LockOutlined /></template>
                </a-input-password>
              </a-form-item>
              <a-button type="primary" html-type="submit" block size="large" class="submit-btn" :loading="loading">
                注册
              </a-button>
            </a-form>
          </a-tab-pane>

          <a-tab-pane key="forgot" tab="找回密码">
            <a-form :model="resetForm" layout="vertical" @finish="handleResetPassword">
              <a-form-item label="注册邮箱" name="email" :rules="[{ required: true, type: 'email', message: '请输入有效邮箱' }]">
                <a-input v-model:value="resetForm.email" size="large" placeholder="注册邮箱" autocomplete="email">
                  <template #prefix><MailOutlined /></template>
                </a-input>
              </a-form-item>
              <a-form-item label="验证码" name="verificationCode" :rules="[{ required: true, message: '请输入验证码' }]">
                <a-input-group compact class="code-group">
                  <a-input
                    v-model:value="resetForm.verificationCode"
                    size="large"
                    placeholder="邮箱验证码"
                    autocomplete="one-time-code"
                  >
                    <template #prefix><SafetyCertificateOutlined /></template>
                  </a-input>
                  <a-button size="large" class="code-btn" :disabled="resetCountdown > 0" @click="sendResetCode">
                    {{ resetCountdown > 0 ? `${resetCountdown}s` : '获取验证码' }}
                  </a-button>
                </a-input-group>
              </a-form-item>
              <a-form-item label="新密码" name="newPassword" :rules="[{ required: true, message: '请输入新密码' }]">
                <a-input-password
                  v-model:value="resetForm.newPassword"
                  size="large"
                  placeholder="设置新密码"
                  autocomplete="new-password"
                >
                  <template #prefix><LockOutlined /></template>
                </a-input-password>
              </a-form-item>
              <a-button type="primary" html-type="submit" block size="large" class="submit-btn" :loading="loading">
                重置密码
              </a-button>
            </a-form>
          </a-tab-pane>
        </a-tabs>
      </a-card>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import {
  DatabaseOutlined,
  LineChartOutlined,
  LockOutlined,
  MailOutlined,
  RiseOutlined,
  SafetyCertificateOutlined,
  UserOutlined
} from '@ant-design/icons-vue'
import gsap from 'gsap'
import { login, register, resetPassword, sendVerificationCode } from '@/api/user'
import { setToken, setUser } from '@/utils/auth'

const router = useRouter()
const route = useRoute()
const loading = ref(false)
const activeTab = ref('login')
const registerCountdown = ref(0)
const resetCountdown = ref(0)
const pageRef = ref<HTMLElement | null>(null)

const loginForm = reactive({ username: '', password: '' })
const registerForm = reactive({ username: '', password: '', email: '', verificationCode: '' })
const resetForm = reactive({ email: '', verificationCode: '', newPassword: '' })

const activeTabTitle = computed(() => {
  if (activeTab.value === 'register') return '创建账号'
  if (activeTab.value === 'forgot') return '重置密码'
  return '账号登录'
})

const applyTabFromRoute = () => {
  const tab = typeof route.query.tab === 'string' ? route.query.tab : ''
  if (tab === 'register' || tab === 'forgot' || tab === 'login') {
    activeTab.value = tab
  }
}

const setTab = (tab: string) => {
  activeTab.value = tab
  router.replace({ path: '/login', query: tab === 'login' ? undefined : { tab } })
}

const getPostAuthPath = () => {
  const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : ''
  if (redirect && redirect !== '/' && !redirect.startsWith('/login')) {
    return redirect
  }
  return '/statistics'
}

watch(
  () => route.query.tab,
  () => applyTabFromRoute(),
  { immediate: true }
)

watch(activeTab, tab => {
  if (route.path !== '/login') return
  const routeTab = typeof route.query.tab === 'string' ? route.query.tab : ''
  if (routeTab !== tab) {
    router.replace({ path: '/login', query: tab === 'login' ? undefined : { tab } })
  }
})

const startCountdown = (target: typeof registerCountdown) => {
  target.value = 60
  const timer = setInterval(() => {
    target.value--
    if (target.value <= 0) clearInterval(timer)
  }, 1000)
}

const sendRegisterCode = async () => {
  if (!registerForm.email) {
    message.warning('请先填写邮箱')
    return
  }
  await sendVerificationCode(registerForm.email, 'REGISTER')
  message.success('验证码已发送')
  startCountdown(registerCountdown)
}

const sendResetCode = async () => {
  if (!resetForm.email) {
    message.warning('请先填写邮箱')
    return
  }
  await sendVerificationCode(resetForm.email, 'RESET_PASSWORD')
  message.success('验证码已发送')
  startCountdown(resetCountdown)
}

const handleLogin = async () => {
  loading.value = true
  try {
    const user = await login(loginForm)
    setToken(user.token)
    setUser(user)
    message.success('登录成功')
    router.push(getPostAuthPath())
  } finally {
    loading.value = false
  }
}

const handleRegister = async () => {
  loading.value = true
  try {
    const user = await register(registerForm)
    setToken(user.token)
    setUser(user)
    message.success('注册成功')
    router.push('/statistics')
  } finally {
    loading.value = false
  }
}

const handleResetPassword = async () => {
  loading.value = true
  try {
    await resetPassword(resetForm)
    message.success('密码重置成功，请登录')
    setTab('login')
  } finally {
    loading.value = false
  }
}

let ctx: gsap.Context | null = null

onMounted(() => {
  const root = pageRef.value
  if (!root) return

  ctx = gsap.context(() => {
    gsap.from('.brand-mark', { y: 16, opacity: 0, duration: 0.7, ease: 'power3.out' })
    gsap.from('.brand-copy', { y: 24, opacity: 0, duration: 0.8, delay: 0.08, ease: 'power3.out' })
    gsap.from('.insight-board', { y: 28, opacity: 0, duration: 0.85, delay: 0.14, ease: 'power3.out' })
    gsap.from('.login-card', { y: 26, opacity: 0, duration: 0.85, delay: 0.18, ease: 'power3.out' })
  }, root)
})

onBeforeUnmount(() => {
  ctx?.revert()
})
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: grid;
  grid-template-columns: minmax(320px, 560px) minmax(360px, 460px);
  align-items: center;
  justify-content: center;
  gap: 56px;
  padding: 48px;
  background:
    radial-gradient(circle at 14% 18%, rgba(34, 211, 238, 0.24), transparent 32%),
    radial-gradient(circle at 86% 20%, rgba(236, 72, 153, 0.18), transparent 30%),
    radial-gradient(circle at 52% 84%, rgba(139, 92, 246, 0.16), transparent 34%),
    linear-gradient(135deg, rgba(3, 7, 18, 0.97) 0%, rgba(10, 14, 32, 0.95) 55%, rgba(24, 7, 41, 0.94) 100%),
    linear-gradient(90deg, rgba(125, 211, 252, 0.05) 1px, transparent 1px),
    linear-gradient(0deg, rgba(125, 211, 252, 0.05) 1px, transparent 1px);
  background-size: auto, 42px 42px, 42px 42px;
  overflow: hidden;
}

.brand-panel,
.auth-panel {
  position: relative;
  z-index: 1;
}

.brand-panel {
  color: #fff;
}

.brand-mark {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  height: 40px;
  padding: 0 14px;
  border: 1px solid rgba(34, 211, 238, 0.26);
  border-radius: 8px;
  background: rgba(8, 13, 34, 0.54);
  box-shadow: 0 0 28px rgba(34, 211, 238, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.12);
  font-weight: 700;
}

.brand-mark-icon {
  width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  background: linear-gradient(135deg, #22d3ee 0%, #8b5cf6 52%, #ec4899 100%);
}

.brand-copy {
  margin-top: 58px;
}

.brand-kicker,
.card-kicker {
  margin: 0 0 10px;
  color: #67e8f9;
  font-size: 13px;
  font-weight: 700;
}

.brand-copy h1 {
  max-width: 520px;
  margin: 0;
  font-size: 48px;
  line-height: 1.12;
  font-weight: 800;
}

.brand-subtitle {
  max-width: 460px;
  margin: 20px 0 0;
  color: rgba(226, 232, 240, 0.76);
  font-size: 16px;
  line-height: 1.8;
}

.insight-board {
  width: min(100%, 500px);
  margin-top: 48px;
  padding: 18px;
  border: 1px solid rgba(34, 211, 238, 0.2);
  border-radius: 8px;
  background: linear-gradient(145deg, rgba(15, 23, 42, 0.7), rgba(30, 27, 75, 0.42));
  backdrop-filter: blur(20px);
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.28), 0 0 36px rgba(34, 211, 238, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.12);
}

.insight-main {
  padding: 18px;
  border-radius: 8px;
  background: rgba(8, 13, 34, 0.42);
}

.insight-label,
.insight-meta,
.insight-item span {
  color: rgba(165, 243, 252, 0.66);
  font-size: 12px;
}

.insight-value {
  margin-top: 8px;
  font-size: 32px;
  line-height: 1.1;
  font-weight: 800;
}

.insight-value.positive {
  color: #22d3ee;
  text-shadow: 0 0 18px rgba(34, 211, 238, 0.32);
}

.insight-meta {
  margin-top: 8px;
}

.insight-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 12px;
}

.insight-item {
  min-width: 0;
  display: grid;
  grid-template-columns: 24px 1fr;
  gap: 8px 10px;
  align-items: center;
  padding: 14px;
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.5);
}

.insight-item .anticon {
  color: #67e8f9;
}

.insight-item strong {
  grid-column: 2;
  color: #fff;
  font-size: 18px;
}

.auth-panel {
  width: 100%;
}

.login-card {
  width: 100%;
  border-radius: 8px;
  border: 1px solid rgba(34, 211, 238, 0.22);
  background: linear-gradient(145deg, rgba(15, 23, 42, 0.82), rgba(30, 27, 75, 0.52));
  box-shadow: 0 28px 90px rgba(0, 0, 0, 0.34), 0 0 42px rgba(34, 211, 238, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(22px);
}

.login-card :deep(.ant-card-body) {
  padding: 32px;
}

.card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.card-head h2 {
  margin: 0;
  color: #f8fbff;
  font-size: 26px;
  font-weight: 800;
}

.auth-tabs :deep(.ant-tabs-nav) {
  margin-bottom: 22px;
}

.auth-tabs :deep(.ant-tabs-tab) {
  padding: 10px 16px;
  font-weight: 600;
}

.auth-tabs :deep(.ant-tabs-ink-bar) {
  height: 3px;
  border-radius: 3px;
  background: linear-gradient(135deg, #22d3ee 0%, #8b5cf6 52%, #ec4899 100%);
}

.login-card :deep(.ant-form-item-label > label) {
  color: #dbeafe;
  font-weight: 600;
}

.login-card :deep(.ant-input-affix-wrapper),
.login-card :deep(.ant-input),
.code-btn {
  border-radius: 8px;
}

.login-card :deep(.ant-input-affix-wrapper) {
  border-color: rgba(34, 211, 238, 0.18);
  background: rgba(15, 23, 42, 0.58);
  transition: border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
}

.login-card :deep(.ant-input-affix-wrapper:hover),
.login-card :deep(.ant-input-affix-wrapper-focused) {
  border-color: #22d3ee;
  background: rgba(15, 23, 42, 0.82);
  box-shadow: 0 0 0 3px rgba(34, 211, 238, 0.14);
}

.login-card :deep(.ant-input-prefix) {
  color: #67e8f9;
  margin-right: 9px;
}

.login-card :deep(.ant-input),
.login-card :deep(.ant-input-password input) {
  color: #f8fbff;
  background: transparent;
}

.login-card :deep(.ant-input::placeholder),
.login-card :deep(.ant-input-password input::placeholder) {
  color: rgba(203, 213, 225, 0.5);
}

.submit-btn {
  height: 44px;
  border: none;
  border-radius: 8px;
  font-weight: 700;
  background: linear-gradient(135deg, #22d3ee 0%, #8b5cf6 52%, #ec4899 100%);
  box-shadow: 0 12px 24px rgba(34, 211, 238, 0.22), 0 0 22px rgba(236, 72, 153, 0.16);
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.submit-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 16px 30px rgba(34, 211, 238, 0.28), 0 0 26px rgba(236, 72, 153, 0.2);
}

.login-links {
  display: flex;
  justify-content: space-between;
  margin-top: 18px;
}

.login-links a {
  color: #a5b4fc;
  font-weight: 600;
}

.login-links a:hover {
  color: #67e8f9;
}

.code-group {
  display: flex;
}

.code-group :deep(.ant-input-affix-wrapper) {
  flex: 1;
  width: auto;
  border-start-end-radius: 0;
  border-end-end-radius: 0;
}

.code-btn {
  width: 120px;
  flex: 0 0 120px;
  border-start-start-radius: 0;
  border-end-start-radius: 0;
  font-weight: 600;
}

@media (max-width: 980px) {
  .login-page {
    grid-template-columns: minmax(0, 520px);
    gap: 28px;
    padding: 32px 20px;
    overflow-y: auto;
  }

  .brand-copy {
    margin-top: 28px;
  }

  .brand-copy h1 {
    font-size: 34px;
  }

  .insight-board {
    margin-top: 28px;
  }
}

@media (max-width: 560px) {
  .login-page {
    padding: 24px 14px;
  }

  .brand-copy h1 {
    font-size: 28px;
  }

  .brand-subtitle {
    font-size: 14px;
  }

  .insight-grid {
    grid-template-columns: 1fr;
  }

  .login-card :deep(.ant-card-body) {
    padding: 24px 18px;
  }

  .card-head {
    align-items: center;
  }

  .code-btn {
    width: 108px;
    flex-basis: 108px;
    padding-inline: 8px;
  }
}
</style>
