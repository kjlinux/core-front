<script setup lang="ts">
import { ref } from 'vue'
import { BellIcon } from '@heroicons/vue/24/outline'
import { onClickOutside } from '@vueuse/core'

const isOpen = ref(false)
const panelRef = ref<HTMLElement | null>(null)

onClickOutside(panelRef, () => {
  isOpen.value = false
})
</script>

<template>
  <div ref="panelRef" class="relative">
    <button
      type="button"
      class="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
      @click="isOpen = !isOpen"
    >
      <BellIcon class="h-5 w-5" />
      <span
        class="absolute right-1 top-1 h-2 w-2 rounded-full bg-danger-500"
      />
    </button>

    <div
      v-if="isOpen"
      class="absolute right-0 top-full z-50 mt-1 w-80 rounded-lg border border-gray-200 bg-white shadow-lg"
    >
      <div class="border-b border-gray-200 px-4 py-3">
        <h3 class="text-sm font-semibold text-gray-800">Notifications</h3>
      </div>
      <div class="max-h-64 overflow-y-auto py-2">
        <p class="px-4 py-6 text-center text-sm text-gray-500">
          Aucune notification
        </p>
      </div>
    </div>
  </div>
</template>
