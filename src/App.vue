<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import AuthLayout from '@/layouts/AuthLayout.vue'
import DashboardLayout from '@/layouts/DashboardLayout.vue'

const route = useRoute()
const authStore = useAuthStore()

// Synchrone : doit être résolu avant le premier render pour que
// isSuperAdmin/isAdminEnterprise soient corrects dès le montage des pages
authStore.loadFromStorage()

const layoutComponent = computed(() => {
  const layout = route.meta.layout
  if (layout === 'auth') return AuthLayout
  return DashboardLayout
})
</script>

<template>
  <component :is="layoutComponent">
    <RouterView />
  </component>
</template>
