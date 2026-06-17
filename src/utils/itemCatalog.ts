import type { InventoryGroupVO, ItemVO } from '@/types'

/** 历史饰品未对接目录（无 goodId） */
export const needsCatalogBind = (item?: { goodId?: number | null }) => {
  return item?.goodId == null || item.goodId === 0
}

export const groupNeedsCatalogBind = (group?: InventoryGroupVO) => {
  return (group?.items || []).some(needsCatalogBind)
}

export const findFirstUnboundItem = (group?: InventoryGroupVO): ItemVO | undefined => {
  return group?.items?.find(needsCatalogBind)
}
