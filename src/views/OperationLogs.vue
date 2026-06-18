<template>
  <div>
    <a-form :layout="isMobile ? 'vertical' : 'inline'" style="margin-bottom: 16px">
      <a-form-item label="操作类型">
        <a-select
          v-model:value="filters.operation"
          :style="{ width: isMobile ? '100%' : '150px' }"
          placeholder="全部"
          allow-clear
        >
          <a-select-option value="饰品购入">饰品购入</a-select-option>
          <a-select-option value="批量购入">批量购入</a-select-option>
          <a-select-option value="饰品卖出">饰品卖出</a-select-option>
          <a-select-option value="登录">登录</a-select-option>
          <a-select-option value="注册">注册</a-select-option>
          <a-select-option value="登出">登出</a-select-option>
          <a-select-option value="忘记密码">忘记密码</a-select-option>
          <a-select-option value="发送验证码">发送验证码</a-select-option>
          <a-select-option value="修改密码">修改密码</a-select-option>
          <a-select-option value="修改交易记录">修改交易记录</a-select-option>
        </a-select>
      </a-form-item>

      <a-form-item label="状态">
        <a-select
          v-model:value="filters.status"
          :style="{ width: isMobile ? '100%' : '120px' }"
          placeholder="全部"
          allow-clear
        >
          <a-select-option value="SUCCESS">成功</a-select-option>
          <a-select-option value="FAIL">失败</a-select-option>
        </a-select>
      </a-form-item>

      <a-form-item label="日期范围">
        <a-range-picker 
          v-model:value="dateRange" 
          format="YYYY-MM-DD"
          :style="{ width: isMobile ? '100%' : 'auto' }"
        />
      </a-form-item>

      <a-form-item>
        <a-button type="primary" @click="handleSearch" :block="isMobile">查询</a-button>
      </a-form-item>
    </a-form>

    <a-table
      :columns="isMobile ? mobileColumns : columns"
      :data-source="logs"
      :loading="loading"
      row-key="id"
      :pagination="pagination"
      @change="handleTableChange"
      :scroll="isMobile ? { x: 800 } : undefined"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'status'">
          <a-tag :color="record.status === 'SUCCESS' ? 'green' : 'red'">
            {{ record.status === 'SUCCESS' ? '成功' : '失败' }}
          </a-tag>
        </template>
        <template v-if="column.key === 'executionTime'">
          <span>{{ record.executionTime }}ms</span>
        </template>
        <template v-if="column.key === 'action'">
          <a-button type="link" size="small" @click="handleViewDetail(record)">详情</a-button>
        </template>
      </template>
    </a-table>

    <a-modal
      v-model:open="detailVisible"
      title="操作日志详情"
      :width="isMobile ? '100%' : 800"
      :footer="null"
    >
      <a-descriptions :column="1" bordered v-if="currentLog">
        <a-descriptions-item label="操作类型">{{ currentLog.operation }}</a-descriptions-item>
        <a-descriptions-item label="用户名">{{ currentLog.username || '-' }}</a-descriptions-item>
        <a-descriptions-item label="IP地址">{{ currentLog.ip }}</a-descriptions-item>
        <a-descriptions-item label="归属地">{{ currentLog.ipLocation || '-' }}</a-descriptions-item>
        <a-descriptions-item label="国家">{{ currentLog.ipCountry || '-' }}</a-descriptions-item>
        <a-descriptions-item label="省份">{{ currentLog.ipRegion || '-' }}</a-descriptions-item>
        <a-descriptions-item label="城市">{{ currentLog.ipCity || '-' }}</a-descriptions-item>
        <a-descriptions-item label="运营商">{{ currentLog.ipIsp || '-' }}</a-descriptions-item>
        <a-descriptions-item label="方法">{{ currentLog.method }}</a-descriptions-item>
        <a-descriptions-item label="状态">
          <a-tag :color="currentLog.status === 'SUCCESS' ? 'green' : 'red'">
            {{ currentLog.status === 'SUCCESS' ? '成功' : '失败' }}
          </a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="执行时间">{{ currentLog.executionTime }}ms</a-descriptions-item>
        <a-descriptions-item label="操作时间">{{ currentLog.createTime }}</a-descriptions-item>
        <a-descriptions-item label="请求参数">
          <pre style="max-height: 200px; overflow: auto; background: #f5f5f5; padding: 8px; border-radius: 4px;">{{ formatJson(currentLog.params) }}</pre>
        </a-descriptions-item>
        <a-descriptions-item label="返回结果" v-if="currentLog.result">
          <pre style="max-height: 200px; overflow: auto; background: #f5f5f5; padding: 8px; border-radius: 4px;">{{ formatJson(currentLog.result) }}</pre>
        </a-descriptions-item>
        <a-descriptions-item label="错误信息" v-if="currentLog.errorMsg">
          <pre style="max-height: 200px; overflow: auto; background: #fff2f0; padding: 8px; border-radius: 4px; color: #cf1322;">{{ currentLog.errorMsg }}</pre>
        </a-descriptions-item>
      </a-descriptions>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { getOperationLogPage, type OperationLogVO } from '@/api/operationLog'
import type { Dayjs } from 'dayjs'
import { useWindowSize } from '@/hooks/useWindowSize'

const { isMobile } = useWindowSize()
const loading = ref(false)
const logs = ref<OperationLogVO[]>([])
const dateRange = ref<[Dayjs, Dayjs] | undefined>()
const detailVisible = ref(false)
const currentLog = ref<OperationLogVO | null>(null)

// 分页参数
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showTotal: (total: number) => `共 ${total} 条`
})

const filters = reactive({
  operation: undefined as string | undefined,
  status: undefined as string | undefined
})

const columns = [
  { title: '操作类型', dataIndex: 'operation', key: 'operation', width: 120 },
  { title: '用户名', dataIndex: 'username', key: 'username', width: 100 },
  { title: 'IP地址', dataIndex: 'ip', key: 'ip', width: 130 },
  { title: '归属地', dataIndex: 'ipLocation', key: 'ipLocation', width: 180, ellipsis: true },
  { title: '状态', key: 'status', width: 80 },
  { title: '执行时间', key: 'executionTime', width: 100 },
  { title: '操作时间', dataIndex: 'createTime', key: 'createTime', width: 170 },
  { title: '操作', key: 'action', width: 80 }
]

const mobileColumns = [
  { title: '操作', dataIndex: 'operation', key: 'operation', width: 100 },
  { title: '状态', key: 'status', width: 70 },
  { title: '时间', dataIndex: 'createTime', key: 'createTime', width: 150 },
  { title: '详情', key: 'action', width: 60 }
]

const loadLogs = async () => {
  loading.value = true
  try {
    const params: any = {
      current: pagination.current,
      size: pagination.pageSize,
      operation: filters.operation,
      status: filters.status
    }
    if (dateRange.value) {
      params.startDate = dateRange.value[0].format('YYYY-MM-DD')
      params.endDate = dateRange.value[1].format('YYYY-MM-DD')
    }
    const result = await getOperationLogPage(params)
    logs.value = result.records
    pagination.total = result.total
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.current = 1
  loadLogs()
}

const handleTableChange = (pag: any) => {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
  loadLogs()
}

const handleViewDetail = (log: OperationLogVO) => {
  currentLog.value = log
  detailVisible.value = true
}

const formatJson = (str: string) => {
  if (!str) return ''
  try {
    return JSON.stringify(JSON.parse(str), null, 2)
  } catch {
    return str
  }
}

onMounted(() => {
  loadLogs()
})
</script>
