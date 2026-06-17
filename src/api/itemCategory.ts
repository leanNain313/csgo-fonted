import request from '@/utils/request'

export interface ItemCategoryVO {
  id: number
  parentId?: number
  level: number
  categoryName: string
  legacyItemTypeId?: number
  sortOrder?: number
  children?: ItemCategoryVO[]
}

export const getCategoryTree = () => {
  return request.get<any, ItemCategoryVO[]>('/item-category/tree')
}

export const getLevel2Categories = (parentId?: number) => {
  return request.get<any, ItemCategoryVO[]>('/item-category/level2', { params: { parentId } })
}

export const saveCategory = (data: Partial<ItemCategoryVO>) => {
  return request.post('/item-category', data)
}

export const updateCategory = (data: Partial<ItemCategoryVO>) => {
  return request.put('/item-category', data)
}

export const deleteCategory = (id: number) => {
  return request.delete(`/item-category/${id}`)
}
