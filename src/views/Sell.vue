<template>
  <div>
    <GroupedInventoryCollapse
      ref="listRef"
      mode="sell"
      @sell="handleSell"
      @bind="openBind"
      @loaded="onGroupsLoaded"
    />

    <a-modal
      v-model:open="modalVisible"
      title="饰品卖出"
      @ok="handleSubmit"
      :confirm-loading="submitLoading"
      :width="isMobile ? '100%' : 520"
    >
      <a-form :label-col="isMobile ? { span: 24 } : { span: 6 }" :wrapper-col="isMobile ? { span: 24 } : { span: 16 }">
        <a-form-item label="饰品名称">
          <span style="font-weight: 500;">{{ selectedItem?.itemName }}</span>
        </a-form-item>
        <a-form-item label="购入价格">
          <span style="font-weight: 500;">¥{{ selectedItem?.purchasePrice?.toFixed(2) }}</span>
        </a-form-item>
        <a-form-item label="卖出价格" required>
          <a-input-number
            v-model:value="formState.price"
            :min="0.01"
            :precision="2"
            style="width: 100%"
            placeholder="请输入卖出价格"
          />
        </a-form-item>
        <a-form-item label="卖出时间" required>
          <a-date-picker
            v-model:value="formState.transactionTime"
            show-time
            format="YYYY-MM-DD HH:mm"
            style="width: 100%"
            placeholder="请选择卖出时间"
          />
        </a-form-item>
        <a-form-item label="平台服务费率" required>
          <a-input-number
            v-model:value="formState.platformFeeRate"
            :min="0"
            :max="100"
            :precision="2"
            style="width: 100%"
            placeholder="请输入平台服务费率(%)"
            addon-after="%"
          />
        </a-form-item>
        <a-divider v-if="estimatedRevenue !== null" style="margin: 12px 0;" />
        <a-form-item label="实际到手" v-if="estimatedRevenue !== null">
          <span style="font-size: 15px; font-weight: bold;">
            ¥{{ estimatedRevenue.toFixed(2) }}
          </span>
        </a-form-item>
        <a-form-item label="预估盈亏" v-if="estimatedProfit !== null">
          <span
            :style="{
              fontSize: '16px',
              fontWeight: 'bold',
              color: estimatedProfit >= 0 ? 'red' : 'green'
            }"
          >
            {{ estimatedProfit >= 0 ? '+' : '' }}¥{{ estimatedProfit.toFixed(2) }}
            ({{ estimatedProfitRate.toFixed(2) }}%)
          </span>
        </a-form-item>
      </a-form>
    </a-modal>

    <a-modal v-model:open="bindVisible" title="绑定目录饰品" @ok="confirmBind">
      <ItemNameAutoComplete
        v-model="bindItemName"
        placeholder="搜索目录饰品"
        @select="onBindSelect"
      />
      <p v-if="selectedBindGoodId" style="margin-top: 8px">Good ID: {{ selectedBindGoodId }}</p>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRoute } from 'vue-router'
import { message } from 'ant-design-vue'
import { sellItem, bindMarketItem } from '@/api/item'
import GroupedInventoryCollapse from '@/components/GroupedInventoryCollapse.vue'
import ItemNameAutoComplete from '@/components/ItemNameAutoComplete.vue'
import type { ItemVO, MarketItemVO, InventoryGroupVO } from '@/types'
import dayjs, { Dayjs } from 'dayjs'
import { useWindowSize } from '@/hooks/useWindowSize'

const route = useRoute()
const { isMobile } = useWindowSize()
const listRef = ref<InstanceType<typeof GroupedInventoryCollapse>>()
const submitLoading = ref(false)
const modalVisible = ref(false)
const selectedItem = ref<ItemVO | null>(null)
const bindVisible = ref(false)
const bindItemName = ref('')
const bindItemId = ref<number>()
const selectedBindGoodId = ref<number>()

const formState = reactive<{
  price: number | undefined
  transactionTime: Dayjs | undefined
  platformFeeRate: number | undefined
}>({
  price: undefined,
  transactionTime: undefined,
  platformFeeRate: undefined
})

const estimatedRevenue = computed(() => {
  if (!formState.price || formState.platformFeeRate === undefined) {
    return null
  }
  return formState.price * (1 - formState.platformFeeRate / 100)
})

const estimatedProfit = computed(() => {
  if (!formState.price || formState.platformFeeRate === undefined || !selectedItem.value?.purchasePrice) {
    return null
  }
  const actualSellPrice = formState.price * (1 - formState.platformFeeRate / 100)
  return actualSellPrice - selectedItem.value.purchasePrice
})

const estimatedProfitRate = computed(() => {
  if (!selectedItem.value?.purchasePrice || estimatedProfit.value === null) {
    return 0
  }
  return (estimatedProfit.value / selectedItem.value.purchasePrice) * 100
})

const handleSell = (item: ItemVO) => {
  selectedItem.value = item
  formState.price = item.currentPrice ?? undefined
  formState.transactionTime = dayjs()
  formState.platformFeeRate = 1
  modalVisible.value = true
}

const handleSubmit = async () => {
  if (!formState.price || !formState.transactionTime || formState.platformFeeRate === undefined) {
    message.error('请填写完整信息')
    return
  }

  submitLoading.value = true
  try {
    await sellItem({
      itemId: selectedItem.value!.id,
      price: formState.price,
      transactionTime: formState.transactionTime.format('YYYY-MM-DD HH:mm:ss'),
      platformFeeRate: formState.platformFeeRate
    })
    message.success('卖出成功')
    modalVisible.value = false
    listRef.value?.loadData()
  } finally {
    submitLoading.value = false
  }
}

const openBind = (record: ItemVO) => {
  bindItemId.value = record.id
  bindItemName.value = ''
  selectedBindGoodId.value = undefined
  bindVisible.value = true
}

const onBindSelect = (item: MarketItemVO) => {
  selectedBindGoodId.value = item.goodId
}

const confirmBind = async () => {
  if (!bindItemId.value || !selectedBindGoodId.value) {
    message.warning('请选择目录饰品')
    return
  }
  await bindMarketItem({ itemId: bindItemId.value, goodId: selectedBindGoodId.value })
  message.success('绑定成功')
  bindVisible.value = false
  listRef.value?.loadData()
}

const onGroupsLoaded = (groups: InventoryGroupVO[]) => {
  const itemId = Number(route.query.itemId)
  if (!itemId) return
  const item = groups.flatMap(g => g.items || []).find(i => i.id === itemId)
  if (item) {
    handleSell(item)
  }
}
</script>
