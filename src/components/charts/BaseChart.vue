<script setup lang="ts">
import { computed } from 'vue'
import VChart from 'vue-echarts'
import type { EChartsOption } from 'echarts'

interface Props {
  option: EChartsOption
  height?: string
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  height: '400px',
  loading: false,
})

const chartOption = computed(() => ({
  ...props.option,
  grid: {
    top: 60,
    right: 20,
    bottom: 60,
    left: 60,
    containLabel: true,
    ...props.option.grid,
  },
  tooltip: {
    trigger: 'axis',
    ...props.option.tooltip,
  },
}))
</script>

<template>
  <div class="relative" :style="{ height }">
    <div v-if="loading" class="absolute inset-0 flex items-center justify-center bg-white/80">
      <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-r-transparent" />
    </div>
    <v-chart :option="chartOption" :style="{ height: '100%', width: '100%' }" autoresize />
  </div>
</template>
