<script setup lang="ts">
import AppSkeleton from './AppSkeleton.vue'

interface Props {
  rows?: number
  columns?: number
  withCheckbox?: boolean
}

withDefaults(defineProps<Props>(), {
  rows: 8,
  columns: 4,
  withCheckbox: false,
})
</script>

<template>
  <tbody class="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
    <tr v-for="r in rows" :key="`sk-${r}`">
      <td v-if="withCheckbox" class="relative w-12 px-6 sm:w-16 sm:px-8">
        <AppSkeleton width="1rem" height="1rem" />
      </td>
      <td v-for="c in columns" :key="`sk-${r}-${c}`" class="whitespace-nowrap px-3 py-4">
        <AppSkeleton height="0.875rem" />
      </td>
    </tr>
  </tbody>
</template>
