<script setup lang="ts">
import { computed } from 'vue'
import BaseChart from './BaseChart.vue'
import type { EChartsOption } from 'echarts'

interface DataItem {
  name: string
  value: number
}

interface Props {
  data: DataItem[]
  title?: string
  seriesName?: string
  color?: string
  horizontal?: boolean
  height?: string
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  seriesName: '',
  color: '#3b82f6',
  horizontal: false,
  height: '400px',
  loading: false,
})

const legendConfig = computed(() => props.seriesName
  ? { data: [props.seriesName], top: 4, textStyle: { color: '#6b7280', fontSize: 12 } }
  : { show: false }
)
const gridTop = computed(() => props.seriesName ? '14%' : '8%')

const chartOption = computed<EChartsOption>(() => {
  if (props.horizontal) {
    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: legendConfig.value,
      grid: { left: '3%', right: '8%', bottom: '4%', top: gridTop.value, containLabel: true },
      xAxis: {
        type: 'value',
        axisLine: { lineStyle: { color: '#e5e7eb' } },
        axisLabel: { color: '#6b7280' },
        splitLine: { lineStyle: { color: '#f3f4f6' } },
      },
      yAxis: {
        type: 'category',
        data: props.data.map(item => item.name),
        axisLine: { lineStyle: { color: '#e5e7eb' } },
        axisLabel: { color: '#6b7280' },
      },
      series: [
        {
          name: props.seriesName || undefined,
          type: 'bar',
          data: props.data.map(item => item.value),
          itemStyle: { color: props.color, borderRadius: [0, 4, 4, 0] },
          barMaxWidth: 40,
        },
      ],
    }
  }

  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: legendConfig.value,
    grid: { left: '3%', right: '4%', bottom: '4%', top: gridTop.value, containLabel: true },
    xAxis: {
      type: 'category',
      data: props.data.map(item => item.name),
      axisLine: { lineStyle: { color: '#e5e7eb' } },
      axisLabel: { color: '#6b7280' },
    },
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: '#e5e7eb' } },
      axisLabel: { color: '#6b7280' },
      splitLine: { lineStyle: { color: '#f3f4f6' } },
    },
    series: [
      {
        name: props.seriesName || undefined,
        type: 'bar',
        data: props.data.map(item => item.value),
        itemStyle: { color: props.color, borderRadius: [4, 4, 0, 0] },
        barMaxWidth: 40,
      },
    ],
  }
})
</script>

<template>
  <BaseChart :option="chartOption" :height="height" :loading="loading" />
</template>
