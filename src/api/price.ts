import request from '@/utils/request'
import type { InventoryGroupVO } from '@/types'

export const refreshPrices = () => {
  return request.post<any, { refreshedCount: number; priceUpdatedAt: string }>('/price/refresh')
}

export const getGroupedInventory = (params?: { itemName?: string; categoryL1Id?: number; categoryL2Id?: number }) => {
  return request.get<any, InventoryGroupVO[]>('/price/inventory/grouped', { params })
}
