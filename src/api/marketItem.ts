import request from '@/utils/request'
import type { PageResult } from '@/types'

export interface MarketItemVO {
  id: number
  goodId: number
  name: string
  marketHashName: string
  categoryL1Id?: number
  categoryL2Id?: number
  categoryL1Name?: string
  categoryL2Name?: string
  wearLevel?: string
  isStattrak?: number
  status?: number
  updateTime?: string
}

export const suggestMarketItems = (
  keyword: string,
  categoryL2Id?: number,
  limit = 20,
  signal?: AbortSignal
) => {
  return request.get<any, MarketItemVO[]>('/market-item/suggest', {
    params: { keyword, categoryL2Id, limit },
    timeout: 30000,
    signal
  })
}

export const getMarketItemPage = (params: {
  current?: number
  size?: number
  keyword?: string
  categoryL1Id?: number
  categoryL2Id?: number
  status?: number
}) => {
  return request.get<any, PageResult<MarketItemVO>>('/market-item/page', { params })
}

export const updateMarketItemCategory = (id: number, categoryL1Id: number, categoryL2Id: number) => {
  return request.put(`/market-item/${id}/category`, null, { params: { categoryL1Id, categoryL2Id } })
}

export const updateMarketItemStatus = (id: number, status: number) => {
  return request.put(`/market-item/${id}/status`, null, { params: { status } })
}

export const importMarketCatalog = (filePath?: string) => {
  return request.post('/market-item/import', null, { params: { filePath } })
}

export const syncMarketCatalog = () => {
  return request.post('/market-item/sync')
}
