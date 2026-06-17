<template>
  <div>
    <a-space style="margin-bottom: 16px" wrap>
      <a-input
        v-model:value="searchName"
        placeholder="搜索饰品名称"
        :style="{ width: isMobile ? '100%' : '200px' }"
        allow-clear
        @press-enter="loadData"
      />
      <a-button type="primary" @click="loadData">查询</a-button>
      <a-button type="primary" :loading="refreshing" @click="handleRefreshPrice">
        刷新悠悠有品市价
      </a-button>
      <span v-if="lastRefresh" class="refresh-hint">上次刷新：{{ lastRefresh }}</span>
    </a-space>

    <template v-if="viewMode === 'list'">
      <a-row :gutter="[12, 12]" style="margin-bottom: 16px">
        <a-col :xs="12" :sm="8" :md="4" :lg="4">
          <a-card size="small" class="stat-card">
            <div class="stat-label">库存总值</div>
            <div class="stat-value">¥{{ formatMoney(summary.totalMarketValue) }}</div>
          </a-card>
        </a-col>
        <a-col :xs="12" :sm="8" :md="5" :lg="5">
          <a-card size="small" class="stat-card">
            <div class="stat-label">库存成本</div>
            <div class="stat-value">¥{{ formatMoney(summary.totalCost) }}</div>
          </a-card>
        </a-col>
        <a-col :xs="12" :sm="8" :md="5" :lg="5">
          <a-card size="small" class="stat-card">
            <div class="stat-label">浮动盈亏</div>
            <div class="stat-value" :style="{ color: pnlColor(summary.totalPnl) }">
              {{ summary.totalPnl >= 0 ? '+' : '' }}¥{{ formatMoney(summary.totalPnl) }}
              <span v-if="summary.pnlRate != null" class="stat-sub">
                ({{ summary.pnlRate >= 0 ? '+' : '' }}{{ summary.pnlRate.toFixed(2) }}%)
              </span>
            </div>
          </a-card>
        </a-col>
        <a-col :xs="12" :sm="8" :md="5" :lg="5">
          <a-card size="small" class="stat-card">
            <div class="stat-label">饰品数量</div>
            <div class="stat-value">{{ summary.itemCount }}</div>
          </a-card>
        </a-col>
        <a-col :xs="12" :sm="8" :md="5" :lg="5">
          <a-card size="small" class="stat-card">
            <div class="stat-label">可售数量</div>
            <div class="stat-value">{{ summary.itemCount }}</div>
          </a-card>
        </a-col>
      </a-row>

      <a-row :gutter="16">
        <a-col v-if="!isMobile" :span="5">
          <a-card size="small" title="分类" class="category-card">
            <a-menu
              v-model:selectedKeys="selectedCategoryKeys"
              mode="inline"
              @click="onCategoryClick"
            >
              <a-menu-item key="all">
                全部 ({{ categoryCounts.all }})
              </a-menu-item>
              <a-menu-item
                v-for="cat in categoryMenuItems"
                :key="String(cat.id)"
              >
                {{ cat.name }} ({{ cat.count }})
              </a-menu-item>
              <a-menu-item v-if="categoryCounts.other > 0" key="other">
                其他 ({{ categoryCounts.other }})
              </a-menu-item>
            </a-menu>
          </a-card>
        </a-col>
        <a-col :xs="24" :sm="24" :md="19" :lg="19">
          <a-select
            v-if="isMobile"
            v-model:value="mobileCategoryKey"
            style="width: 100%; margin-bottom: 12px"
            @change="onMobileCategoryChange"
          >
            <a-select-option value="all">全部 ({{ categoryCounts.all }})</a-select-option>
            <a-select-option
              v-for="cat in categoryMenuItems"
              :key="String(cat.id)"
              :value="String(cat.id)"
            >
              {{ cat.name }} ({{ cat.count }})
            </a-select-option>
            <a-select-option v-if="categoryCounts.other > 0" value="other">
              其他 ({{ categoryCounts.other }})
            </a-select-option>
          </a-select>

          <a-spin :spinning="loading">
            <a-table
              v-if="displayGroups.length"
              :columns="mainColumns"
              :data-source="displayGroups"
              :row-key="groupKey"
              size="middle"
              :pagination="false"
              :scroll="isMobile ? { x: 700 } : undefined"
              :row-selection="mode === 'batch' ? mainRowSelection : undefined"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'itemInfo'">
                  <div class="item-info">
                    <img
                      v-if="record.imageUrl"
                      :src="record.imageUrl"
                      class="item-thumb"
                      alt=""
                    />
                    <div v-else class="item-thumb placeholder">无图</div>
                    <div>
                      <div class="item-name">{{ record.itemName }}</div>
                      <a-tag v-if="record.categoryL2Name" size="small">{{ record.categoryL2Name }}</a-tag>
                    </div>
                  </div>
                </template>
                <template v-if="column.key === 'avgPrice'">
                  ¥{{ formatMoney(record.avgPurchasePrice ?? record.totalPurchasePrice / record.count) }}
                </template>
                <template v-if="column.key === 'currentPrice'">
                  <span v-if="record.currentPrice != null">¥{{ formatMoney(record.currentPrice) }}</span>
                  <a-tag v-else color="orange" size="small">无市价</a-tag>
                </template>
                <template v-if="column.key === 'pnl'">
                  <span
                    v-if="record.totalUnrealizedPnl != null"
                    :style="{ color: pnlColor(record.totalUnrealizedPnl) }"
                  >
                    {{ record.totalUnrealizedPnl >= 0 ? '+' : '' }}¥{{ formatMoney(record.totalUnrealizedPnl) }}
                  </span>
                  <span v-else>-</span>
                </template>
                <template v-if="column.key === 'action'">
                  <a-space>
                    <a-button type="link" size="small" @click="openDetail(record)">详情</a-button>
                    <a-button type="primary" size="small" @click="handleSellGroup(record)">出售</a-button>
                  </a-space>
                </template>
              </template>
            </a-table>
            <a-empty v-else-if="!loading" description="暂无库存" />
          </a-spin>
        </a-col>
      </a-row>
    </template>

    <template v-else>
      <a-breadcrumb style="margin-bottom: 16px">
        <a-breadcrumb-item>
          <a @click="backToList">库存列表</a>
        </a-breadcrumb-item>
        <a-breadcrumb-item>{{ activeGroup?.itemName }}</a-breadcrumb-item>
      </a-breadcrumb>

      <a-table
        :columns="detailColumns"
        :data-source="activeGroup?.items || []"
        row-key="id"
        size="middle"
        :pagination="false"
        :row-selection="mode === 'batch' ? detailRowSelection : undefined"
      >
        <template #bodyCell="{ column, record, index }">
          <template v-if="column.key === 'index'">
            {{ index + 1 }}
          </template>
          <template v-if="column.key === 'purchasePrice'">
            ¥{{ formatMoney(record.purchasePrice) }}
          </template>
          <template v-if="column.key === 'action'">
            <a-space>
              <a-button
                v-if="mode === 'sell'"
                type="primary"
                size="small"
                @click="$emit('sell', record)"
              >
                卖出
              </a-button>
              <a-button
                v-if="!record.goodId"
                type="link"
                size="small"
                @click="$emit('bind', record)"
              >
                绑定目录
              </a-button>
              <span v-if="record.goodId && mode !== 'sell'" class="bound-hint">已绑定</span>
            </a-space>
          </template>
        </template>
      </a-table>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { getGroupedInventory, refreshPrices } from '@/api/price'
import { getCategoryTree } from '@/api/itemCategory'
import type { InventoryGroupVO, ItemVO, ItemCategoryVO } from '@/types'
import { useWindowSize } from '@/hooks/useWindowSize'

const OTHER_CATEGORY_KEY = 'other'
const ALL_CATEGORY_KEY = 'all'

const props = withDefaults(defineProps<{
  mode?: 'sell' | 'batch'
  selectedKeys?: number[]
}>(), {
  mode: 'sell',
  selectedKeys: () => []
})

const emit = defineEmits<{
  sell: [item: ItemVO]
  bind: [item: ItemVO]
  'update:selectedKeys': [keys: number[]]
  loaded: [groups: InventoryGroupVO[]]
}>()

const { isMobile } = useWindowSize()
const allGroups = ref<InventoryGroupVO[]>([])
const displayGroups = ref<InventoryGroupVO[]>([])
const categoryTree = ref<ItemCategoryVO[]>([])
const searchName = ref('')
const loading = ref(false)
const refreshing = ref(false)
const lastRefresh = ref('')
const viewMode = ref<'list' | 'detail'>('list')
const activeGroup = ref<InventoryGroupVO | null>(null)
const selectedCategoryKeys = ref<string[]>([ALL_CATEGORY_KEY])
const mobileCategoryKey = ref(ALL_CATEGORY_KEY)
const selectedCategoryL1Id = ref<number | null>(null)

const groupKey = (g: InventoryGroupVO) => `${g.goodId || g.itemName}`

const mainColumns = [
  { title: '饰品信息', key: 'itemInfo', width: 260 },
  { title: '数量', dataIndex: 'count', key: 'count', width: 70, align: 'center' as const },
  { title: '购入价', key: 'avgPrice', width: 110 },
  { title: '市场价', key: 'currentPrice', width: 110 },
  { title: '浮动盈亏', key: 'pnl', width: 120 },
  { title: '操作', key: 'action', width: 140, fixed: 'right' as const }
]

const detailColumns = computed(() => {
  return [
    { title: '序号', key: 'index', width: 70 },
    { title: '购入价', key: 'purchasePrice', width: 120 },
    { title: '购入时间', dataIndex: 'purchaseTime', key: 'purchaseTime', width: 180 },
    { title: '操作', key: 'action', width: 180 }
  ]
})

const categoryCounts = computed(() => {
  const counts: Record<string, number> = { all: 0, other: 0 }
  for (const g of allGroups.value) {
    const n = g.count || 0
    counts.all += n
    const l1 = g.categoryL1Id
    if (l1 == null && g.categoryL2Id == null) {
      counts.other += n
    } else if (l1 != null) {
      counts[String(l1)] = (counts[String(l1)] || 0) + n
    } else {
      counts.other += n
    }
  }
  return counts
})

const categoryMenuItems = computed(() => {
  return categoryTree.value
    .map(l1 => ({
      id: l1.id,
      name: l1.categoryName,
      count: categoryCounts.value[String(l1.id)] || 0
    }))
    .filter(c => c.count > 0)
})

const summary = computed(() => {
  let totalMarketValue = 0
  let totalCost = 0
  let totalPnl = 0
  let itemCount = 0
  let hasPnl = false

  for (const g of displayGroups.value) {
    itemCount += g.count || 0
    totalCost += g.totalPurchasePrice || 0
    if (g.currentPrice != null) {
      totalMarketValue += g.currentPrice * g.count
    }
    if (g.totalUnrealizedPnl != null) {
      totalPnl += g.totalUnrealizedPnl
      hasPnl = true
    }
  }

  const pnlRate = totalCost > 0 && hasPnl ? (totalPnl / totalCost) * 100 : null
  return { totalMarketValue, totalCost, totalPnl, itemCount, pnlRate }
})

const mainRowSelection = computed(() => ({
  selectedRowKeys: displayGroups.value
    .filter(g => g.items?.length && g.items.every(i => props.selectedKeys.includes(i.id)))
    .map(groupKey),
  onSelect: (record: InventoryGroupVO, selected: boolean) => {
    const ids = new Set(props.selectedKeys)
    record.items?.forEach(i => {
      if (selected) ids.add(i.id)
      else ids.delete(i.id)
    })
    emit('update:selectedKeys', Array.from(ids))
  },
  onSelectAll: (selected: boolean, _rows: InventoryGroupVO[], changeRows: InventoryGroupVO[]) => {
    const ids = new Set(props.selectedKeys)
    changeRows.forEach(g => {
      g.items?.forEach(i => {
        if (selected) ids.add(i.id)
        else ids.delete(i.id)
      })
    })
    emit('update:selectedKeys', Array.from(ids))
  }
}))

const detailRowSelection = computed(() => ({
  selectedRowKeys: props.selectedKeys,
  onChange: (keys: number[]) => emit('update:selectedKeys', keys),
  preserveSelectedRowKeys: true
}))

const formatMoney = (val?: number | null) => {
  if (val == null || Number.isNaN(val)) return '-'
  return Number(val).toFixed(2)
}

const pnlColor = (val: number) => (val >= 0 ? '#cf1322' : '#3f8600')

const applyFilters = () => {
  let result = allGroups.value
  const keyword = searchName.value.trim()
  if (keyword) {
    result = result.filter(g => g.itemName?.includes(keyword))
  }
  if (selectedCategoryL1Id.value === 0) {
    result = result.filter(g => g.categoryL1Id == null && g.categoryL2Id == null)
  } else if (selectedCategoryL1Id.value != null) {
    result = result.filter(g => g.categoryL1Id === selectedCategoryL1Id.value)
  }
  displayGroups.value = result
}

const loadData = async () => {
  loading.value = true
  try {
    if (!categoryTree.value.length) {
      categoryTree.value = await getCategoryTree()
    }
    allGroups.value = await getGroupedInventory({})
    if (allGroups.value[0]?.priceUpdatedAt) {
      lastRefresh.value = String(allGroups.value[0].priceUpdatedAt)
    }
    applyFilters()
    emit('loaded', allGroups.value)
  } finally {
    loading.value = false
  }
}

const applyCategoryFilter = (key: string) => {
  if (key === ALL_CATEGORY_KEY) {
    selectedCategoryL1Id.value = null
  } else if (key === OTHER_CATEGORY_KEY) {
    selectedCategoryL1Id.value = 0
  } else {
    selectedCategoryL1Id.value = Number(key)
  }
  applyFilters()
}

const onCategoryClick = ({ key }: { key: string }) => {
  mobileCategoryKey.value = key
  applyCategoryFilter(key)
}

const onMobileCategoryChange = (key: string) => {
  selectedCategoryKeys.value = [key]
  applyCategoryFilter(key)
}

const handleRefreshPrice = async () => {
  refreshing.value = true
  try {
    const res = await refreshPrices()
    lastRefresh.value = res.priceUpdatedAt
    message.success(`已刷新 ${res.refreshedCount} 个饰品价格`)
    await loadData()
  } finally {
    refreshing.value = false
  }
}

const openDetail = (group: InventoryGroupVO) => {
  activeGroup.value = group
  viewMode.value = 'detail'
}

const backToList = () => {
  viewMode.value = 'list'
  activeGroup.value = null
}

const handleSellGroup = (group: InventoryGroupVO) => {
  if (group.count === 1 && group.items?.[0]) {
    emit('sell', group.items[0])
  } else {
    openDetail(group)
  }
}

defineExpose({ loadData })

onMounted(loadData)
</script>

<style scoped>
.stat-card :deep(.ant-card-body) {
  padding: 12px 16px;
}
.stat-label {
  font-size: 12px;
  color: #888;
  margin-bottom: 4px;
}
.stat-value {
  font-size: 18px;
  font-weight: 600;
  line-height: 1.3;
}
.stat-sub {
  font-size: 12px;
  font-weight: normal;
}
.category-card :deep(.ant-card-body) {
  padding: 0;
}
.item-info {
  display: flex;
  align-items: center;
  gap: 10px;
}
.item-thumb {
  width: 48px;
  height: 36px;
  object-fit: contain;
  border-radius: 4px;
  background: #f5f5f5;
  flex-shrink: 0;
}
.item-thumb.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  color: #bbb;
}
.item-name {
  font-weight: 500;
  margin-bottom: 2px;
}
.refresh-hint {
  color: #999;
  font-size: 12px;
}
.bound-hint {
  color: #999;
  font-size: 12px;
}
</style>
