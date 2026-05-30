<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { useDarkMode } from '@/composables/useDarkMode'
import AuthLayout from '@/layouts/AuthLayout.vue'
import DashboardLayout from '@/layouts/DashboardLayout.vue'
import AppToastContainer from '@/components/ui/AppToastContainer.vue'

const route = useRoute()
const authStore = useAuthStore()

// Applique le theme sauvegarde des le boot de l'app, pour toutes les pages
// (login inclus). Sans ca, le theme n'etait initialise que par TheHeader, donc
// jamais sur les ecrans hors dashboard comme la page de connexion.
useDarkMode()

// Synchrone : doit être résolu avant le premier render pour que
// isSuperAdmin/isAdminEnterprise soient corrects dès le montage des pages
authStore.loadFromStorage()

const layoutComponent = computed(() => {
  const layout = route.meta.layout
  if (layout === 'none') return null
  if (layout === 'auth') return AuthLayout
  return DashboardLayout
})
</script>

<template>
  <RouterView v-if="!layoutComponent" />
  <component v-else :is="layoutComponent">
    <RouterView />
  </component>
  <AppToastContainer />
</template>
