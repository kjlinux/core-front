<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSupportStore } from '@/stores/support.store'
import { useI18n } from 'vue-i18n'
import { useToast } from '@/composables/useToast'
import { extractApiErrorMessage } from '@/utils/api-error'
import AppCard from '@/components/ui/AppCard.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppButton from '@/components/ui/AppButton.vue'
import { PhoneIcon } from '@heroicons/vue/24/outline'
import type { SupportCompanyRow } from '@/services/api/support.api'

const store = useSupportStore()
const toast = useToast()
const { t } = useI18n()
const router = useRouter()

// Tri : compagnies les plus en difficulté en premier (offline puis alertes).
const sortedCompanies = computed(() =>
  [...store.companies].sort((a, b) => {
    if (b.devicesOffline !== a.devicesOffline) return b.devicesOffline - a.devicesOffline
    return b.openAlerts - a.openAlerts
  }),
)

function offlineDays(iso: string | null): number | null {
  if (!iso) return null
  const ms = Date.now() - new Date(iso).getTime()
  if (Number.isNaN(ms)) return null
  return Math.floor(ms / 86_400_000)
}

function offlineLabel(c: SupportCompanyRow): string {
  if (c.devicesOffline === 0) return '-'
  const d = offlineDays(c.oldestOfflineSince)
  if (d === null) return `${c.devicesOffline} hors ligne`
  return `${c.devicesOffline} hors ligne · depuis ${d} j`
}

function rowVariant(c: SupportCompanyRow): 'danger' | 'warning' | 'success' {
  if (c.devicesOffline > 0 || c.openAlerts > 0) {
    const d = offlineDays(c.oldestOfflineSince)
    return d !== null && d >= 2 ? 'danger' : 'warning'
  }
  return 'success'
}

onMounted(async () => {
  try {
    await store.fetchCompanies()
  } catch (e) {
    toast.error(t('toast.support.loadError'), extractApiErrorMessage(e, t('common.genericError')))
  }
})
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-semibold text-gray-900">Compagnies</h1>
      <p class="text-sm text-gray-500">Santé des capteurs par compagnie — détecter et appeler avant le client</p>
    </div>

    <AppCard>
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Compagnie</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Capteurs</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hors ligne</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Alertes</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
              <th class="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-100">
            <tr
              v-for="c in sortedCompanies"
              :key="c.id"
              class="hover:bg-gray-50 cursor-pointer"
              @click="router.push(`/support-it/companies/${c.id}`)"
            >
              <td class="px-4 py-3">
                <span class="inline-block w-2 h-2 rounded-full mr-2" :class="{
                  'bg-red-500': rowVariant(c) === 'danger',
                  'bg-amber-500': rowVariant(c) === 'warning',
                  'bg-green-500': rowVariant(c) === 'success',
                }" />
                <span class="text-sm font-medium text-gray-900">{{ c.name }}</span>
              </td>
              <td class="px-4 py-3 text-sm text-gray-600">{{ c.devicesOnline }}/{{ c.devicesTotal }} en ligne</td>
              <td class="px-4 py-3">
                <AppBadge :variant="c.devicesOffline > 0 ? rowVariant(c) : 'neutral'" size="sm">{{ offlineLabel(c) }}</AppBadge>
              </td>
              <td class="px-4 py-3">
                <AppBadge :variant="c.openAlerts > 0 ? 'danger' : 'neutral'" size="sm">{{ c.openAlerts }}</AppBadge>
              </td>
              <td class="px-4 py-3 text-sm text-gray-600">{{ c.phone ?? c.email ?? '-' }}</td>
              <td class="px-4 py-3" @click.stop>
                <a v-if="c.phone" :href="`tel:${c.phone}`">
                  <AppButton variant="outline" size="sm"><PhoneIcon class="w-4 h-4" /> Appeler</AppButton>
                </a>
              </td>
            </tr>
            <tr v-if="sortedCompanies.length === 0">
              <td colspan="6" class="px-4 py-6 text-sm text-center text-gray-500">Aucune compagnie.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </AppCard>
  </div>
</template>
