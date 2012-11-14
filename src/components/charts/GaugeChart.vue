<script setup lang="ts">
import { computed } from 'vue'
import BaseChart from './BaseChart.vue'
import type { EChartsOption } from 'echarts'

interface Props {
  value: number
  title?: string
  max?: number
  height?: string
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  max: 100,
  height: '400px',
  loading: false,
})

const getColor = (value: number): string => {
  if (value < 40) return '#ef4444'
  if (value < 70) return '#f97316'
  return '#22c55e'
}

const chartOption = computed<EChartsOption>(() => ({
  title: {
    text: props.title,
    left: 'center',
    textStyle: {
      fontSize: 16,
      fontWeight: 600,
    },
  },
  series: [
    {
      type: 'gauge',
      startAngle: 180,
      endAngle: 0,
      min: 0,
      max: props.max,
      radius: '80%',
      center: ['50%', '70%'],
      splitNumber: 10,
      axisLine: {
        lineStyle: {
          width: 20,
          color: [
            [0.4, '#ef4444'],
            [0.7, '#f97316'],
            [1, '#22c55e'],
          ],
        },
      },
      pointer: {
        itemStyle: {
          color: getColor(props.value),
        },
        width: 6,
        length: '60%',
      },
      axisTick: {
        distance: -20,
        length: 8,
        lineStyle: {
          color: '#fff',
          width: 2,
        },
      },
      splitLine: {
        distance: -20,
        length: 15,
        lineStyle: {
          color: '#fff',
          width: 3,
        },
      },
      axisLabel: {
        color: '#6b7280',
        distance: 20,
        fontSize: 12,
      },
      detail: {
        valueAnimation: true,
        formatter: '{value}%',
        color: getColor(props.value),
        fontSize: 32,
        fontWeight: 600,
        offsetCenter: [0, '10%'],
      },
      data: [
        {
          value: props.value,
        },
      ],
    },
  ],
}))
</script>

<template>
  <BaseChart :option="chartOption" :height="height" :loading="loading" />
</template>
