<template>
  <a-layout class="app-layout">
    <a-drawer
      v-model:open="drawerVisible"
      placement="left"
      :closable="false"
      :width="250"
      :body-style="{ padding: 0 }"
      class="mobile-drawer"
    >
      <div class="sider-inner">
        <div class="logo">CS:GO 交易</div>
        <a-menu
          v-model:selectedKeys="selectedKeys"
          v-model:openKeys="openKeys"
          theme="dark"
          mode="inline"
          class="sider-menu"
          @click="handleMenuClick"
        >
          <a-menu-item key="/statistics">
            <BarChartOutlined />
            <span>数据统计</span>
          </a-menu-item>
          <a-menu-item key="/batch-sell">
            <InboxOutlined />
            <span>库存</span>
          </a-menu-item>
          <a-sub-menu key="purchase-menu">
            <template #title>
              <ShoppingCartOutlined />
              <span>饰品购入</span>
            </template>
            <a-menu-item key="/purchase">单个购入</a-menu-item>
            <a-menu-item key="/batch-purchase">批量购入</a-menu-item>
          </a-sub-menu>
          <a-menu-item key="/transactions">
            <UnorderedListOutlined />
            <span>交易记录</span>
          </a-menu-item>
          <a-menu-item v-if="isAdminUser" key="/item-types">
            <SettingOutlined />
            <span>分类管理</span>
          </a-menu-item>
          <a-menu-item v-if="isAdminUser" key="/market-items">
            <DatabaseOutlined />
            <span>饰品目录</span>
          </a-menu-item>
          <a-menu-item v-if="isAdminUser" key="/operation-logs">
            <FileTextOutlined />
            <span>操作日志</span>
          </a-menu-item>
          <a-menu-item v-if="isAdminUser" key="/admin">
            <ControlOutlined />
            <span>系统控制台</span>
          </a-menu-item>
        </a-menu>
        <SidebarUserPanel :user="currentUser" @logout="handleLogout" />
      </div>
    </a-drawer>

    <a-layout-sider
      :width="220"
      :collapsible="false"
      class="desktop-sider"
    >
      <div class="sider-inner">
        <div class="logo">CS:GO 交易</div>
        <a-menu
          v-model:selectedKeys="selectedKeys"
          v-model:openKeys="openKeys"
          theme="dark"
          mode="inline"
          class="sider-menu"
          @click="handleMenuClick"
        >
          <a-menu-item key="/statistics">
            <BarChartOutlined />
            <span>数据统计</span>
          </a-menu-item>
          <a-menu-item key="/batch-sell">
            <InboxOutlined />
            <span>库存</span>
          </a-menu-item>
          <a-sub-menu key="purchase-menu">
            <template #title>
              <ShoppingCartOutlined />
              <span>饰品购入</span>
            </template>
            <a-menu-item key="/purchase">单个购入</a-menu-item>
            <a-menu-item key="/batch-purchase">批量购入</a-menu-item>
          </a-sub-menu>
          <a-menu-item key="/transactions">
            <UnorderedListOutlined />
            <span>交易记录</span>
          </a-menu-item>
          <a-menu-item v-if="isAdminUser" key="/item-types">
            <SettingOutlined />
            <span>分类管理</span>
          </a-menu-item>
          <a-menu-item v-if="isAdminUser" key="/market-items">
            <DatabaseOutlined />
            <span>饰品目录</span>
          </a-menu-item>
          <a-menu-item v-if="isAdminUser" key="/operation-logs">
            <FileTextOutlined />
            <span>操作日志</span>
          </a-menu-item>
          <a-menu-item v-if="isAdminUser" key="/admin">
            <ControlOutlined />
            <span>系统控制台</span>
          </a-menu-item>
        </a-menu>
        <SidebarUserPanel :user="currentUser" @logout="handleLogout" />
      </div>
    </a-layout-sider>

    <a-layout class="main-area">
      <a-layout-header class="header">
        <a-button type="text" class="mobile-menu-btn" @click="drawerVisible = true">
          <MenuOutlined style="font-size: 20px;" />
        </a-button>
        <h2 v-if="!route.meta.fullBleed" class="header-title">{{ currentTitle }}</h2>
      </a-layout-header>
      <a-layout-content :class="['content', 'scroll-content', { 'content-full': route.meta.fullBleed }]">
        <div :class="['content-wrapper', { 'content-wrapper-full': route.meta.fullBleed }]">
          <router-view />
        </div>
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Modal } from 'ant-design-vue'
import {
  BarChartOutlined,
  ShoppingCartOutlined,
  UnorderedListOutlined,
  SettingOutlined,
  MenuOutlined,
  FileTextOutlined,
  DatabaseOutlined,
  ControlOutlined,
  InboxOutlined
} from '@ant-design/icons-vue'
import { getUser, logout, isAdmin, setUser, type AuthUser } from '@/utils/auth'
import { getCurrentUser } from '@/api/user'
import SidebarUserPanel from '@/components/SidebarUserPanel.vue'

const router = useRouter()
const route = useRoute()
const drawerVisible = ref(false)
const selectedKeys = ref<string[]>([route.path])
const openKeys = ref<string[]>(['purchase-menu'])
const currentUser = ref<AuthUser | null>(null)

const isAdminUser = computed(() => isAdmin())
const currentTitle = computed(() => route.meta.title as string || '')

watch(() => route.path, (newPath) => {
  selectedKeys.value = [newPath === '/sell' ? '/batch-sell' : newPath]
  drawerVisible.value = false
})

const handleMenuClick = ({ key }: { key: string }) => {
  if (key.startsWith('/')) {
    router.push(key)
  }
}

const handleLogout = () => {
  Modal.confirm({
    title: '确认退出',
    content: '确定要退出登录吗？',
    onOk: () => {
      logout()
      router.push('/login')
    }
  })
}

const loadUser = async () => {
  const cached = getUser()
  if (cached) {
    currentUser.value = cached
  }
  try {
    const profile = await getCurrentUser()
    const user: AuthUser = {
      id: profile.id,
      username: profile.username,
      email: profile.email,
      role: profile.role || 'USER'
    }
    currentUser.value = user
    if (cached?.token) {
      setUser({ ...user, token: cached.token })
    }
  } catch {
    currentUser.value = cached
  }
}

onMounted(loadUser)
</script>

<style scoped>
.app-layout {
  height: 100vh;
  overflow: hidden;
}

.main-area {
  flex: 1;
  min-width: 0;
  height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.desktop-sider {
  flex: 0 0 220px !important;
  max-width: 220px !important;
  min-width: 220px !important;
  height: 100vh;
  overflow: hidden;
}

.sider-inner {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.logo {
  height: 32px;
  margin: 16px;
  color: #fff;
  font-size: 18px;
  font-weight: bold;
  text-align: center;
  flex-shrink: 0;
}

.sider-menu {
  flex: 1;
  overflow-y: auto;
  border-right: none !important;
}

.header {
  background: #fff;
  padding: 0 16px;
  display: flex;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  min-height: 64px;
  flex-shrink: 0;
  z-index: 1;
}

.scroll-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}

.content {
  margin: 16px;
}

.content-wrapper {
  padding: 16px;
  background: #fff;
  min-height: 360px;
  border-radius: 8px;
}

.content-wrapper-full {
  padding: 0;
  background: transparent;
  border-radius: 0;
  min-height: auto;
  box-shadow: none;
}

.content-full {
  margin: 0;
}

.header-title {
  margin: 0;
  font-size: 18px;
  flex: 1;
  text-align: center;
}

.mobile-menu-btn {
  display: none;
}

:deep(.desktop-sider .ant-layout-sider-children) {
  display: flex;
  flex-direction: column;
  height: 100%;
}

@media (max-width: 768px) {
  .desktop-sider {
    display: none !important;
  }

  .mobile-menu-btn {
    display: block;
  }

  .header-title {
    font-size: 16px;
  }

  .content {
    margin: 8px;
  }

  .content-wrapper {
    padding: 12px;
    border-radius: 4px;
  }
}

:deep(.mobile-drawer .ant-drawer-body) {
  background: #001529;
  padding: 0;
}

:deep(.mobile-drawer .ant-menu) {
  background: #001529;
}
</style>
