<template>
  <div class="pnl-calendar-panel" :class="{ embedded }">
    <div class="panel-head">
      <div class="panel-title">库存浮盈日历</div>
      <div class="month-nav">
        <button type="button" class="nav-btn" aria-label="上个月" @click="shiftMonth(-1)">
          <LeftOutlined />
        </button>
        <span class="month-label">{{ currentMonth.format('YYYY年M月') }}</span>
        <button type="button" class="nav-btn" aria-label="下个月" @click="shiftMonth(1)">
          <RightOutlined />
        </button>
      </div>
    </div>

    <div class="weekdays">
      <span v-for="w in weekdays" :key="w">{{ w }}</span>
    </div>

    <div class="days-grid">
      <div
        v-for="cell in calendarCells"
        :key="cell.key"
        class="day-cell"
        :class="cellClasses(cell)"
      >
        <a-tooltip
          v-if="cell.data"
          placement="top"
          :mouse-enter-delay="0.15"
        >
          <template #title>
            <div class="tooltip-body">
              <div class="tooltip-date">{{ cell.date }}</div>
              <div>浮盈：{{ formatPnl(cell.data.value) }}</div>
              <div>最高：{{ formatPnl(cell.data.maxPnl) }}</div>
              <div>最低：{{ formatPnl(cell.data.minPnl) }}</div>
              <div v-if="cell.data.settled === false" class="tooltip-note">当日未结算</div>
            </div>
          </template>
          <div class="day-inner">
            <span class="day-num">{{ cell.day }}</span>
            <span class="day-pnl">{{ formatCellValue(cell.data.value) }}</span>
          </div>
        </a-tooltip>
        <div v-else class="day-inner">
          <span class="day-num">{{ cell.day }}</span>
        </div>
      </div>
    </div>

    <div class="panel-foot">30分钟采样 · 0点结算</div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import dayjs, { type Dayjs } from 'dayjs'
import { LeftOutlined, RightOutlined } from '@ant-design/icons-vue'
import { getUnrealizedCalendar } from '@/api/statistics'
import type { UnrealizedCalendarVO } from '@/types'

defineProps<{
  embedded?: boolean
}>()

const weekdays = ['日', '一', '二', '三', '四', '五', '六']

const currentMonth = ref(dayjs().startOf('month'))
const calendarData = ref<UnrealizedCalendarVO[]>([])
const loadedYear = ref('')

const dataMap = computed(() =>
  Object.fromEntries(calendarData.value.map(item => [item.date, item]))
)

const todayStr = dayjs().format('YYYY-MM-DD')

const calendarCells = computed(() => {
  const monthStart = currentMonth.value.startOf('month')
  const monthEnd = currentMonth.value.endOf('month')
  const leading = monthStart.day()
  const cells: Array<{
    key: string
    day: number
    date: string
    otherMonth: boolean
    data: UnrealizedCalendarVO | null
  }> = []

  for (let i = leading - 1; i >= 0; i--) {
    const d = monthStart.subtract(i + 1, 'day')
    const date = d.format('YYYY-MM-DD')
    cells.push({
      key: date,
      day: d.date(),
      date,
      otherMonth: true,
      data: dataMap.value[date] || null
    })
  }

  let cursor = monthStart
  while (cursor.isBefore(monthEnd) || cursor.isSame(monthEnd, 'day')) {
    const date = cursor.format('YYYY-MM-DD')
    cells.push({
      key: date,
      day: cursor.date(),
      date,
      otherMonth: false,
      data: dataMap.value[date] || null
    })
    cursor = cursor.add(1, 'day')
  }

  while (cells.length % 7 !== 0) {
    const last = dayjs(cells[cells.length - 1].date).add(1, 'day')
    const date = last.format('YYYY-MM-DD')
    cells.push({
      key: date,
      day: last.date(),
      date,
      otherMonth: true,
      data: dataMap.value[date] || null
    })
  }

  return cells
})

const formatPnl = (val: number | null | undefined) => {
  if (val == null) return '-'
  return `${val >= 0 ? '+' : ''}¥${Number(val).toFixed(2)}`
}

const formatCellValue = (val: number) => {
  const n = Number(val)
  const abs = Math.abs(n)
  if (abs >= 10000) return `${n >= 0 ? '+' : '-'}${(abs / 10000).toFixed(1)}w`
  if (abs >= 1000) return `${n >= 0 ? '+' : '-'}${(abs / 1000).toFixed(1)}k`
  return `${n >= 0 ? '+' : ''}${n.toFixed(0)}`
}

const cellClasses = (cell: { date: string; otherMonth: boolean; data: UnrealizedCalendarVO | null }) => {
  const classes: string[] = []
  if (cell.otherMonth) classes.push('is-other-month')
  const isToday = cell.date === todayStr
  if (isToday) classes.push('is-today')
  if (!cell.data || cell.data.value == null) {
    if (!cell.otherMonth) classes.push('is-empty')
    return classes
  }
  const val = Number(cell.data.value)
  if (val > 0) classes.push('is-profit')
  else if (val < 0) classes.push('is-loss')
  else classes.push('is-empty')
  return classes
}

const ensureYearData = async (year: string) => {
  if (loadedYear.value === year) return
  try {
    calendarData.value = await getUnrealizedCalendar(year)
  } catch {
    calendarData.value = []
  }
  loadedYear.value = year
}

const shiftMonth = (delta: number) => {
  currentMonth.value = currentMonth.value.add(delta, 'month').startOf('month')
}

watch(currentMonth, (m: Dayjs) => {
  ensureYearData(String(m.year()))
}, { immediate: false })

const loadCalendar = async () => {
  loadedYear.value = ''
  await ensureYearData(String(currentMonth.value.year()))
}

onMounted(loadCalendar)

defineExpose({ reload: loadCalendar })
</script>

<style scoped>
.pnl-calendar-panel {
  background: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 12px;
  padding: 12px 14px 10px;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.pnl-calendar-panel.embedded {
  background: transparent;
  border: none;
  border-radius: 0;
  padding: 0;
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  gap: 8px;
}

.panel-title {
  font-size: 14px;
  font-weight: 600;
  color: #262626;
}

.month-nav {
  display: flex;
  align-items: center;
  gap: 6px;
}

.month-label {
  font-size: 13px;
  font-weight: 600;
  color: #434343;
  min-width: 88px;
  text-align: center;
}

.nav-btn {
  width: 24px;
  height: 24px;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  background: #fafafa;
  color: #595959;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  transition: all 0.2s ease;
}

.nav-btn:hover {
  border-color: #d9d9d9;
  background: #fff;
  color: #262626;
}

.weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 6px;
  margin-bottom: 6px;
}

.weekdays span {
  text-align: center;
  font-size: 12px;
  color: #8c8c8c;
  font-weight: 500;
  line-height: 1.2;
}

.days-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 6px;
  flex: 1;
}

.day-cell {
  height: 44px;
  border-radius: 8px;
  padding: 0;
  background: #fafafa;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  cursor: default;
  user-select: none;
}

.day-cell :deep(.ant-tooltip) {
  display: block;
  width: 100%;
  height: 100%;
}

.day-inner {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1px;
  padding: 3px 2px;
  border-radius: 7px;
}

.day-cell:hover:not(.is-other-month) {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  z-index: 1;
}

.day-num {
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  color: #262626;
}

.day-pnl {
  font-size: 10px;
  font-weight: 600;
  line-height: 1.1;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.is-profit {
  /* 图中：浅粉底 + 红字 */
  background: #F7EDEC;
  color: #8E2F35;
}

.is-profit .day-inner {
  background: #F7EDEC;
}

.is-loss {
  /* 图中：浅薄荷绿底 + 绿字 */
  background: #DDF2EE;
  color: #1F6F63;
}

.is-loss .day-inner {
  background: #DDF2EE;
}

.is-today {
  /* 今天：深红底 + 白字（按截图效果） */
  background: #C85B61;
  color: #fff;
}

.is-today .day-inner {
  background: #C85B61;
}

.is-today .day-pnl {
  color: #fff;
}

.is-today .day-num {
  color: #fff;
}

/* 今天优先级覆盖涨跌底色 */
.is-today.is-profit,
.is-today.is-loss {
  background: #C85B61;
  color: #fff;
}

.is-empty {
  background: #f7f7f7;
  color: #8c8c8c;
}

.is-empty .day-inner {
  background: #f7f7f7;
}

.is-other-month {
  background: transparent;
  color: #d9d9d9;
}

.is-other-month .day-inner {
  background: transparent;
}

.is-other-month .day-pnl {
  color: #c4c4c4;
}

.is-other-month:hover {
  transform: none;
  box-shadow: none;
}

.panel-foot {
  margin-top: 6px;
  text-align: right;
  font-size: 10px;
  color: #bfbfbf;
}

.tooltip-body {
  font-size: 12px;
  line-height: 1.6;
}

.tooltip-date {
  font-weight: 600;
  margin-bottom: 2px;
}

.tooltip-note {
  margin-top: 2px;
  color: rgba(255, 255, 255, 0.75);
}
</style>
