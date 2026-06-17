<template>
  <div class="list-panel">
    <template v-if="viewMode === 'list'">
      <div class="batch-toolbar">
        <div class="batch-toolbar-left">
          <a-checkbox
            :checked="isAllSelected"
            :indeterminate="isIndeterminate"
            @change="onSelectAllChange"
          >
            全选
          </a-checkbox>
          <span class="selected-hint">已选择 <strong>{{ selectedIds.length }}</strong> 件饰品</span>
        </div>
        <div class="batch-toolbar-right">
          <a-button type="link" :disabled="!selectedIds.length" @click="clearSelection">
            清空选择
          </a-button>
        </div>
      </div>

      <a-spin :spinning="loading">
        <a-table
          v-if="groups.length"
          class="inv-table"
          :columns="mainColumns"
          :data-source="groups"
          :row-key="groupKey"
          size="middle"
          :pagination="pagination"
          :scroll="{ x: 1200 }"
          :row-selection="mainRowSelection"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'itemInfo'">
              <div class="item-info">
                <img v-if="record.imageUrl" :src="record.imageUrl" class="item-thumb" alt="" />
                <div v-else class="item-thumb placeholder">无图</div>
                <div class="item-meta">
                  <div class="item-name">{{ record.itemName }}</div>
                  <div class="item-tags">
                    <a-tag v-if="groupNeedsCatalogBind(record)" color="warning" size="small">未绑定目录</a-tag>
                    <span v-if="record.categoryL2Name" class="item-rarity">{{ record.categoryL2Name }}</span>
                  </div>
                </div>
              </div>
            </template>
            <template v-else-if="column.key === 'wearLevel'">
              <div class="wear-cell">
                <a-tag
                  v-for="wear in groupWearLabels(record)"
                  :key="wear"
                  :color="getWearLevelColor(wear)"
                  size="small"
                >
                  {{ wear }}
                </a-tag>
                <span v-if="!groupWearLabels(record).length">-</span>
              </div>
            </template>
            <template v-if="column.key === 'avgPrice'">
              ¥{{ formatMoney(record.avgPurchasePrice ?? record.totalPurchasePrice / record.count) }}
            </template>
            <template v-if="column.key === 'currentPrice'">
              <span v-if="record.currentPrice != null">¥{{ formatMoney(record.currentPrice) }}/件</span>
              <a-tag v-else color="orange" size="small">无市价</a-tag>
            </template>
            <template v-if="column.key === 'pnl'">
              <div
                v-if="record.totalUnrealizedPnl != null"
                class="pnl-cell"
                :style="{ color: pnlColor(record.totalUnrealizedPnl) }"
              >
                <span class="pnl-amount">
                  {{ record.totalUnrealizedPnl >= 0 ? '+' : '' }}¥{{ formatMoney(record.totalUnrealizedPnl) }}
                </span>
                <span class="pnl-rate">{{ formatPnlRate(record) }}</span>
              </div>
              <span v-else>-</span>
            </template>
            <template v-if="column.key === 'action'">
              <a-space :size="4" wrap>
                <a-button type="link" size="small" class="action-link" @click="openDetail(record)">详情</a-button>
                <a-button type="link" size="small" class="action-sell" @click="handleSellGroup(record)">
                  出售
                </a-button>
                <a-button
                  v-if="groupNeedsCatalogBind(record)"
                  type="link"
                  size="small"
                  class="action-bind"
                  @click="emitBindGroup(record)"
                >
                  绑定目录
                </a-button>
              </a-space>
            </template>
          </template>
        </a-table>
        <a-empty v-else-if="!loading" description="暂无库存" />
      </a-spin>
    </template>

    <template v-else>
      <div class="detail-header">
        <a-breadcrumb class="detail-breadcrumb">
          <a-breadcrumb-item>
            <a @click="backToList">库存列表</a>
          </a-breadcrumb-item>
          <a-breadcrumb-item>{{ activeGroup?.itemName }}</a-breadcrumb-item>
        </a-breadcrumb>
        <a-space v-if="detailSelectedIds.length">
          <span class="selected-hint">已选 {{ detailSelectedIds.length }} 件</span>
        </a-space>
      </div>

      <a-table
        class="inv-table"
        :columns="detailColumns"
        :data-source="activeGroup?.items || []"
        row-key="id"
        size="middle"
        :pagination="false"
        :row-selection="detailRowSelection"
      >
        <template #bodyCell="{ column, record, index }">
          <template v-if="column.key === 'index'">{{ index + 1 }}</template>
          <template v-if="column.key === 'wearLevel'">
            <a-tag v-if="hasWearLevel(record.wearLevel)" :color="getWearLevelColor(record.wearLevel)" size="small">
              {{ displayWearLevel(record.wearLevel) }}
            </a-tag>
            <span v-else>-</span>
          </template>
          <template v-if="column.key === 'purchasePrice'">
            ¥{{ formatMoney(record.purchasePrice) }}
          </template>
          <template v-if="column.key === 'action'">
            <a-space :size="4" wrap>
              <a-button type="link" size="small" class="action-sell" @click="emitSell([record])">
                出售
              </a-button>
              <a-button
                v-if="needsCatalogBind(record)"
                type="link"
                size="small"
                class="action-bind"
                @click="$emit('bind', record)"
              >
                绑定目录
              </a-button>
              <span v-else class="bound-hint">已绑定目录</span>
            </a-space>
          </template>
        </template>
      </a-table>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { message } from 'ant-design-vue'
import type { InventoryGroupVO, ItemVO } from '@/types'
import { formatInventoryMoney, formatInventoryPnlRate, inventoryPnlColor } from '@/composables/useInventoryData'
import {
  displayWearLevel,
  getWearLevelColor,
  groupWearLabels,
  hasWearLevel
} from '@/utils/wearLevel'
import { needsCatalogBind, groupNeedsCatalogBind, findFirstUnboundItem } from '@/utils/itemCatalog'

const props = defineProps<{
  groups: InventoryGroupVO[]
  loading?: boolean
  selectedIds?: number[]
}>()

const emit = defineEmits<{
  'update:selectedIds': [ids: number[]]
  bind: [item: ItemVO]
  sell: [items: ItemVO[]]
}>()

const selectedIds = computed({
  get: () => props.selectedIds || [],
  set: (ids: number[]) => emit('update:selectedIds', ids)
})

const viewMode = ref<'list' | 'detail'>('list')
const activeGroup = ref<InventoryGroupVO | null>(null)

const groupKey = (g: InventoryGroupVO) => `${g.goodId || g.itemName}_${g.wearLevel || ''}`

const allItemIds = computed(() =>
  props.groups.flatMap(g => g.items?.map(i => i.id) || [])
)

const selectedIdsSet = computed(() => new Set(selectedIds.value))

const isAllSelected = computed(() =>
  allItemIds.value.length > 0 && allItemIds.value.every(id => selectedIdsSet.value.has(id))
)

const isIndeterminate = computed(() =>
  selectedIds.value.length > 0 && !isAllSelected.value
)

const detailSelectedIds = computed(() => {
  const groupIds = new Set(activeGroup.value?.items?.map(i => i.id) || [])
  return selectedIds.value.filter(id => groupIds.has(id))
})

const mainColumns = [
  { title: '饰品信息', key: 'itemInfo', width: 260, fixed: 'left' as const },
  { title: '磨损', key: 'wearLevel', width: 120 },
  { title: '数量', dataIndex: 'count', key: 'count', width: 68, align: 'center' as const },
  { title: '均价', key: 'avgPrice', width: 96 },
  { title: '市价', key: 'currentPrice', width: 100 },
  { title: '浮动盈亏', key: 'pnl', width: 118 },
  { title: '操作', key: 'action', width: 180, fixed: 'right' as const }
]

const detailColumns = [
  { title: '#', key: 'index', width: 56 },
  { title: '磨损', key: 'wearLevel', width: 110 },
  { title: '购入价', key: 'purchasePrice', width: 100 },
  { title: '购入时间', dataIndex: 'purchaseTime', key: 'purchaseTime', width: 170 },
  { title: '操作', key: 'action', width: 180 }
]

const pagination = computed(() => ({
  total: props.groups.length,
  showSizeChanger: true,
  pageSizeOptions: ['10', '20', '50'],
  defaultPageSize: 10,
  showTotal: (total: number) => `共 ${total} 组`
}))

const mainRowSelection = computed(() => ({
  selectedRowKeys: props.groups
    .filter(g => g.items?.length && g.items.every(i => selectedIdsSet.value.has(i.id)))
    .map(groupKey),
  onSelect: (record: InventoryGroupVO, selected: boolean) => {
    const ids = new Set(selectedIds.value)
    record.items?.forEach(i => {
      if (selected) ids.add(i.id)
      else ids.delete(i.id)
    })
    selectedIds.value = Array.from(ids)
  },
  onSelectAll: (selected: boolean, _rows: InventoryGroupVO[], changeRows: InventoryGroupVO[]) => {
    const ids = new Set(selectedIds.value)
    changeRows.forEach(g => {
      g.items?.forEach(i => {
        if (selected) ids.add(i.id)
        else ids.delete(i.id)
      })
    })
    selectedIds.value = Array.from(ids)
  },
  preserveSelectedRowKeys: true
}))

const detailRowSelection = computed(() => ({
  selectedRowKeys: detailSelectedIds.value,
  onChange: (keys: number[]) => {
    const groupIds = new Set(activeGroup.value?.items?.map(i => i.id) || [])
    const other = selectedIds.value.filter(id => !groupIds.has(id))
    selectedIds.value = [...other, ...keys]
  },
  preserveSelectedRowKeys: true
}))

const onSelectAllChange = (e: { target: { checked: boolean } }) => {
  selectedIds.value = e.target.checked ? [...allItemIds.value] : []
}

const clearSelection = () => {
  selectedIds.value = []
}

const findItemsByIds = (ids: number[]): ItemVO[] => {
  const idSet = new Set(ids)
  return props.groups.flatMap(g => g.items || []).filter(i => idSet.has(i.id))
}

const emitSell = (items: ItemVO[]) => {
  if (!items.length) return
  emit('sell', items)
}

const handleSellGroup = (group: InventoryGroupVO) => {
  if (group.count === 1 && group.items?.[0]) {
    emitSell([group.items[0]])
  } else {
    openDetail(group)
  }
}

const emitBindGroup = (group: InventoryGroupVO) => {
  const target = findFirstUnboundItem(group)
  if (!target) {
    message.warning('该组饰品均已绑定目录')
    return
  }
  emit('bind', target)
}

const formatMoney = formatInventoryMoney
const formatPnlRate = formatInventoryPnlRate
const pnlColor = inventoryPnlColor

const openDetail = (group: InventoryGroupVO) => {
  activeGroup.value = group
  viewMode.value = 'detail'
}

const backToList = () => {
  viewMode.value = 'list'
  activeGroup.value = null
}

defineExpose({
  backToList,
  viewMode,
  clearSelection,
  findItemsByIds
})
</script>

<style scoped>
.list-panel {
  flex: 1;
  min-width: 0;
  padding: 0 4px;
}

.batch-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-bottom: 1px solid #f0f0f0;
  background: #fafafa;
  flex-wrap: wrap;
  gap: 12px;
}

.batch-toolbar-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.selected-hint {
  color: #666;
  font-size: 14px;
}

.batch-toolbar-right {
  display: flex;
  gap: 10px;
}

.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-bottom: 1px solid #f0f0f0;
  gap: 12px;
}

.detail-breadcrumb {
  margin: 0;
}

.item-info {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 4px 0;
}

.item-thumb {
  width: 52px;
  height: 40px;
  object-fit: contain;
  border-radius: 6px;
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

.item-meta {
  min-width: 0;
}

.item-name {
  font-weight: 600;
  color: #1a1a1a;
  line-height: 1.4;
}

.item-tags {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
  flex-wrap: wrap;
}

.item-rarity {
  font-size: 12px;
  color: #8c5cd6;
}

.wear-cell {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.pnl-cell {
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  line-height: 1.2;
}

.pnl-amount {
  font-weight: 700;
  font-size: 14px;
}

.pnl-rate {
  font-size: 12px;
  font-weight: 600;
  opacity: 0.82;
}

.action-link,
.action-sell,
.action-bind {
  padding: 0 4px;
}

.action-link {
  color: #1677ff;
}

.action-sell {
  color: #ff4d4f;
}

.action-bind {
  color: #fa8c16;
}

.bound-hint {
  color: #999;
  font-size: 12px;
}

.inv-table :deep(.ant-table-thead > tr > th) {
  background: #fafafa;
  font-weight: 600;
  padding: 12px 16px;
}

.inv-table :deep(.ant-table-tbody > tr > td) {
  padding: 14px 16px;
}
</style>
