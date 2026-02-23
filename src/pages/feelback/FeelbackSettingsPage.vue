<script setup lang="ts">
import { ref } from 'vue'
import { useFeelbackStore } from '@/stores/feelback.store'
import { useToast } from '@/composables/useToast'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppToggle from '@/components/ui/AppToggle.vue'
import AppTextarea from '@/components/ui/AppTextarea.vue'

const store = useFeelbackStore()
const toast = useToast()

const alertSettings = ref({
  thresholdMauvais: 30,
  offlineDelayMinutes: 60,
  batteryThreshold: 15,
})

const notificationSettings = ref({
  emailEnabled: true,
  smsEnabled: false,
  emailRecipients: 'direction@company.com',
})

const scheduleSettings = ref({
  openHour: '08:00',
  closeHour: '18:00',
  workDays: [true, true, true, true, true, false, false],
})

const dayLabels = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']

async function saveAlertSettings() {
  await store.updateAlertSettings(alertSettings.value)
  toast.showSuccess('Seuils d\'alerte enregistres')
}

function saveNotifications() {
  toast.showSuccess('Parametres de notification enregistres')
}

function saveSchedule() {
  toast.showSuccess('Periodes de reference enregistrees')
}
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-bold text-gray-900">Configuration Feelback</h1>

    <AppCard title="Seuils d'alerte">
      <div class="space-y-4 max-w-md">
        <AppInput
          v-model.number="alertSettings.thresholdMauvais"
          label="Taux mauvais maximum (%)"
          type="number"
          :min="0"
          :max="100"
        />
        <p class="text-xs text-gray-400 -mt-2">Une alerte est generee si le taux mauvais depasse ce seuil</p>
        <AppInput
          v-model.number="alertSettings.offlineDelayMinutes"
          label="Delai alerte hors ligne (minutes)"
          type="number"
          :min="1"
        />
        <AppInput
          v-model.number="alertSettings.batteryThreshold"
          label="Seuil batterie critique (%)"
          type="number"
          :min="0"
          :max="100"
        />
        <AppButton variant="primary" @click="saveAlertSettings">Enregistrer</AppButton>
      </div>
    </AppCard>

    <AppCard title="Notifications">
      <div class="space-y-4 max-w-md">
        <div class="flex items-center justify-between py-2">
          <div>
            <p class="text-sm font-medium text-gray-800">Notifications email</p>
            <p class="text-xs text-gray-500">Recevoir les alertes par email</p>
          </div>
          <AppToggle v-model="notificationSettings.emailEnabled" />
        </div>
        <div class="flex items-center justify-between py-2">
          <div>
            <p class="text-sm font-medium text-gray-800">Notifications SMS</p>
            <p class="text-xs text-gray-500">Recevoir les alertes par SMS</p>
          </div>
          <AppToggle v-model="notificationSettings.smsEnabled" />
        </div>
        <div v-if="notificationSettings.emailEnabled">
          <AppTextarea
            v-model="notificationSettings.emailRecipients"
            label="Emails des destinataires"
            placeholder="email1@company.com&#10;email2@company.com"
            :rows="3"
          />
          <p class="text-xs text-gray-400 mt-1">Un email par ligne</p>
        </div>
        <AppButton variant="primary" @click="saveNotifications">Enregistrer</AppButton>
      </div>
    </AppCard>

    <AppCard title="Periodes de reference">
      <div class="space-y-4 max-w-md">
        <div class="flex gap-4">
          <AppInput v-model="scheduleSettings.openHour" label="Heure d'ouverture" type="time" />
          <AppInput v-model="scheduleSettings.closeHour" label="Heure de fermeture" type="time" />
        </div>
        <div>
          <p class="text-sm font-medium text-gray-700 mb-3">Jours ouvrables</p>
          <div class="flex flex-wrap gap-3">
            <label
              v-for="(day, index) in dayLabels"
              :key="day"
              class="flex items-center gap-2 cursor-pointer"
            >
              <input
                v-model="scheduleSettings.workDays[index]"
                type="checkbox"
                class="w-4 h-4 text-primary rounded border-gray-300"
              />
              <span class="text-sm text-gray-700">{{ day }}</span>
            </label>
          </div>
        </div>
        <AppButton variant="primary" @click="saveSchedule">Enregistrer</AppButton>
      </div>
    </AppCard>
  </div>
</template>
