<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useFirmwareStore } from '@/stores/firmware.store'
import { usePermissions } from '@/composables/usePermissions'
import { useToast } from '@/composables/useToast'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppToggle from '@/components/ui/AppToggle.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppConfirmDialog from '@/components/ui/AppConfirmDialog.vue'
import DataTable from '@/components/data-display/DataTable.vue'
import { PlusIcon, TrashIcon, BellAlertIcon } from '@heroicons/vue/24/outline'
import { sortByRecent } from '@/utils/sort'

const { t } = useI18n()
const store = useFirmwareStore()
const router = useRouter()
const permissions = usePermissions()
const toast = useToast()

const deviceKindFilter = ref('')
const deviceKindOptions = computed(() => [
  { value: '', label: t('firmware.allTypes') },
  { value: 'rfid', label: t('firmware.deviceKinds.rfid') },
  { value: 'biometric', label: t('firmware.deviceKinds.biometric') },
])
const confirmDeleteId = ref<string | null>(null)
const confirmPublishId = ref<string | null>(null)
const publishingId = ref<string | null>(null)

const columns = computed(() => [
  { key: 'version', label: t('firmware.version') },
  { key: 'deviceKind', label: t('firmware.deviceKind') },
  { key: 'description', label: t('firmware.description') },
  { key: 'fileSize', label: t('firmware.fileSize') },
  { key: 'isAutoUpdate', label: t('firmware.auto') },
  { key: 'isPublished', label: t('firmware.published') },
  { key: 'uploadedAt', label: t('firmware.uploadedAt') },
  { key: 'actions', label: t('common.actions') },
])

const currentPage = ref(1)
const perPage = ref(15)

const filteredVersions = computed(() => {
  if (!deviceKindFilter.value) return store.versions
  return store.versions.filter((v) => v.deviceKind === deviceKindFilter.value)
})

const pagedVersions = computed(() => {
  const start = (currentPage.value - 1) * perPage.value
  return sortByRecent(filteredVersions.value).slice(start, start + perPage.value)
})

const paginationObj = computed(() => {
  const total = filteredVersions.value.length
  return { currentPage: currentPage.value, totalPages: Math.ceil(total / perPage.value) || 1, perPage: perPage.value, total }
})

const handlePageChange = (page: number) => { currentPage.value = page }

watch(deviceKindFilter, () => { currentPage.value = 1 })

onMounted(() => loadData())

async function loadData() {
  await store.fetchVersions(deviceKindFilter.value ? { deviceKind: deviceKindFilter.value, perPage: 1000 } : { perPage: 1000 })
}

function formatSize(bytes?: number) {
  if (!bytes) return '-'
  return (bytes / 1024).toFixed(1) + ' KB'
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR')
}

async function toggleAutoUpdate(id: string, current: boolean) {
  try {
    await store.setAutoUpdate(id, !current)
    toast.success(t('firmware.autoUpdateChanged'))
  } catch {
    toast.error(t('common.error'))
  }
}

async function handlePublish(id: string) {
  publishingId.value = id
  try {
    await store.publishVersion(id)
    toast.success(t('firmware.publishedSuccess'))
  } catch {
    toast.error(t('firmware.publishError'))
  } finally {
    publishingId.value = null
    confirmPublishId.value = null
  }
}

async function handleDelete(id: string) {
  try {
    await store.deleteVersion(id)
    toast.success(t('firmware.deletedSuccess'))
    confirmDeleteId.value = null
  } catch {
    toast.error(t('firmware.deleteError'))
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-900">{{ t('firmware.versions') }}</h1>
      <AppButton
        v-if="permissions.isSetupRole.value"
        variant="primary"
        @click="router.push({ name: 'firmware-upload' })"
      >
        <PlusIcon class="mr-1 h-4 w-4" />
        {{ t('firmware.upload') }}
      </AppButton>
    </div>

    <AppCard>
      <div class="mb-4 flex items-center gap-4">
        <div class="w-64">
          <AppSelect
            v-model="deviceKindFilter"
            :options="deviceKindOptions"
            @update:model-value="loadData"
          />
        </div>
      </div>

      <DataTable :columns="columns" :data="pagedVersions" :loading="store.isLoading" :pagination="paginationObj" @page-change="handlePageChange">
        <template #deviceKind="{ row }">
          <AppBadge variant="info">{{ row.deviceKind === 'rfid' ? t('firmware.deviceKinds.rfid') : t('firmware.deviceKinds.biometric') }}</AppBadge>
        </template>
        <template #fileSize="{ row }">{{ formatSize(row.fileSize) }}</template>
        <template #isAutoUpdate="{ row }">
          <AppToggle
            :modelValue="row.isAutoUpdate"
            :disabled="!permissions.isSetupRole.value"
            @update:modelValue="toggleAutoUpdate(row.id, row.isAutoUpdate)"
          />
        </template>
        <template #isPublished="{ row }">
          <AppBadge :variant="row.isPublished ? 'success' : 'neutral'">
            {{ row.isPublished ? t('firmware.published') : t('firmware.notPublished') }}
          </AppBadge>
        </template>
        <template #uploadedAt="{ row }">{{ formatDate(row.uploadedAt) }}</template>
        <template #actions="{ row }">
          <div class="flex items-center gap-2" @click.stop>
            <!-- Bouton Notifier les admins (super_admin uniquement, desactive si deja publie) -->
            <AppButton
              v-if="permissions.isSuperAdmin.value"
              size="sm"
              variant="outline"
              :disabled="row.isPublished || publishingId === row.id"
              :loading="publishingId === row.id"
              :title="t('firmware.published')"
              @click="confirmPublishId = row.id"
            >
              <BellAlertIcon class="h-4 w-4" />
            </AppButton>
            <AppButton
              v-if="permissions.isSuperAdmin.value"
              size="sm"
              variant="ghost"
              class="text-red-600 hover:text-red-700"
              :title="t('common.delete')"
              @click="confirmDeleteId = row.id"
            >
              <TrashIcon class="h-4 w-4" />
            </AppButton>
          </div>
        </template>
      </DataTable>
    </AppCard>

    <AppConfirmDialog
      :open="!!confirmPublishId"
      :title="t('firmware.published')"
      :message="t('firmware.notifyConfirm')"
      variant="info"
      :confirm-label="t('common.confirm')"
      :cancel-label="t('common.cancel')"
      @confirm="confirmPublishId && handlePublish(confirmPublishId)"
      @cancel="confirmPublishId = null"
    />

    <div
      v-if="confirmDeleteId"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      @click.self="confirmDeleteId = null"
    >
      <div class="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h3 class="mb-2 text-lg font-semibold text-gray-900">{{ t('firmware.deleteTitle') }}</h3>
        <p class="mb-6 text-sm text-gray-600">{{ t('firmware.deleteIrreversible') }}</p>
        <div class="flex justify-end gap-3">
          <AppButton variant="ghost" @click="confirmDeleteId = null">{{ t('common.cancel') }}</AppButton>
          <AppButton variant="danger" @click="handleDelete(confirmDeleteId!)">{{ t('common.delete') }}</AppButton>
        </div>
      </div>
    </div>
  </div>
</template>
