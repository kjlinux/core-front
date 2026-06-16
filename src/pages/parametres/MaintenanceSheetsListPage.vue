<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  maintenanceApi,
  MAINTENANCE_SOLUTION_LABELS,
  MAINTENANCE_TYPE_LABELS,
  type MaintenanceSheet,
} from '@/services/api/maintenance.api'
import { useToast } from '@/composables/useToast'
import { extractApiErrorMessage } from '@/utils/api-error'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppPagination from '@/components/ui/AppPagination.vue'
import AppSpinner from '@/components/ui/AppSpinner.vue'

const router = useRouter()
const toast = useToast()

const items = ref<MaintenanceSheet[]>([])
const loading = ref(true)
const currentPage = ref(1)
const totalPages = ref(1)
const perPage = ref(20)

function equipmentsSummary(sheet: MaintenanceSheet): string {
  const list = sheet.equipments ?? []
  if (!list.length) return '-'
  const labels = list.map((e) => MAINTENANCE_SOLUTION_LABELS[e.solution] ?? e.solution)
  return labels.join(', ')
}

async function load() {
  loading.value = true
  try {
    const r = await maintenanceApi.list({ page: currentPage.value })
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
      <h1 class="text-2xl font-bold text-gray-900">Fiches de maintenance</h1>
      <AppButton variant="primary" size="sm" @click="router.push({ name: 'technicien-maintenance-sheet' })">
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
              <th class="px-3 py-2 text-left">Type</th>
              <th class="px-3 py-2 text-left">Équipements</th>
              <th class="px-3 py-2 text-left">Statut</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="s in items"
              :key="s.id"
              class="cursor-pointer border-t hover:bg-gray-50"
              @click="router.push({ name: 'technicien-maintenance-sheet-detail', params: { id: s.id } })"
            >
              <td class="px-3 py-2">{{ new Date(s.maintained_at).toLocaleDateString('fr-FR') }}</td>
              <td class="px-3 py-2">{{ s.company?.name ?? '-' }}</td>
              <td class="px-3 py-2">{{ MAINTENANCE_TYPE_LABELS[s.maintenance_type] ?? s.maintenance_type }}</td>
              <td class="px-3 py-2">{{ equipmentsSummary(s) }}</td>
              <td class="px-3 py-2">
                <AppBadge :variant="s.resolved ? 'success' : 'warning'">
                  {{ s.resolved ? 'Résolue' : 'À suivre' }}
                </AppBadge>
              </td>
            </tr>
            <tr v-if="!items.length">
              <td colspan="5" class="px-3 py-6 text-center text-gray-500">Aucune fiche de maintenance.</td>
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
