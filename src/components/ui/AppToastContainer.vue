<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useUiStore } from '@/stores/ui.store'
import {
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XMarkIcon,
} from '@heroicons/vue/24/outline'
import type { ToastMessage } from '@/types'

const ui = useUiStore()
const { toasts } = storeToRefs(ui)

const iconFor = (type: ToastMessage['type']) => {
  switch (type) {
    case 'success': return CheckCircleIcon
    case 'error': return XCircleIcon
    case 'warning': return ExclamationTriangleIcon
    default: return InformationCircleIcon
  }
}

const variantClasses = computed(() => ({
  success: 'border-l-4 border-green-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100',
  error: 'border-l-4 border-red-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100',
  warning: 'border-l-4 border-amber-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100',
  info: 'border-l-4 border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100',
}))

const iconColor = {
  success: 'text-green-500',
  error: 'text-red-500',
  warning: 'text-amber-500',
  info: 'text-blue-500',
} as const
</script>

<template>
  <Teleport to="body">
    <div
      class="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2"
      role="region"
      aria-live="polite"
      aria-label="Notifications"
    >
      <TransitionGroup name="toast">
        <div
          v-for="t in toasts"
          :key="t.id"
          :class="['pointer-events-auto flex items-start gap-3 rounded-lg p-4 shadow-lg ring-1 ring-black/5', variantClasses[t.type]]"
          role="status"
        >
          <component :is="iconFor(t.type)" :class="['h-6 w-6 flex-shrink-0', iconColor[t.type]]" aria-hidden="true" />
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold">{{ t.title }}</p>
            <p v-if="t.message" class="mt-1 text-sm text-gray-600 dark:text-gray-300">{{ t.message }}</p>
          </div>
          <button
            type="button"
            class="ml-2 inline-flex flex-shrink-0 rounded-md p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            :aria-label="`Fermer ${t.title}`"
            @click="ui.removeToast(t.id)"
          >
            <XMarkIcon class="h-4 w-4" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
.toast-move {
  transition: transform 0.3s ease;
}
</style>
