<script setup lang="ts">
import { computed } from 'vue'
import VChart from 'vue-echarts'
import type { EChartsOption } from 'echarts'
import { useDarkMode } from '@/composables/useDarkMode'

interface Props {
  option: EChartsOption
  height?: string
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  height: '400px',
  loading: false,
})

const { isDark } = useDarkMode()

// Jetons de couleur du theme sombre des graphiques.
const DARK = {
  text: '#cbd5e1', // slate-300 : titres / legendes
  textMuted: '#94a3b8', // slate-400 : labels d'axes
  line: '#374151', // gray-700 : lignes d'axes / ticks
  split: 'rgba(148, 163, 184, 0.15)', // quadrillage discret
  surface: '#1f2937', // gray-800 : fond des cartes (separateurs de camembert, tooltip)
  tooltipText: '#e5e7eb', // gray-200
}

type AnyObj = Record<string, unknown>
function isPlainObject(v: unknown): v is AnyObj {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

// Fusion profonde : `override` gagne, mais on preserve les proprietes existantes
// (fontSize, width, data, ...) non redefinies.
function deepMerge<T>(base: T, override: AnyObj): T {
  if (!isPlainObject(base)) return override as T
  const out: AnyObj = { ...base }
  for (const key of Object.keys(override)) {
    const o = override[key]
    const b = out[key]
    out[key] = isPlainObject(o) && isPlainObject(b) ? deepMerge(b, o) : o
  }
  return out as T
}

const AXIS_DARK: AnyObj = {
  axisLine: { lineStyle: { color: DARK.line } },
  axisTick: { lineStyle: { color: DARK.line } },
  axisLabel: { color: DARK.textMuted },
  splitLine: { lineStyle: { color: DARK.split } },
}

function darkifyAxis(axis: unknown): unknown {
  if (Array.isArray(axis)) return axis.map((a) => (isPlainObject(a) ? deepMerge(a, AXIS_DARK) : a))
  if (isPlainObject(axis)) return deepMerge(axis, AXIS_DARK)
  return axis
}

// Applique le theme sombre par-dessus une option deja construite par le chart enfant.
function applyDarkTheme(option: EChartsOption): EChartsOption {
  const themed: AnyObj = { ...(option as AnyObj) }

  // Texte global par defaut (legendes/labels sans couleur explicite).
  themed.textStyle = deepMerge((themed.textStyle ?? {}) as AnyObj, { color: DARK.text })

  if (themed.title) themed.title = deepMerge(themed.title, { textStyle: { color: DARK.text } })
  if (isPlainObject(themed.legend)) themed.legend = deepMerge(themed.legend, { textStyle: { color: DARK.text } })

  themed.tooltip = deepMerge((themed.tooltip ?? {}) as AnyObj, {
    backgroundColor: DARK.surface,
    borderColor: DARK.line,
    textStyle: { color: DARK.tooltipText },
  })

  if (themed.xAxis) themed.xAxis = darkifyAxis(themed.xAxis)
  if (themed.yAxis) themed.yAxis = darkifyAxis(themed.yAxis)

  if (isPlainObject(themed.radar)) {
    themed.radar = deepMerge(themed.radar, {
      axisName: { color: DARK.textMuted },
      axisLine: { lineStyle: { color: DARK.line } },
      splitLine: { lineStyle: { color: DARK.line } },
      splitArea: { areaStyle: { color: ['rgba(148, 163, 184, 0.04)', 'rgba(148, 163, 184, 0.10)'] } },
    })
  }

  if (isPlainObject(themed.visualMap)) {
    themed.visualMap = deepMerge(themed.visualMap, { textStyle: { color: DARK.textMuted } })
  }

  // Camembert : separateurs de parts couleur carte + couleur explicite des labels.
  // Sans `label.color`, ECharts laisse le remplissage en 'auto' et zrender ajoute
  // un contour (halo) blanc auto autour du texte (le fond du chart est transparent,
  // donc zrender ignore qu'on est en sombre). Fixer la couleur supprime ce halo.
  if (Array.isArray(themed.series)) {
    themed.series = themed.series.map((s) =>
      isPlainObject(s) && s.type === 'pie'
        ? deepMerge(s, { itemStyle: { borderColor: DARK.surface }, label: { color: DARK.text } })
        : s,
    )
  }

  return themed as EChartsOption
}

const chartOption = computed<EChartsOption>(() => {
  const merged: EChartsOption = {
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
  }
  return isDark.value ? applyDarkTheme(merged) : merged
})
</script>

<template>
  <div class="relative" :style="{ height }">
    <div
      v-if="loading"
      class="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80"
    >
      <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-r-transparent" />
    </div>
    <v-chart :option="chartOption" :style="{ height: '100%', width: '100%' }" autoresize />
  </div>
</template>
