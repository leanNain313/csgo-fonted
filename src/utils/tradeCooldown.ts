import dayjs from 'dayjs'

/** Steam 饰品交易冷却：购入起 7 天 */
export const TRADE_COOLDOWN_DAYS = 7

export type CooldownStatus = {
  /** 是否已过冷却 */
  ready: boolean
  /** 剩余整小时数，已好为 0；无法计算为 null */
  remainHours: number | null
  /** 展示文案：CD已好 / 3d5h CD / 12h CD / - */
  label: string
}

/**
 * 按购入时间计算交易冷却状态（前端即时计算，不落库）。
 * @param purchaseTime 购入时间，可空
 */
export const getCooldownStatus = (purchaseTime?: string | null): CooldownStatus => {
  if (!purchaseTime) {
    return { ready: false, remainHours: null, label: '-' }
  }
  const start = dayjs(purchaseTime)
  if (!start.isValid()) {
    return { ready: false, remainHours: null, label: '-' }
  }
  const end = start.add(TRADE_COOLDOWN_DAYS, 'day')
  const remainMs = end.diff(dayjs())
  if (remainMs <= 0) {
    return { ready: true, remainHours: 0, label: 'CD已好' }
  }
  const remainHours = Math.ceil(remainMs / (60 * 60 * 1000))
  const days = Math.floor(remainHours / 24)
  const hours = remainHours % 24
  const label = days > 0
    ? (hours > 0 ? `${days}d${hours}h CD` : `${days}d CD`)
    : `${remainHours}h CD`
  return { ready: false, remainHours, label }
}

/**
 * 分组冷却摘要：全部已好则 CD已好，否则展示组内最长剩余冷却。
 */
export const getGroupCooldownStatus = (items?: { purchaseTime?: string }[]): CooldownStatus => {
  if (!items?.length) {
    return { ready: false, remainHours: null, label: '-' }
  }
  let maxRemain: number | null = null
  let allReady = true
  let hasValid = false
  for (const item of items) {
    const status = getCooldownStatus(item.purchaseTime)
    if (status.remainHours == null) continue
    hasValid = true
    if (!status.ready) {
      allReady = false
      maxRemain = Math.max(maxRemain ?? 0, status.remainHours)
    }
  }
  if (!hasValid) {
    return { ready: false, remainHours: null, label: '-' }
  }
  if (allReady) {
    return { ready: true, remainHours: 0, label: 'CD已好' }
  }
  const remainHours = maxRemain ?? 0
  const days = Math.floor(remainHours / 24)
  const hours = remainHours % 24
  const label = days > 0
    ? (hours > 0 ? `${days}d${hours}h CD` : `${days}d CD`)
    : `${remainHours}h CD`
  return { ready: false, remainHours, label }
}
