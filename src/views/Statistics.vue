<template>
  <div>
    <a-form :layout="isMobile ? 'vertical' : 'inline'" style="margin-bottom: 16px">
      <a-form-item label="日期范围">
        <a-range-picker 
          v-model:value="dateRange" 
          format="YYYY-MM-DD"
          :style="{ width: isMobile ? '100%' : 'auto' }"
        />
      </a-form-item>
      <a-form-item>
        <a-button type="primary" @click="handleSearch" :block="isMobile">查询</a-button>
      </a-form-item>
    </a-form>

    <a-row :gutter="[16, 16]" style="margin-bottom: 16px">
      <a-col :xs="12" :sm="12" :md="6">
        <a-card>
          <a-statistic 
            title="购买总额" 
            :value="statistics.totalPurchase" 
            prefix="¥" 
            :precision="2"
            :value-style="{ fontSize: isMobile ? '20px' : '24px' }"
          />
        </a-card>
      </a-col>
      <a-col :xs="12" :sm="12" :md="6">
        <a-card>
          <a-statistic 
            title="卖出总额" 
            :value="statistics.totalSell" 
            prefix="¥" 
            :precision="2"
            :value-style="{ fontSize: isMobile ? '20px' : '24px' }"
          />
        </a-card>
      </a-col>
      <a-col :xs="12" :sm="12" :md="6">
        <a-card>
          <a-statistic
            title="盈亏总计"
            :value="statistics.totalProfit"
            prefix="¥"
            :precision="2"
            :value-style="{ color: statistics.totalProfit >= 0 ? '#cf1322' : '#3f8600', fontSize: isMobile ? '20px' : '24px' }"
          />
        </a-card>
      </a-col>
      <a-col :xs="12" :sm="12" :md="6">
        <a-card>
          <a-statistic 
            title="库存总价" 
            :value="statistics.inventoryValue" 
            prefix="¥" 
            :precision="2"
            :value-style="{ fontSize: isMobile ? '20px' : '24px' }"
          />
        </a-card>
      </a-col>
    </a-row>

    <a-row :gutter="[16, 16]" style="margin-bottom: 16px">
      <a-col :xs="24" :sm="24" :md="12">
        <a-card title="购入金额流水">
          <div ref="purchaseChartRef" :style="{ height: isMobile ? '250px' : '300px' }"></div>
        </a-card>
      </a-col>
      <a-col :xs="24" :sm="24" :md="12">
        <a-card title="卖出金额流水">
          <div ref="sellChartRef" :style="{ height: isMobile ? '250px' : '300px' }"></div>
        </a-card>
      </a-col>
    </a-row>

    <a-row :gutter="[16, 16]">
      <a-col :xs="24" :sm="24" :md="12">
        <a-card title="利润流水">
          <div ref="profitChartRef" :style="{ height: isMobile ? '250px' : '300px' }"></div>
        </a-card>
      </a-col>
      <a-col :xs="24" :sm="24" :md="12">
        <a-card title="各类型利润占比">
          <div ref="pieChartRef" :style="{ height: isMobile ? '250px' : '300px' }"></div>
        </a-card>
      </a-col>
    </a-row>

    <a-row :gutter="[16, 16]" style="margin-top: 16px">
      <a-col :span="24">
        <a-card title="盈亏日历">
          <a-space style="margin-bottom: 12px">
            <a-select v-model:value="calendarYear" style="width: 120px" @change="loadProfitCalendar">
              <a-select-option v-for="y in yearOptions" :key="y" :value="y">{{ y }} 年</a-select-option>
            </a-select>
          </a-space>
          <div ref="calendarChartRef" :style="{ height: isMobile ? '320px' : '380px' }"></div>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick, computed } from 'vue'
import { useRouter } from 'vue-router'
import { getStatistics, getProfitCalendar } from '@/api/statistics'
import type { StatisticsVO, ChartDataVO } from '@/types'
import * as echarts from 'echarts'
import type { Dayjs } from 'dayjs'
import { useWindowSize } from '@/hooks/useWindowSize'

const { isMobile } = useWindowSize()
const router = useRouter()
const dateRange = ref<[Dayjs, Dayjs] | undefined>()
const purchaseChartRef = ref<HTMLDivElement>()
const sellChartRef = ref<HTMLDivElement>()
const profitChartRef = ref<HTMLDivElement>()
const pieChartRef = ref<HTMLDivElement>()
const calendarChartRef = ref<HTMLDivElement>()
const profitCalendar = ref<ChartDataVO[]>([])
const calendarYear = ref(String(new Date().getFullYear()))
const yearOptions = computed(() => {
  const current = new Date().getFullYear()
  return [current - 1, current, current + 1].map(String)
})

const statistics = reactive<StatisticsVO>({
  totalPurchase: 0,
  totalSell: 0,
  totalProfit: 0,
  totalProfitRate: 0,
  inventoryValue: 0,
  purchaseChart: [],
  sellChart: [],
  profitChart: [],
  profitByType: []
})

const loadStatistics = async () => {
  const params: any = {}
  if (dateRange.value) {
    params.startDate = dateRange.value[0].format('YYYY-MM-DD')
    params.endDate = dateRange.value[1].format('YYYY-MM-DD')
  }
  
  const data = await getStatistics(params)
  Object.assign(statistics, data)
  
  await nextTick()
  renderCharts()
  await loadProfitCalendar()
}

const loadProfitCalendar = async () => {
  profitCalendar.value = await getProfitCalendar(calendarYear.value)
  await nextTick()
  renderCalendarChart()
}

const renderCalendarChart = () => {
  if (!calendarChartRef.value) return
  const chart = echarts.init(calendarChartRef.value)
  const data = profitCalendar.value
  const profitMap = Object.fromEntries(data.map(i => [i.date, Number(i.value)]))
  const values = data.map(i => Number(i.value))
  const min = values.length ? Math.min(...values, 0) : 0
  const max = values.length ? Math.max(...values, 1) : 1

  chart.setOption({
    backgroundColor: 'transparent',
    tooltip: {
      borderWidth: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.92)',
      textStyle: { color: '#fff' },
      formatter: (p: any) => {
        const val = profitMap[p.data[0]]
        if (val == null) return `${p.data[0]}<br/>无卖出盈亏`
        const colorText = val >= 0 ? '上涨' : '亏损'
        return `${p.data[0]}<br/>${colorText}: ${val >= 0 ? '+' : ''}¥${val.toFixed(2)}`
      }
    },
    visualMap: {
      min,
      max,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: 0,
      textStyle: { color: '#595959', fontSize },
      inRange: { color: ['#d9f7be', '#f8fafc', '#ffccc7'] }
    },
    calendar: {
      top: 50,
      left: 40,
      right: 20,
      cellSize: isMobile.value ? ['auto', 18] : ['auto', 22],
      range: calendarYear.value,
      itemStyle: {
        borderColor: '#eef2f7',
        borderWidth: 1
      },
      splitLine: {
        lineStyle: {
          color: '#e5e7eb',
          width: 1
        }
      },
      yearLabel: { show: true, color: '#262626', fontWeight: 600 },
      dayLabel: { fontSize: isMobile.value ? 10 : 11 },
      monthLabel: { fontSize: isMobile.value ? 10 : 11 }
    },
    series: [
      {
        type: 'heatmap',
        coordinateSystem: 'calendar',
        data: data.map(i => [i.date, Number(i.value)]),
        label: {
          show: true,
          fontSize: isMobile.value ? 9 : 10,
          formatter: (p: any) => {
            const val = profitMap[p.data[0]]
            if (val == null || val === 0) return ''
            const abs = Math.abs(val)
            if (abs >= 1000) return `${val >= 0 ? '+' : '-'}${(abs / 1000).toFixed(1)}k`
            return `${val >= 0 ? '+' : ''}${abs.toFixed(0)}`
          },
          color: (p: any) => {
            const val = profitMap[p.data[0]]
            if (val == null || val === 0) return '#64748b'
            return val > 0 ? '#cf1322' : '#3f8600'
          },
          fontWeight: 600
        },
        emphasis: {
          itemStyle: {
            borderColor: '#1677ff',
            borderWidth: 2,
            shadowBlur: 12,
            shadowColor: 'rgba(15, 23, 42, 0.16)'
          }
        }
      }
    ]
  })
  chart.off('click')
  chart.on('click', (params: any) => {
    if (params.data?.[0]) {
      router.push({ path: '/transactions', query: { startDate: params.data[0], endDate: params.data[0] } })
    }
  })
}

const renderCharts = () => {
  const fontSize = isMobile.value ? 10 : 12
  
  // 购入金额折线图
  if (purchaseChartRef.value) {
    const chart = echarts.init(purchaseChartRef.value)
    chart.setOption({
      grid: { left: '10%', right: '5%', bottom: '15%', top: '10%' },
      xAxis: {
        type: 'category',
        data: statistics.purchaseChart.map(item => item.date),
        axisLabel: { fontSize, rotate: isMobile.value ? 45 : 0 }
      },
      yAxis: { type: 'value', axisLabel: { fontSize } },
      series: [{
        data: statistics.purchaseChart.map(item => item.value),
        type: 'line',
        smooth: true
      }],
      tooltip: { trigger: 'axis' }
    })
  }

  // 卖出金额折线图
  if (sellChartRef.value) {
    const chart = echarts.init(sellChartRef.value)
    chart.setOption({
      grid: { left: '10%', right: '5%', bottom: '15%', top: '10%' },
      xAxis: {
        type: 'category',
        data: statistics.sellChart.map(item => item.date),
        axisLabel: { fontSize, rotate: isMobile.value ? 45 : 0 }
      },
      yAxis: { type: 'value', axisLabel: { fontSize } },
      series: [{
        data: statistics.sellChart.map(item => item.value),
        type: 'line',
        smooth: true,
        itemStyle: { color: '#52c41a' }
      }],
      tooltip: { trigger: 'axis' }
    })
  }

  // 利润折线图
  if (profitChartRef.value) {
    const chart = echarts.init(profitChartRef.value)
    chart.setOption({
      grid: { left: '10%', right: '5%', bottom: '15%', top: '10%' },
      xAxis: {
        type: 'category',
        data: statistics.profitChart.map(item => item.date),
        axisLabel: { fontSize, rotate: isMobile.value ? 45 : 0 }
      },
      yAxis: { type: 'value', axisLabel: { fontSize } },
      series: [{
        data: statistics.profitChart.map(item => item.value),
        type: 'line',
        smooth: true,
        itemStyle: { color: '#faad14' }
      }],
      tooltip: { trigger: 'axis' }
    })
  }

  // 利润饼图
  if (pieChartRef.value) {
    const chart = echarts.init(pieChartRef.value)
    chart.setOption({
      tooltip: { trigger: 'item' },
      legend: { 
        orient: isMobile.value ? 'horizontal' : 'vertical', 
        left: isMobile.value ? 'center' : 'left',
        bottom: isMobile.value ? 0 : 'auto',
        textStyle: { fontSize }
      },
      series: [{
        type: 'pie',
        radius: '50%',
        center: isMobile.value ? ['50%', '45%'] : ['50%', '50%'],
        data: statistics.profitByType.map(item => ({
          name: item.name,
          value: item.value
        })),
        label: { fontSize },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }]
    })
  }
}

const handleSearch = () => {
  loadStatistics()
}

onMounted(() => {
  loadStatistics()
})
</script>
