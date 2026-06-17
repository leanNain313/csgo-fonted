<template>
  <div class="inventory-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">库存管理</h1>
        <p class="page-subtitle">勾选饰品批量出售；历史数据可先绑定目录再刷新市价</p>
      </div>
    </div>

    <a-alert
      class="legacy-alert"
      type="info"
      show-icon
      message="历史库存兼容说明"
      description="未绑定目录的旧饰品无法获取市价。请在列表或详情中点击「绑定目录」，搜索并选择当前饰品目录中的对应饰品完成对接。"
    />

    <div class="overview-card">
      <div class="overview-inner">
        <div class="stat-square">
          <div class="stat-card stat-blue">
            <div class="stat-icon"><WalletOutlined /></div>
            <div class="stat-body">
              <div class="stat-label">库存总值</div>
              <div class="stat-value">¥{{ formatMoney(summary.totalMarketValue) }}</div>
              <div class="stat-foot">{{ lastRefresh ? `市价更新时间：${lastRefresh}` : '市价未刷新' }}</div>
            </div>
          </div>
          <div class="stat-card stat-orange">
            <div class="stat-icon"><ShoppingOutlined /></div>
            <div class="stat-body">
              <div class="stat-label">库存成本</div>
              <div class="stat-value">¥{{ formatMoney(summary.totalCost) }}</div>
              <div class="stat-foot">按购入价汇总</div>
            </div>
          </div>
          <div class="stat-card stat-green">
            <div class="stat-icon"><ThunderboltOutlined /></div>
            <div class="stat-body">
              <div class="stat-label">浮动盈亏</div>
              <div class="stat-value" :style="{ color: pnlColor(summary.totalPnl) }">
                {{ summary.totalPnl >= 0 ? '+' : '' }}¥{{ formatMoney(summary.totalPnl) }}
              </div>
              <div class="stat-foot" :style="{ color: pnlColor(summary.totalPnl) }">
                {{ summary.pnlRate == null ? '缺少市价数据' : `${summary.pnlRate >= 0 ? '+' : ''}${summary.pnlRate.toFixed(2)}%` }}
              </div>
            </div>
          </div>
          <div class="stat-card stat-cyan">
            <div class="stat-icon"><AppstoreOutlined /></div>
            <div class="stat-body">
              <div class="stat-label">饰品数量</div>
              <div class="stat-value">{{ summary.itemCount }} <span class="stat-unit">件</span></div>
              <div class="stat-foot">在库饰品总量</div>
            </div>
          </div>
        </div>

        <UnrealizedCalendarPanel embedded class="overview-calendar" />
      </div>
    </div>

    <div class="main-card">
      <div class="filter-bar">
        <a-input-search
          v-model:value="searchName"
          placeholder="搜索饰品名称"
          class="filter-search"
          allow-clear
          @search="handleFilter"
        />
        <a-button type="primary" @click="handleFilter">筛选</a-button>
        <a-button @click="resetFilter">重置</a-button>
        <a-button :loading="refreshing" @click="handleRefreshPrice">刷新市价</a-button>
      </div>

      <div class="inventory-body">
        <aside class="category-panel">
          <div class="category-title">分类</div>
          <div
            class="category-item"
            :class="{ active: selectedCategoryKeys[0] === ALL_CATEGORY_KEY }"
            @click="applyCategoryFilter(ALL_CATEGORY_KEY)"
          >
            <span>全部</span>
            <span class="category-count">{{ categoryCounts.all }}</span>
          </div>
          <div
            v-for="cat in categoryMenuItems"
            :key="cat.id"
            class="category-item"
            :class="{ active: selectedCategoryKeys[0] === String(cat.id) }"
            @click="applyCategoryFilter(String(cat.id))"
          >
            <span>{{ cat.name }}</span>
            <span class="category-count">{{ cat.count }}</span>
          </div>
          <div
            v-if="categoryCounts.other > 0"
            class="category-item"
            :class="{ active: selectedCategoryKeys[0] === OTHER_CATEGORY_KEY }"
            @click="applyCategoryFilter(OTHER_CATEGORY_KEY)"
          >
            <span>其他</span>
            <span class="category-count">{{ categoryCounts.other }}</span>
          </div>
        </aside>

        <div class="list-area">
          <InventoryListPanel
            ref="listPanelRef"
            v-model:selected-ids="selectedRowKeys"
            :groups="displayGroups"
            :loading="loading"
            @bind="openBind"
            @sell="openSell"
          />

          <a-card v-if="selectedItems.length > 0" class="batch-sell-card" title="批量卖出设置">
            <a-form :label-col="{ span: 5 }" :wrapper-col="{ span: 16 }">
              <a-form-item label="卖出价格" required>
                <a-input-number
                  v-model:value="batchSellForm.price"
                  :min="0.01"
                  :precision="2"
                  style="width: 220px"
                  placeholder="统一卖出价格"
                />
              </a-form-item>
              <a-form-item label="卖出时间" required>
                <a-date-picker
                  v-model:value="batchSellForm.transactionTime"
                  show-time
                  format="YYYY-MM-DD HH:mm"
                  style="width: 220px"
                />
              </a-form-item>
              <a-form-item label="平台费率" required>
                <a-input-number
                  v-model:value="batchSellForm.platformFeeRate"
                  :min="0"
                  :max="100"
                  :precision="2"
                  style="width: 220px"
                  addon-after="%"
                />
              </a-form-item>
              <a-form-item label="已选饰品">
                <a-tag color="blue">{{ selectedItems.length }} 件</a-tag>
              </a-form-item>
              <a-form-item v-if="totalPurchaseCost > 0" label="总购入成本">
                <strong>¥{{ totalPurchaseCost.toFixed(2) }}</strong>
              </a-form-item>
              <a-form-item v-if="estimatedRevenue > 0" label="预估到手">
                <strong>¥{{ estimatedRevenue.toFixed(2) }}</strong>
              </a-form-item>
              <a-form-item v-if="batchSellForm.price && totalPurchaseCost > 0" label="预估盈亏">
                <strong :style="{ color: estimatedProfit >= 0 ? '#cf1322' : '#3f8600' }">
                  {{ estimatedProfit >= 0 ? '+' : '' }}¥{{ estimatedProfit.toFixed(2) }}
                  ({{ estimatedProfitRate.toFixed(2) }}%)
                </strong>
              </a-form-item>
              <a-form-item :wrapper-col="{ offset: 5 }">
                <a-space>
                  <a-button type="primary" danger :loading="submitLoading" @click="handleBatchSell">
                    批量卖出
                  </a-button>
                  <a-button @click="handleClearSelection">清空选择</a-button>
                </a-space>
              </a-form-item>
            </a-form>
          </a-card>
        </div>
      </div>
    </div>

    <BindMarketItemModal
      v-model:open="bindVisible"
      :default-item-name="bindItemName"
      @confirm="confirmBind"
    />

    <InventoryBatchSellModal
      v-model:open="sellVisible"
      :items="sellItems"
      @success="onSellSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import dayjs, { type Dayjs } from 'dayjs'
import {
  WalletOutlined,
  ShoppingOutlined,
  ThunderboltOutlined,
  AppstoreOutlined
} from '@ant-design/icons-vue'
import { batchSellItems, bindMarketItem } from '@/api/item'
import BindMarketItemModal from '@/components/BindMarketItemModal.vue'
import InventoryListPanel from '@/components/inventory/InventoryListPanel.vue'
import InventoryBatchSellModal from '@/components/inventory/InventoryBatchSellModal.vue'
import UnrealizedCalendarPanel from '@/components/inventory/UnrealizedCalendarPanel.vue'
import { useInventoryData, formatInventoryMoney, inventoryPnlColor } from '@/composables/useInventoryData'
import type { ItemVO } from '@/types'

const {
  displayGroups,
  allGroups,
  searchName,
  loading,
  refreshing,
  selectedCategoryKeys,
  categoryCounts,
  categoryMenuItems,
  summary,
  loadData,
  applyCategoryFilter,
  handleFilter,
  resetFilter,
  handleRefreshPrice,
  ALL_CATEGORY_KEY,
  OTHER_CATEGORY_KEY
} = useInventoryData()

const listPanelRef = ref<InstanceType<typeof InventoryListPanel>>()
const selectedRowKeys = ref<number[]>([])
const submitLoading = ref(false)
const bindVisible = ref(false)
const bindItemId = ref<number>()
const bindItemName = ref('')
const sellVisible = ref(false)
const sellItems = ref<ItemVO[]>([])

const batchSellForm = reactive<{
  price: number | undefined
  transactionTime: Dayjs | undefined
  platformFeeRate: number
}>({
  price: undefined,
  transactionTime: dayjs(),
  platformFeeRate: 1
})

const formatMoney = formatInventoryMoney
const pnlColor = inventoryPnlColor

const allItems = computed(() => allGroups.value.flatMap(g => g.items || []))

const selectedItems = computed(() =>
  allItems.value.filter(item => selectedRowKeys.value.includes(item.id))
)

const totalPurchaseCost = computed(() =>
  selectedItems.value.reduce((sum, item) => sum + (item.purchasePrice || 0), 0)
)

const estimatedRevenue = computed(() => {
  if (!batchSellForm.price) return 0
  const feeRate = batchSellForm.platformFeeRate / 100
  return selectedItems.value.length * batchSellForm.price * (1 - feeRate)
})

const estimatedProfit = computed(() => estimatedRevenue.value - totalPurchaseCost.value)

const estimatedProfitRate = computed(() => {
  if (totalPurchaseCost.value === 0) return 0
  return (estimatedProfit.value / totalPurchaseCost.value) * 100
})

const openBind = (record: ItemVO) => {
  bindItemId.value = record.id
  bindItemName.value = record.itemName || ''
  bindVisible.value = true
}

const confirmBind = async ({ goodId }: { goodId: number }) => {
  if (!bindItemId.value) return
  await bindMarketItem({ itemId: bindItemId.value, goodId })
  message.success('绑定成功，可刷新市价获取最新价格')
  bindVisible.value = false
  bindItemName.value = ''
  await loadData()
}

const openSell = (items: ItemVO[]) => {
  sellItems.value = items
  sellVisible.value = true
}

const handleBatchSell = async () => {
  if (!selectedItems.value.length) {
    message.error('请选择要卖出的饰品')
    return
  }
  if (!batchSellForm.price || batchSellForm.price <= 0) {
    message.error('请输入有效的卖出价格')
    return
  }
  if (!batchSellForm.transactionTime) {
    message.error('请选择卖出时间')
    return
  }

  submitLoading.value = true
  try {
    const time = batchSellForm.transactionTime.format('YYYY-MM-DD HH:mm:ss')
    await batchSellItems({
      items: selectedItems.value.map(item => ({
        itemId: item.id,
        price: batchSellForm.price!,
        transactionTime: time,
        platformFeeRate: batchSellForm.platformFeeRate
      }))
    })
    message.success(`批量卖出成功，共 ${selectedItems.value.length} 件饰品`)
    handleClearSelection()
    listPanelRef.value?.backToList()
    await loadData()
  } finally {
    submitLoading.value = false
  }
}

const handleClearSelection = () => {
  selectedRowKeys.value = []
  batchSellForm.price = undefined
  batchSellForm.transactionTime = dayjs()
  batchSellForm.platformFeeRate = 1
}

const onSellSuccess = async () => {
  handleClearSelection()
  listPanelRef.value?.backToList()
  await loadData()
}

onMounted(loadData)
</script>

<style scoped>
.inventory-page {
  margin: 0;
  padding: 24px 28px 40px;
  background: #f5f6f8;
  min-height: 100%;
}

.page-header {
  margin-bottom: 16px;
}

.page-title {
  margin: 0 0 6px;
  font-size: 22px;
  font-weight: 700;
  color: #1a1a1a;
}

.page-subtitle {
  margin: 0;
  color: #8c8c8c;
  font-size: 14px;
}

.legacy-alert {
  margin-bottom: 20px;
}

.overview-card {
  background: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 12px;
  padding: 18px 18px;
  margin-bottom: 20px;
}

.overview-inner {
  display: grid;
  grid-template-columns: 1fr 1.7fr;
  gap: 20px;
  align-items: stretch;
}

.stat-square {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 16px;
  min-height: 0;
}

.overview-calendar {
  min-width: 0;
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
  border: 1px solid #f0f0f0;
}

.stat-card {
  background: #fff;
  border-radius: 12px;
  padding: 18px 18px;
  display: flex;
  align-items: center;
  gap: 14px;
  border: 1px solid #f0f0f0;
  min-height: 92px;
}

.stat-body {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.stat-square .stat-value {
  font-size: 20px;
}

.stat-square .stat-label {
  font-size: 12px;
  margin-bottom: 4px;
  color: rgba(0, 0, 0, 0.45);
}

.stat-foot {
  margin-top: 6px;
  font-size: 11px;
  line-height: 1.2;
  color: rgba(0, 0, 0, 0.45);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.stat-square .stat-icon {
  width: 40px;
  height: 40px;
  font-size: 18px;
  border-radius: 12px;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
}

.stat-blue .stat-icon { background: #e6f4ff; color: #1677ff; }
.stat-orange .stat-icon { background: #fff7e6; color: #fa8c16; }
.stat-green .stat-icon { background: #f6ffed; color: #52c41a; }
.stat-cyan .stat-icon { background: #e6fffb; color: #13c2c2; }

.stat-label {
  font-size: 13px;
  color: #8c8c8c;
  margin-bottom: 6px;
}

.stat-value {
  font-size: 22px;
  font-weight: 700;
  line-height: 1.2;
  color: #1a1a1a;
}

.stat-unit {
  font-size: 14px;
  font-weight: 400;
  color: #8c8c8c;
}

.main-card {
  background: #fff;
  border-radius: 12px;
  border: 1px solid #f0f0f0;
  overflow: hidden;
}

.filter-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 18px 24px;
  border-bottom: 1px solid #f0f0f0;
  flex-wrap: wrap;
}

.filter-search {
  width: 280px;
}

.inventory-body {
  display: flex;
  align-items: stretch;
  min-height: 520px;
}

.list-area {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.batch-sell-card {
  margin: 16px 20px 20px;
  border: 1px solid #ffd6d6;
  background: #fffafa;
}

.batch-sell-card :deep(.ant-card-head) {
  border-bottom-color: #ffe7e7;
  min-height: 44px;
}

.batch-sell-card :deep(.ant-card-head-title) {
  color: #cf1322;
  font-weight: 600;
}

.category-panel {
  width: 180px;
  flex-shrink: 0;
  border-right: 1px solid #f0f0f0;
  padding: 16px 0;
  background: #fafafa;
}

.category-title {
  padding: 4px 20px 14px;
  font-weight: 600;
  color: #595959;
  font-size: 13px;
}

.category-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 11px 20px;
  cursor: pointer;
  color: #595959;
  font-size: 14px;
  transition: background 0.15s;
}

.category-item:hover {
  background: #f0f0f0;
}

.category-item.active {
  background: #fff;
  color: #1677ff;
  font-weight: 500;
  border-right: 2px solid #1677ff;
}

.category-count {
  color: #bfbfbf;
  font-size: 12px;
}

.category-item.active .category-count {
  color: #1677ff;
}

@media (max-width: 1100px) {
  .overview-inner {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .overview-calendar {
    border-left: none;
    padding-left: 0;
    border-top: 1px solid #f0f0f0;
    padding-top: 20px;
  }

  .stat-square {
    max-width: 480px;
  }
}

@media (max-width: 768px) {
  .inventory-page {
    padding: 16px;
  }

  .overview-card {
    padding: 16px;
  }

  .stat-square {
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  .stat-square .stat-value {
    font-size: 15px;
  }

  .filter-search {
    width: 100%;
  }

  .inventory-body {
    flex-direction: column;
  }

  .category-panel {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid #f0f0f0;
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    padding: 12px 16px;
  }

  .category-title {
    width: 100%;
    padding: 0 0 8px;
  }

  .category-item {
    padding: 6px 14px;
    border-radius: 16px;
    background: #fff;
    border: 1px solid #e8e8e8;
  }

  .category-item.active {
    border-color: #1677ff;
    border-right: 1px solid #1677ff;
  }
}
</style>
