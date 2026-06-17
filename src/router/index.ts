import { createRouter, createWebHistory } from 'vue-router'
import { message } from 'ant-design-vue'
import { getToken, isAdmin } from '@/utils/auth'

type LayoutRouteMeta = {
  title: string
  requiresAdmin?: boolean
  fullBleed?: boolean
}

const withMainLayout = (
  path: string,
  name: string,
  component: () => Promise<unknown>,
  meta: LayoutRouteMeta
) => ({
  path,
  component: () => import('@/layouts/MainLayout.vue'),
  children: [
    {
      path: '',
      name,
      component,
      meta
    }
  ]
})

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: () => import('@/views/Home.vue'),
      meta: { title: '首页' }
    },
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/Login.vue'),
      meta: { title: '登录' }
    },
    withMainLayout('/statistics', 'Statistics', () => import('@/views/Statistics.vue'), {
      title: '数据统计'
    }),
    withMainLayout('/purchase', 'Purchase', () => import('@/views/Purchase.vue'), {
      title: '饰品购入'
    }),
    withMainLayout('/batch-purchase', 'BatchPurchase', () => import('@/views/BatchPurchase.vue'), {
      title: '批量购入'
    }),
    {
      path: '/sell',
      redirect: '/batch-sell'
    },
    withMainLayout('/batch-sell', 'BatchSell', () => import('@/views/BatchSell.vue'), {
      title: '库存管理',
      fullBleed: true
    }),
    withMainLayout('/transactions', 'Transactions', () => import('@/views/Transactions.vue'), {
      title: '交易记录'
    }),
    withMainLayout('/market-items', 'MarketItems', () => import('@/views/MarketItems.vue'), {
      title: '饰品目录',
      requiresAdmin: true
    }),
    withMainLayout('/item-types', 'ItemTypes', () => import('@/views/ItemTypes.vue'), {
      title: '分类管理',
      requiresAdmin: true
    }),
    withMainLayout('/operation-logs', 'OperationLogs', () => import('@/views/OperationLogs.vue'), {
      title: '操作日志',
      requiresAdmin: true
    }),
    withMainLayout('/admin', 'AdminConsole', () => import('@/views/AdminConsole.vue'), {
      title: '系统控制台',
      requiresAdmin: true
    })
  ]
})

router.beforeEach((to, _from, next) => {
  const token = getToken()
  const publicPaths = new Set(['/', '/login'])

  if (publicPaths.has(to.path)) {
    if (to.path === '/login' && token) {
      next('/statistics')
    } else {
      next()
    }
    return
  }

  if (!token) {
    next({ path: '/login', query: { redirect: to.fullPath } })
    return
  }

  if (to.meta.requiresAdmin && !isAdmin()) {
    message.warning('无权限访问该页面')
    next('/statistics')
    return
  }

  next()
})

export default router
