import request from '@/utils/request'
import type { StatisticsVO, ChartDataVO, UnrealizedCalendarVO } from '@/types'

export const getStatistics = (params: {
  startDate?: string
  endDate?: string
}) => {
  return request.get<any, StatisticsVO>('/statistics', { params })
}

export const getProfitCalendar = (year?: string) => {
  return request.get<any, ChartDataVO[]>('/statistics/profit-calendar', {
    params: year ? { year } : undefined
  })
}

export const getUnrealizedCalendar = (year?: string) => {
  return request.get<any, UnrealizedCalendarVO[]>('/statistics/unrealized-calendar', {
    params: year ? { year } : undefined
  })
}
