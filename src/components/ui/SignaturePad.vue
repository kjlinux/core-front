<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

interface Props {
  label?: string
  required?: boolean
  height?: number
}
const props = withDefaults(defineProps<Props>(), {
  label: '',
  required: false,
  height: 180,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const canvas = ref<HTMLCanvasElement | null>(null)
const isEmpty = ref(true)
let ctx: CanvasRenderingContext2D | null = null
let drawing = false

function resize() {
  const el = canvas.value
  if (!el) return
  const ratio = window.devicePixelRatio || 1
  const rect = el.getBoundingClientRect()
  el.width = rect.width * ratio
  el.height = props.height * ratio
  ctx = el.getContext('2d')
  if (ctx) {
    ctx.scale(ratio, ratio)
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#111827'
  }
}

function pos(e: PointerEvent) {
  const rect = canvas.value!.getBoundingClientRect()
  return { x: e.clientX - rect.left, y: e.clientY - rect.top }
}

function start(e: PointerEvent) {
  if (!ctx) return
  drawing = true
  canvas.value!.setPointerCapture(e.pointerId)
  const { x, y } = pos(e)
  ctx.beginPath()
  ctx.moveTo(x, y)
}

function move(e: PointerEvent) {
  if (!drawing || !ctx) return
  const { x, y } = pos(e)
  ctx.lineTo(x, y)
  ctx.stroke()
}

function end() {
  if (!drawing) return
  drawing = false
  isEmpty.value = false
  emit('update:modelValue', canvas.value!.toDataURL('image/png'))
}

function clear() {
  if (!ctx || !canvas.value) return
  ctx.clearRect(0, 0, canvas.value.width, canvas.value.height)
  isEmpty.value = true
  emit('update:modelValue', '')
}

defineExpose({ clear, isEmpty })

onMounted(() => {
  resize()
  window.addEventListener('resize', resize)
})
onBeforeUnmount(() => window.removeEventListener('resize', resize))
</script>

<template>
  <div class="w-full">
    <label v-if="label" class="block text-sm font-medium text-gray-700 mb-1">
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>
    <div class="relative rounded-lg border border-gray-300 bg-white">
      <canvas
        ref="canvas"
        class="w-full touch-none rounded-lg"
        :style="{ height: `${height}px` }"
        @pointerdown="start"
        @pointermove="move"
        @pointerup="end"
        @pointerleave="end"
      />
      <span v-if="isEmpty" class="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-gray-400">
        Signez ici
      </span>
      <button
        type="button"
        class="absolute right-2 top-2 text-xs text-gray-500 underline hover:text-gray-700"
        @click="clear"
      >
        Effacer
      </button>
    </div>
  </div>
</template>
