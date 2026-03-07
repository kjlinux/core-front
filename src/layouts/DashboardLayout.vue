<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useUiStore } from '@/stores/ui.store'
import { useAuthStore } from '@/stores/auth.store'
import { useRealtimeSubscriptions } from '@/composables/useRealtimeSubscriptions'
import { authApi } from '@/services/api/auth.api'
import TheSidebar from '@/components/layout/TheSidebar.vue'
import TheHeader from '@/components/layout/TheHeader.vue'

const ui = useUiStore()
const authStore = useAuthStore()

const { subscribeAll, unsubscribeAll } = useRealtimeSubscriptions()

onMounted(async () => {
  subscribeAll()
  // Rafraichir le profil utilisateur pour avoir companyName et autres données à jour
  try {
    const user = await authApi.getCurrentUser()
    authStore.user = user
    authStore.persistUser()
  } catch {
    // Silencieux — si l'appel échoue, on garde le user du localStorage
  }
})
onUnmounted(() => unsubscribeAll())
</script>

<template>
  <div class="flex h-screen overflow-hidden bg-gray-50">
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
      <TheHeader />
      <main class="flex-1 overflow-y-auto p-6">
        <slot />
      </main>
    </div>
  </div>
</template>
