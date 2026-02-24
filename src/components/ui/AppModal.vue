<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="isVisible"
        class="fixed inset-0 z-50 overflow-y-auto"
        @click.self="handleOverlayClick"
      >
        <div class="flex min-h-full items-center justify-center p-4">
          <Transition name="modal-inner">
            <div
              v-if="isVisible"
              :class="modalClasses"
              class="relative bg-white rounded-lg shadow-xl transform transition-all"
              @click.stop
            >
              <div class="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 class="text-lg font-semibold text-gray-900">
                  {{ title }}
                </h3>
                <button
                  type="button"
                  class="text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg p-1"
                  @click="handleClose"
                >
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div class="p-6">
                <slot />
              </div>

              <div v-if="$slots.footer" class="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-lg">
                <slot name="footer" />
              </div>
            </div>
          </Transition>
        </div>
        <div class="fixed inset-0 bg-black bg-opacity-50 -z-10"></div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';

interface Props {
  isOpen?: boolean;
  modelValue?: boolean;
  title: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const props = withDefaults(defineProps<Props>(), {
  isOpen: false,
  modelValue: false,
  size: 'md',
});

const emit = defineEmits<{
  close: [];
  'update:modelValue': [value: boolean];
}>();

const isVisible = computed(() => props.modelValue || props.isOpen);

const handleClose = () => {
  emit('close');
  emit('update:modelValue', false);
};

const handleOverlayClick = () => {
  handleClose();
};

const modalClasses = computed(() => {
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };
  return `w-full ${sizeClasses[props.size]}`;
});

watch(isVisible, (isOpen) => {
  if (isOpen) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
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
