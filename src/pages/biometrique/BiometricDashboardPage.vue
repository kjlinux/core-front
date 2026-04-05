<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useBiometricStore } from '@/stores/biometric.store'
import { useToast } from '@/composables/useToast'
import StatCard from '@/components/data-display/StatCard.vue'
import AppCard from '@/components/ui/AppCard.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppSpinner from '@/components/ui/AppSpinner.vue'
import {
  DevicePhoneMobileIcon,
  SignalIcon,
  HandRaisedIcon,
  ClockIcon,
  EyeIcon,
  ArrowPathIcon,
  ArrowRightIcon,
} from '@heroicons/vue/24/outline'

const { t } = useI18n()
const router = useRouter()
const biometricStore = useBiometricStore()
const toast = useToast()

const totalDevices = computed(() => biometricStore.devices.length)
const onlineDevices = computed(() => biometricStore.devices.filter(d => d.isOnline).length)
const totalEnrollments = computed(() => biometricStore.enrollments.length)
const pendingEnrollments = computed(() => biometricStore.enrollments.filter(e => e.status === 'pending').length)

function syncDevice(deviceId: string) {
  toast.success(t('biometric.syncLaunched'), `Le terminal ${deviceId} est en cours de synchronisation.`)
}

function viewDevice(deviceId: string) {
  router.push(`/biometrique/devices/${deviceId}`)
}

onMounted(() => {
  biometricStore.fetchDevices()
  biometricStore.fetchEnrollments()
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-900">{{ t('biometric.dashboardTitle') }}</h1>
    </div>

    <!-- Stat Cards -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        :title="t('biometric.totalDevices')"
        :value="totalDevices"
        :icon="DevicePhoneMobileIcon"
        icon-bg-class="bg-blue-100"
        icon-color-class="text-blue-600"
      />
      <StatCard
        :title="t('biometric.onlineDevices')"
        :value="onlineDevices"
        :icon="SignalIcon"
        icon-bg-class="bg-green-100"
        icon-color-class="text-green-600"
      />
      <StatCard
        :title="t('biometric.totalEnrollments')"
        :value="totalEnrollments"
        :icon="HandRaisedIcon"
        icon-bg-class="bg-purple-100"
        icon-color-class="text-purple-600"
      />
      <StatCard
        :title="t('biometric.pendingEnrollments')"
        :value="pendingEnrollments"
        :icon="ClockIcon"
        icon-bg-class="bg-yellow-100"
        icon-color-class="text-yellow-600"
      />
    </div>

    <!-- Devices Section -->
    <AppCard :title="t('biometric.devicesSection')" :subtitle="t('biometric.devicesSubtitle')">
      <template #actions>
        <AppButton size="sm" variant="secondary" @click="router.push('/biometrique/devices')">
          {{ t('biometric.viewAll') }}
          <ArrowRightIcon class="w-4 h-4 ml-1" />
        </AppButton>
      </template>

      <div v-if="biometricStore.isLoading" class="flex justify-center py-12">
        <AppSpinner />
      </div>

      <div v-else-if="biometricStore.devices.length === 0" class="py-12 text-center text-sm text-gray-500">
        {{ t('biometric.noDevice') }}
      </div>

      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                {{ t('biometric.serialNumber') }}
              </th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                {{ t('biometric.name') }}
              </th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                {{ t('biometric.site') }}
              </th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                {{ t('biometric.status') }}
              </th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                {{ t('biometric.enrolled') }}
              </th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                {{ t('biometric.firmware') }}
              </th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                {{ t('biometric.lastSync') }}
              </th>
              <th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                {{ t('biometric.actions') }}
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 bg-white">
            <tr
              v-for="device in biometricStore.devices"
              :key="device.id"
              class="hover:bg-gray-50 transition-colors"
            >
              <td class="whitespace-nowrap px-4 py-4 text-sm font-mono text-gray-900">
                {{ device.serialNumber }}
              </td>
              <td class="whitespace-nowrap px-4 py-4 text-sm font-medium text-gray-900">
                {{ device.name }}
              </td>
              <td class="whitespace-nowrap px-4 py-4 text-sm text-gray-500">
                {{ device.siteId }}
              </td>
              <td class="whitespace-nowrap px-4 py-4">
                <AppBadge :variant="device.isOnline ? 'success' : 'danger'" size="sm">
                  {{ device.isOnline ? t('biometric.online') : t('biometric.offline') }}
                </AppBadge>
              </td>
              <td class="whitespace-nowrap px-4 py-4 text-sm text-gray-900">
                {{ device.enrolledCount }}
              </td>
              <td class="whitespace-nowrap px-4 py-4 text-sm font-mono text-gray-500">
                {{ device.firmwareVersion }}
              </td>
              <td class="whitespace-nowrap px-4 py-4 text-sm text-gray-500">
                {{ device.lastSyncAt ? new Date(device.lastSyncAt).toLocaleString('fr-FR') : '-' }}
              </td>
              <td class="whitespace-nowrap px-4 py-4 text-right">
                <div class="flex items-center justify-end gap-2">
                  <AppButton size="sm" variant="ghost" @click="viewDevice(device.id)" :title="t('biometric.detail')">
                    <EyeIcon class="w-4 h-4" />
                  </AppButton>
                  <AppButton size="sm" variant="ghost" @click="syncDevice(device.id)" :title="t('biometric.sync')">
                    <ArrowPathIcon class="w-4 h-4" />
                  </AppButton>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </AppCard>
  </div>
</template>
