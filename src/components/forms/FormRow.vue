<script setup lang="ts">
defineProps<{
  label: string
  required?: boolean
  optional?: boolean
  error?: string
  help?: string
}>()
</script>

<template>
  <div class="flex flex-col gap-2">
    <label class="flex items-center text-sm font-medium text-gray-700">
      {{ label }}
      <span v-if="required" class="text-red-500 ml-1">*</span>
      <span v-if="optional" class="text-gray-400 ml-1 text-xs font-normal">(optionnel)</span>
    </label>
    <div class="flex-1">
      <slot />
    </div>
    <p v-if="error" class="text-sm text-red-600">
      {{ error }}
    </p>
    <p v-if="help && !error" class="text-sm text-gray-500">
      {{ help }}
    </p>
  </div>
</template>
