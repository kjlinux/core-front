<template>
  <span
    :class="[
      sizeClasses,
      'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-100 font-medium text-gray-600',
    ]"
  >
    <img
      v-if="src && !failed"
      :src="src"
      :alt="name || 'Avatar'"
      class="h-full w-full object-cover"
      @error="failed = true"
    />
    <span v-else>{{ initials }}</span>
  </span>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

interface Props {
  src?: string | null
  name?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const props = withDefaults(defineProps<Props>(), {
  src: null,
  name: '',
  size: 'md',
})

const failed = ref(false)

// Reinitialise l'etat d'erreur quand la source change (ex: mise a jour du profil).
watch(
  () => props.src,
  () => {
    failed.value = false
  },
)

const initials = computed(() => {
  const parts = props.name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) {
    return '?'
  }
  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : ''
  return (first + last).toUpperCase()
})

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'h-7 w-7 text-xs'
    case 'lg':
      return 'h-10 w-10 text-base'
    case 'xl':
      return 'h-20 w-20 text-2xl'
    case 'md':
    default:
      return 'h-8 w-8 text-sm'
  }
})
</script>
