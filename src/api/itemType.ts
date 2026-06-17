import request from '@/utils/request'
import type { ItemType } from '@/types'

export const getItemTypeList = () => {
  return request.get<any, ItemType[]>('/item-type/list')
}

export const saveItemType = (data: { typeName: string }) => {
  return request.post('/item-type', data)
}

export const updateItemType = (data: ItemType) => {
  return request.put('/item-type', data)
}

export const deleteItemType = (id: number) => {
  return request.delete(`/item-type/${id}`)
}

export const bindItemTypeCategory = (id: number, categoryL2Id: number) => {
  return request.put(`/item-type/${id}/bind-category`, null, { params: { categoryL2Id } })
}
