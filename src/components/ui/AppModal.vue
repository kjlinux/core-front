<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="isVisible"
        class="fixed inset-0 z-50 overflow-y-auto"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
        @click.self="handleOverlayClick"
      >
        <div class="flex min-h-full items-center justify-center p-4">
          <Transition name="modal-inner">
            <div
              v-if="isVisible"
              ref="panel"
              tabindex="-1"
              :class="modalClasses"
              class="relative bg-white dark:bg-gray-900 rounded-lg shadow-xl transform transition-all outline-none"
              @click.stop
            >
              <div class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 :id="titleId" class="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {{ title }}
                </h3>
                <button
                  type="button"
                  class="text-gray-400 hover:text-gray-500 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg p-1"
                  aria-label="Fermer"
                  @click="handleClose"
                >
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div class="p-6 text-gray-800 dark:text-gray-100">
                <slot />
              </div>

              <div v-if="$slots.footer" class="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-b-lg">
                <slot name="footer" />
              </div>
            </div>
          </Transition>
        </div>
        <div class="fixed inset-0 bg-black/20 backdrop-blur-sm -z-10"></div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, watch, ref, nextTick, onBeforeUnmount } from 'vue';

interface Props {
  isOpen?: boolean;
  modelValue?: boolean;
  title: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closeOnEscape?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isOpen: false,
  modelValue: false,
  size: 'md',
  closeOnEscape: true,
});

const emit = defineEmits<{
  close: [];
  'update:modelValue': [value: boolean];
}>();

const isVisible = computed(() => props.modelValue || props.isOpen);
const panel = ref<HTMLElement | null>(null);
const previouslyFocused = ref<HTMLElement | null>(null);
const titleId = `modal-title-${Math.random().toString(36).slice(2, 9)}`;

function handleClose() {
  emit('close');
  emit('update:modelValue', false);
}

function handleOverlayClick() {
  handleClose();
}

function onKeydown(e: KeyboardEvent) {
  if (!isVisible.value) return;
  if (e.key === 'Escape' && props.closeOnEscape) {
    e.stopPropagation();
    handleClose();
  }
}

const modalClasses = computed(() => {
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };
  return `w-full ${sizeClasses[props.size]}`;
});

watch(isVisible, async (open) => {
  if (open) {
    previouslyFocused.value = document.activeElement as HTMLElement | null;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeydown);
    await nextTick();
    panel.value?.focus();
  } else {
    document.body.style.overflow = '';
    document.removeEventListener('keydown', onKeydown);
    previouslyFocused.value?.focus?.();
  }
});

onBeforeUnmount(() => {
  document.body.style.overflow = '';
  document.removeEventListener('keydown', onKeydown);
});
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-inner-enter-active,
.modal-inner-leave-active {
  transition: all 0.3s ease;
}

.modal-inner-enter-from,
.modal-inner-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
