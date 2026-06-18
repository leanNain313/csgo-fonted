import request from '@/utils/request'

export interface OperationLogVO {
  id: number
  userId: number
  username: string
  operation: string
  method: string
  params: string
  result: string
  ip: string
  ipCountry?: string
  ipRegion?: string
  ipCity?: string
  ipIsp?: string
  ipLocation?: string
  status: string
  errorMsg: string
  executionTime: number
  createTime: string
}

export interface PageResult<T> {
  records: T[]
  total: number
  current: number
  size: number
  pages: number
}

export const getOperationLogList = (params: {
  operation?: string
  status?: string
  startDate?: string
  endDate?: string
}) => {
  return request.get<any, OperationLogVO[]>('/operation-log/list', { params })
}

export const getOperationLogPage = (params: {
  current: number
  size: number
  operation?: string
  status?: string
  startDate?: string
  endDate?: string
}) => {
  return request.get<any, PageResult<OperationLogVO>>('/operation-log/page', { params })
}
