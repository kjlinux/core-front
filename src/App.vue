<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import AuthLayout from '@/layouts/AuthLayout.vue'
import DashboardLayout from '@/layouts/DashboardLayout.vue'

const route = useRoute()
const authStore = useAuthStore()

const layoutComponent = computed(() => {
  const layout = route.meta.layout
  if (layout === 'auth') return AuthLayout
  return DashboardLayout
})

onMounted(() => {
  authStore.loadFromStorage()
})
</script>

<template>
  <component :is="layoutComponent">
    <RouterView />
  </component>
</template>
