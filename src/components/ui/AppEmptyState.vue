<template>
  <div class="flex flex-col items-center justify-center py-12 px-4">
    <div v-if="icon" class="flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
      <svg
        class="w-10 h-10 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <component :is="iconPath" />
      </svg>
    </div>

    <h3 class="text-lg font-semibold text-gray-900 mb-2 text-center">
      {{ title }}
    </h3>

    <p v-if="description" class="text-sm text-gray-500 mb-6 text-center max-w-sm">
      {{ description }}
    </p>

    <div v-if="$slots.actions" class="flex items-center gap-3">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, h } from 'vue';

interface Props {
  title: string;
  description?: string;
  icon?: 'inbox' | 'document' | 'folder' | 'search' | 'user';
}

const props = withDefaults(defineProps<Props>(), {
  description: '',
  icon: 'inbox',
});

const iconPath = computed(() => {
  const icons = {
    inbox: () => h('path', {
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      'stroke-width': '2',
      d: 'M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4',
    }),
    document: () => h('path', {
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      'stroke-width': '2',
      d: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    }),
    folder: () => h('path', {
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      'stroke-width': '2',
      d: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z',
    }),
    search: () => h('path', {
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      'stroke-width': '2',
      d: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
    }),
    user: () => h('path', {
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      'stroke-width': '2',
      d: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
    }),
  };

  return icons[props.icon] || icons.inbox;
});
</script>
