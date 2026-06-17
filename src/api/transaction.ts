import request from '@/utils/request'
import type { TransactionVO } from '@/types'

export interface PageResult<T> {
  records: T[]
  total: number
  current: number
  size: number
  pages: number
}

export const getTransactionList = (params: {
  itemTypeId?: number
  transactionType?: string
  startDate?: string
  endDate?: string
}) => {
  return request.get<any, TransactionVO[]>('/transaction/list', { params })
}

export const getTransactionPage = (params: {
  current: number
  size: number
  itemTypeId?: number
  transactionType?: string
  itemName?: string
  startDate?: string
  endDate?: string
}) => {
  return request.get<any, PageResult<TransactionVO>>('/transaction/page', { params })
}

export const updateTransaction = (data: {
  id: number
  price: number
  transactionTime: string
  platformFeeRate?: number
}) => {
  return request.put('/item/transaction', data)
}

export const deleteTransaction = (id: number) => {
  return request.delete(`/transaction/${id}`)
}
