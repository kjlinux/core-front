<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { useDarkMode } from '@/composables/useDarkMode'
import AuthLayout from '@/layouts/AuthLayout.vue'
import DashboardLayout from '@/layouts/DashboardLayout.vue'
import AppToastContainer from '@/components/ui/AppToastContainer.vue'
import DemoBanner from '@/components/layout/DemoBanner.vue'

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
  // Tant que la navigation initiale n'est pas resolue (deep-link au chargement),
  // route.matched est vide et route.meta.layout indefini : on ne monte AUCUN
  // layout. Sans ce garde, DashboardLayout (layout par defaut) se monte par
  // defaut et declenche au onMounted des appels API authentifies (/auth/me,
  // /menu-badges...) qui, sur une page publique non authentifiee comme /demo,
  // renvoient 401 et provoquent une redirection vers /login.
  if (route.matched.length === 0) return null
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
  <DemoBanner />
</template>
