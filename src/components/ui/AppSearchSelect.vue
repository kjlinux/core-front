<template>
  <div class="w-full relative" ref="rootEl">
    <label v-if="label" :for="inputId" class="block text-sm font-medium text-gray-700 mb-1">
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>

    <div class="relative">
      <input
        :id="inputId"
        ref="inputEl"
        type="text"
        autocomplete="off"
        :value="displayValue"
        :placeholder="placeholder || 'Selectionner...'"
        :disabled="disabled"
        :required="required"
        :class="inputClasses"
        @focus="handleFocus"
        @input="handleInput"
        @keydown="handleKeydown"
        @click="handleFocus"
      />

      <div class="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none gap-1">
        <button
          v-if="clearable && !disabled && modelValue !== '' && modelValue !== null && modelValue !== undefined"
          type="button"
          class="pointer-events-auto text-gray-400 hover:text-gray-600 p-0.5"
          @click.stop="clear"
          aria-label="Effacer"
        >
          <XMarkIcon class="h-4 w-4" />
        </button>
        <ChevronDownIcon
          class="h-4 w-4 text-gray-400 transition-transform"
          :class="{ 'rotate-180': isOpen }"
        />
      </div>
    </div>

    <ul
      v-if="isOpen"
      class="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white py-1 text-sm shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none border border-gray-200"
      role="listbox"
    >
      <li v-if="filteredOptions.length === 0" class="px-3 py-2 text-gray-500 italic">
        Aucun resultat
      </li>
      <li
        v-for="(option, index) in filteredOptions"
        :key="option.value"
        :class="[
          'cursor-pointer select-none px-3 py-2',
          highlightedIndex === index ? 'bg-primary-50 text-primary-900' : 'text-gray-900',
          String(option.value) === String(modelValue) ? 'font-semibold' : ''
        ]"
        role="option"
        :aria-selected="String(option.value) === String(modelValue)"
        @mousedown.prevent="selectOption(option)"
        @mouseenter="highlightedIndex = index"
      >
        {{ option.label }}
      </li>
    </ul>

    <p v-if="error" class="mt-1 text-sm text-red-600">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { ChevronDownIcon, XMarkIcon } from '@heroicons/vue/24/outline';

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
  clearable?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  label: '',
  placeholder: '',
  error: '',
  disabled: false,
  required: false,
  clearable: true,
});

const emit = defineEmits<{
  'update:modelValue': [value: string | number];
}>();

const inputId = computed(() => `search-select-${Math.random().toString(36).substr(2, 9)}`);

const rootEl = ref<HTMLElement | null>(null);
const inputEl = ref<HTMLInputElement | null>(null);
const isOpen = ref(false);
const query = ref('');
const highlightedIndex = ref(0);

const selectedOption = computed(() =>
  props.options.find((o) => String(o.value) === String(props.modelValue))
);

const displayValue = computed(() => {
  if (isOpen.value) return query.value;
  return selectedOption.value ? selectedOption.value.label : '';
});

const filteredOptions = computed(() => {
  if (!query.value.trim()) return props.options;
  const q = query.value.toLowerCase();
  return props.options.filter((o) => o.label.toLowerCase().includes(q));
});

watch(filteredOptions, () => {
  highlightedIndex.value = 0;
});

function open() {
  if (props.disabled) return;
  isOpen.value = true;
  query.value = '';
  highlightedIndex.value = Math.max(
    0,
    props.options.findIndex((o) => String(o.value) === String(props.modelValue))
  );
  nextTick(() => inputEl.value?.select());
}

function close() {
  isOpen.value = false;
  query.value = '';
}

function handleFocus() {
  if (!isOpen.value) open();
}

function handleInput(event: Event) {
  const target = event.target as HTMLInputElement;
  query.value = target.value;
  if (!isOpen.value) isOpen.value = true;
}

function selectOption(option: SelectOption) {
  emit('update:modelValue', option.value);
  close();
  inputEl.value?.blur();
}

function clear() {
  emit('update:modelValue', '');
  close();
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'ArrowDown') {
    event.preventDefault();
    if (!isOpen.value) open();
    else highlightedIndex.value = Math.min(highlightedIndex.value + 1, filteredOptions.value.length - 1);
  } else if (event.key === 'ArrowUp') {
    event.preventDefault();
    highlightedIndex.value = Math.max(highlightedIndex.value - 1, 0);
  } else if (event.key === 'Enter') {
    event.preventDefault();
    const opt = filteredOptions.value[highlightedIndex.value];
    if (opt) selectOption(opt);
  } else if (event.key === 'Escape') {
    close();
    inputEl.value?.blur();
  } else if (event.key === 'Tab') {
    close();
  }
}

function handleClickOutside(event: MouseEvent) {
  if (rootEl.value && !rootEl.value.contains(event.target as Node)) {
    close();
  }
}

onMounted(() => document.addEventListener('mousedown', handleClickOutside));
onBeforeUnmount(() => document.removeEventListener('mousedown', handleClickOutside));

const baseClasses =
  'block w-full rounded-lg border shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:bg-gray-100 disabled:cursor-not-allowed';

const inputClasses = computed(() => {
  const errorClasses = props.error
    ? 'border-red-300 text-red-900 focus:border-red-500 focus:ring-red-500'
    : 'border-gray-300 text-gray-900 focus:border-primary-700 focus:ring-primary-700';
  return `${baseClasses} ${errorClasses} px-3 py-2 pr-12 text-sm cursor-pointer`;
});
</script>
