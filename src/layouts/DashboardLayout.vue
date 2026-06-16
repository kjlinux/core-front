<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useUiStore } from '@/stores/ui.store'
import { useAuthStore } from '@/stores/auth.store'
import { useBadgesStore } from '@/stores/badges.store'
import { useRealtimeSubscriptions } from '@/composables/useRealtimeSubscriptions'
import { authApi } from '@/services/api/auth.api'
import TheSidebar from '@/components/layout/TheSidebar.vue'
import TheHeader from '@/components/layout/TheHeader.vue'
import ImpersonationBanner from '@/components/layout/ImpersonationBanner.vue'
import AppBreadcrumb from '@/components/ui/AppBreadcrumb.vue'
import CommandPalette from '@/components/ui/CommandPalette.vue'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'

const ui = useUiStore()
const authStore = useAuthStore()
const badgesStore = useBadgesStore()

const { subscribeAll, unsubscribeAll } = useRealtimeSubscriptions()

onMounted(async () => {
  subscribeAll()
  badgesStore.startPolling()
  // Rafraichir le profil utilisateur pour avoir companyName et autres données à jour
  try {
    const user = await authApi.getCurrentUser()
    authStore.user = user
    authStore.persistUser()
  } catch {
    // Silencieux - si l'appel échoue, on garde le user du localStorage
  }
})
onUnmounted(() => {
  unsubscribeAll()
  badgesStore.stopPolling()
})
</script>

<template>
  <div class="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
    <!-- Overlay mobile -->
    <div
      v-if="ui.sidebarMobileOpen"
      class="fixed inset-0 z-40 bg-black/50 lg:hidden"
      @click="ui.closeMobileSidebar()"
    />

    <!-- Sidebar -->
    <TheSidebar />

    <!-- Main content -->
    <div class="flex flex-1 flex-col overflow-hidden">
      <ImpersonationBanner />
      <TheHeader />
      <main class="flex-1 overflow-y-auto p-6">
        <AppBreadcrumb class="mb-3" />
        <slot />
      </main>
      <CommandPalette />
    </div>

    <ConfirmModal />
  </div>
</template>
