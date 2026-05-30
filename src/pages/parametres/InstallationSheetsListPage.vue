<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  installationApi,
  INSTALLATION_SOLUTION_LABELS,
  type InstallationSheet,
} from '@/services/api/installation.api'
import { useToast } from '@/composables/useToast'
import { extractApiErrorMessage } from '@/utils/api-error'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppPagination from '@/components/ui/AppPagination.vue'
import AppSpinner from '@/components/ui/AppSpinner.vue'

const router = useRouter()
const toast = useToast()

const items = ref<InstallationSheet[]>([])
const loading = ref(true)
const currentPage = ref(1)
const totalPages = ref(1)
const perPage = ref(20)

function materialsSummary(sheet: InstallationSheet): string {
  const list = sheet.materials ?? []
  if (!list.length) return '-'
  const labels = list.map((m) => INSTALLATION_SOLUTION_LABELS[m.solution] ?? m.solution)
  return labels.join(', ')
}

function serialsSummary(sheet: InstallationSheet): string {
  const list = sheet.materials ?? []
  if (!list.length) return '-'
  return list.map((m) => m.serial_number).join(', ')
}

async function load() {
  loading.value = true
  try {
    const r = await installationApi.list({ page: currentPage.value })
    items.value = r.data
    currentPage.value = r.meta.currentPage
    totalPages.value = r.meta.totalPages
    perPage.value = r.meta.perPage
  } catch (error: unknown) {
    toast.error('Erreur', extractApiErrorMessage(error, 'Impossible de charger les fiches'))
  } finally {
    loading.value = false
  }
}

function goToPage(page: number) {
  currentPage.value = page
  load()
}

onMounted(load)
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-900">Fiches d'installation</h1>
      <AppButton variant="primary" size="sm" @click="router.push({ name: 'technicien-installation-sheet' })">
        Nouvelle fiche
      </AppButton>
    </div>

    <AppCard>
      <div v-if="loading" class="flex justify-center py-10">
        <AppSpinner size="lg" class="text-primary-600" />
      </div>

      <div v-else class="overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-3 py-2 text-left">Date</th>
              <th class="px-3 py-2 text-left">Entreprise</th>
              <th class="px-3 py-2 text-left">Matériels</th>
              <th class="px-3 py-2 text-left">N° série</th>
              <th class="px-3 py-2 text-left">Formation</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="s in items"
              :key="s.id"
              class="cursor-pointer border-t hover:bg-gray-50"
              @click="router.push({ name: 'technicien-installation-sheet-detail', params: { id: s.id } })"
            >
              <td class="px-3 py-2">{{ new Date(s.installed_at).toLocaleDateString('fr-FR') }}</td>
              <td class="px-3 py-2">{{ s.company?.name ?? '-' }}</td>
              <td class="px-3 py-2">{{ materialsSummary(s) }}</td>
              <td class="px-3 py-2 font-mono">{{ serialsSummary(s) }}</td>
              <td class="px-3 py-2">{{ s.training_rating ? `${s.training_rating}/5` : '-' }}</td>
            </tr>
            <tr v-if="!items.length">
              <td colspan="5" class="px-3 py-6 text-center text-gray-500">Aucune fiche d'installation.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <AppPagination
        v-if="totalPages > 1"
        class="mt-4"
        :current-page="currentPage"
        :total-pages="totalPages"
        :per-page="perPage"
        @page-change="goToPage"
      />
    </AppCard>
  </div>
</template>
