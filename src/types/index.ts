export interface PageResult<T> {
  records: T[]
  total: number
  current: number
  size: number
}

export interface ItemType {
  id: number
  typeName: string
}

export interface ItemCategoryVO {
  id: number
  parentId?: number
  level: number
  categoryName: string
  legacyItemTypeId?: number
  children?: ItemCategoryVO[]
}

export interface User {
  id: number
  username: string
  email: string
  role: 'USER' | 'ADMIN'
  token: string
}

export interface ItemVO {
  id: number
  itemName: string
  itemTypeId?: number
  typeName?: string
  categoryL1Id?: number
  categoryL2Id?: number
  categoryL2Name?: string
  goodId?: number
  marketHashName?: string
  imageUrl?: string
  counterType: string
  wearLevel: string
  isSold: number
  purchasePrice: number
  purchaseTime: string
  currentPrice?: number
  unrealizedPnl?: number
  priceUpdatedAt?: string
}

export interface InventoryGroupVO {
  goodId?: number
  itemName: string
  marketHashName?: string
  imageUrl?: string
  categoryL1Id?: number
  categoryL2Id?: number
  categoryL2Name?: string
  count: number
  totalPurchasePrice: number
  avgPurchasePrice?: number
  currentPrice?: number
  totalUnrealizedPnl?: number
  priceUpdatedAt?: string
  wearLevel?: string
  items: ItemVO[]
}

export interface MarketItemVO {
  id: number
  goodId: number
  name: string
  marketHashName: string
  imageUrl?: string
  categoryL1Id?: number
  categoryL2Id?: number
  categoryL1Name?: string
  categoryL2Name?: string
  wearLevel?: string
  isStattrak?: number
}

export interface ItemPurchaseDTO {
  goodId: number
  categoryL2Id: number
  itemName?: string
  itemTypeId?: number
  counterType: string
  wearLevel: string
  price: number
  transactionTime: string
}

export interface ItemSellDTO {
  itemId: number
  price: number
  transactionTime: string
  platformFeeRate: number
}

export interface TransactionVO {
  id: number
  itemId: number
  itemName: string
  typeName: string
  counterType: string
  wearLevel: string
  transactionType: string
  price: number
  transactionTime: string
  platformFeeRate?: number
  profit?: number
  profitRate?: number
}

export interface ChartDataVO {
  date: string
  value: number
}

export interface UnrealizedCalendarVO {
  date: string
  value: number
  maxPnl: number
  minPnl: number
  settled?: boolean
}

export interface PieDataVO {
  name: string
  value: number
}

export interface StatisticsVO {
  totalPurchase: number
  totalSell: number
  totalProfit: number
  totalProfitRate: number
  inventoryValue: number
  purchaseChart: ChartDataVO[]
  sellChart: ChartDataVO[]
  profitChart: ChartDataVO[]
  profitByType: PieDataVO[]
}

export interface CacheStatusVO {
  cacheType: string
  cacheKey: string
  loaded: boolean
  itemCount?: number
  ttlSeconds?: number
  lastRefreshAt?: string
  description?: string
}

export interface JobConfigVO {
  jobId: string
  jobName: string
  description?: string
  cron: string
  enabled: boolean
  lastRunAt?: string
  lastRunStatus?: string
  lastRunMessage?: string
}

export interface CatalogCacheMetaVO {
  categoryRefreshedAt?: string
  marketRefreshedAt?: string
  categoryCount?: number
  marketCount?: number
}
