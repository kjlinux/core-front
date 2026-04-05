<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useBiometricStore } from '@/stores/biometric.store'
import { useToast } from '@/composables/useToast'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import { TrashIcon, ArrowLeftIcon } from '@heroicons/vue/24/outline'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const store = useBiometricStore()
const toast = useToast()

const deviceId = route.params.id as string

const device = computed(() => store.devices.find((d) => d.id === deviceId) ?? store.currentDevice)
const deviceEnrollments = computed(() => store.enrollments.filter((e) => e.deviceId === deviceId))

function formatDate(date: string) {
  return new Date(date).toLocaleString('fr-FR')
}

async function handleDeleteEnrollment(enrollmentId: string) {
  try {
    await store.deleteEnrollment(enrollmentId)
    toast.showSuccess(t('biometric.enrollmentDeleted'))
  } catch {
    toast.showError(t('biometric.enrollmentDeleteError'))
  }
}

onMounted(async () => {
  await Promise.all([store.fetchDevices(), store.fetchEnrollments()])
  if (!device.value) {
    await store.fetchDevice(deviceId)
  }
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center gap-4">
      <AppButton variant="ghost" @click="router.push('/biometrique/devices')">
        <ArrowLeftIcon class="w-4 h-4 mr-1" />
        {{ t('common.back') }}
      </AppButton>
      <h1 class="text-2xl font-bold text-gray-900">{{ t('biometric.deviceDetail') }}</h1>
    </div>

    <div v-if="store.isLoading && !device" class="flex justify-center py-12">
      <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
    </div>

    <template v-else-if="device">
      <AppCard :title="t('biometric.deviceInfo')">
        <div class="flex items-start justify-between">
          <div class="grid grid-cols-2 gap-6">
            <div>
              <p class="text-xs text-gray-500 uppercase tracking-wide">{{ t('biometric.name') }}</p>
              <p class="mt-1 font-semibold text-gray-900">{{ device.name }}</p>
            </div>
            <div>
              <p class="text-xs text-gray-500 uppercase tracking-wide">{{ t('biometric.serialNumber') }}</p>
              <p class="mt-1 font-mono text-gray-900">{{ device.serialNumber }}</p>
            </div>
            <div>
              <p class="text-xs text-gray-500 uppercase tracking-wide">{{ t('biometric.status') }}</p>
              <AppBadge :variant="device.isOnline ? 'success' : 'danger'" class="mt-1">
                {{ device.isOnline ? t('biometric.online') : t('biometric.offline') }}
              </AppBadge>
            </div>
            <div>
              <p class="text-xs text-gray-500 uppercase tracking-wide">{{ t('biometric.versionFirmware') }}</p>
              <p class="mt-1 text-gray-900">{{ device.firmwareVersion }}</p>
            </div>
            <div>
              <p class="text-xs text-gray-500 uppercase tracking-wide">{{ t('biometric.enrolledEmployees') }}</p>
              <p class="mt-1 text-2xl font-bold text-primary">{{ device.enrolledCount }}</p>
            </div>
            <div>
              <p class="text-xs text-gray-500 uppercase tracking-wide">{{ t('biometric.lastSync') }}</p>
              <p class="mt-1 text-gray-900">{{ formatDate(device.lastSyncAt) }}</p>
            </div>
          </div>
        </div>
      </AppCard>

      <AppCard :title="t('biometric.enrolledEmployees')">
        <div v-if="deviceEnrollments.length === 0" class="text-center py-8 text-gray-500">
          {{ t('biometric.noEnrollment') }}
        </div>
        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{{ t('biometric.employee') }}</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{{ t('biometric.status') }}</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{{ t('biometric.enrollDate') }}</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{{ t('biometric.actions') }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="enrollment in deviceEnrollments" :key="enrollment.id" class="hover:bg-gray-50">
                <td class="px-4 py-3 text-sm font-medium text-gray-900">{{ enrollment.employeeName }}</td>
                <td class="px-4 py-3">
                  <AppBadge
                    :variant="enrollment.status === 'enrolled' ? 'success' : enrollment.status === 'failed' ? 'danger' : 'warning'"
                  >
                    {{ enrollment.status === 'enrolled' ? t('biometric.statusEnrolled') : enrollment.status === 'failed' ? t('biometric.statusFailed') : t('biometric.statusPending') }}
                  </AppBadge>
                </td>
                <td class="px-4 py-3 text-sm text-gray-600">
                  {{ enrollment.enrolledAt ? formatDate(enrollment.enrolledAt) : '-' }}
                </td>
                <td class="px-4 py-3">
                  <AppButton size="sm" variant="ghost" class="text-red-600 hover:text-red-700" @click="handleDeleteEnrollment(enrollment.id)" :title="t('biometric.deleteEnrollment')">
                    <TrashIcon class="w-4 h-4" />
                  </AppButton>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </AppCard>
    </template>

    <div v-else class="text-center py-12 text-gray-500">
      {{ t('biometric.deviceNotFound') }}
    </div>
  </div>
</template>
