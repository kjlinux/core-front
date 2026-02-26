<script setup lang="ts">
import { computed, inject, onMounted, ref, watch, type Component, type Ref } from 'vue'
import { ChevronDownIcon } from '@heroicons/vue/24/outline'

const props = defineProps<{
  groupId: string
  label: string
  icon: Component
  collapsed: boolean
  active: boolean
}>()

const openGroupId = inject<Ref<string | null>>('sidebarOpenGroupId')

const isOpen = computed(() => openGroupId?.value === props.groupId)

const contentRef = ref<HTMLElement | null>(null)
const contentHeight = ref('0px')

onMounted(() => {
  if (isOpen.value) {
    contentHeight.value = 'auto'
  }
})

watch(isOpen, (open) => {
  if (open && contentRef.value) {
    contentHeight.value = contentRef.value.scrollHeight + 'px'
  } else {
    contentHeight.value = '0px'
  }
})

function onTransitionEnd() {
  if (isOpen.value && contentRef.value) {
    contentHeight.value = 'auto'
  }
}

function toggle() {
  if (!props.collapsed && openGroupId) {
    if (isOpen.value && contentRef.value) {
      contentHeight.value = contentRef.value.scrollHeight + 'px'
      void contentRef.value.offsetHeight
      contentHeight.value = '0px'
      openGroupId.value = null
    } else {
      openGroupId.value = props.groupId
    }
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
        :class="['h-4 w-4 shrink-0 transition-transform duration-300', isOpen ? 'rotate-180' : '']"
      />
    </button>
    <div
      v-if="!collapsed"
      ref="contentRef"
      class="overflow-hidden transition-[max-height] duration-300 ease-in-out"
      :style="{ maxHeight: contentHeight }"
      @transitionend="onTransitionEnd"
    >
      <div class="pb-1">
        <slot />
      </div>
    </div>
  </div>
</template>
