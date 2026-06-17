<template>
  <div class="login-page">
    <div class="login-brand">
      <h1>CS:GO 饰品交易</h1>
      <p>追踪买卖 · 分析盈亏 · 管理库存</p>
    </div>
    <a-card class="login-card">
      <a-tabs v-model:activeKey="activeTab" centered>
        <a-tab-pane key="login" tab="登录">
          <a-form :model="loginForm" layout="vertical" @finish="handleLogin">
            <a-form-item label="用户名" name="username" :rules="[{ required: true, message: '请输入用户名' }]">
              <a-input v-model:value="loginForm.username" size="large" placeholder="用户名" />
            </a-form-item>
            <a-form-item label="密码" name="password" :rules="[{ required: true, message: '请输入密码' }]">
              <a-input-password v-model:value="loginForm.password" size="large" placeholder="密码" />
            </a-form-item>
            <a-button type="primary" html-type="submit" block size="large" :loading="loading">登录</a-button>
            <div class="login-links">
              <a @click="activeTab = 'register'">注册账号</a>
              <a @click="activeTab = 'forgot'">忘记密码</a>
            </div>
          </a-form>
        </a-tab-pane>

        <a-tab-pane key="register" tab="注册">
          <a-form :model="registerForm" layout="vertical" @finish="handleRegister">
            <a-form-item label="用户名" name="username" :rules="[{ required: true }]">
              <a-input v-model:value="registerForm.username" size="large" />
            </a-form-item>
            <a-form-item label="邮箱" name="email" :rules="[{ required: true, type: 'email', message: '请输入有效邮箱' }]">
              <a-input v-model:value="registerForm.email" size="large" />
            </a-form-item>
            <a-form-item label="验证码" name="verificationCode" :rules="[{ required: true }]">
              <a-input-group compact>
                <a-input v-model:value="registerForm.verificationCode" size="large" style="width: calc(100% - 120px)" />
                <a-button size="large" :disabled="registerCountdown > 0" @click="sendRegisterCode" style="width: 120px">
                  {{ registerCountdown > 0 ? `${registerCountdown}s` : '获取验证码' }}
                </a-button>
              </a-input-group>
            </a-form-item>
            <a-form-item label="密码" name="password" :rules="[{ required: true }]">
              <a-input-password v-model:value="registerForm.password" size="large" />
            </a-form-item>
            <a-button type="primary" html-type="submit" block size="large" :loading="loading">注册</a-button>
          </a-form>
        </a-tab-pane>

        <a-tab-pane key="forgot" tab="找回密码">
          <a-form :model="resetForm" layout="vertical" @finish="handleResetPassword">
            <a-form-item label="注册邮箱" name="email" :rules="[{ required: true, type: 'email' }]">
              <a-input v-model:value="resetForm.email" size="large" />
            </a-form-item>
            <a-form-item label="验证码" name="verificationCode" :rules="[{ required: true }]">
              <a-input-group compact>
                <a-input v-model:value="resetForm.verificationCode" size="large" style="width: calc(100% - 120px)" />
                <a-button size="large" :disabled="resetCountdown > 0" @click="sendResetCode" style="width: 120px">
                  {{ resetCountdown > 0 ? `${resetCountdown}s` : '获取验证码' }}
                </a-button>
              </a-input-group>
            </a-form-item>
            <a-form-item label="新密码" name="newPassword" :rules="[{ required: true }]">
              <a-input-password v-model:value="resetForm.newPassword" size="large" />
            </a-form-item>
            <a-button type="primary" html-type="submit" block size="large" :loading="loading">重置密码</a-button>
          </a-form>
        </a-tab-pane>
      </a-tabs>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { login, register, resetPassword, sendVerificationCode } from '@/api/user'
import { setToken, setUser } from '@/utils/auth'

const router = useRouter()
const loading = ref(false)
const activeTab = ref('login')
const registerCountdown = ref(0)
const resetCountdown = ref(0)

const loginForm = reactive({ username: '', password: '' })
const registerForm = reactive({ username: '', password: '', email: '', verificationCode: '' })
const resetForm = reactive({ email: '', verificationCode: '', newPassword: '' })

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
    router.push('/')
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
    router.push('/')
  } finally {
    loading.value = false
  }
}

const handleResetPassword = async () => {
  loading.value = true
  try {
    await resetPassword(resetForm)
    message.success('密码重置成功，请登录')
    activeTab.value = 'login'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 48px;
  padding: 24px;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
}

.login-brand {
  color: #fff;
  max-width: 360px;
}

.login-brand h1 {
  font-size: 32px;
  margin-bottom: 12px;
}

.login-brand p {
  opacity: 0.85;
  font-size: 16px;
}

.login-card {
  width: 100%;
  max-width: 420px;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.login-links {
  display: flex;
  justify-content: space-between;
  margin-top: 16px;
}

@media (max-width: 768px) {
  .login-page {
    flex-direction: column;
    gap: 24px;
  }
  .login-brand {
    text-align: center;
  }
  .login-brand h1 {
    font-size: 24px;
  }
}
</style>
