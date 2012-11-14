<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useUiStore } from '@/stores/ui.store'
import { useAuthStore } from '@/stores/auth.store'
import TheHeaderUserMenu from './TheHeaderUserMenu.vue'
import TheHeaderNotifications from './TheHeaderNotifications.vue'
import { Bars3Icon, ChevronLeftIcon } from '@heroicons/vue/24/outline'

const ui = useUiStore()
const auth = useAuthStore()
const route = useRoute()

const pageTitle = computed(() => {
  return (route.meta.title as string) || 'Tableau de bord'
})
</script>

<template>
  <header class="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6">
    <div class="flex items-center gap-4">
      <!-- Mobile menu button -->
      <button
        type="button"
        class="text-gray-500 hover:text-gray-700 lg:hidden"
        @click="ui.openMobileSidebar()"
      >
        <Bars3Icon class="h-6 w-6" />
      </button>

      <!-- Collapse sidebar button (desktop) -->
      <button
        type="button"
        class="hidden text-gray-500 hover:text-gray-700 lg:block"
        @click="ui.toggleSidebar()"
      >
        <ChevronLeftIcon
          :class="['h-5 w-5 transition-transform', ui.sidebarCollapsed ? 'rotate-180' : '']"
        />
      </button>

      <h1 class="text-lg font-semibold text-gray-800">{{ pageTitle }}</h1>
    </div>

    <div class="flex items-center gap-4">
      <TheHeaderNotifications />
      <TheHeaderUserMenu />
    </div>
  </header>
</template>
