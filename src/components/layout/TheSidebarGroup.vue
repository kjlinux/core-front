<script setup lang="ts">
import { ref, type Component } from 'vue'
import { ChevronDownIcon } from '@heroicons/vue/24/outline'

const props = defineProps<{
  label: string
  icon: Component
  collapsed: boolean
  active: boolean
}>()

const isOpen = ref(props.active)

function toggle() {
  if (!props.collapsed) {
    isOpen.value = !isOpen.value
  }
}
</script>

<template>
  <div>
    <button
      type="button"
      :class="[
        'flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors',
        active
          ? 'bg-sidebar-hover text-white'
          : 'text-gray-300 hover:bg-sidebar-hover hover:text-white',
      ]"
      @click="toggle"
    >
      <component :is="icon" class="h-5 w-5 shrink-0" />
      <span v-if="!collapsed" class="flex-1 truncate text-left">{{ label }}</span>
      <ChevronDownIcon
        v-if="!collapsed"
        :class="['h-4 w-4 shrink-0 transition-transform', isOpen ? 'rotate-180' : '']"
      />
    </button>
    <div v-if="isOpen && !collapsed" class="pb-1">
      <slot />
    </div>
  </div>
</template>
