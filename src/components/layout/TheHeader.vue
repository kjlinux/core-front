<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useUiStore } from '@/stores/ui.store'
import { useAuthStore } from '@/stores/auth.store'
import { useActiveCompanyStore } from '@/stores/active-company.store'
import { useFirmwareStore } from '@/stores/firmware.store'
import { usePlan } from '@/composables/usePlan'
import { usePermissions } from '@/composables/usePermissions'
import { UserRole } from '@/types/enums'
import type { FirmwareVersion } from '@/types'
import TheHeaderUserMenu from './TheHeaderUserMenu.vue'
import TheHeaderNotifications from './TheHeaderNotifications.vue'
import TheLanguageSwitcher from './TheLanguageSwitcher.vue'
import TheCompanySwitcher from './TheCompanySwitcher.vue'
import FirmwareCompanyUpdateModal from '@/components/firmware/FirmwareCompanyUpdateModal.vue'
import AppLiveIndicator from '@/components/ui/AppLiveIndicator.vue'
import { Bars3Icon, ChevronLeftIcon, SunIcon, MoonIcon } from '@heroicons/vue/24/outline'
import { useDarkMode } from '@/composables/useDarkMode'

const { isDark, toggle: toggleDark } = useDarkMode()

const ui = useUiStore()
const auth = useAuthStore()
const activeCompanyStore = useActiveCompanyStore()
const firmwareStore = useFirmwareStore()
const plan = usePlan()
const { canCollapseSidebar } = usePermissions()
const route = useRoute()

const selectedFirmwareForUpdate = ref<FirmwareVersion | null>(null)

// L'OTA en masse exige un plan garantie ou premium cote backend
// (super_admin bypasse via usePlan).
const hasOtaPlan = computed(() => {
  if (plan.isSuperAdmin.value) return true
  return plan.planCode.value === 'garantie' || plan.planCode.value === 'premium'
})

function deviceKindLabel(kind: string): string {
  return kind === 'rfid' ? 'RFID' : 'Biométriques'
}

function openFirmwareUpdate(version: FirmwareVersion) {
  selectedFirmwareForUpdate.value = version
}

function closeFirmwareUpdate() {
  selectedFirmwareForUpdate.value = null
}

const now = ref(new Date())
let clockInterval: ReturnType<typeof setInterval>

const formattedDate = computed(() => {
  return now.value.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
})

const formattedTime = computed(() => {
  return now.value.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
})

const APP_VERSION = '2.9.8'
const APP_UPDATE_BANNER_KEY = 'app_update_banner_dismissed_version'
const showAppUpdateBanner = ref(
  typeof window !== 'undefined' &&
    window.localStorage?.getItem(APP_UPDATE_BANNER_KEY) !== APP_VERSION,
)

function dismissAppUpdateBanner() {
  showAppUpdateBanner.value = false
  try {
    window.localStorage?.setItem(APP_UPDATE_BANNER_KEY, APP_VERSION)
  } catch {
    // ignore localStorage indisponible
  }
}

const pageTitle = computed(() => {
  return (route.meta.title as string) || 'Tableau de bord'
})

const companyName = computed(() => {
  if (auth.user?.role === 'super_admin') return null
  // Pour le technicien, afficher l'entreprise active selectionnee
  if (auth.user?.role === 'technicien') {
    return activeCompanyStore.activeCompanyName ?? null
  }
  return auth.user?.companyName ?? null
})

const canSeeFirmwareBanner = computed(() => {
  const role = auth.user?.role
  return (
    role === UserRole.SUPER_ADMIN ||
    role === UserRole.ADMIN_ENTERPRISE ||
    role === UserRole.TECHNICIEN
  )
})

// Une banniere par type d'appareil ayant une version publiee.
const firmwareBanners = computed(() =>
  canSeeFirmwareBanner.value ? firmwareStore.publishedBanners : [],
)

onMounted(() => {
  clockInterval = setInterval(() => {
    now.value = new Date()
  }, 1000)
  if (
    auth.user?.role === UserRole.SUPER_ADMIN ||
    auth.user?.role === UserRole.ADMIN_ENTERPRISE ||
    auth.user?.role === UserRole.TECHNICIEN
  ) {
    firmwareStore.fetchLatestPublished()
  }
})

onUnmounted(() => {
  clearInterval(clockInterval)
})
</script>

<template>
  <div>
    <!-- Bandeau mise à jour application -->
    <div
      v-if="showAppUpdateBanner"
      class="flex items-center justify-between bg-green-600 px-6 py-2 text-sm text-white"
    >
      <span class="font-medium">
        Bonne nouvelle ! Votre application vient d'être mise à jour en version {{ APP_VERSION }}.
        Profitez des dernières améliorations.
      </span>
      <button
        type="button"
        class="ml-4 rounded-md bg-white/20 px-3 py-1 text-xs font-semibold hover:bg-white/30 transition-colors"
        @click="dismissAppUpdateBanner"
      >
        Fermer
      </button>
    </div>

    <!-- Bandeaux mise à jour firmware (une par type d'appareil) -->
    <div
      v-for="banner in firmwareBanners"
      :key="banner.id"
      class="flex items-center justify-between bg-amber-500 px-6 py-2 text-sm text-white"
    >
      <span class="font-medium">
        Mise à jour firmware {{ banner.version }} disponible pour vos terminaux
        {{ deviceKindLabel(banner.deviceKind) }}.
        <span v-if="!hasOtaPlan" class="ml-1 opacity-90">
          (nécessite un abonnement Garantie ou Premium)
        </span>
      </span>
      <button
        v-if="hasOtaPlan"
        type="button"
        class="ml-4 rounded-md bg-white/20 px-3 py-1 text-xs font-semibold hover:bg-white/30 transition-colors"
        @click="openFirmwareUpdate(banner)"
      >
        Lancer la mise à jour
      </button>
      <router-link
        v-else
        to="/abonnement"
        class="ml-4 rounded-md bg-white/20 px-3 py-1 text-xs font-semibold hover:bg-white/30 transition-colors"
      >
        Voir les abonnements
      </router-link>
    </div>

    <!-- Header principal -->
    <header
      class="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6"
    >
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
          v-if="canCollapseSidebar"
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
          style="background-color: #334155"
        >
          {{ companyName }}
        </span>
      </div>

      <div class="flex items-center gap-4">
        <AppLiveIndicator class="hidden md:inline-flex" />

        <!-- Date et heure en temps réel -->
        <div class="hidden md:flex flex-col items-end leading-tight">
          <span class="text-xs font-medium text-gray-700 capitalize">{{ formattedDate }}</span>
          <span class="text-sm font-semibold text-gray-900 tabular-nums">{{ formattedTime }}</span>
        </div>

        <TheCompanySwitcher v-if="auth.user?.role === UserRole.TECHNICIEN" />
        <button
          type="button"
          class="rounded-md p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          :aria-label="isDark ? 'Activer le mode clair' : 'Activer le mode sombre'"
          @click="toggleDark"
        >
          <SunIcon v-if="isDark" class="h-5 w-5" />
          <MoonIcon v-else class="h-5 w-5" />
        </button>
        <TheLanguageSwitcher />
        <TheHeaderNotifications />
        <TheHeaderUserMenu />
      </div>
    </header>

    <!-- Modal mise à jour en masse -->
    <FirmwareCompanyUpdateModal
      v-if="selectedFirmwareForUpdate"
      :firmware-version-id="selectedFirmwareForUpdate.id"
      :firmware-version="selectedFirmwareForUpdate.version"
      :device-kind="selectedFirmwareForUpdate.deviceKind"
      @close="closeFirmwareUpdate"
    />
  </div>
</template>
