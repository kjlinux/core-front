<script setup lang="ts">
import { computed } from 'vue'
import BaseChart from './BaseChart.vue'
import type { EChartsOption } from 'echarts'

interface Props {
  xAxis: string[]
  yAxis: string[]
  // data: [xIndex, yIndex, value]
  data: Array<[number, number, number]>
  min?: number
  max?: number
  title?: string
  height?: string
  loading?: boolean
  colors?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  min: 0,
  max: undefined,
  title: '',
  height: '320px',
  loading: false,
  colors: () => ['#eff6ff', '#3b82f6', '#1e3a8a'],
})

const option = computed<EChartsOption>(() => {
  const maxValue = props.max ?? Math.max(1, ...props.data.map((d) => d[2]))
  return {
    title: props.title ? { text: props.title, left: 'center', textStyle: { fontSize: 14, fontWeight: 600 } } : undefined,
    tooltip: {
      position: 'top',
      formatter: (p: unknown) => {
        const [xi, yi, v] = (p as { value: [number, number, number] }).value
        return `${props.yAxis[yi]} - ${props.xAxis[xi]}<br/><strong>${v}</strong>`
      },
    },
    grid: { top: props.title ? 50 : 20, left: 60, right: 20, bottom: 40, containLabel: true },
    xAxis: {
      type: 'category',
      data: props.xAxis,
      splitArea: { show: true },
      axisLabel: { fontSize: 11 },
    },
    yAxis: {
      type: 'category',
      data: props.yAxis,
      splitArea: { show: true },
      axisLabel: { fontSize: 11 },
    },
    visualMap: {
      min: props.min,
      max: maxValue,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: 0,
      inRange: { color: props.colors },
      textStyle: { fontSize: 11 },
    },
    series: [{
      type: 'heatmap',
      data: props.data,
      label: { show: false },
      emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.3)' } },
    }],
  }
})
</script>

<template>
  <BaseChart :option="option" :height="height" :loading="loading" />
</template>
