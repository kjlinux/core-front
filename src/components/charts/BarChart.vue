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
  horizontal?: boolean
  height?: string
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  color: '#3b82f6',
  horizontal: false,
  height: '400px',
  loading: false,
})

const chartOption = computed<EChartsOption>(() => {
  if (props.horizontal) {
    return {
      title: {
        text: props.title,
        left: 'center',
        textStyle: {
          fontSize: 16,
          fontWeight: 600,
        },
      },
      xAxis: {
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
      yAxis: {
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
      series: [
        {
          type: 'bar',
          data: props.data.map(item => item.value),
          itemStyle: {
            color: props.color,
            borderRadius: [0, 4, 4, 0],
          },
          barMaxWidth: 40,
        },
      ],
    }
  }

  return {
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
        type: 'bar',
        data: props.data.map(item => item.value),
        itemStyle: {
          color: props.color,
          borderRadius: [4, 4, 0, 0],
        },
        barMaxWidth: 40,
      },
    ],
  }
})
</script>

<template>
  <BaseChart :option="chartOption" :height="height" :loading="loading" />
</template>
