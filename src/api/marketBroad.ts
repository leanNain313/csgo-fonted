import request from '@/utils/request'
import type {
  BroadMarketDataStatusVO,
  BroadMarketKlinePointVO,
  BroadMarketOverviewVO,
  BroadMarketRefreshVO,
  BroadMarketTurnoverVO
} from '@/types'

export const getBroadIndex = (options?: { silent?: boolean }) => {
  return request.get<any, BroadMarketOverviewVO>('/broad-market/index', {
    silent: options?.silent
  })
}

export const getBroadKline = (period: string, indexId?: number) => {
  return request.get<any, BroadMarketKlinePointVO[]>('/broad-market/kline', {
    params: { period, indexId }
  })
}

export const getBroadMarketMeta = () => {
  return request.get<any, BroadMarketDataStatusVO[]>('/broad-market/meta')
}

export const getBroadMarketTurnover = (startDate?: string, endDate?: string) => {
  return request.get<any, BroadMarketTurnoverVO[]>('/broad-market/turnover', {
    params: { startDate, endDate }
  })
}

export const refreshBroadMarket = () => {
  return request.post<any, BroadMarketRefreshVO>('/broad-market/refresh', null, {
    timeout: 30000
  })
}
