<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useFeelbackStore } from '@/stores/feelback.store'
import { useToast } from '@/composables/useToast'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppInput from '@/components/ui/AppInput.vue'

const store = useFeelbackStore()
const toast = useToast()

const filterTab = ref('all')
const showSettingsModal = ref(false)

const alertSettings = ref({
  thresholdMauvais: 30,
  offlineDelayMinutes: 60,
})

const filteredAlerts = computed(() => {
  switch (filterTab.value) {
    case 'unread': return store.alerts.filter((a) => !a.isRead)
    case 'read': return store.alerts.filter((a) => a.isRead)
    default: return store.alerts
  }
})

function getTypeLabel(type: string) {
  switch (type) {
    case 'threshold_exceeded': return 'Seuil depasse'
    case 'device_offline': return 'Hors ligne'
    default: return type
  }
}

function getTypeVariant(type: string) {
  switch (type) {
    case 'threshold_exceeded': return 'danger'
    case 'device_offline': return 'warning'
    default: return 'neutral'
  }
}

function formatDate(date: string) {
  return new Date(date).toLocaleString('fr-FR')
}

function markAsRead(alert: any) {
  alert.isRead = true
  toast.showSuccess('Alerte marquee comme lue')
}

function markAllAsRead() {
  store.alerts.forEach((a) => (a.isRead = true))
  toast.showSuccess('Toutes les alertes marquees comme lues')
}

async function saveSettings() {
  await store.updateAlertSettings({
    thresholdMauvais: alertSettings.value.thresholdMauvais,
    offlineDelayMinutes: alertSettings.value.offlineDelayMinutes,
  })
  toast.showSuccess('Parametres d\'alerte enregistres')
  showSettingsModal.value = false
}

onMounted(async () => {
  await store.fetchAlerts()
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Alertes Feelback</h1>
        <p class="text-sm text-gray-500 mt-1">
          {{ store.alerts.filter((a) => !a.isRead).length }} alerte(s) non lue(s)
        </p>
      </div>
      <div class="flex gap-3">
        <AppButton variant="secondary" @click="markAllAsRead">Tout marquer comme lu</AppButton>
        <AppButton variant="ghost" @click="showSettingsModal = true">Parametres</AppButton>
      </div>
    </div>

    <!-- Tabs -->
    <div class="flex border-b border-gray-200">
      <button
        v-for="tab in [{ label: 'Toutes', value: 'all' }, { label: 'Non lues', value: 'unread' }, { label: 'Lues', value: 'read' }]"
        :key="tab.value"
        class="px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors"
        :class="filterTab === tab.value ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'"
        @click="filterTab = tab.value"
      >
        {{ tab.label }}
      </button>
    </div>

    <div v-if="store.isLoading" class="flex justify-center py-12">
      <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
    </div>

    <div v-else-if="filteredAlerts.length === 0" class="text-center py-12">
      <p class="text-gray-500">Aucune alerte dans cette categorie</p>
    </div>

    <div v-else class="space-y-3">
      <AppCard
        v-for="alert in filteredAlerts"
        :key="alert.id"
        class="transition-colors"
        :class="{ 'opacity-60': alert.isRead }"
      >
        <div class="flex items-start justify-between gap-4">
          <div class="flex items-start gap-3 flex-1">
            <AppBadge :variant="getTypeVariant(alert.type) as any">
              {{ getTypeLabel(alert.type) }}
            </AppBadge>
            <div class="flex-1">
              <p class="text-sm font-semibold text-gray-900">{{ alert.siteName }}</p>
              <p class="text-sm text-gray-600 mt-1">{{ alert.message }}</p>
              <div v-if="alert.currentValue !== undefined && alert.threshold !== undefined" class="text-xs text-gray-500 mt-1">
                Valeur actuelle : {{ alert.currentValue }}% | Seuil : {{ alert.threshold }}%
              </div>
              <p class="text-xs text-gray-400 mt-2">{{ formatDate(alert.createdAt) }}</p>
            </div>
          </div>
          <div class="flex items-center gap-2 flex-shrink-0">
            <AppBadge :variant="alert.isRead ? 'neutral' : 'warning'">
              {{ alert.isRead ? 'Lu' : 'Non lu' }}
            </AppBadge>
            <AppButton v-if="!alert.isRead" size="sm" variant="ghost" @click="markAsRead(alert)">
              Marquer lu
            </AppButton>
          </div>
        </div>
      </AppCard>
    </div>

    <!-- Settings Modal -->
    <AppModal v-model="showSettingsModal" title="Parametres d'alerte" size="md">
      <div class="space-y-4">
        <AppInput
          v-model.number="alertSettings.thresholdMauvais"
          label="Taux mauvais maximum (%)"
          type="number"
          :min="0"
          :max="100"
          help="Une alerte est declenchee si le taux mauvais depasse ce seuil"
        />
        <AppInput
          v-model.number="alertSettings.offlineDelayMinutes"
          label="Delai alerte hors ligne (minutes)"
          type="number"
          :min="1"
        />
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <AppButton variant="secondary" @click="showSettingsModal = false">Annuler</AppButton>
          <AppButton variant="primary" @click="saveSettings">Enregistrer</AppButton>
        </div>
      </template>
    </AppModal>
  </div>
</template>
