<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :class="buttonClasses"
    @click="handleClick"
  >
    <AppSpinner v-if="loading" :size="spinnerSize" color="currentColor" />
    <span class="inline-flex items-center gap-1.5" :class="{ 'opacity-0': loading }">
      <slot />
    </span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import AppSpinner from './AppSpinner.vue';

interface Props {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost' | 'success';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  loading: false,
  disabled: false,
  type: 'button',
});

const emit = defineEmits<{
  click: [event: MouseEvent];
}>();

const handleClick = (event: MouseEvent) => {
  if (!props.loading && !props.disabled) {
    emit('click', event);
  }
};

const baseClasses = 'relative inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

const variantClasses = computed(() => {
  switch (props.variant) {
    case 'primary':
      return 'bg-primary-800 text-white hover:bg-primary-900 focus:ring-primary-600';
    case 'secondary':
      return 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500';
    case 'danger':
      return 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500';
    case 'outline':
      return 'bg-transparent text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-gray-500';
    case 'ghost':
      return 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500';
    case 'success':
      return 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500';
    default:
      return '';
  }
});

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'px-3 py-1.5 text-sm';
    case 'md':
      return 'px-4 py-2 text-base';
    case 'lg':
      return 'px-6 py-3 text-lg';
    default:
      return '';
  }
});

const spinnerSize = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'sm';
    case 'md':
      return 'sm';
    case 'lg':
      return 'md';
    default:
      return 'sm';
  }
});

const buttonClasses = computed(() => {
  return [baseClasses, variantClasses.value, sizeClasses.value].join(' ');
});
</script>
