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
  height?: string
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  seriesName: '',
  color: '#22c55e',
  height: '400px',
  loading: false,
})

const chartOption = computed<EChartsOption>(() => ({
  tooltip: {
    trigger: 'axis',
    axisPointer: { type: 'cross', crossStyle: { color: '#94a3b8' } },
  },
  legend: props.seriesName
    ? { data: [props.seriesName], top: 4, textStyle: { color: '#6b7280', fontSize: 12 } }
    : { show: false },
  grid: { left: '3%', right: '4%', bottom: '4%', top: props.seriesName ? '14%' : '8%', containLabel: true },
  xAxis: {
    type: 'category',
    data: props.data.map(item => item.name),
    axisLine: {
      lineStyle: {
        color: '#e5e7eb',
      },
    },
    axisLabel: {
      color: '#6b7280',
    },
  },
  yAxis: {
    type: 'value',
    axisLine: {
      lineStyle: {
        color: '#e5e7eb',
      },
    },
    axisLabel: {
      color: '#6b7280',
    },
    splitLine: {
      lineStyle: {
        color: '#f3f4f6',
      },
    },
  },
  series: [
    {
      name: props.seriesName || undefined,
      type: 'line',
      data: props.data.map(item => item.value),
      smooth: true,
      lineStyle: {
        color: props.color,
        width: 2,
      },
      itemStyle: {
        color: props.color,
      },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            {
              offset: 0,
              color: props.color + '40',
            },
            {
              offset: 1,
              color: props.color + '00',
            },
          ],
        },
      },
    },
  ],
}))
</script>

<template>
  <BaseChart :option="chartOption" :height="height" :loading="loading" />
</template>
