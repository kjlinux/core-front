<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useBiometricStore } from '@/stores/biometric.store'
import { useToast } from '@/composables/useToast'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppSearchInput from '@/components/ui/AppSearchInput.vue'

const store = useBiometricStore()
const toast = useToast()

const search = ref('')
const filterStartDate = ref('')
const filterEndDate = ref('')
const currentPage = ref(1)
const perPage = 15

const filteredLog = computed(() => {
  let list = store.auditLog
  if (search.value) {
    const q = search.value.toLowerCase()
    list = list.filter(
      (e) => e.userName.toLowerCase().includes(q) || e.action.toLowerCase().includes(q) || e.target.toLowerCase().includes(q),
    )
  }
  return list
})

const paginatedLog = computed(() => {
  const start = (currentPage.value - 1) * perPage
  return filteredLog.value.slice(start, start + perPage)
})

const totalPages = computed(() => Math.ceil(filteredLog.value.length / perPage))

function getActionVariant(action: string) {
  if (action.includes('enrolled') || action.includes('created')) return 'success'
  if (action.includes('deleted') || action.includes('removed')) return 'danger'
  if (action.includes('failed')) return 'warning'
  return 'neutral'
}

function formatDate(date: string) {
  return new Date(date).toLocaleString('fr-FR')
}

function handleExport() {
  toast.showSuccess('Export en cours...')
}

onMounted(async () => {
  await store.fetchAuditLog()
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Journal d'audit biometrique</h1>
        <p class="text-sm text-gray-500 mt-1">Historique de toutes les actions sur le systeme biometrique</p>
      </div>
      <AppButton variant="secondary" @click="handleExport">Exporter</AppButton>
    </div>

    <AppCard>
      <div class="flex flex-col sm:flex-row gap-4 mb-6">
        <AppSearchInput v-model="search" placeholder="Rechercher par utilisateur, action..." class="flex-1" />
        <div class="flex gap-3">
          <AppInput v-model="filterStartDate" type="date" placeholder="Date debut" />
          <AppInput v-model="filterEndDate" type="date" placeholder="Date fin" />
        </div>
      </div>

      <div v-if="store.isLoading" class="flex justify-center py-12">
        <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>

      <div v-else-if="filteredLog.length === 0" class="text-center py-12 text-gray-500">
        Aucun evenement trouve
      </div>

      <div v-else>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date/heure</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Utilisateur</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cible</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-100">
              <tr v-for="entry in paginatedLog" :key="entry.id" class="hover:bg-gray-50">
                <td class="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{{ formatDate(entry.timestamp) }}</td>
                <td class="px-4 py-3 text-sm font-medium text-gray-900">{{ entry.userName }}</td>
                <td class="px-4 py-3">
                  <AppBadge :variant="getActionVariant(entry.action)">{{ entry.action }}</AppBadge>
                </td>
                <td class="px-4 py-3 text-sm text-gray-600">{{ entry.target }}</td>
                <td class="px-4 py-3 text-sm text-gray-500">{{ entry.details ?? '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="totalPages > 1" class="flex justify-center mt-6">
          <div class="flex gap-2">
            <AppButton size="sm" variant="ghost" :disabled="currentPage === 1" @click="currentPage--">
              Precedent
            </AppButton>
            <span class="px-3 py-1 text-sm text-gray-600">
              Page {{ currentPage }} / {{ totalPages }}
            </span>
            <AppButton size="sm" variant="ghost" :disabled="currentPage === totalPages" @click="currentPage++">
              Suivant
            </AppButton>
          </div>
        </div>
      </div>
    </AppCard>
  </div>
</template>
