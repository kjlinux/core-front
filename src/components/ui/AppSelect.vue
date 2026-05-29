<template>
  <AppSearchSelect
    :model-value="modelValue"
    :options="options"
    :label="label"
    :placeholder="placeholder"
    :error="error"
    :disabled="disabled"
    :required="required"
    @update:model-value="(v) => $emit('update:modelValue', v)"
  />
</template>

<script setup lang="ts">
import AppSearchSelect from './AppSearchSelect.vue';

export interface SelectOption {
  value: string | number;
  label: string;
}

interface Props {
  modelValue?: string | number;
  options: SelectOption[];
  label?: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
}

withDefaults(defineProps<Props>(), {
  modelValue: '',
  label: '',
  placeholder: '',
  error: '',
  disabled: false,
  required: false,
});

defineEmits<{
  'update:modelValue': [value: string | number];
}>();
</script>
