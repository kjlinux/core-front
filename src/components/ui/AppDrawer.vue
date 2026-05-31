<script setup lang="ts">
import { computed, watch, onBeforeUnmount, ref, nextTick } from 'vue'
import { XMarkIcon } from '@heroicons/vue/24/outline'

interface Props {
  isOpen?: boolean
  modelValue?: boolean
  title?: string
  side?: 'right' | 'left'
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  closeOnOverlay?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isOpen: false,
  modelValue: false,
  title: '',
  side: 'right',
  size: 'md',
  closeOnOverlay: true,
})

const emit = defineEmits<{
  close: []
  'update:modelValue': [value: boolean]
}>()

const isVisible = computed(() => props.modelValue || props.isOpen)
const panel = ref<HTMLElement | null>(null)

const sizeClass = computed(() => ({
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
  full: 'max-w-full',
}[props.size]))

const sideClass = computed(() =>
  props.side === 'right' ? 'right-0' : 'left-0'
)

function handleClose() {
  emit('close')
  emit('update:modelValue', false)
}

function onOverlayClick() {
  if (props.closeOnOverlay) handleClose()
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && isVisible.value) handleClose()
}

watch(isVisible, async (open) => {
  if (open) {
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKeydown)
    await nextTick()
    panel.value?.focus()
  } else {
    document.body.style.overflow = ''
    document.removeEventListener('keydown', onKeydown)
  }
})

onBeforeUnmount(() => {
  document.body.style.overflow = ''
  document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="drawer-fade">
      <div
        v-if="isVisible"
        class="fixed inset-0 z-50"
        role="dialog"
        aria-modal="true"
        :aria-label="title || 'Panneau lateral'"
      >
        <div class="absolute inset-0 bg-black/30 backdrop-blur-sm" @click="onOverlayClick" />
        <Transition :name="side === 'right' ? 'drawer-right' : 'drawer-left'">
          <div
            v-if="isVisible"
            ref="panel"
            tabindex="-1"
            :class="[
              'absolute top-0 bottom-0 flex w-full flex-col bg-white dark:bg-gray-900 shadow-xl outline-none',
              sideClass,
              sizeClass,
            ]"
          >
            <div class="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-5 py-4">
              <h3 v-if="title || $slots.title" class="text-lg font-semibold text-gray-900 dark:text-gray-100">
                <slot name="title">{{ title }}</slot>
              </h3>
              <button
                type="button"
                class="ml-auto rounded-md p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Fermer"
                @click="handleClose"
              >
                <XMarkIcon class="h-5 w-5" />
              </button>
            </div>
            <div class="flex-1 overflow-y-auto p-5">
              <slot />
            </div>
            <div
              v-if="$slots.footer"
              class="flex items-center justify-end gap-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-5 py-3"
            >
              <slot name="footer" />
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.drawer-fade-enter-active,
.drawer-fade-leave-active { transition: opacity 0.25s ease; }
.drawer-fade-enter-from,
.drawer-fade-leave-to { opacity: 0; }

.drawer-right-enter-active,
.drawer-right-leave-active,
.drawer-left-enter-active,
.drawer-left-leave-active {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.drawer-right-enter-from,
.drawer-right-leave-to { transform: translateX(100%); }
.drawer-left-enter-from,
.drawer-left-leave-to { transform: translateX(-100%); }
</style>
