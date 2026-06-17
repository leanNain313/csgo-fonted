<template>
  <div>
    <a-form :layout="isMobile ? 'vertical' : 'inline'" style="margin-bottom: 16px">
      <a-form-item label="饰品名称">
        <a-input
          v-model:value="filters.itemName"
          :style="{ width: isMobile ? '100%' : '150px' }"
          placeholder="输入饰品名称"
          allow-clear
        />
      </a-form-item>

      <a-form-item label="饰品类型">
        <a-select
          v-model:value="filters.itemTypeId"
          :style="{ width: isMobile ? '100%' : '150px' }"
          placeholder="全部"
          allow-clear
        >
          <a-select-option v-for="type in itemTypes" :key="type.id" :value="type.id">
            {{ type.typeName }}
          </a-select-option>
        </a-select>
      </a-form-item>

      <a-form-item label="交易类型">
        <a-select
          v-model:value="filters.transactionType"
          :style="{ width: isMobile ? '100%' : '120px' }"
          placeholder="全部"
          allow-clear
        >
          <a-select-option value="BUY">购入</a-select-option>
          <a-select-option value="SELL">卖出</a-select-option>
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
      :data-source="transactions"
      :loading="loading"
      row-key="id"
      :pagination="pagination"
      @change="handleTableChange"
      :scroll="isMobile ? { x: 800 } : undefined"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'counterType'">
          <a-tag :color="record.counterType === 'StatTrak' ? 'orange' : 'blue'">
            {{ record.counterType }}
          </a-tag>
        </template>
        <template v-if="column.key === 'wearLevel'">
          <a-tag :color="getWearLevelColor(record.wearLevel)">
            {{ record.wearLevel }}
          </a-tag>
        </template>
        <template v-if="column.key === 'transactionType'">
          <a-tag :color="record.transactionType === 'BUY' ? 'cyan' : 'red'">
            {{ record.transactionType === 'BUY' ? '购入' : '卖出' }}
          </a-tag>
        </template>
        <template v-if="column.key === 'profit'">
          <span v-if="record.profit !== null" :style="{ color: record.profit >= 0 ? 'red' : 'green', fontWeight: 'bold' }">
            ¥{{ record.profit.toFixed(2) }}
          </span>
          <span v-else>-</span>
        </template>
        <template v-if="column.key === 'profitRate'">
          <span v-if="record.profitRate !== null" :style="{ color: record.profitRate >= 0 ? 'red' : 'green', fontWeight: 'bold' }">
            {{ record.profitRate.toFixed(2) }}%
          </span>
          <span v-else>-</span>
        </template>
        <template v-if="column.key === 'action'">
          <a-space>
            <a-button type="link" size="small" @click="handleEdit(record)">编辑</a-button>
            <a-button type="link" size="small" danger @click="handleDelete(record)">删除</a-button>
          </a-space>
        </template>
      </template>
    </a-table>

    <a-modal
      v-model:open="editVisible"
      title="修改交易记录"
      @ok="handleUpdate"
      :width="isMobile ? '100%' : 520"
    >
      <a-form :label-col="isMobile ? { span: 24 } : { span: 6 }" :wrapper-col="isMobile ? { span: 24 } : { span: 16 }">
        <a-form-item label="交易价格" required>
          <a-input-number
            v-model:value="editForm.price"
            :min="0.01"
            :precision="2"
            style="width: 100%"
            placeholder="请输入交易价格"
          />
        </a-form-item>
        <a-form-item label="交易时间" required>
          <a-date-picker
            v-model:value="editForm.transactionTime"
            show-time
            format="YYYY-MM-DD HH:mm"
            style="width: 100%"
            placeholder="请选择交易时间"
          />
        </a-form-item>
        <a-form-item label="平台服务费率" v-if="editForm.transactionType === 'SELL'">
          <a-input-number
            v-model:value="editForm.platformFeeRate"
            :min="0"
            :max="100"
            :precision="2"
            style="width: 100%"
            placeholder="请输入平台服务费率(%)"
            addon-after="%"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { message, Modal } from 'ant-design-vue'
import { getTransactionPage, updateTransaction, deleteTransaction } from '@/api/transaction'
import { getItemTypeList } from '@/api/itemType'
import type { TransactionVO, ItemType } from '@/types'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import { useWindowSize } from '@/hooks/useWindowSize'

const { isMobile } = useWindowSize()
const route = useRoute()
const loading = ref(false)
const transactions = ref<TransactionVO[]>([])
const itemTypes = ref<ItemType[]>([])
const dateRange = ref<[Dayjs, Dayjs] | undefined>()

// 分页参数
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showTotal: (total: number) => `共 ${total} 条`
})

const filters = reactive({
  itemName: undefined as string | undefined,
  itemTypeId: undefined as number | undefined,
  transactionType: undefined as string | undefined
})

const columns = [
  { title: '饰品名称', dataIndex: 'itemName', key: 'itemName', width: 150 },
  { title: '类型', dataIndex: 'typeName', key: 'typeName', width: 100 },
  { title: '计数类型', key: 'counterType', width: 100 },
  { title: '磨损程度', key: 'wearLevel', width: 100 },
  { title: '交易类型', key: 'transactionType', width: 100 },
  { title: '交易价格', dataIndex: 'price', key: 'price', width: 100 },
  { title: '交易时间', dataIndex: 'transactionTime', key: 'transactionTime', width: 150 },
  { title: '盈亏', key: 'profit', width: 100 },
  { title: '盈利率', key: 'profitRate', width: 100 },
  { title: '操作', key: 'action', width: 150 }
]

// 移动端简化列
const mobileColumns = [
  { title: '饰品', dataIndex: 'itemName', key: 'itemName', width: 120 },
  { title: '类型', key: 'transactionType', width: 80 },
  { title: '价格', dataIndex: 'price', key: 'price', width: 80 },
  { title: '盈亏', key: 'profit', width: 80 },
  { title: '操作', key: 'action', width: 100 }
]

const editVisible = ref(false)
const editForm = reactive<{
  id: number | undefined
  price: number | undefined
  transactionTime: Dayjs | undefined
  platformFeeRate: number | undefined
  transactionType: string
}>({
  id: undefined,
  price: undefined,
  transactionTime: undefined,
  platformFeeRate: undefined,
  transactionType: ''
})

const handleEdit = (record: TransactionVO) => {
  editForm.id = record.id
  editForm.price = record.price
  editForm.transactionTime = dayjs(record.transactionTime)
  editForm.platformFeeRate = record.platformFeeRate
  editForm.transactionType = record.transactionType
  editVisible.value = true
}

const handleUpdate = async () => {
  if (!editForm.price || !editForm.transactionTime) {
    message.error('请填写完整信息')
    return
  }

  loading.value = true
  try {
    await updateTransaction({
      id: editForm.id!,
      price: editForm.price,
      transactionTime: editForm.transactionTime.format('YYYY-MM-DD HH:mm:ss'),
      platformFeeRate: editForm.platformFeeRate
    })
    message.success('修改成功')
    editVisible.value = false
    loadTransactions()
  } finally {
    loading.value = false
  }
}

const handleDelete = (record: TransactionVO) => {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除饰品"${record.itemName}"的${record.transactionType === 'BUY' ? '购入' : '卖出'}记录吗？`,
    okText: '确认',
    cancelText: '取消',
    onOk: async () => {
      loading.value = true
      try {
        await deleteTransaction(record.id)
        message.success('删除成功')
        loadTransactions()
      } finally {
        loading.value = false
      }
    }
  })
}

const loadTransactions = async () => {
  loading.value = true
  try {
    const params: any = {
      current: pagination.current,
      size: pagination.pageSize,
      itemName: filters.itemName,
      itemTypeId: filters.itemTypeId,
      transactionType: filters.transactionType
    }
    if (dateRange.value) {
      params.startDate = dateRange.value[0].format('YYYY-MM-DD')
      params.endDate = dateRange.value[1].format('YYYY-MM-DD')
    }
    const result = await getTransactionPage(params)
    transactions.value = result.records
    pagination.total = result.total
  } finally {
    loading.value = false
  }
}

const loadItemTypes = async () => {
  itemTypes.value = await getItemTypeList()
}

const handleSearch = () => {
  pagination.current = 1
  loadTransactions()
}

const handleTableChange = (pag: any) => {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
  loadTransactions()
}

const getWearLevelColor = (wearLevel: string) => {
  const colorMap: Record<string, string> = {
    '崭新出厂': 'green',
    '略有磨损': 'orange',
    '久经沙场': 'purple',
    '破损不堪': 'pink',
    '战痕累累': 'red'
  }
  return colorMap[wearLevel] || 'default'
}

onMounted(() => {
  const q = route.query
  if (q.startDate && q.endDate) {
    dateRange.value = [dayjs(String(q.startDate)), dayjs(String(q.endDate))]
  }
  loadItemTypes()
  loadTransactions()
})
</script>
