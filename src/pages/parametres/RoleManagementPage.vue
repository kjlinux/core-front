<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { hasPermission, type Module, type Action } from '@/utils/permissions'
import { usePermissions } from '@/composables/usePermissions'
import AppCard from '@/components/ui/AppCard.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import { CheckIcon, XMarkIcon } from '@heroicons/vue/24/solid'

const { t } = useI18n()
const permissions = usePermissions()

const modules = computed<{ key: Module; label: string }[]>(() => [
  { key: 'dashboard', label: t('parametres.permDashboard') },
  { key: 'pointage-rfid', label: t('parametres.permRfid') },
  { key: 'biometrique', label: t('parametres.permBio') },
  { key: 'feelback', label: t('parametres.permFeelback') },
  { key: 'marketplace', label: t('parametres.permMarketplace') },
  { key: 'settings', label: t('parametres.permSettings') },
])

const actions = computed<{ key: Action; label: string }[]>(() => [
  { key: 'view', label: t('parametres.permView') },
  { key: 'create', label: t('parametres.permCreate') },
  { key: 'edit', label: t('parametres.permEdit') },
  { key: 'delete', label: t('parametres.permDelete') },
  { key: 'export', label: t('parametres.permExport') },
])

const allRoles = computed<{ key: string; label: string; description: string; variant: string }[]>(() => [
  {
    key: 'super_admin',
    label: t('parametres.superAdminRole'),
    description: t('parametres.superAdminDesc'),
    variant: 'danger',
  },
  {
    key: 'admin_enterprise',
    label: t('parametres.adminEnterpriseRole'),
    description: t('parametres.adminEnterpriseDesc'),
    variant: 'warning',
  },
  {
    key: 'manager',
    label: t('roles.manager'),
    description: t('parametres.managerDesc'),
    variant: 'info',
  },
])

const roles = computed(() => {
  if (permissions.isSuperAdmin.value) return allRoles.value
  return allRoles.value.filter((r) => r.key !== 'super_admin')
})

function check(role: string, module: Module, action: Action): boolean {
  return hasPermission(role as any, module, action)
}

const totalPermissions = computed(() => {
  const totals: Record<string, number> = {}
  for (const role of roles.value) {
    let count = 0
    for (const mod of modules.value) {
      for (const act of actions.value) {
        if (check(role.key, mod.key, act.key)) count++
      }
    }
    totals[role.key] = count
  }
  return totals
})
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">{{ t('parametres.rolesTitle') }}</h1>
      <p class="text-sm text-gray-500 mt-1">
        {{ t('parametres.rolesSubtitle') }}
      </p>
    </div>

    <!-- Summary cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <AppCard v-for="role in roles" :key="role.key">
        <div class="flex items-start justify-between mb-3">
          <AppBadge :variant="role.variant as any">{{ role.label }}</AppBadge>
          <span class="text-lg font-bold text-gray-900">{{ totalPermissions[role.key] }}/{{ modules.length * actions.length }}</span>
        </div>
        <p class="text-xs text-gray-500">{{ role.description }}</p>
      </AppCard>
    </div>

    <!-- Permission matrix per role -->
    <div v-for="role in roles" :key="role.key" class="space-y-2">
      <AppCard>
        <template #header>
          <div class="flex items-center gap-3">
            <AppBadge :variant="role.variant as any">{{ role.label }}</AppBadge>
            <span class="text-sm text-gray-500">{{ totalPermissions[role.key] }} {{ t('parametres.activePermissions') }}</span>
          </div>
        </template>

        <div class="overflow-x-auto">
          <table class="min-w-full">
            <thead>
              <tr class="border-b border-gray-200">
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-48">Module</th>
                <th
                  v-for="action in actions"
                  :key="action.key"
                  class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-24"
                >
                  {{ action.label }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="mod in modules"
                :key="mod.key"
                class="border-b border-gray-50 hover:bg-gray-50"
              >
                <td class="px-4 py-3 text-sm font-medium text-gray-800">{{ mod.label }}</td>
                <td
                  v-for="action in actions"
                  :key="action.key"
                  class="px-4 py-3 text-center"
                >
                  <span
                    v-if="check(role.key, mod.key, action.key)"
                    class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-600"
                  >
                    <CheckIcon class="w-4 h-4" />
                  </span>
                  <span
                    v-else
                    class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-gray-400"
                  >
                    <XMarkIcon class="w-4 h-4" />
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </AppCard>
    </div>

  </div>
</template>
