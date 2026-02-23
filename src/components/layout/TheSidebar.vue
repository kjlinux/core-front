<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
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
  ExclamationTriangleIcon,
  BookOpenIcon,
} from '@heroicons/vue/24/outline'

const ui = useUiStore()
const auth = useAuthStore()
const route = useRoute()

const isSuperAdmin = computed(() => auth.user?.role === UserRole.SUPER_ADMIN)
const isAdminOrSuper = computed(
  () => auth.user?.role === UserRole.SUPER_ADMIN || auth.user?.role === UserRole.ADMIN_ENTERPRISE,
)

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
        <span class="text-lg font-bold tracking-wide">CORE TANGA</span>
      </template>
      <template v-else>
        <span class="text-lg font-bold">CT</span>
      </template>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 overflow-y-auto py-4">
      <!-- Dashboard -->
      <TheSidebarItem
        label="Tableau de bord"
        to="/"
        :icon="HomeIcon"
        :collapsed="ui.sidebarCollapsed"
        :active="route.path === '/'"
      />

      <!-- Pointage RFID -->
      <TheSidebarGroup
        label="Pointage RFID"
        :icon="CreditCardIcon"
        :collapsed="ui.sidebarCollapsed"
        :active="route.path.startsWith('/pointage-rfid')"
      >
        <TheSidebarItem
          v-if="isSuperAdmin"
          label="Entreprises"
          to="/pointage-rfid/companies"
          :icon="BuildingOffice2Icon"
          :collapsed="false"
          :active="route.path.startsWith('/pointage-rfid/companies')"
          :nested="true"
        />
        <TheSidebarItem
          label="Sites"
          to="/pointage-rfid/sites"
          :icon="MapPinIcon"
          :collapsed="false"
          :active="route.path.startsWith('/pointage-rfid/sites')"
          :nested="true"
        />
        <TheSidebarItem
          label="Departements"
          to="/pointage-rfid/departments"
          :icon="RectangleGroupIcon"
          :collapsed="false"
          :active="route.path.startsWith('/pointage-rfid/departments')"
          :nested="true"
        />
        <TheSidebarItem
          label="Employes"
          to="/pointage-rfid/employees"
          :icon="UsersIcon"
          :collapsed="false"
          :active="route.path.startsWith('/pointage-rfid/employees')"
          :nested="true"
        />
        <TheSidebarItem
          label="Cartes RFID"
          to="/pointage-rfid/cards"
          :icon="CreditCardIcon"
          :collapsed="false"
          :active="route.path.startsWith('/pointage-rfid/cards')"
          :nested="true"
        />
        <TheSidebarItem
          label="Horaires"
          to="/pointage-rfid/schedules"
          :icon="ClockIcon"
          :collapsed="false"
          :active="route.path.startsWith('/pointage-rfid/schedules') || route.path.startsWith('/pointage-rfid/holidays')"
          :nested="true"
        />
        <TheSidebarItem
          label="Pointage"
          to="/pointage-rfid/attendance"
          :icon="CalendarDaysIcon"
          :collapsed="false"
          :active="route.path.startsWith('/pointage-rfid/attendance')"
          :nested="true"
        />
        <TheSidebarItem
          label="Rapports"
          to="/pointage-rfid/reports"
          :icon="DocumentChartBarIcon"
          :collapsed="false"
          :active="route.path.startsWith('/pointage-rfid/reports')"
          :nested="true"
        />
      </TheSidebarGroup>

      <!-- Biometrique -->
      <TheSidebarGroup
        label="Biometrique"
        :icon="FingerPrintIcon"
        :collapsed="ui.sidebarCollapsed"
        :active="route.path.startsWith('/biometrique')"
      >
        <TheSidebarItem
          label="Tableau de bord"
          to="/biometrique"
          :icon="ChartBarIcon"
          :collapsed="false"
          :active="route.path === '/biometrique'"
          :nested="true"
        />
        <TheSidebarItem
          label="Terminaux"
          to="/biometrique/devices"
          :icon="DevicePhoneMobileIcon"
          :collapsed="false"
          :active="route.path.startsWith('/biometrique/devices')"
          :nested="true"
        />
        <TheSidebarItem
          label="Inscriptions"
          to="/biometrique/enrollment"
          :icon="HandRaisedIcon"
          :collapsed="false"
          :active="route.path.startsWith('/biometrique/enrollment')"
          :nested="true"
        />
        <TheSidebarItem
          label="Incoherences"
          to="/biometrique/inconsistencies"
          :icon="ExclamationTriangleIcon"
          :collapsed="false"
          :active="route.path === '/biometrique/inconsistencies'"
          :nested="true"
        />
        <TheSidebarItem
          label="Journal d'audit"
          to="/biometrique/audit-log"
          :icon="BookOpenIcon"
          :collapsed="false"
          :active="route.path === '/biometrique/audit-log'"
          :nested="true"
        />
      </TheSidebarGroup>

      <!-- Feelback -->
      <TheSidebarGroup
        label="Feelback"
        :icon="FaceSmileIcon"
        :collapsed="ui.sidebarCollapsed"
        :active="route.path.startsWith('/feelback')"
      >
        <TheSidebarItem
          label="Tableau de bord"
          to="/feelback"
          :icon="ChartBarIcon"
          :collapsed="false"
          :active="route.path === '/feelback'"
          :nested="true"
        />
        <TheSidebarItem
          label="Analyse"
          to="/feelback/analytics"
          :icon="DocumentChartBarIcon"
          :collapsed="false"
          :active="route.path.startsWith('/feelback/analytics')"
          :nested="true"
        />
        <TheSidebarItem
          label="Donnees brutes"
          to="/feelback/data"
          :icon="ClipboardDocumentListIcon"
          :collapsed="false"
          :active="route.path.startsWith('/feelback/data')"
          :nested="true"
        />
        <TheSidebarItem
          label="Terminaux"
          to="/feelback/devices"
          :icon="DevicePhoneMobileIcon"
          :collapsed="false"
          :active="route.path.startsWith('/feelback/devices')"
          :nested="true"
        />
        <TheSidebarItem
          label="Alertes"
          to="/feelback/alerts"
          :icon="BellAlertIcon"
          :collapsed="false"
          :active="route.path.startsWith('/feelback/alerts')"
          :nested="true"
        />
        <TheSidebarItem
          label="Comparaison sites"
          to="/feelback/comparison"
          :icon="ChartBarIcon"
          :collapsed="false"
          :active="route.path.startsWith('/feelback/comparison')"
          :nested="true"
        />
        <TheSidebarItem
          label="Rapports"
          to="/feelback/reports"
          :icon="DocumentChartBarIcon"
          :collapsed="false"
          :active="route.path.startsWith('/feelback/reports')"
          :nested="true"
        />
      </TheSidebarGroup>

      <!-- Marketplace -->
      <TheSidebarGroup
        label="Marketplace"
        :icon="ShoppingCartIcon"
        :collapsed="ui.sidebarCollapsed"
        :active="route.path.startsWith('/marketplace')"
      >
        <TheSidebarItem
          label="Catalogue"
          to="/marketplace"
          :icon="TagIcon"
          :collapsed="false"
          :active="route.path === '/marketplace' || route.path.startsWith('/marketplace/products')"
          :nested="true"
        />
        <TheSidebarItem
          label="Mon panier"
          to="/marketplace/cart"
          :icon="ShoppingCartIcon"
          :collapsed="false"
          :active="route.path === '/marketplace/cart'"
          :nested="true"
        />
        <TheSidebarItem
          label="Mes commandes"
          to="/marketplace/orders"
          :icon="ClipboardDocumentListIcon"
          :collapsed="false"
          :active="route.path.startsWith('/marketplace/orders')"
          :nested="true"
        />
        <TheSidebarItem
          v-if="isSuperAdmin"
          label="Gestion produits"
          to="/marketplace/admin/products"
          :icon="CubeIcon"
          :collapsed="false"
          :active="route.path.startsWith('/marketplace/admin/products')"
          :nested="true"
        />
        <TheSidebarItem
          v-if="isSuperAdmin"
          label="Toutes commandes"
          to="/marketplace/admin/orders"
          :icon="WrenchScrewdriverIcon"
          :collapsed="false"
          :active="route.path.startsWith('/marketplace/admin/orders')"
          :nested="true"
        />
        <TheSidebarItem
          v-if="isSuperAdmin"
          label="Stocks"
          to="/marketplace/admin/inventory"
          :icon="ServerStackIcon"
          :collapsed="false"
          :active="route.path.startsWith('/marketplace/admin/inventory')"
          :nested="true"
        />
        <TheSidebarItem
          v-if="isSuperAdmin"
          label="Rapports ventes"
          to="/marketplace/admin/reports"
          :icon="DocumentChartBarIcon"
          :collapsed="false"
          :active="route.path.startsWith('/marketplace/admin/reports')"
          :nested="true"
        />
      </TheSidebarGroup>

      <!-- Parametres -->
      <TheSidebarGroup
        label="Parametres"
        :icon="Cog6ToothIcon"
        :collapsed="ui.sidebarCollapsed"
        :active="route.path.startsWith('/parametres')"
      >
        <TheSidebarItem
          label="Mon profil"
          to="/parametres/profile"
          :icon="UserIcon"
          :collapsed="false"
          :active="route.path === '/parametres/profile'"
          :nested="true"
        />
        <TheSidebarItem
          v-if="isAdminOrSuper"
          label="Entreprise"
          to="/parametres/entreprise"
          :icon="BuildingOffice2Icon"
          :collapsed="false"
          :active="route.path === '/parametres/entreprise'"
          :nested="true"
        />
        <TheSidebarItem
          v-if="isAdminOrSuper"
          label="Utilisateurs"
          to="/parametres/utilisateurs"
          :icon="UsersIcon"
          :collapsed="false"
          :active="route.path === '/parametres/utilisateurs'"
          :nested="true"
        />
        <TheSidebarItem
          v-if="isSuperAdmin"
          label="Roles"
          to="/parametres/roles"
          :icon="ShieldCheckIcon"
          :collapsed="false"
          :active="route.path === '/parametres/roles'"
          :nested="true"
        />
      </TheSidebarGroup>
    </nav>
  </aside>
</template>
