<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { getEcho } from '@/services/echo'

interface Props {
  label?: string
  showLabel?: boolean
}

withDefaults(defineProps<Props>(), {
  label: 'Temps reel',
  showLabel: true,
})

type State = 'connected' | 'connecting' | 'disconnected'
const state = ref<State>('disconnected')

let pollId: ReturnType<typeof setInterval> | null = null

function readState() {
  const echo = getEcho()
  if (!echo) { state.value = 'disconnected'; return }
  const pusher: any = (echo.connector as any)?.pusher
  const s: string | undefined = pusher?.connection?.state
  if (s === 'connected') state.value = 'connected'
  else if (s === 'connecting' || s === 'initialized') state.value = 'connecting'
  else state.value = 'disconnected'
}

onMounted(() => {
  readState()
  pollId = setInterval(readState, 3000)
})

onBeforeUnmount(() => {
  if (pollId) clearInterval(pollId)
})

const dotClass = {
  connected: 'bg-green-500',
  connecting: 'bg-amber-500',
  disconnected: 'bg-gray-400',
} as const

const tooltip = {
  connected: 'Connexion temps reel active',
  connecting: 'Connexion en cours...',
  disconnected: 'Hors ligne',
} as const
</script>

<template>
  <div
    class="inline-flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-300"
    role="status"
    :aria-label="tooltip[state]"
    :title="tooltip[state]"
  >
    <span class="relative inline-flex h-2.5 w-2.5">
      <span
        v-if="state === 'connected'"
        class="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"
      />
      <span :class="['relative inline-flex h-2.5 w-2.5 rounded-full', dotClass[state]]" />
    </span>
    <span v-if="showLabel" class="hidden sm:inline">{{ label }}</span>
  </div>
</template>
