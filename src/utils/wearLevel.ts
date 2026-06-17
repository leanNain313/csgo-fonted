const WEAR_COLOR_MAP: Record<string, string> = {
  '崭新出厂': 'green',
  '略有磨损': 'orange',
  '久经沙场': 'purple',
  '破损不堪': 'pink',
  '战痕累累': 'red',
  'Factory New': 'green',
  'Minimal Wear': 'orange',
  'Field-Tested': 'purple',
  'Well-Worn': 'pink',
  'Battle-Scarred': 'red'
}

/** 库存主表磨损分列（按后端标准磨损值） */
export const WEAR_LEVEL_COLUMNS = [
  '崭新出厂',
  '略有磨损',
  '久经沙场',
  '破损不堪',
  '战痕累累'
] as const

export type WearLevelName = (typeof WEAR_LEVEL_COLUMNS)[number]

/** 直接展示后端 wearLevel，空值显示占位 */
export const displayWearLevel = (wearLevel?: string | null) => {
  if (wearLevel == null || wearLevel === '') return '-'
  return wearLevel
}

export const getWearLevelColor = (wearLevel?: string | null) => {
  if (!wearLevel) return 'default'
  return WEAR_COLOR_MAP[wearLevel] || 'default'
}

/** 分组内出现的磨损（去重，按后端原值） */
export const groupWearLabels = (group: { wearLevel?: string; items?: { wearLevel?: string }[] }) => {
  if (group.wearLevel) return [group.wearLevel]
  const labels: string[] = []
  const seen = new Set<string>()
  for (const item of group.items || []) {
    if (!hasWearLevel(item.wearLevel)) continue
    const w = item.wearLevel!
    if (!seen.has(w)) {
      seen.add(w)
      labels.push(w)
    }
  }
  return labels
}

/** @deprecated 主表已改为单列磨损 */
export const groupHasWear = (
  group: { wearLevel?: string; items?: { wearLevel?: string }[] },
  wear: string
) => {
  if (group.wearLevel) return group.wearLevel === wear
  return (group.items || []).some(i => i.wearLevel === wear)
}

export const hasWearLevel = (wearLevel?: string | null) => {
  return wearLevel != null && wearLevel !== ''
}

/** @deprecated 主表已改为分列展示 */
export const groupWearSummary = (group: { wearLevel?: string; items?: { wearLevel?: string }[] }) => {
  if (group.wearLevel) {
    return [{ wear: group.wearLevel, count: group.items?.length || 1 }]
  }
  const map = new Map<string, number>()
  for (const item of group.items || []) {
    const wear = displayWearLevel(item.wearLevel)
    if (wear === '-') continue
    map.set(wear, (map.get(wear) || 0) + 1)
  }
  return Array.from(map.entries()).map(([wear, count]) => ({ wear, count }))
}
