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
  color?: string
  height?: string
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  color: '#22c55e',
  height: '400px',
  loading: false,
})

const chartOption = computed<EChartsOption>(() => ({
  title: {
    text: props.title,
    left: 'center',
    textStyle: {
      fontSize: 16,
      fontWeight: 600,
    },
  },
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
