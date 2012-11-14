<template>
  <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
    <div class="flex items-start justify-between">
      <div class="flex-1">
        <div class="flex items-center gap-3 mb-3">
          <div
            v-if="icon"
            :class="[
              'flex items-center justify-center w-10 h-10 rounded-lg',
              iconBgClass,
            ]"
          >
            <span :class="['text-lg', iconColorClass]">{{ icon }}</span>
          </div>
          <p class="text-sm font-medium text-gray-600">{{ title }}</p>
        </div>

        <div class="flex items-baseline gap-2">
          <p class="text-2xl font-bold text-gray-900">
            {{ formatValue(value) }}
            <span v-if="suffix" class="text-lg font-medium text-gray-600">{{ suffix }}</span>
          </p>
        </div>

        <div v-if="trend" class="mt-2 flex items-center gap-1">
          <span :class="[
            'inline-flex items-center text-xs font-medium',
            trend.isPositive ? 'text-green-600' : 'text-red-600'
          ]">
            <svg
              class="w-3 h-3 mr-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
              :class="trend.isPositive ? '' : 'rotate-180'"
            >
              <path
                fill-rule="evenodd"
                d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z"
                clip-rule="evenodd"
              />
            </svg>
            {{ Math.abs(trend.value) }}%
          </span>
          <span class="text-xs text-gray-500">vs periode precedente</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Trend {
  value: number
  isPositive: boolean
}

interface Props {
  title: string
  value: number | string
  icon?: string
  trend?: Trend
  suffix?: string
  iconBgClass?: string
  iconColorClass?: string
}

withDefaults(defineProps<Props>(), {
  icon: undefined,
  trend: undefined,
  suffix: undefined,
  iconBgClass: 'bg-primary-100',
  iconColorClass: 'text-primary-600',
})

function formatValue(val: number | string): string {
  if (typeof val === 'number') {
    return val.toLocaleString('fr-FR')
  }
  return val
}
</script>
