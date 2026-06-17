import { ref, computed } from 'vue'
import { message } from 'ant-design-vue'
import { getGroupedInventory, refreshPrices } from '@/api/price'
import { getCategoryTree } from '@/api/itemCategory'
import type { InventoryGroupVO, ItemCategoryVO } from '@/types'

const OTHER_CATEGORY_KEY = 'other'
const ALL_CATEGORY_KEY = 'all'

export function useInventoryData() {
  const allGroups = ref<InventoryGroupVO[]>([])
  const displayGroups = ref<InventoryGroupVO[]>([])
  const categoryTree = ref<ItemCategoryVO[]>([])
  const searchName = ref('')
  const filterKeyword = ref('')
  const loading = ref(false)
  const refreshing = ref(false)
  const lastRefresh = ref('')
  const selectedCategoryKeys = ref<string[]>([ALL_CATEGORY_KEY])
  const selectedCategoryL1Id = ref<number | null>(null)

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

  const applyFilters = () => {
    let result = allGroups.value
    const keyword = filterKeyword.value.trim() || searchName.value.trim()
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
      return allGroups.value
    } finally {
      loading.value = false
    }
  }

  const applyCategoryFilter = (key: string) => {
    selectedCategoryKeys.value = [key]
    if (key === ALL_CATEGORY_KEY) {
      selectedCategoryL1Id.value = null
    } else if (key === OTHER_CATEGORY_KEY) {
      selectedCategoryL1Id.value = 0
    } else {
      selectedCategoryL1Id.value = Number(key)
    }
    applyFilters()
  }

  const handleFilter = () => {
    filterKeyword.value = searchName.value
    applyFilters()
  }

  const resetFilter = () => {
    searchName.value = ''
    filterKeyword.value = ''
    selectedCategoryKeys.value = [ALL_CATEGORY_KEY]
    selectedCategoryL1Id.value = null
    applyFilters()
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

  return {
    allGroups,
    displayGroups,
    categoryTree,
    searchName,
    loading,
    refreshing,
    lastRefresh,
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
  }
}

export function formatInventoryMoney(val?: number | null) {
  if (val == null || Number.isNaN(val)) return '-'
  return Number(val).toFixed(2)
}

export function getInventoryPnlRate(group: Pick<InventoryGroupVO, 'totalUnrealizedPnl' | 'totalPurchasePrice'>) {
  const pnl = group.totalUnrealizedPnl
  const cost = group.totalPurchasePrice
  if (pnl == null || cost == null || Number(cost) === 0) return null
  return (Number(pnl) / Number(cost)) * 100
}

export function formatInventoryPnlRate(group: Pick<InventoryGroupVO, 'totalUnrealizedPnl' | 'totalPurchasePrice'>) {
  const rate = getInventoryPnlRate(group)
  if (rate == null || Number.isNaN(rate)) return '-'
  return `${rate >= 0 ? '+' : ''}${rate.toFixed(2)}%`
}

export function inventoryPnlColor(val: number) {
  return val >= 0 ? '#cf1322' : '#3f8600'
}
