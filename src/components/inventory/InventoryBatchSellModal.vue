<template>
  <a-modal
    v-model:open="visible"
    :title="items.length > 1 ? `批量出售（${items.length} 件）` : '饰品出售'"
    :width="720"
    :confirm-loading="submitting"
    ok-text="确认出售"
    @ok="handleSubmit"
    @cancel="handleCancel"
  >
    <a-form layout="vertical" class="sell-form">
      <a-row :gutter="16">
        <a-col :span="12">
          <a-form-item label="卖出时间" required>
            <a-date-picker
              v-model:value="formState.transactionTime"
              show-time
              format="YYYY-MM-DD HH:mm"
              style="width: 100%"
            />
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item label="平台服务费率 (%)" required>
            <a-input-number
              v-model:value="formState.platformFeeRate"
              :min="0"
              :max="100"
              :precision="2"
              style="width: 100%"
              addon-after="%"
              @change="applyFeeToSummary"
            />
          </a-form-item>
        </a-col>
      </a-row>
      <a-form-item label="统一卖出价（可选，应用到全部）">
        <a-input-number
          v-model:value="uniformPrice"
          :min="0.01"
          :precision="2"
          style="width: 200px"
          placeholder="输入后点击应用"
        />
        <a-button type="link" @click="applyUniformPrice">应用到全部</a-button>
      </a-form-item>
    </a-form>

    <a-table
      :columns="columns"
      :data-source="sellRows"
      row-key="itemId"
      size="small"
      :pagination="false"
      :scroll="{ y: 280 }"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'wearLevel'">
          <a-tag v-if="hasWearLevel(record.wearLevel)" :color="getWearLevelColor(record.wearLevel)" size="small">
            {{ displayWearLevel(record.wearLevel) }}
          </a-tag>
          <span v-else>-</span>
        </template>
        <template v-if="column.key === 'purchasePrice'">
          ¥{{ record.purchasePrice?.toFixed(2) }}
        </template>
        <template v-if="column.key === 'price'">
          <a-input-number
            v-model:value="record.price"
            :min="0.01"
            :precision="2"
            size="small"
            style="width: 110px"
          />
        </template>
        <template v-if="column.key === 'profit'">
          <span :style="{ color: calcProfit(record) >= 0 ? '#cf1322' : '#3f8600' }">
            {{ calcProfit(record) >= 0 ? '+' : '' }}¥{{ calcProfit(record).toFixed(2) }}
          </span>
        </template>
      </template>
    </a-table>

    <div class="sell-summary">
      <span>合计卖出价：<strong>¥{{ totalSellPrice.toFixed(2) }}</strong></span>
      <span>预估到手：<strong>¥{{ totalRevenue.toFixed(2) }}</strong></span>
      <span>
        预估盈亏：
        <strong :style="{ color: totalProfit >= 0 ? '#cf1322' : '#3f8600' }">
          {{ totalProfit >= 0 ? '+' : '' }}¥{{ totalProfit.toFixed(2) }}
        </strong>
      </span>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { message } from 'ant-design-vue'
import dayjs, { type Dayjs } from 'dayjs'
import { batchSellItems } from '@/api/item'
import type { ItemVO } from '@/types'
import { displayWearLevel, getWearLevelColor, hasWearLevel } from '@/utils/wearLevel'

interface SellRow {
  itemId: number
  itemName: string
  wearLevel?: string
  purchasePrice?: number
  price?: number
}

const props = defineProps<{
  open: boolean
  items: ItemVO[]
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  success: []
}>()

const visible = computed({
  get: () => props.open,
  set: (v) => emit('update:open', v)
})

const submitting = ref(false)
const uniformPrice = ref<number>()
const sellRows = ref<SellRow[]>([])

const formState = reactive<{
  transactionTime: Dayjs | undefined
  platformFeeRate: number
}>({
  transactionTime: undefined,
  platformFeeRate: 1
})

const columns = [
  { title: '饰品名称', dataIndex: 'itemName', key: 'itemName', ellipsis: true },
  { title: '磨损', key: 'wearLevel', width: 100 },
  { title: '购入价', key: 'purchasePrice', width: 90 },
  { title: '卖出价', key: 'price', width: 130 },
  { title: '预估盈亏', key: 'profit', width: 100 }
]

const initRows = (items: ItemVO[]) => {
  sellRows.value = items.map(item => ({
    itemId: item.id,
    itemName: item.itemName,
    wearLevel: item.wearLevel,
    purchasePrice: item.purchasePrice,
    price: item.currentPrice ?? item.purchasePrice ?? undefined
  }))
  formState.transactionTime = dayjs()
  formState.platformFeeRate = 1
  uniformPrice.value = undefined
}

watch(() => props.items, (items) => {
  if (items.length) initRows(items)
}, { immediate: true })

watch(() => props.open, (open) => {
  if (open && props.items.length) initRows(props.items)
})

const feeRate = computed(() => (formState.platformFeeRate ?? 0) / 100)

const calcProfit = (row: SellRow) => {
  if (!row.price || row.purchasePrice == null) return 0
  return row.price * (1 - feeRate.value) - row.purchasePrice
}

const totalSellPrice = computed(() =>
  sellRows.value.reduce((sum, r) => sum + (r.price || 0), 0)
)

const totalRevenue = computed(() =>
  sellRows.value.reduce((sum, r) => sum + (r.price || 0) * (1 - feeRate.value), 0)
)

const totalProfit = computed(() =>
  sellRows.value.reduce((sum, r) => sum + calcProfit(r), 0)
)

const applyUniformPrice = () => {
  if (!uniformPrice.value) {
    message.warning('请输入统一卖出价')
    return
  }
  sellRows.value.forEach(r => { r.price = uniformPrice.value })
}

const applyFeeToSummary = () => {}

const handleCancel = () => {
  visible.value = false
}

const handleSubmit = async () => {
  if (!formState.transactionTime) {
    message.error('请选择卖出时间')
    return
  }
  const invalid = sellRows.value.find(r => !r.price || r.price <= 0)
  if (invalid) {
    message.error('请为每件饰品填写卖出价格')
    return
  }

  submitting.value = true
  try {
    const time = formState.transactionTime.format('YYYY-MM-DD HH:mm:ss')
    await batchSellItems({
      items: sellRows.value.map(r => ({
        itemId: r.itemId,
        price: r.price!,
        transactionTime: time,
        platformFeeRate: formState.platformFeeRate
      }))
    })
    message.success(`成功出售 ${sellRows.value.length} 件饰品`)
    visible.value = false
    emit('success')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.sell-form {
  margin-bottom: 12px;
}
.sell-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
  font-size: 14px;
  color: #595959;
}
</style>
