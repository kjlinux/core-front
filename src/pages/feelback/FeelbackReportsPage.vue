<script setup lang="ts">
import { ref } from 'vue'
import { useToast } from '@/composables/useToast'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppModal from '@/components/ui/AppModal.vue'
import StatCard from '@/components/data-display/StatCard.vue'

const toast = useToast()

const reportType = ref('global')
const startDate = ref('')
const endDate = ref('')
const selectedSite = ref('')
const showScheduleModal = ref(false)

const scheduleForm = ref({
  frequency: 'weekly',
  recipients: '',
  format: 'pdf',
})

const reportTypes = [
  { label: 'Rapport global', value: 'global' },
  { label: 'Rapport par site', value: 'site' },
  { label: 'Rapport par agent', value: 'agent' },
  { label: 'Rapport par periode', value: 'period' },
]

const siteOptions = [
  { label: 'Tous les sites', value: '' },
  { label: 'Siege Social', value: '1' },
  { label: 'Agence Nord', value: '2' },
]

const frequencyOptions = [
  { label: 'Quotidien', value: 'daily' },
  { label: 'Hebdomadaire', value: 'weekly' },
  { label: 'Mensuel', value: 'monthly' },
]

const formatOptions = [
  { label: 'PDF', value: 'pdf' },
  { label: 'Excel', value: 'excel' },
]

const scheduledReports = [
  { id: '1', name: 'Rapport hebdomadaire global', frequency: 'Hebdomadaire', recipients: 'direction@company.com', format: 'PDF', nextRun: '2024-12-02' },
  { id: '2', name: 'Rapport mensuel par site', frequency: 'Mensuel', recipients: 'managers@company.com', format: 'Excel', nextRun: '2024-12-01' },
]

function exportPdf() {
  toast.showSuccess('Generation du rapport PDF en cours...')
}

function exportExcel() {
  toast.showSuccess('Generation du rapport Excel en cours...')
}

function saveSchedule() {
  toast.showSuccess('Rapport automatique configure')
  showScheduleModal.value = false
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-900">Rapports Feelback</h1>
      <AppButton variant="secondary" @click="showScheduleModal = true">
        Configurer rapport automatique
      </AppButton>
    </div>

    <AppCard title="Parametres du rapport">
      <div class="flex flex-wrap gap-4 mb-6">
        <AppSelect v-model="reportType" label="Type de rapport" :options="reportTypes" class="w-52" />
        <AppInput v-model="startDate" label="Date debut" type="date" />
        <AppInput v-model="endDate" label="Date fin" type="date" />
        <AppSelect v-model="selectedSite" label="Site" :options="siteOptions" class="w-48" />
      </div>
      <div class="flex gap-3">
        <AppButton variant="danger" @click="exportPdf">Exporter PDF</AppButton>
        <AppButton variant="success" @click="exportExcel">Exporter Excel</AppButton>
      </div>
    </AppCard>

    <AppCard title="Apercu du rapport">
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total reponses" value="1 847" />
        <StatCard title="Taux bon" value="68%" />
        <StatCard title="Taux neutre" value="21%" />
        <StatCard title="Taux mauvais" value="11%" />
      </div>
      <p class="text-sm text-gray-400 mt-4">Apercu base sur les filtres selectionnes</p>
    </AppCard>

    <AppCard title="Rapports automatiques configures">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Frequence</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Destinataires</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Format</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prochaine execution</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="report in scheduledReports" :key="report.id" class="hover:bg-gray-50">
              <td class="px-4 py-3 text-sm font-medium text-gray-900">{{ report.name }}</td>
              <td class="px-4 py-3 text-sm text-gray-600">{{ report.frequency }}</td>
              <td class="px-4 py-3 text-sm text-gray-600">{{ report.recipients }}</td>
              <td class="px-4 py-3 text-sm text-gray-600">{{ report.format }}</td>
              <td class="px-4 py-3 text-sm text-gray-600">{{ report.nextRun }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </AppCard>

    <AppModal v-model="showScheduleModal" title="Configurer un rapport automatique" size="md">
      <div class="space-y-4">
        <AppSelect v-model="scheduleForm.frequency" label="Frequence" :options="frequencyOptions" />
        <AppInput v-model="scheduleForm.recipients" label="Destinataires (emails)" type="email" placeholder="email1@company.com, email2@company.com" />
        <AppSelect v-model="scheduleForm.format" label="Format" :options="formatOptions" />
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <AppButton variant="secondary" @click="showScheduleModal = false">Annuler</AppButton>
          <AppButton variant="primary" @click="saveSchedule">Enregistrer</AppButton>
        </div>
      </template>
    </AppModal>
  </div>
</template>
