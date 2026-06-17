<template>
  <div>
    <a-tabs>
      <a-tab-pane key="cache" tab="缓存管理">
        <a-alert
          style="margin-bottom: 16px"
          type="warning"
          show-icon
          message="CSQAQ 接口调用前须绑定 IP 白名单"
          description="服务器或本地开发环境需先将当前出口 IP 绑定到 ApiToken，否则价格/饰品详情等接口会鉴权失败。非固定 IP 可点击下方按钮（30 秒限 1 次）。"
        />
        <a-space style="margin-bottom: 16px" wrap>
          <a-button :loading="bindingIp" @click="handleBindIp">绑定 CSQAQ 白名单 IP</a-button>
          <a-button type="primary" :loading="loading" @click="loadCacheStatus">刷新状态</a-button>
          <a-button :loading="actionLoading" @click="handleRefresh('all')">重建全部缓存</a-button>
          <a-button danger :loading="actionLoading" @click="handleClear('all')">清空全部缓存</a-button>
        </a-space>

        <a-table
          :columns="cacheColumns"
          :data-source="cacheList"
          :loading="loading"
          row-key="cacheType"
          :pagination="false"
          size="middle"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'loaded'">
              <a-tag :color="record.loaded ? 'green' : 'default'">{{ record.loaded ? '已加载' : '未加载' }}</a-tag>
            </template>
            <template v-if="column.key === 'action'">
              <a-space>
                <a-button type="link" size="small" @click="handleRefresh(record.cacheType)">重建</a-button>
                <a-button type="link" size="small" danger @click="handleClear(record.cacheType)">清空</a-button>
              </a-space>
            </template>
          </template>
        </a-table>

        <a-descriptions v-if="meta" title="目录缓存详情" bordered size="small" :column="isMobile ? 1 : 2" style="margin-top: 16px">
          <a-descriptions-item label="分类数量">{{ meta.categoryCount ?? '-' }}</a-descriptions-item>
          <a-descriptions-item label="饰品数量">{{ meta.marketCount ?? '-' }}</a-descriptions-item>
          <a-descriptions-item label="分类刷新时间">{{ meta.categoryRefreshedAt || '-' }}</a-descriptions-item>
          <a-descriptions-item label="饰品刷新时间">{{ meta.marketRefreshedAt || '-' }}</a-descriptions-item>
        </a-descriptions>
      </a-tab-pane>

      <a-tab-pane key="jobs" tab="定时任务">
        <a-alert
          style="margin-bottom: 16px"
          type="info"
          show-icon
          message="任务说明"
          description="默认每日 0 点汇总盈亏日历，1 点预热饰品目录缓存。可修改 Cron 表达式并手动执行。"
        />

        <a-table
          :columns="jobColumns"
          :data-source="jobs"
          :loading="jobLoading"
          row-key="jobId"
          :pagination="false"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'enabled'">
              <a-switch
                :checked="record.enabled"
                @change="(v: boolean) => toggleJob(record, v)"
              />
            </template>
            <template v-if="column.key === 'cron'">
              <a-input
                v-model:value="record.cron"
                style="width: 180px"
                @blur="saveJobCron(record)"
              />
            </template>
            <template v-if="column.key === 'lastRun'">
              <div v-if="record.lastRunAt">
                <div>{{ record.lastRunAt }}</div>
                <a-tag :color="record.lastRunStatus === 'SUCCESS' ? 'green' : 'red'" size="small">
                  {{ record.lastRunStatus }}
                </a-tag>
                <div class="job-msg">{{ record.lastRunMessage }}</div>
              </div>
              <span v-else>-</span>
            </template>
            <template v-if="column.key === 'action'">
              <a-button type="primary" size="small" :loading="runningJobId === record.jobId" @click="handleRunJob(record.jobId)">
                立即执行
              </a-button>
            </template>
          </template>
        </a-table>
      </a-tab-pane>
    </a-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { message, Modal } from 'ant-design-vue'
import { getCacheStatus, refreshCache, clearCache, listJobs, updateJob, runJob, bindCsqaqIp } from '@/api/admin'
import type { CacheStatusVO, JobConfigVO, CatalogCacheMetaVO } from '@/types'
import { useWindowSize } from '@/hooks/useWindowSize'

const { isMobile } = useWindowSize()
const loading = ref(false)
const actionLoading = ref(false)
const jobLoading = ref(false)
const runningJobId = ref('')
const bindingIp = ref(false)
const cacheList = ref<CacheStatusVO[]>([])
const jobs = ref<JobConfigVO[]>([])
const meta = ref<CatalogCacheMetaVO | null>(null)

const cacheColumns = [
  { title: '类型', dataIndex: 'cacheType', key: 'cacheType', width: 100 },
  { title: '说明', dataIndex: 'description', key: 'description' },
  { title: 'Key', dataIndex: 'cacheKey', key: 'cacheKey', ellipsis: true },
  { title: '状态', key: 'loaded', width: 90 },
  { title: '条目数', dataIndex: 'itemCount', key: 'itemCount', width: 90 },
  { title: '上次刷新', dataIndex: 'lastRefreshAt', key: 'lastRefreshAt', width: 170 },
  { title: '操作', key: 'action', width: 140 }
]

const jobColumns = [
  { title: '任务', dataIndex: 'jobName', key: 'jobName', width: 140 },
  { title: '说明', dataIndex: 'description', key: 'description' },
  { title: 'Cron', key: 'cron', width: 200 },
  { title: '启用', key: 'enabled', width: 80 },
  { title: '上次执行', key: 'lastRun', width: 220 },
  { title: '操作', key: 'action', width: 110 }
]

const handleBindIp = async () => {
  bindingIp.value = true
  try {
    const res = await bindCsqaqIp()
    if (res.code === 200) {
      message.success(res.data || 'IP 绑定成功')
    } else {
      message.warning(res.data || res.msg || '绑定失败')
    }
  } finally {
    bindingIp.value = false
  }
}

const loadCacheStatus = async () => {
  loading.value = true
  try {
    cacheList.value = await getCacheStatus()
  } finally {
    loading.value = false
  }
}

const loadJobs = async () => {
  jobLoading.value = true
  try {
    jobs.value = await listJobs()
  } finally {
    jobLoading.value = false
  }
}

const handleRefresh = async (cacheType: string) => {
  actionLoading.value = true
  try {
    const res = await refreshCache(cacheType)
    message.success(res.message || '缓存已重建')
    if (res.meta) meta.value = res.meta
    await loadCacheStatus()
  } finally {
    actionLoading.value = false
  }
}

const handleClear = (cacheType: string) => {
  Modal.confirm({
    title: '确认清空缓存？',
    content: `将清空 ${cacheType} 相关 Redis 缓存`,
    onOk: async () => {
      actionLoading.value = true
      try {
        const res = await clearCache(cacheType)
        message.success(res.message)
        await loadCacheStatus()
      } finally {
        actionLoading.value = false
      }
    }
  })
}

const toggleJob = async (record: JobConfigVO, enabled: boolean) => {
  await updateJob(record.jobId, { enabled })
  record.enabled = enabled
  message.success(enabled ? '任务已启用' : '任务已停用')
  await loadJobs()
}

const saveJobCron = async (record: JobConfigVO) => {
  if (!record.cron?.trim()) {
    message.warning('Cron 不能为空')
    return
  }
  await updateJob(record.jobId, { cron: record.cron.trim() })
  message.success('Cron 已更新')
  await loadJobs()
}

const handleRunJob = async (jobId: string) => {
  runningJobId.value = jobId
  try {
    const res = await runJob(jobId)
    if (res.status === 'SUCCESS') {
      message.success(res.message)
    } else {
      message.error(res.message || '执行失败')
    }
    await loadJobs()
    await loadCacheStatus()
  } finally {
    runningJobId.value = ''
  }
}

onMounted(() => {
  loadCacheStatus()
  loadJobs()
})
</script>

<style scoped>
.job-msg {
  font-size: 12px;
  color: #666;
  margin-top: 4px;
}
</style>
