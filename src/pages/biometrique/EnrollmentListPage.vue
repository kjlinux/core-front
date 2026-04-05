<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useBiometricStore } from '@/stores/biometric.store'
import { useToast } from '@/composables/useToast'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import { ArrowPathIcon, TrashIcon, PlusIcon } from '@heroicons/vue/24/outline'

const { t } = useI18n()
const router = useRouter()
const store = useBiometricStore()
const toast = useToast()

const filterStatus = ref('')
const filterDevice = ref('')

const statusOptions = computed(() => [
  { label: t('biometric.allStatuses'), value: '' },
  { label: t('biometric.statusPending'), value: 'pending' },
  { label: t('biometric.statusEnrolled'), value: 'enrolled' },
  { label: t('biometric.statusFailed'), value: 'failed' },
])

const deviceOptions = computed(() => [
  { label: t('biometric.devicesTitle'), value: '' },
  ...store.devices.map((d) => ({ label: d.name, value: d.id })),
])

const filteredEnrollments = computed(() => {
  let list = store.enrollments
  if (filterStatus.value) {
    list = list.filter((e) => e.status === filterStatus.value)
  }
  if (filterDevice.value) {
    list = list.filter((e) => e.deviceId === filterDevice.value)
  }
  return list
})

function getStatusVariant(status: string) {
  switch (status) {
    case 'enrolled': return 'success'
    case 'failed': return 'danger'
    default: return 'warning'
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case 'enrolled': return t('biometric.statusEnrolled')
    case 'failed': return t('biometric.statusFailed')
    default: return t('biometric.statusPending')
  }
}

function formatDate(date?: string) {
  if (!date) return '-'
  return new Date(date).toLocaleString('fr-FR')
}

function truncateHash(hash: string) {
  return hash.length > 12 ? hash.substring(0, 12) + '...' : hash
}

async function handleDelete(id: string) {
  try {
    await store.deleteEnrollment(id)
    toast.showSuccess(t('biometric.enrollmentDeleted'))
  } catch {
    toast.showError(t('biometric.enrollmentDeleteError'))
  }
}

onMounted(async () => {
  await Promise.all([store.fetchEnrollments(), store.fetchDevices()])
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">{{ t('biometric.enrollmentsTitle') }}</h1>
        <p class="text-sm text-gray-500 mt-1">{{ t('biometric.enrollmentsSubtitle') }}</p>
      </div>
      <AppButton variant="primary" @click="router.push('/biometrique/enrollment/new')">
        <PlusIcon class="w-4 h-4 mr-1" />
        {{ t('biometric.newEnrollment') }}
      </AppButton>
    </div>

    <AppCard>
      <div class="flex flex-col sm:flex-row gap-4 mb-6">
        <AppSelect v-model="filterStatus" :options="statusOptions" class="w-full sm:w-48" />
        <AppSelect v-model="filterDevice" :options="deviceOptions" class="w-full sm:w-64" />
      </div>

      <div v-if="store.isLoading" class="flex justify-center py-12">
        <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>

      <div v-else-if="filteredEnrollments.length === 0" class="text-center py-12 text-gray-500">
        {{ t('biometric.noEnrollmentFound') }}
      </div>

      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{{ t('biometric.employee') }}</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{{ t('biometric.deviceLabel') }}</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{{ t('biometric.status') }}</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{{ t('biometric.enrollDate') }}</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{{ t('biometric.template') }}</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{{ t('biometric.actions') }}</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-100">
            <tr v-for="enrollment in filteredEnrollments" :key="enrollment.id" class="hover:bg-gray-50">
              <td class="px-4 py-3 text-sm font-medium text-gray-900">{{ enrollment.employeeName }}</td>
              <td class="px-4 py-3 text-sm text-gray-600">
                {{ store.devices.find((d) => d.id === enrollment.deviceId)?.name ?? enrollment.deviceId }}
              </td>
              <td class="px-4 py-3">
                <AppBadge :variant="getStatusVariant(enrollment.status)">
                  {{ getStatusLabel(enrollment.status) }}
                </AppBadge>
              </td>
              <td class="px-4 py-3 text-sm text-gray-600">{{ formatDate(enrollment.enrolledAt) }}</td>
              <td class="px-4 py-3 font-mono text-xs text-gray-500">{{ truncateHash(enrollment.templateHash) }}</td>
              <td class="px-4 py-3">
                <div class="flex gap-2">
                  <AppButton
                    v-if="enrollment.status === 'pending' || enrollment.status === 'failed'"
                    size="sm"
                    variant="ghost"
                    @click="router.push({ name: 'bio-enrollment-new', query: { deviceId: enrollment.deviceId, employeeId: enrollment.employeeId } })"
                    :title="enrollment.status === 'pending' ? t('biometric.resume') : t('biometric.restart')"
                  >
                    <ArrowPathIcon class="w-4 h-4" />
                  </AppButton>
                  <AppButton size="sm" variant="ghost" class="text-red-600 hover:text-red-700" @click="handleDelete(enrollment.id)" :title="t('common.delete')">
                    <TrashIcon class="w-4 h-4" />
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
