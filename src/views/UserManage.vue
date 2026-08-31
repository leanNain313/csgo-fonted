<template>
  <div class="users-page">
    <a-form layout="inline" class="filter-form" @finish="handleSearch">
      <a-form-item label="关键词">
        <a-input v-model:value="filters.keyword" allow-clear placeholder="用户名/邮箱" style="width: 180px" />
      </a-form-item>
      <a-form-item label="角色">
        <a-select v-model:value="filters.role" allow-clear placeholder="全部" style="width: 120px">
          <a-select-option value="USER">普通用户</a-select-option>
          <a-select-option value="ADMIN">管理员</a-select-option>
        </a-select>
      </a-form-item>
      <a-form-item label="状态">
        <a-select v-model:value="filters.status" allow-clear placeholder="全部" style="width: 120px">
          <a-select-option :value="1">启用</a-select-option>
          <a-select-option :value="0">禁用</a-select-option>
        </a-select>
      </a-form-item>
      <a-form-item>
        <a-space>
          <a-button type="primary" html-type="submit">查询</a-button>
          <a-button type="primary" ghost @click="openCreate">新建用户</a-button>
        </a-space>
      </a-form-item>
    </a-form>

    <a-table
      :columns="columns"
      :data-source="users"
      :loading="loading"
      row-key="id"
      :pagination="pagination"
      @change="handleTableChange"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'role'">
          <a-tag :color="record.role === 'ADMIN' ? 'purple' : 'blue'">
            {{ record.role === 'ADMIN' ? '管理员' : '普通用户' }}
          </a-tag>
        </template>
        <template v-else-if="column.key === 'status'">
          <a-tag :color="record.status === 1 ? 'success' : 'default'">
            {{ record.status === 1 ? '启用' : '禁用' }}
          </a-tag>
        </template>
        <template v-else-if="column.key === 'action'">
          <a-space wrap>
            <a-button type="link" size="small" @click="toggleRole(record)">
              {{ record.role === 'ADMIN' ? '设为普通' : '设为管理员' }}
            </a-button>
            <a-button type="link" size="small" @click="toggleStatus(record)">
              {{ record.status === 1 ? '禁用' : '启用' }}
            </a-button>
            <a-button type="link" size="small" @click="handleResetPassword(record)">重置密码</a-button>
          </a-space>
        </template>
      </template>
    </a-table>

    <a-modal v-model:open="createVisible" title="新建用户" :confirm-loading="saving" @ok="submitCreate">
      <a-form layout="vertical" :model="createForm">
        <a-form-item label="用户名" required>
          <a-input v-model:value="createForm.username" />
        </a-form-item>
        <a-form-item label="密码" required>
          <a-input-password v-model:value="createForm.password" />
        </a-form-item>
        <a-form-item label="邮箱">
          <a-input v-model:value="createForm.email" />
        </a-form-item>
        <a-form-item label="角色">
          <a-select v-model:value="createForm.role">
            <a-select-option value="USER">普通用户</a-select-option>
            <a-select-option value="ADMIN">管理员</a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { message, Modal } from 'ant-design-vue'
import {
  createAdminUser,
  getAdminUserPage,
  resetAdminUserPassword,
  updateAdminUserRole,
  updateAdminUserStatus,
  type AdminUserVO
} from '@/api/adminUser'

const loading = ref(false)
const saving = ref(false)
const users = ref<AdminUserVO[]>([])
const createVisible = ref(false)
const filters = reactive<{ keyword?: string; role?: string; status?: number }>({})
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showTotal: (total: number) => `共 ${total} 人`
})
const createForm = reactive({
  username: '',
  password: '12345678',
  email: '',
  role: 'USER' as 'USER' | 'ADMIN'
})

const columns = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
  { title: '用户名', dataIndex: 'username', key: 'username' },
  { title: '邮箱', dataIndex: 'email', key: 'email' },
  { title: '角色', key: 'role', width: 110 },
  { title: '状态', key: 'status', width: 90 },
  { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 180 },
  { title: '操作', key: 'action', width: 280 }
]

const loadData = async () => {
  loading.value = true
  try {
    const data = await getAdminUserPage({
      current: pagination.current,
      size: pagination.pageSize,
      keyword: filters.keyword,
      role: filters.role,
      status: filters.status
    })
    users.value = data.records || []
    pagination.total = Number(data.total || 0)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.current = 1
  loadData()
}

const handleTableChange = (pager: { current?: number; pageSize?: number }) => {
  pagination.current = pager.current || 1
  pagination.pageSize = pager.pageSize || 10
  loadData()
}

const openCreate = () => {
  createForm.username = ''
  createForm.password = '12345678'
  createForm.email = ''
  createForm.role = 'USER'
  createVisible.value = true
}

const submitCreate = async () => {
  if (!createForm.username || !createForm.password) {
    message.warning('请填写用户名和密码')
    return
  }
  saving.value = true
  try {
    await createAdminUser({ ...createForm })
    message.success('创建成功')
    createVisible.value = false
    loadData()
  } finally {
    saving.value = false
  }
}

const toggleRole = (record: AdminUserVO) => {
  const next = record.role === 'ADMIN' ? 'USER' : 'ADMIN'
  Modal.confirm({
    title: '确认修改角色',
    content: `将 ${record.username} 设为 ${next === 'ADMIN' ? '管理员' : '普通用户'}？`,
    onOk: async () => {
      await updateAdminUserRole(record.id, next)
      message.success('角色已更新')
      loadData()
    }
  })
}

const toggleStatus = (record: AdminUserVO) => {
  const next = record.status === 1 ? 0 : 1
  Modal.confirm({
    title: next === 0 ? '确认禁用' : '确认启用',
    content: `${next === 0 ? '禁用' : '启用'}用户 ${record.username}？`,
    onOk: async () => {
      await updateAdminUserStatus(record.id, next)
      message.success('状态已更新')
      loadData()
    }
  })
}

const handleResetPassword = (record: AdminUserVO) => {
  Modal.confirm({
    title: '重置密码',
    content: `将 ${record.username} 的密码重置为 12345678？`,
    onOk: async () => {
      await resetAdminUserPassword(record.id)
      message.success('密码已重置为 12345678')
    }
  })
}

onMounted(loadData)
</script>

<style scoped>
.filter-form { margin-bottom: 16px; }
</style>
