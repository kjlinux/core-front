<template>
  <div class="space-y-3">
    <div
      v-for="(channel, index) in channels"
      :key="index"
      class="flex items-center gap-3"
    >
      <input
        v-model="channel.name"
        type="text"
        placeholder="Ex: Instagram, Facebook, Bouche à oreille..."
        class="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        @input="emit('update:modelValue', channels)"
      />
      <button
        type="button"
        class="shrink-0 text-red-400 hover:text-red-600 transition-colors"
        @click="removeChannel(index)"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <button
      v-if="channels.length < 20"
      type="button"
      class="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
      @click="addChannel"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
      </svg>
      Ajouter un canal
    </button>

    <p v-if="channels.length === 0" class="text-sm text-gray-400 italic">
      Aucun canal configuré. Les clients ne verront pas la question "Où nous avez-vous connus ?".
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

interface Channel {
  name: string
}

const props = defineProps<{
  modelValue: Channel[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: Channel[]]
}>()

const channels = ref<Channel[]>(props.modelValue.map((c) => ({ ...c })))

watch(
  () => props.modelValue,
  (val) => {
    channels.value = val.map((c) => ({ ...c }))
  },
  { deep: true }
)

function addChannel() {
  channels.value.push({ name: '' })
  emit('update:modelValue', channels.value)
}

function removeChannel(index: number) {
  channels.value.splice(index, 1)
  emit('update:modelValue', channels.value)
}
</script>
