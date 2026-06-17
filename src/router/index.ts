import { createRouter, createWebHistory } from 'vue-router'
import { message } from 'ant-design-vue'
import { getToken, isAdmin } from '@/utils/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/Login.vue'),
      meta: { title: '登录' }
    },
    {
      path: '/',
      component: () => import('@/layouts/MainLayout.vue'),
      redirect: '/statistics',
      children: [
        {
          path: '/statistics',
          name: 'Statistics',
          component: () => import('@/views/Statistics.vue'),
          meta: { title: '数据统计' }
        },
        {
          path: '/purchase',
          name: 'Purchase',
          component: () => import('@/views/Purchase.vue'),
          meta: { title: '饰品购入' }
        },
        {
          path: '/batch-purchase',
          name: 'BatchPurchase',
          component: () => import('@/views/BatchPurchase.vue'),
          meta: { title: '批量购入' }
        },
        {
          path: '/sell',
          redirect: '/batch-sell'
        },
        {
          path: '/batch-sell',
          name: 'BatchSell',
          component: () => import('@/views/BatchSell.vue'),
          meta: { title: '库存管理', fullBleed: true }
        },
        {
          path: '/transactions',
          name: 'Transactions',
          component: () => import('@/views/Transactions.vue'),
          meta: { title: '交易记录' }
        },
        {
          path: '/market-items',
          name: 'MarketItems',
          component: () => import('@/views/MarketItems.vue'),
          meta: { title: '饰品目录', requiresAdmin: true }
        },
        {
          path: '/item-types',
          name: 'ItemTypes',
          component: () => import('@/views/ItemTypes.vue'),
          meta: { title: '分类管理', requiresAdmin: true }
        },
        {
          path: '/operation-logs',
          name: 'OperationLogs',
          component: () => import('@/views/OperationLogs.vue'),
          meta: { title: '操作日志', requiresAdmin: true }
        },
        {
          path: '/admin',
          name: 'AdminConsole',
          component: () => import('@/views/AdminConsole.vue'),
          meta: { title: '系统控制台', requiresAdmin: true }
        }
      ]
    }
  ]
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const token = getToken()
  
  if (to.path === '/login') {
    if (token) {
      next('/')
    } else {
      next()
    }
  } else {
    if (!token) {
      next('/login')
      return
    }
    if (to.meta.requiresAdmin && !isAdmin()) {
      message.warning('无权限访问该页面')
      next('/statistics')
      return
    }
    next()
  }
})

export default router
