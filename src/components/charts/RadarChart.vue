<script setup lang="ts">
import { computed } from 'vue'
import BaseChart from './BaseChart.vue'
import type { EChartsOption } from 'echarts'

interface RadarSeries {
  name: string
  values: number[]
  color?: string
}

interface Props {
  indicators: Array<{ name: string; max: number }>
  series: RadarSeries[]
  title?: string
  height?: string
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  height: '360px',
  loading: false,
})

const option = computed<EChartsOption>(() => ({
  title: props.title ? { text: props.title, left: 'center', textStyle: { fontSize: 14, fontWeight: 600 } } : undefined,
  tooltip: { trigger: 'item' },
  legend: {
    data: props.series.map((s) => s.name),
    bottom: 0,
    textStyle: { fontSize: 11 },
  },
  radar: {
    indicator: props.indicators,
    radius: '65%',
    splitNumber: 4,
    axisName: { fontSize: 11, color: '#475569' },
  },
  series: [{
    type: 'radar',
    data: props.series.map((s) => ({
      name: s.name,
      value: s.values,
      itemStyle: s.color ? { color: s.color } : undefined,
      areaStyle: { opacity: 0.2 },
    })),
  }],
}))
</script>

<template>
  <BaseChart :option="option" :height="height" :loading="loading" />
</template>
