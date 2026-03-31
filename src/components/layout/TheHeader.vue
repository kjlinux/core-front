<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useUiStore } from '@/stores/ui.store'
import { useAuthStore } from '@/stores/auth.store'
import { useFirmwareStore } from '@/stores/firmware.store'
import { UserRole } from '@/types/enums'
import TheHeaderUserMenu from './TheHeaderUserMenu.vue'
import TheHeaderNotifications from './TheHeaderNotifications.vue'
import TheLanguageSwitcher from './TheLanguageSwitcher.vue'
import FirmwareUpdateModal from '@/components/firmware/FirmwareUpdateModal.vue'
import { Bars3Icon, ChevronLeftIcon } from '@heroicons/vue/24/outline'

const ui = useUiStore()
const auth = useAuthStore()
const firmwareStore = useFirmwareStore()
const route = useRoute()

const showUpdateModal = ref(false)

const pageTitle = computed(() => {
  return (route.meta.title as string) || 'Tableau de bord'
})

const companyName = computed(() => {
  if (auth.user?.role === 'super_admin') return null
  return auth.user?.companyName ?? null
})

const showFirmwareBanner = computed(() => {
  if (!firmwareStore.latestPublishedVersion) return false
  const role = auth.user?.role
  return role === UserRole.SUPER_ADMIN || role === UserRole.ADMIN_ENTERPRISE || role === UserRole.TECHNICIEN
})

onMounted(() => {
  if (
    auth.user?.role === UserRole.SUPER_ADMIN ||
    auth.user?.role === UserRole.ADMIN_ENTERPRISE ||
    auth.user?.role === UserRole.TECHNICIEN
  ) {
    firmwareStore.fetchLatestPublished()
  }
})
</script>

<template>
  <div>
    <!-- Bandeau mise à jour firmware -->
    <div
      v-if="showFirmwareBanner"
      class="flex items-center justify-between bg-amber-500 px-6 py-2 text-sm text-white"
    >
      <span class="font-medium">
        Mise a jour firmware v{{ firmwareStore.latestPublishedVersion!.version }} disponible
        pour vos capteurs {{ firmwareStore.latestPublishedVersion!.deviceKind === 'rfid' ? 'RFID' : 'Biometrique' }}
      </span>
      <button
        type="button"
        class="ml-4 rounded-md bg-white/20 px-3 py-1 text-xs font-semibold hover:bg-white/30 transition-colors"
        @click="showUpdateModal = true"
      >
        Mettre a jour maintenant
      </button>
    </div>

    <!-- Header principal -->
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
        <span
          v-if="companyName"
          class="hidden sm:inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold text-white"
          style="background-color: #334155;"
        >
          {{ companyName }}
        </span>
      </div>

      <div class="flex items-center gap-4">
        <TheLanguageSwitcher />
        <TheHeaderNotifications />
        <TheHeaderUserMenu />
      </div>
    </header>

    <!-- Modal mise à jour en masse -->
    <FirmwareUpdateModal
      v-if="showUpdateModal && firmwareStore.latestPublishedVersion"
      :firmware-version-id="firmwareStore.latestPublishedVersion.id"
      :firmware-version="firmwareStore.latestPublishedVersion.version"
      :device-kind="firmwareStore.latestPublishedVersion.deviceKind"
      @close="showUpdateModal = false"
    />
  </div>
</template>
