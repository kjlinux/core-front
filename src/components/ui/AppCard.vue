<template>
  <div class="bg-white rounded-lg border border-gray-200 shadow-sm">
    <div v-if="title || subtitle || $slots.actions" :class="headerPaddingClasses" class="border-b border-gray-200">
      <div class="flex items-start justify-between">
        <div>
          <h3 v-if="title" class="text-lg font-semibold text-gray-900">
            {{ title }}
          </h3>
          <p v-if="subtitle" class="mt-1 text-sm text-gray-500">
            {{ subtitle }}
          </p>
        </div>
        <div v-if="$slots.actions" class="ml-4">
          <slot name="actions" />
        </div>
      </div>
    </div>

    <div :class="contentPaddingClasses">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  title?: string;
  subtitle?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  subtitle: '',
  padding: 'md',
});

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

const headerPaddingClasses = computed(() => {
  if (props.title || props.subtitle) {
    return paddingClasses[props.padding];
  }
  return '';
});

const contentPaddingClasses = computed(() => paddingClasses[props.padding]);
</script>
