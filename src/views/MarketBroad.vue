<template>
  <div class="market-page">
    <a-alert
      v-if="statusMessage"
      :message="statusMessage"
      :type="hasStaleData ? 'warning' : 'info'"
      show-icon
      style="margin-bottom: 16px"
    />

    <div class="status-line top-status">
      <span>最后更新：{{ formatDateTime(overview.observedAt) }}</span>
      <span v-for="status in statuses" :key="`${status.source}-${status.period || status.dataset}`" :class="status.stale ? 'stale' : 'healthy'">
        {{ statusLabel(status) }}
      </span>
      <a-button type="primary" :loading="refreshing" :disabled="refreshing" @click="handleRefresh">手动刷新</a-button>
    </div>

    <div class="index-quote-card overview-row">
      <div class="index-quote-main">
        <div class="index-quote-title">
          <span>{{ csqaqIndex.name || '饰品指数' }}</span>
          <a-tooltip title="数据来源：CSQAQ 大盘指数">
            <span class="info-dot">i</span>
          </a-tooltip>
        </div>
        <div class="index-quote-row" :class="csqaqTrendClass">
          <span class="index-now">{{ formatIndex(csqaqIndex.now) }}</span>
          <span class="index-chg">{{ formatSigned(csqaqIndex.amplitude) }}</span>
          <span class="index-pct">{{ formatIndexRate(csqaqIndex.now, csqaqIndex.amplitude, csqaqIndex.rate) }}</span>
        </div>
        <div class="index-quote-time">{{ formatDateTime(csqaqIndex.updatedAt) }} 当前时间</div>
      </div>
      <div class="index-quote-side">
        <div class="hl high">
          <span>今日最高</span>
          <strong>{{ formatIndex(csqaqIndex.todayHigh) }}</strong>
        </div>
        <div class="hl low">
          <span>今日最低</span>
          <strong>{{ formatIndex(csqaqIndex.todayLow) }}</strong>
        </div>
      </div>
    </div>

    <div class="metric-panel overview-row">
      <div
        v-for="(metric, index) in overviewMetrics"
        :key="metric.key"
        class="metric-item"
        :class="{ 'with-divider': index === 1 }"
      >
        <div class="metric-head">
          <span class="metric-title">{{ metric.title }}</span>
          <span class="metric-ratio" :class="ratioClass(metric.ratio)">
            环比: {{ ratioArrow(metric.ratio) }} {{ formatRatioDisplay(metric.ratio) }}
          </span>
        </div>
        <div class="metric-value" :class="metric.tone">
          {{ formatWan(metric.value) }} <small>万</small>
        </div>
        <div class="metric-yesterday">昨日 {{ formatWan(metric.yesterday) }}万</div>
      </div>
    </div>

    <div
      ref="klinePanelRef"
      class="kline-panel"
      :class="{ 'is-fullscreen': klineFullscreen }"
    >
      <a-card class="chart-card kline-card">
        <template #title>
          <div class="card-title-row">
            <span>大盘 K 线</span>
            <div class="card-title-actions">
              <a-radio-group v-model:value="period" button-style="solid" @change="loadKline">
                <a-radio-button v-for="item in periods" :key="item.value" :value="item.value">{{ item.label }}</a-radio-button>
              </a-radio-group>
              <a-tooltip :title="klineFullscreen ? '退出全屏' : '全屏显示'">
                <a-button type="text" class="fullscreen-btn" @click="toggleKlineFullscreen">
                  <template #icon>
                    <CompressOutlined v-if="klineFullscreen" />
                    <ExpandOutlined v-else />
                  </template>
                </a-button>
              </a-tooltip>
            </div>
          </div>
        </template>
        <a-spin :spinning="loadingKline">
          <a-empty v-if="!loadingKline && !klineData.length" description="暂无 K 线数据" />
          <div v-else ref="klineChartRef" class="kline-chart"></div>
        </a-spin>
      </a-card>
    </div>

    <a-card title="每日成交额" class="chart-card">
      <a-spin :spinning="loadingTurnover">
        <a-empty v-if="!loadingTurnover && !turnoverData.length" description="暂无成交额数据" />
        <div v-else ref="turnoverChartRef" class="turnover-chart"></div>
      </a-spin>
    </a-card>

  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { message } from 'ant-design-vue'
import { CompressOutlined, ExpandOutlined } from '@ant-design/icons-vue'
import * as echarts from 'echarts'
import type { ECharts } from 'echarts'
import dayjs from 'dayjs'
import {
  getBroadIndex,
  getBroadKline,
  getBroadMarketMeta,
  getBroadMarketTurnover,
  refreshBroadMarket
} from '@/api/marketBroad'
import type {
  BroadMarketDataStatusVO,
  BroadMarketKlinePointVO,
  BroadMarketOverviewVO,
  BroadMarketTurnoverVO
} from '@/types'
import { useWindowSize } from '@/hooks/useWindowSize'
import { TRADE_COOLDOWN_DAYS } from '@/utils/tradeCooldown'

const { isMobile } = useWindowSize()
const periods = [
  { value: '1hour', label: '1H' },
  { value: '4hour', label: '4H' },
  { value: '1day', label: '日K' },
  { value: '7day', label: '7D' }
]
const period = ref('1day')
const overview = reactive<BroadMarketOverviewVO>({})
const statuses = ref<BroadMarketDataStatusVO[]>([])
const klineData = ref<BroadMarketKlinePointVO[]>([])
const turnoverData = ref<BroadMarketTurnoverVO[]>([])
const loadingKline = ref(false)
const loadingTurnover = ref(false)
const refreshing = ref(false)
const statusMessage = ref('')
const klineChartRef = ref<HTMLDivElement>()
const turnoverChartRef = ref<HTMLDivElement>()
const klinePanelRef = ref<HTMLDivElement>()
const klineFullscreen = ref(false)
let klineChart: ECharts | null = null
let turnoverChart: ECharts | null = null
let pollTimer: number | null = null
let cssFullscreenFallback = false

const hasStaleData = computed(() => statuses.value.some(item => item.stale))
const csqaqIndex = computed(() => overview.csqaqIndex || {})
const csqaqTrendClass = computed(() => {
  const amp = Number(csqaqIndex.value.amplitude ?? csqaqIndex.value.rate ?? 0)
  if (amp > 0) return 'up'
  if (amp < 0) return 'down'
  return ''
})

const overviewMetrics = computed(() => [
  {
    key: 'turnover',
    title: '¥ 饰品成交额',
    value: overview.todayTurnover,
    yesterday: overview.yesterdayTurnover,
    ratio: overview.todayTradeAmountRatio,
    tone: 'money'
  },
  {
    key: 'tradeNum',
    title: '饰品成交量',
    value: overview.todayTradeNum,
    yesterday: overview.yesterdayTradeNum,
    ratio: overview.todayTradeVolumeRatio,
    tone: 'count'
  },
  {
    key: 'addValuation',
    title: '¥ 饰品新增额',
    value: overview.todayAddValuation,
    yesterday: overview.yesterdayAddValuation,
    ratio: overview.todayAddAmountRatio,
    tone: 'money'
  },
  {
    key: 'addNum',
    title: '饰品新增量',
    value: overview.todayAddNum,
    yesterday: overview.yesterdayAddNum,
    ratio: overview.todayAddNumRatio,
    tone: 'count'
  }
])

/** 环比：SteamDT 等接口可能是小数比例或已是百分数 */
const toPercent = (ratio?: number) => {
  if (ratio == null || Number.isNaN(ratio)) return null
  return Math.abs(ratio) <= 1 ? ratio * 100 : ratio
}

/**
 * 指数涨跌幅：优先用点数差与昨收推算，避免上游 rate 被二次放大。
 * 昨收 = 现价 - 今日变动点数。
 */
const formatIndexRate = (now?: number | null, amplitude?: number | null, rate?: number | null) => {
  if (now != null && amplitude != null && !Number.isNaN(Number(now)) && !Number.isNaN(Number(amplitude))) {
    const prev = Number(now) - Number(amplitude)
    if (prev !== 0) {
      const pct = (Number(amplitude) / prev) * 100
      return `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`
    }
  }
  if (rate == null || Number.isNaN(Number(rate))) return '--'
  // CSQAQ rate 一般为百分数数值（如 -0.22 表示 -0.22%），不再 *100
  const pct = Number(rate)
  return `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`
}

const formatRatio = (ratio?: number) => {
  const pct = toPercent(ratio)
  if (pct == null) return '--'
  return `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`
}

const formatRatioDisplay = (ratio?: number) => {
  const pct = toPercent(ratio)
  if (pct == null) return '--'
  return `${pct.toFixed(2)}%`
}

const ratioArrow = (ratio?: number) => {
  const pct = toPercent(ratio)
  if (pct == null) return ''
  if (pct > 0) return '↑'
  if (pct < 0) return '↓'
  return ''
}

const ratioClass = (ratio?: number) => {
  const pct = toPercent(ratio)
  if (pct == null) return ''
  if (pct > 0) return 'up'
  if (pct < 0) return 'down'
  return ''
}

const formatWan = (value?: number | null) => {
  if (value == null || Number.isNaN(Number(value))) return '--'
  return (Number(value) / 10000).toLocaleString('zh-CN', {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3
  })
}

const formatIndex = (value?: number) => {
  if (value == null) return '--'
  return Number(value).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const formatSigned = (value?: number) => {
  if (value == null) return '--'
  const n = Number(value)
  return `${n >= 0 ? '+' : ''}${n.toFixed(2)}`
}

const formatDateTime = (value?: string) => value ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : '--'
const formatMoney = (value?: number) => value == null ? '--' : `¥${value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const statusLabel = (status: BroadMarketDataStatusVO) => {
  const source = status.source === 'CSQAQ' ? 'CSQAQ' : 'SteamDT'
  const name = status.period || '统计'
  return `${source} ${name}: ${status.stale ? '过期' : '正常'}`
}

const loadOverview = async () => {
  try {
    const [data, meta] = await Promise.all([getBroadIndex(), getBroadMarketMeta()])
    Object.assign(overview, data || {})
    statuses.value = meta || []
    statusMessage.value = statuses.value.find(item => item.stale && item.lastError)?.lastError
      || (statuses.value.some(item => item.stale) ? '部分大盘数据尚未成功同步或已过期' : '')
  } catch (error: any) {
    statusMessage.value = error?.message || '加载大盘概览失败'
  }
}

const loadKline = async () => {
  loadingKline.value = true
  try {
    klineData.value = await getBroadKline(period.value) || []
    await nextTick()
    renderKlineChart()
  } catch (error: any) {
    klineData.value = []
    message.error(error?.message || '加载 K 线失败')
  } finally {
    loadingKline.value = false
  }
}

const loadTurnover = async () => {
  loadingTurnover.value = true
  try {
    turnoverData.value = await getBroadMarketTurnover() || []
    await nextTick()
    renderTurnoverChart()
  } catch (error: any) {
    turnoverData.value = []
    message.error(error?.message || '加载成交额失败')
  } finally {
    loadingTurnover.value = false
  }
}

const loadData = async () => {
  await Promise.all([loadOverview(), loadKline(), loadTurnover()])
}

const handleRefresh = async () => {
  refreshing.value = true
  try {
    const result = await refreshBroadMarket()
    statusMessage.value = result.message || ''
    if (result.summaryOk && result.klineOk) message.success('大盘数据已刷新')
    else message.warning(result.message || '部分数据刷新失败')
    await loadData()
  } catch (error: any) {
    message.error(error?.message || '刷新失败')
  } finally {
    refreshing.value = false
  }
}

const upColor = '#FF0020'
const downColor = '#0DAB62'

/** ECharts K 线 values: [open, close, lowest, highest] */
const splitKlineData = (points: BroadMarketKlinePointVO[]) => {
  const timeFormat = period.value === '1day' || period.value === '7day' ? 'YYYY/M/D' : 'YYYY/M/D HH:mm'
  const categoryData: string[] = []
  const values: (number | string)[][] = []
  for (const point of points) {
    categoryData.push(dayjs(point.time).format(timeFormat))
    values.push([
      Number(point.open),
      Number(point.close),
      Number(point.low),
      Number(point.high)
    ])
  }
  return { categoryData, values }
}

const calculateMA = (dayCount: number, values: (number | string)[][]) => {
  const result: (number | string)[] = []
  for (let i = 0; i < values.length; i++) {
    if (i < dayCount - 1) {
      result.push('-')
      continue
    }
    let sum = 0
    let valid = true
    for (let j = 0; j < dayCount; j++) {
      const close = values[i - j][1]
      if (close === '-' || close == null || Number.isNaN(Number(close))) {
        valid = false
        break
      }
      sum += Number(close)
    }
    result.push(valid ? +(sum / dayCount).toFixed(4) : '-')
  }
  return result
}

/** 布林带 BOLL(N,K)：中轨=SMA(N)，上下轨=中轨 ± K×标准差；默认 N=20、K=2 */
const calculateBOLL = (dayCount: number, multiplier: number, values: (number | string)[][]) => {
  const mid: (number | string)[] = []
  const upper: (number | string)[] = []
  const lower: (number | string)[] = []
  for (let i = 0; i < values.length; i++) {
    if (i < dayCount - 1) {
      mid.push('-')
      upper.push('-')
      lower.push('-')
      continue
    }
    const closes: number[] = []
    let valid = true
    for (let j = 0; j < dayCount; j++) {
      const close = values[i - j][1]
      if (close === '-' || close == null || Number.isNaN(Number(close))) {
        valid = false
        break
      }
      closes.push(Number(close))
    }
    if (!valid || !closes.length) {
      mid.push('-')
      upper.push('-')
      lower.push('-')
      continue
    }
    const mean = closes.reduce((a, b) => a + b, 0) / closes.length
    const variance = closes.reduce((a, b) => a + (b - mean) ** 2, 0) / closes.length
    const std = Math.sqrt(variance)
    mid.push(+mean.toFixed(4))
    upper.push(+(mean + multiplier * std).toFixed(4))
    lower.push(+(mean - multiplier * std).toFixed(4))
  }
  return { mid, upper, lower }
}

/** 默认可视窗口：日K近1个月、4H近2周、1H近1周、7D近半年 */
const DEFAULT_VISIBLE_MS: Record<string, number> = {
  '1hour': 7 * 24 * 60 * 60 * 1000,
  '4hour': 14 * 24 * 60 * 60 * 1000,
  '1day': 30 * 24 * 60 * 60 * 1000,
  '7day': 180 * 24 * 60 * 60 * 1000
}

/**
 * 右侧按可视窗口一半补空位，默认缩放使最新一根真实 K 线落在图中间。
 */
const buildCenteredKlineAxis = (points: BroadMarketKlinePointVO[]) => {
  const data0 = splitKlineData(points)
  if (points.length === 0) {
    return { ...data0, zoom: { start: 0, end: 100 }, realCount: 0 }
  }
  const windowMs = DEFAULT_VISIBLE_MS[period.value] ?? DEFAULT_VISIBLE_MS['1day']
  const endTime = Number(points[points.length - 1].time)
  const cutoff = endTime - windowMs
  let startIndex = 0
  for (let i = 0; i < points.length; i++) {
    if (Number(points[i].time) >= cutoff) {
      startIndex = i
      break
    }
  }
  const visibleReal = Math.max(points.length - startIndex, 2)
  const padCount = Math.ceil(visibleReal / 2)
  const emptyCandle: (number | string)[] = ['-', '-', '-', '-']
  for (let i = 0; i < padCount; i++) {
    data0.categoryData.push('')
    data0.values.push(emptyCandle)
  }
  const total = data0.categoryData.length
  const lastRealIndex = points.length - 1
  const half = padCount
  const zoomStartIdx = Math.max(0, lastRealIndex - half)
  const zoomEndIdx = Math.min(total - 1, lastRealIndex + half)
  const denom = Math.max(total - 1, 1)
  return {
    ...data0,
    realCount: points.length,
    zoom: {
      start: (zoomStartIdx / denom) * 100,
      end: (zoomEndIdx / denom) * 100
    }
  }
}

const renderKlineChart = () => {
  if (!klineChartRef.value) {
    klineChart?.dispose()
    klineChart = null
    return
  }
  klineChart?.dispose()
  klineChart = echarts.init(klineChartRef.value)
  const points = klineData.value
  const data0 = buildCenteredKlineAxis(points)
  const candleName = periods.find(item => item.value === period.value)?.label || '日K'
  const zoom = data0.zoom
  const maSource = data0.values.slice(0, data0.realCount)
  const padTail = (series: (number | string)[]) => {
    const pad = data0.values.length - data0.realCount
    return pad > 0 ? series.concat(Array(pad).fill('-')) : series
  }
  const boll = calculateBOLL(20, 2, maSource)

  /** 相对最新一根 K 线，找「一个 CD（7 天）前」对应的 K 线索引，画虚竖线标注 */
  const findCdMarkIndex = () => {
    if (!points.length) return -1
    const lastIdx = points.length - 1
    const cdStartMs = dayjs(points[lastIdx].time).subtract(TRADE_COOLDOWN_DAYS, 'day').valueOf()
    for (let i = 0; i <= lastIdx; i++) {
      if (Number(points[i].time) >= cdStartMs) {
        return i
      }
    }
    return -1
  }
  const cdMarkIdx = findCdMarkIndex()
  const cdMarkLine =
    cdMarkIdx >= 0
      ? {
          xAxis: data0.categoryData[cdMarkIdx],
          name: '1CD',
          lineStyle: { type: 'dashed' as const, color: '#1677ff', width: 1.5 },
          label: {
            show: true,
            formatter: '1CD',
            position: 'end' as const,
            color: '#1677ff',
            fontSize: isMobile.value ? 11 : 12,
            fontWeight: 600
          }
        }
      : null

  klineChart.setOption({
    animation: false,
    title: {
      text: '大盘指数',
      left: 0,
      textStyle: { fontSize: isMobile.value ? 14 : 16 }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' },
      formatter: (params: any) => {
        const list = Array.isArray(params) ? params : [params]
        const candle = list.find((p: any) => p.seriesType === 'candlestick')
        if (!candle || candle.dataIndex >= data0.realCount) return ''
        const point = points[candle.dataIndex]
        if (!point) return ''
        const lines = [
          `${dayjs(point.time).format('YYYY-MM-DD HH:mm')}`,
          `开: ${point.open}`,
          `收: ${point.close}`,
          `低: ${point.low}`,
          `高: ${point.high}`
        ]
        for (const p of list) {
          if (p.seriesType === 'line' && p.data != null && p.data !== '-') {
            lines.push(`${p.seriesName}: ${p.data}`)
          }
        }
        return lines.join('<br/>')
      }
    },
    legend: {
      data: [candleName, 'MA5', 'MA10', 'MA20', 'MA30', 'BOLL上', 'BOLL中', 'BOLL下'],
      top: 28,
      type: 'scroll'
    },
    grid: {
      left: isMobile.value ? '12%' : '10%',
      right: isMobile.value ? '6%' : '10%',
      top: 72,
      bottom: '15%'
    },
    xAxis: {
      type: 'category',
      data: data0.categoryData,
      boundaryGap: true,
      axisLine: { onZero: false },
      splitLine: { show: false },
      min: 'dataMin',
      max: 'dataMax',
      axisLabel: {
        rotate: isMobile.value ? 45 : 0,
        formatter: (value: string) => value || ''
      }
    },
    yAxis: {
      scale: true,
      splitArea: { show: true }
    },
    dataZoom: [
      { type: 'inside', start: zoom.start, end: zoom.end },
      { show: true, type: 'slider', top: '90%', start: zoom.start, end: zoom.end }
    ],
    series: [
      {
        name: candleName,
        type: 'candlestick',
        data: data0.values,
        barWidth: '88%',
        barCategoryGap: '4%',
        itemStyle: {
          color: upColor,
          color0: downColor,
          borderColor: upColor,
          borderColor0: downColor
        },
        markPoint: {
          label: {
            formatter: (param: { value?: number | string }) =>
              param?.value != null ? `${Math.round(Number(param.value))}` : ''
          },
          data: [
            { name: '最高', type: 'max', valueDim: 'highest' },
            { name: '最低', type: 'min', valueDim: 'lowest' },
            { name: '收盘均价', type: 'average', valueDim: 'close' }
          ]
        },
        markLine: {
          symbol: ['none', 'none'],
          data: [
            [
              {
                name: '最低到最高',
                type: 'min',
                valueDim: 'lowest',
                symbol: 'circle',
                symbolSize: 10,
                label: { show: false },
                emphasis: { label: { show: false } }
              },
              {
                type: 'max',
                valueDim: 'highest',
                symbol: 'circle',
                symbolSize: 10,
                label: { show: false },
                emphasis: { label: { show: false } }
              }
            ],
            { name: '收盘最低', type: 'min', valueDim: 'close' },
            { name: '收盘最高', type: 'max', valueDim: 'close' },
            ...(cdMarkLine ? [cdMarkLine] : [])
          ]
        }
      },
      {
        name: 'MA5',
        type: 'line',
        data: padTail(calculateMA(5, maSource)),
        smooth: true,
        showSymbol: false,
        lineStyle: { opacity: 0.5 }
      },
      {
        name: 'MA10',
        type: 'line',
        data: padTail(calculateMA(10, maSource)),
        smooth: true,
        showSymbol: false,
        lineStyle: { opacity: 0.5 }
      },
      {
        name: 'MA20',
        type: 'line',
        data: padTail(calculateMA(20, maSource)),
        smooth: true,
        showSymbol: false,
        lineStyle: { opacity: 0.5 }
      },
      {
        name: 'MA30',
        type: 'line',
        data: padTail(calculateMA(30, maSource)),
        smooth: true,
        showSymbol: false,
        lineStyle: { opacity: 0.5 }
      },
      {
        name: 'BOLL上',
        type: 'line',
        data: padTail(boll.upper),
        smooth: true,
        showSymbol: false,
        lineStyle: { width: 1.2, color: '#975fe5' }
      },
      {
        name: 'BOLL中',
        type: 'line',
        data: padTail(boll.mid),
        smooth: true,
        showSymbol: false,
        lineStyle: { width: 1.2, color: '#f5a623' }
      },
      {
        name: 'BOLL下',
        type: 'line',
        data: padTail(boll.lower),
        smooth: true,
        showSymbol: false,
        lineStyle: { width: 1.2, color: '#37cbcb' }
      }
    ]
  })
}

const renderTurnoverChart = () => {
  if (!turnoverChartRef.value) {
    turnoverChart?.dispose()
    turnoverChart = null
    return
  }
  turnoverChart?.dispose()
  turnoverChart = echarts.init(turnoverChartRef.value)
  const data = turnoverData.value
  turnoverChart.setOption({
    animation: false,
    grid: { left: isMobile.value ? '16%' : '9%', right: '4%', top: '10%', bottom: '18%' },
    tooltip: { trigger: 'axis', formatter: (params: any) => `${params[0]?.axisValue}<br/>成交额: ${formatMoney(params[0]?.value)}` },
    xAxis: { type: 'category', data: data.map(item => item.date), axisLabel: { rotate: isMobile.value ? 45 : 0 } },
    yAxis: { type: 'value', axisLabel: { formatter: (value: number) => `${(value / 10000).toFixed(0)}万` } },
    series: [{ type: 'bar', barMaxWidth: 28, data: data.map(item => item.turnover), itemStyle: { color: '#1677ff' } }]
  })
}

const resizeCharts = () => {
  klineChart?.resize()
  turnoverChart?.resize()
}

/** 同步原生全屏状态并在尺寸变化后重绘 K 线 */
const syncKlineFullscreenState = () => {
  const el = klinePanelRef.value
  if (!cssFullscreenFallback) {
    klineFullscreen.value = !!el && document.fullscreenElement === el
  }
  nextTick(() => resizeCharts())
}

const setCssFullscreen = (enabled: boolean) => {
  cssFullscreenFallback = enabled
  klineFullscreen.value = enabled
  document.body.style.overflow = enabled ? 'hidden' : ''
  nextTick(() => resizeCharts())
}

/** 切换 K 线面板全屏；优先 Fullscreen API，失败时用固定定位兜底 */
const toggleKlineFullscreen = async () => {
  const el = klinePanelRef.value
  if (!el) return
  if (cssFullscreenFallback) {
    setCssFullscreen(false)
    return
  }
  try {
    if (document.fullscreenElement === el) {
      await document.exitFullscreen()
      return
    }
    if (document.fullscreenElement) {
      await document.exitFullscreen()
    }
    await el.requestFullscreen()
  } catch {
    setCssFullscreen(!klineFullscreen.value)
  }
}

const onFullscreenKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && cssFullscreenFallback && klineFullscreen.value) {
    setCssFullscreen(false)
  }
}

watch(isMobile, () => nextTick(() => {
  renderKlineChart()
  renderTurnoverChart()
}))

onMounted(async () => {
  await loadData()
  window.addEventListener('resize', resizeCharts)
  document.addEventListener('fullscreenchange', syncKlineFullscreenState)
  window.addEventListener('keydown', onFullscreenKeydown)
  pollTimer = window.setInterval(loadData, 120000)
})

onUnmounted(() => {
  window.removeEventListener('resize', resizeCharts)
  document.removeEventListener('fullscreenchange', syncKlineFullscreenState)
  window.removeEventListener('keydown', onFullscreenKeydown)
  if (cssFullscreenFallback) {
    document.body.style.overflow = ''
  }
  if (document.fullscreenElement === klinePanelRef.value) {
    document.exitFullscreen().catch(() => undefined)
  }
  if (pollTimer) window.clearInterval(pollTimer)
  klineChart?.dispose()
  turnoverChart?.dispose()
  klineChart = null
  turnoverChart = null
})
</script>

<style scoped>
.top-status { margin-bottom: 16px; }
.overview-row { margin-bottom: 16px; }
.index-quote-card {
  display: flex;
  align-items: stretch;
  justify-content: space-between;
  gap: 24px;
  padding: 18px 24px;
  background: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
}
.index-quote-main { min-width: 0; flex: 1; }
.index-quote-title {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  color: rgba(0, 0, 0, .88);
  margin-bottom: 8px;
}
.info-dot {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 1px solid rgba(0, 0, 0, .25);
  font-size: 10px;
  line-height: 1;
  color: rgba(0, 0, 0, .45);
  cursor: default;
}
.index-quote-row {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 12px;
  font-weight: 700;
}
.index-quote-row.up { color: #cf1322; }
.index-quote-row.down { color: #389e0d; }
.index-now { font-size: 36px; line-height: 1.15; letter-spacing: 0.02em; }
.index-chg,
.index-pct { font-size: 18px; }
.index-quote-time {
  margin-top: 10px;
  font-size: 12px;
  color: rgba(0, 0, 0, .45);
}
.index-quote-side {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 10px;
  min-width: 140px;
  text-align: right;
}
.hl {
  display: flex;
  align-items: baseline;
  justify-content: flex-end;
  gap: 10px;
  font-size: 13px;
  font-weight: 600;
}
.hl strong { font-size: 16px; font-weight: 700; }
.hl.high { color: #cf1322; }
.hl.low { color: #389e0d; }
.metric-panel {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0;
  padding: 18px 8px;
  background: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
}
.metric-item {
  padding: 4px 20px;
  min-width: 0;
}
.metric-item.with-divider {
  border-right: 1px solid #f0f0f0;
}
.metric-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 10px;
}
.metric-title {
  font-size: 14px;
  font-weight: 600;
  color: rgba(0, 0, 0, .88);
  white-space: nowrap;
}
.metric-ratio {
  font-size: 12px;
  color: rgba(0, 0, 0, .45);
  white-space: nowrap;
}
.metric-ratio.up { color: #cf1322; }
.metric-ratio.down { color: #389e0d; }
.metric-value {
  font-size: 28px;
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: 0.02em;
}
.metric-value small {
  font-size: 14px;
  font-weight: 600;
  margin-left: 2px;
}
.metric-value.money { color: #d48806; }
.metric-value.count { color: #1677ff; }
.metric-yesterday {
  margin-top: 8px;
  font-size: 12px;
  color: rgba(0, 0, 0, .45);
}
.chart-card { margin-bottom: 16px; }
.card-title-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.card-title-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}
.fullscreen-btn { color: rgba(0, 0, 0, .65); }
.kline-panel:fullscreen,
.kline-panel.is-fullscreen {
  background: #f5f5f5;
  box-sizing: border-box;
  padding: 16px;
}
.kline-panel.is-fullscreen {
  position: fixed;
  inset: 0;
  z-index: 1000;
  overflow: auto;
}
.kline-panel:fullscreen .kline-card,
.kline-panel.is-fullscreen .kline-card {
  margin-bottom: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
}
.kline-panel:fullscreen .kline-card :deep(.ant-card-body),
.kline-panel.is-fullscreen .kline-card :deep(.ant-card-body) {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.kline-panel:fullscreen .kline-card :deep(.ant-spin-nested-loading),
.kline-panel:fullscreen .kline-card :deep(.ant-spin-container),
.kline-panel.is-fullscreen .kline-card :deep(.ant-spin-nested-loading),
.kline-panel.is-fullscreen .kline-card :deep(.ant-spin-container) {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.kline-chart { height: 520px; }
.kline-panel:fullscreen .kline-chart,
.kline-panel.is-fullscreen .kline-chart {
  flex: 1;
  height: auto;
  min-height: 360px;
}
.turnover-chart { height: 320px; }
.status-line { display: flex; align-items: center; flex-wrap: wrap; gap: 12px; color: rgba(0, 0, 0, .55); font-size: 13px; }
.healthy { color: #389e0d; }
.stale { color: #d46b08; }
@media (max-width: 992px) {
  .metric-panel { grid-template-columns: repeat(2, minmax(0, 1fr)); row-gap: 16px; }
  .metric-item.with-divider { border-right: none; }
  .metric-item:nth-child(odd) { border-right: 1px solid #f0f0f0; }
}
@media (max-width: 768px) {
  .card-title-row,
  .card-title-actions { align-items: flex-start; flex-direction: column; }
  .index-quote-card { flex-direction: column; gap: 16px; }
  .index-quote-side { text-align: left; }
  .hl { justify-content: flex-start; }
  .index-now { font-size: 30px; }
  .metric-panel { grid-template-columns: 1fr; }
  .metric-item,
  .metric-item:nth-child(odd) { border-right: none; border-bottom: 1px solid #f0f0f0; padding-bottom: 14px; }
  .metric-item:last-child { border-bottom: none; }
  .metric-value { font-size: 24px; }
  .kline-chart { height: 400px; }
  .turnover-chart { height: 260px; }
}
</style>
