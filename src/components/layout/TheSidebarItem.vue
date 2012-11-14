<script setup lang="ts">
import type { Component } from 'vue'
import { RouterLink } from 'vue-router'

defineProps<{
  label: string
  to: string
  icon: Component
  collapsed: boolean
  active: boolean
  nested?: boolean
}>()
</script>

<template>
  <RouterLink
    :to="to"
    :class="[
      'flex items-center gap-3 px-4 py-2.5 text-sm transition-colors',
      nested ? 'pl-12' : 'pl-4',
      active
        ? 'bg-sidebar-active text-white'
        : 'text-gray-300 hover:bg-sidebar-hover hover:text-white',
    ]"
  >
    <component :is="icon" class="h-5 w-5 shrink-0" />
    <span v-if="!collapsed" class="truncate">{{ label }}</span>
  </RouterLink>
</template>
