<template>
  <div>
    <label
      v-if="label"
      :for="textareaId"
      class="block text-sm font-medium text-gray-700 mb-1"
    >
      {{ label }}
    </label>
    <textarea
      :id="textareaId"
      :value="modelValue"
      :placeholder="placeholder"
      :rows="rows"
      :disabled="disabled"
      :class="[
        'block w-full rounded-lg border px-3 py-2 text-sm shadow-sm transition-colors duration-150 resize-vertical',
        'focus:outline-none focus:ring-2 focus:ring-offset-0',
        error
          ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500'
          : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500',
        disabled ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white',
      ]"
      @input="onInput"
    />
    <p v-if="error" class="mt-1 text-sm text-danger-600">
      {{ error }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  modelValue?: string
  label?: string
  placeholder?: string
  error?: string
  rows?: number
  disabled?: boolean
}

withDefaults(defineProps<Props>(), {
  modelValue: '',
  label: undefined,
  placeholder: undefined,
  error: undefined,
  rows: 3,
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const textareaId = computed(() => `textarea-${Math.random().toString(36).substring(2, 9)}`)

function onInput(event: Event) {
  const target = event.target as HTMLTextAreaElement
  emit('update:modelValue', target.value)
}
</script>
