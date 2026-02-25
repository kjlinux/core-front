<script setup lang="ts">
import { useUiStore } from '@/stores/ui.store'
import { useRealtimeSubscriptions } from '@/composables/useRealtimeSubscriptions'
import TheSidebar from '@/components/layout/TheSidebar.vue'
import TheHeader from '@/components/layout/TheHeader.vue'

const ui = useUiStore()

// Initialize all real-time WebSocket subscriptions
useRealtimeSubscriptions()
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
