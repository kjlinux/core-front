<script setup lang="ts">
defineProps<{
  title: string
  description?: string
}>()
</script>

<template>
  <fieldset class="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
    <legend class="text-lg font-semibold text-gray-900 px-2">
      {{ title }}
    </legend>
    <p v-if="description" class="text-sm text-gray-600 mt-2 mb-4">
      {{ description }}
    </p>
    <div class="space-y-4 mt-4">
      <slot />
    </div>
  </fieldset>
</template>
