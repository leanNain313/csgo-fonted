import request from '@/utils/request'
import type { ItemVO, ItemPurchaseDTO, ItemSellDTO } from '@/types'

export interface PageResult<T> {
  records: T[]
  total: number
  current: number
  size: number
  pages: number
}

export const purchaseItem = (data: ItemPurchaseDTO) => {
  return request.post('/item/purchase', data)
}

export const batchPurchaseItems = (data: { items: ItemPurchaseDTO[] }) => {
  return request.post('/item/batch-purchase', data)
}

export const sellItem = (data: ItemSellDTO) => {
  return request.post('/item/sell', data)
}

export const batchSellItems = (data: { items: ItemSellDTO[] }) => {
  return request.post('/item/batch-sell', data)
}

export const getInventoryItems = () => {
  return request.get<any, ItemVO[]>('/item/inventory')
}

export const getInventoryPage = (params: { 
  current: number
  size: number
  itemTypeId?: number
  itemName?: string
}) => {
  return request.get<any, PageResult<ItemVO>>('/item/inventory/page', { params })
}

export const bindMarketItem = (data: { itemId: number; goodId: number }) => {
  return request.put('/item/bind', data)
}
