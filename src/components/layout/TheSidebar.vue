<script setup lang="ts">
import { computed, provide, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useUiStore } from '@/stores/ui.store'
import { useAuthStore } from '@/stores/auth.store'
import { UserRole } from '@/types/enums'
import TheSidebarGroup from './TheSidebarGroup.vue'
import TheSidebarItem from './TheSidebarItem.vue'
import {
  HomeIcon,
  CreditCardIcon,
  FingerPrintIcon,
  FaceSmileIcon,
  ShoppingCartIcon,
  Cog6ToothIcon,
  BuildingOffice2Icon,
  MapPinIcon,
  RectangleGroupIcon,
  UsersIcon,
  ClockIcon,
  CalendarDaysIcon,
  DocumentChartBarIcon,
  DevicePhoneMobileIcon,
  HandRaisedIcon,
  ChartBarIcon,
  BellAlertIcon,
  TagIcon,
  ClipboardDocumentListIcon,
  WrenchScrewdriverIcon,
  CubeIcon,
  UserIcon,
  ShieldCheckIcon,
  ServerStackIcon,
  QrCodeIcon,
  CpuChipIcon,
  QuestionMarkCircleIcon,
  BanknotesIcon,
  Cog8ToothIcon,
  UserCircleIcon,
} from '@heroicons/vue/24/outline'

const { t } = useI18n()
const ui = useUiStore()
const auth = useAuthStore()
const route = useRoute()

const isSuperAdmin = computed(() => auth.user?.role === UserRole.SUPER_ADMIN)
const isTechnicien = computed(() => auth.user?.role === UserRole.TECHNICIEN)
const isEmploye = computed(() => auth.user?.role === UserRole.EMPLOYE)
const isAdminOrSuper = computed(
  () => auth.user?.role === UserRole.SUPER_ADMIN || auth.user?.role === UserRole.ADMIN_ENTERPRISE,
)
const isSetupRole = computed(
  () => auth.user?.role === UserRole.SUPER_ADMIN || auth.user?.role === UserRole.TECHNICIEN,
)
const isAdminOrSuperOrTech = computed(
  () =>
    auth.user?.role === UserRole.SUPER_ADMIN ||
    auth.user?.role === UserRole.ADMIN_ENTERPRISE ||
    auth.user?.role === UserRole.TECHNICIEN,
)
const isClientRole = computed(
  () =>
    auth.user?.role === UserRole.SUPER_ADMIN ||
    auth.user?.role === UserRole.ADMIN_ENTERPRISE ||
    auth.user?.role === UserRole.MANAGER ||
    auth.user?.role === UserRole.TECHNICIEN,
)

function getActiveGroupId(): string | null {
  const path = route.path
  if (path.startsWith('/pointage-rfid')) return 'pointage-rfid'
  if (path.startsWith('/pointage-qrcode')) return 'pointage-qrcode'
  if (path.startsWith('/biometrique')) return 'biometrique'
  if (path.startsWith('/firmware')) return 'firmware'
  if (path.startsWith('/feelback')) return 'feelback'
  if (path.startsWith('/marketplace')) return 'marketplace'
  if (path.startsWith('/paie')) return 'paie'
  if (path.startsWith('/parametres')) return 'parametres'
  return null
}

const openGroupId = ref<string | null>(getActiveGroupId())
provide('sidebarOpenGroupId', openGroupId)

const sidebarClasses = computed(() => [
  'fixed inset-y-0 left-0 z-50 flex flex-col bg-sidebar text-white transition-all duration-300 lg:relative',
  ui.sidebarCollapsed ? 'w-20' : 'w-64',
  ui.sidebarMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
])
</script>

<template>
  <aside :class="sidebarClasses">
    <!-- Logo -->
    <div class="flex h-16 items-center justify-center border-b border-white/10 px-4">
      <template v-if="!ui.sidebarCollapsed">
        <span class="text-lg font-bold tracking-wide">TANGAFLOW</span>
      </template>
      <template v-else>
        <span class="text-lg font-bold">TF</span>
      </template>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 overflow-y-auto py-4">
      <!-- Dashboard -->
      <TheSidebarItem
        v-if="!isEmploye"
        :label="t('nav.dashboard')"
        to="/"
        :icon="HomeIcon"
        :collapsed="ui.sidebarCollapsed"
        :active="route.path === '/'"
      />

      <!-- Pointage RFID -->
      <TheSidebarGroup
        v-if="!isEmploye"
        group-id="pointage-rfid"
        :label="t('nav.pointageRfid')"
        :icon="CreditCardIcon"
        :collapsed="ui.sidebarCollapsed"
        :active="route.path.startsWith('/pointage-rfid')"
      >
        <TheSidebarItem
          v-if="isSetupRole"
          :label="t('nav.companies')"
          to="/pointage-rfid/companies"
          :icon="BuildingOffice2Icon"
          :collapsed="false"
          :active="route.path.startsWith('/pointage-rfid/companies')"
          :nested="true"
        />
        <TheSidebarItem
          :label="t('nav.sites')"
          to="/pointage-rfid/sites"
          :icon="MapPinIcon"
          :collapsed="false"
          :active="route.path.startsWith('/pointage-rfid/sites')"
          :nested="true"
        />
        <TheSidebarItem
          :label="t('nav.departments')"
          to="/pointage-rfid/departments"
          :icon="RectangleGroupIcon"
          :collapsed="false"
          :active="route.path.startsWith('/pointage-rfid/departments')"
          :nested="true"
        />
        <TheSidebarItem
          :label="t('nav.employees')"
          to="/pointage-rfid/employees"
          :icon="UsersIcon"
          :collapsed="false"
          :active="route.path.startsWith('/pointage-rfid/employees')"
          :nested="true"
        />
        <TheSidebarItem
          v-if="isAdminOrSuperOrTech"
          :label="t('nav.rfidDevices')"
          to="/pointage-rfid/devices"
          :icon="DevicePhoneMobileIcon"
          :collapsed="false"
          :active="route.path.startsWith('/pointage-rfid/devices')"
          :nested="true"
        />
        <TheSidebarItem
          :label="t('nav.rfidCards')"
          to="/pointage-rfid/cards"
          :icon="CreditCardIcon"
          :collapsed="false"
          :active="route.path.startsWith('/pointage-rfid/cards')"
          :nested="true"
        />
        <TheSidebarItem
          :label="t('nav.schedules')"
          to="/pointage-rfid/schedules"
          :icon="ClockIcon"
          :collapsed="false"
          :active="
            route.path.startsWith('/pointage-rfid/schedules') ||
            route.path.startsWith('/pointage-rfid/holidays')
          "
          :nested="true"
        />
        <TheSidebarItem
          :label="t('nav.attendance')"
          to="/pointage-rfid/attendance"
          :icon="CalendarDaysIcon"
          :collapsed="false"
          :active="route.path.startsWith('/pointage-rfid/attendance')"
          :nested="true"
        />
        <TheSidebarItem
          :label="t('nav.reports')"
          to="/pointage-rfid/reports"
          :icon="DocumentChartBarIcon"
          :collapsed="false"
          :active="route.path.startsWith('/pointage-rfid/reports')"
          :nested="true"
        />
      </TheSidebarGroup>

      <!-- Pointage QR Code -->
      <TheSidebarGroup
        v-if="!isEmploye"
        group-id="pointage-qrcode"
        :label="t('nav.pointageQrcode')"
        :icon="QrCodeIcon"
        :collapsed="ui.sidebarCollapsed"
        :active="route.path.startsWith('/pointage-qrcode')"
      >
        <TheSidebarItem
          :label="t('nav.dashboard')"
          to="/pointage-qrcode"
          :icon="ChartBarIcon"
          :collapsed="false"
          :active="route.path === '/pointage-qrcode'"
          :nested="true"
        />
        <TheSidebarItem
          :label="t('nav.qrCodes')"
          to="/pointage-qrcode/list"
          :icon="QrCodeIcon"
          :collapsed="false"
          :active="route.path.startsWith('/pointage-qrcode/list')"
          :nested="true"
        />
        <TheSidebarItem
          v-if="isAdminOrSuperOrTech"
          :label="t('nav.generate')"
          to="/pointage-qrcode/generate"
          :icon="CreditCardIcon"
          :collapsed="false"
          :active="route.path.startsWith('/pointage-qrcode/generate')"
          :nested="true"
        />
        <TheSidebarItem
          v-if="isAdminOrSuperOrTech"
          label="Enrolement telephones"
          to="/pointage-qrcode/enroll"
          :icon="DevicePhoneMobileIcon"
          :collapsed="false"
          :active="route.path.startsWith('/pointage-qrcode/enroll')"
          :nested="true"
        />
        <TheSidebarItem
          :label="t('nav.attendance')"
          to="/pointage-qrcode/attendance"
          :icon="CalendarDaysIcon"
          :collapsed="false"
          :active="route.path.startsWith('/pointage-qrcode/attendance')"
          :nested="true"
        />
        <TheSidebarItem
          :label="t('nav.reports')"
          to="/pointage-qrcode/reports"
          :icon="DocumentChartBarIcon"
          :collapsed="false"
          :active="route.path.startsWith('/pointage-qrcode/reports')"
          :nested="true"
        />
      </TheSidebarGroup>

      <!-- Biometrique -->
      <TheSidebarGroup
        v-if="!isEmploye"
        group-id="biometrique"
        :label="t('nav.biometrique')"
        :icon="FingerPrintIcon"
        :collapsed="ui.sidebarCollapsed"
        :active="route.path.startsWith('/biometrique')"
      >
        <TheSidebarItem
          :label="t('nav.dashboard')"
          to="/biometrique"
          :icon="ChartBarIcon"
          :collapsed="false"
          :active="route.path === '/biometrique'"
          :nested="true"
        />
        <TheSidebarItem
          v-if="isAdminOrSuperOrTech"
          :label="t('nav.biometricDevices')"
          to="/biometrique/devices"
          :icon="DevicePhoneMobileIcon"
          :collapsed="false"
          :active="route.path.startsWith('/biometrique/devices')"
          :nested="true"
        />
        <TheSidebarItem
          v-if="isAdminOrSuperOrTech"
          :label="t('nav.enrollments')"
          to="/biometrique/enrollment"
          :icon="HandRaisedIcon"
          :collapsed="false"
          :active="route.path.startsWith('/biometrique/enrollment')"
          :nested="true"
        />
        <TheSidebarItem
          :label="t('nav.attendance')"
          to="/biometrique/attendance"
          :icon="ClockIcon"
          :collapsed="false"
          :active="route.path === '/biometrique/attendance'"
          :nested="true"
        />
      </TheSidebarGroup>

      <!-- Firmware OTA -->
      <TheSidebarGroup
        v-if="isAdminOrSuperOrTech"
        group-id="firmware"
        :label="t('nav.firmware')"
        :icon="CpuChipIcon"
        :collapsed="ui.sidebarCollapsed"
        :active="route.path.startsWith('/firmware')"
      >
        <TheSidebarItem
          :label="t('nav.firmwareVersions')"
          to="/firmware"
          :icon="ServerStackIcon"
          :collapsed="false"
          :active="route.path === '/firmware'"
          :nested="true"
        />
        <TheSidebarItem
          v-if="isSetupRole"
          :label="t('nav.firmwareUpload')"
          to="/firmware/upload"
          :icon="CubeIcon"
          :collapsed="false"
          :active="route.path.startsWith('/firmware/upload')"
          :nested="true"
        />
        <TheSidebarItem
          :label="t('nav.firmwareDevices')"
          to="/firmware/devices"
          :icon="DevicePhoneMobileIcon"
          :collapsed="false"
          :active="route.path.startsWith('/firmware/devices')"
          :nested="true"
        />
        <TheSidebarItem
          :label="t('nav.firmwareLogs')"
          to="/firmware/logs"
          :icon="ClipboardDocumentListIcon"
          :collapsed="false"
          :active="route.path.startsWith('/firmware/logs')"
          :nested="true"
        />
      </TheSidebarGroup>

      <!-- Feelback -->
      <TheSidebarGroup
        v-if="isClientRole && !isTechnicien && !isEmploye"
        group-id="feelback"
        :label="t('nav.feelback')"
        :icon="FaceSmileIcon"
        :collapsed="ui.sidebarCollapsed"
        :active="route.path.startsWith('/feelback')"
      >
        <TheSidebarItem
          :label="t('nav.dashboard')"
          to="/feelback"
          :icon="ChartBarIcon"
          :collapsed="false"
          :active="route.path === '/feelback'"
          :nested="true"
        />
        <TheSidebarItem
          :label="t('nav.feelbackAnalytics')"
          to="/feelback/analytics"
          :icon="DocumentChartBarIcon"
          :collapsed="false"
          :active="route.path.startsWith('/feelback/analytics')"
          :nested="true"
        />
        <TheSidebarItem
          :label="t('nav.feelbackData')"
          to="/feelback/data"
          :icon="ClipboardDocumentListIcon"
          :collapsed="false"
          :active="route.path.startsWith('/feelback/data')"
          :nested="true"
        />
        <TheSidebarItem
          v-if="isAdminOrSuper"
          :label="t('nav.biometricDevices')"
          to="/feelback/devices"
          :icon="DevicePhoneMobileIcon"
          :collapsed="false"
          :active="route.path.startsWith('/feelback/devices')"
          :nested="true"
        />
        <TheSidebarItem
          v-if="isAdminOrSuper"
          :label="t('nav.feelbackAlerts')"
          to="/feelback/alerts"
          :icon="BellAlertIcon"
          :collapsed="false"
          :active="route.path.startsWith('/feelback/alerts')"
          :nested="true"
        />
        <TheSidebarItem
          :label="t('nav.feelbackComparison')"
          to="/feelback/comparison"
          :icon="ChartBarIcon"
          :collapsed="false"
          :active="route.path.startsWith('/feelback/comparison')"
          :nested="true"
        />
        <TheSidebarItem
          :label="t('nav.reports')"
          to="/feelback/reports"
          :icon="DocumentChartBarIcon"
          :collapsed="false"
          :active="route.path.startsWith('/feelback/reports')"
          :nested="true"
        />
        <TheSidebarItem
          :label="t('nav.feelbackQrAvis')"
          to="/feelback/qr-avis"
          :icon="QrCodeIcon"
          :collapsed="false"
          :active="route.path.startsWith('/feelback/qr-avis')"
          :nested="true"
        />
      </TheSidebarGroup>

      <!-- Marketplace (masque pour technicien) -->
      <TheSidebarGroup
        v-if="isClientRole && !isTechnicien && !isEmploye"
        group-id="marketplace"
        :label="t('nav.marketplace')"
        :icon="ShoppingCartIcon"
        :collapsed="ui.sidebarCollapsed"
        :active="route.path.startsWith('/marketplace')"
      >
        <TheSidebarItem
          :label="t('nav.catalog')"
          to="/marketplace"
          :icon="TagIcon"
          :collapsed="false"
          :active="route.path === '/marketplace' || route.path.startsWith('/marketplace/products')"
          :nested="true"
        />
        <TheSidebarItem
          :label="t('nav.cart')"
          to="/marketplace/cart"
          :icon="ShoppingCartIcon"
          :collapsed="false"
          :active="route.path === '/marketplace/cart'"
          :nested="true"
        />
        <TheSidebarItem
          :label="t('nav.orders')"
          to="/marketplace/orders"
          :icon="ClipboardDocumentListIcon"
          :collapsed="false"
          :active="route.path.startsWith('/marketplace/orders')"
          :nested="true"
        />
        <TheSidebarItem
          v-if="isSuperAdmin"
          :label="t('nav.adminProducts')"
          to="/marketplace/admin/products"
          :icon="CubeIcon"
          :collapsed="false"
          :active="route.path.startsWith('/marketplace/admin/products')"
          :nested="true"
        />
        <TheSidebarItem
          v-if="isSuperAdmin"
          :label="t('nav.adminOrders')"
          to="/marketplace/admin/orders"
          :icon="WrenchScrewdriverIcon"
          :collapsed="false"
          :active="route.path.startsWith('/marketplace/admin/orders')"
          :nested="true"
        />
        <TheSidebarItem
          v-if="isSuperAdmin"
          :label="t('nav.inventory')"
          to="/marketplace/admin/inventory"
          :icon="ServerStackIcon"
          :collapsed="false"
          :active="route.path.startsWith('/marketplace/admin/inventory')"
          :nested="true"
        />
        <TheSidebarItem
          v-if="isSuperAdmin"
          :label="t('nav.salesReports')"
          to="/marketplace/admin/reports"
          :icon="DocumentChartBarIcon"
          :collapsed="false"
          :active="route.path.startsWith('/marketplace/admin/reports')"
          :nested="true"
        />
      </TheSidebarGroup>

      <!-- Paie -->
      <TheSidebarGroup
        v-if="isAdminOrSuper && !isEmploye"
        group-id="paie"
        label="Paie"
        :icon="BanknotesIcon"
        :collapsed="ui.sidebarCollapsed"
        :active="route.path.startsWith('/paie')"
      >
        <TheSidebarItem
          label="Configuration"
          to="/paie/configuration"
          :icon="Cog8ToothIcon"
          :collapsed="false"
          :active="route.path === '/paie/configuration'"
          :nested="true"
        />
        <TheSidebarItem
          label="Fiches de paie"
          to="/paie/generer"
          :icon="DocumentChartBarIcon"
          :collapsed="false"
          :active="route.path === '/paie/generer'"
          :nested="true"
        />
      </TheSidebarGroup>

      <!-- Mon espace (portail employe) -->
      <TheSidebarItem
        label="Mon espace"
        to="/mon-espace"
        :icon="UserCircleIcon"
        :collapsed="ui.sidebarCollapsed"
        :active="route.path.startsWith('/mon-espace')"
      />

      <!-- Parametres -->
      <TheSidebarGroup
        group-id="parametres"
        :label="t('nav.parametres')"
        :icon="Cog6ToothIcon"
        :collapsed="ui.sidebarCollapsed"
        :active="route.path.startsWith('/parametres')"
      >
        <TheSidebarItem
          :label="t('nav.profile')"
          to="/parametres/profile"
          :icon="UserIcon"
          :collapsed="false"
          :active="route.path === '/parametres/profile'"
          :nested="true"
        />
        <TheSidebarItem
          v-if="isAdminOrSuper && !isEmploye"
          :label="t('nav.company')"
          to="/parametres/entreprise"
          :icon="BuildingOffice2Icon"
          :collapsed="false"
          :active="route.path === '/parametres/entreprise'"
          :nested="true"
        />
        <TheSidebarItem
          v-if="(isAdminOrSuper || isTechnicien) && !isEmploye"
          :label="t('nav.users')"
          to="/parametres/utilisateurs"
          :icon="UsersIcon"
          :collapsed="false"
          :active="route.path === '/parametres/utilisateurs'"
          :nested="true"
        />
        <TheSidebarItem
          v-if="isAdminOrSuper && !isEmploye"
          :label="t('nav.roles')"
          to="/parametres/roles"
          :icon="ShieldCheckIcon"
          :collapsed="false"
          :active="route.path === '/parametres/roles'"
          :nested="true"
        />
        <TheSidebarItem
          v-if="isSetupRole && !isEmploye"
          label="Rapport technicien"
          to="/parametres/rapport-technicien"
          :icon="ClipboardDocumentListIcon"
          :collapsed="false"
          :active="route.path === '/parametres/rapport-technicien'"
          :nested="true"
        />
        <TheSidebarItem
          v-if="isSuperAdmin && !isEmploye"
          label="Activites techniciens"
          to="/parametres/activites-techniciens"
          :icon="DocumentChartBarIcon"
          :collapsed="false"
          :active="route.path === '/parametres/activites-techniciens'"
          :nested="true"
        />
        <TheSidebarItem
          v-if="!isEmploye"
          label="Centre d'aide"
          to="/parametres/aide"
          :icon="QuestionMarkCircleIcon"
          :collapsed="false"
          :active="route.path === '/parametres/aide'"
          :nested="true"
        />
      </TheSidebarGroup>
    </nav>
  </aside>
</template>
