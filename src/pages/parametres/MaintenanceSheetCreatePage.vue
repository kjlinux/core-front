<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeftIcon } from '@heroicons/vue/24/outline'
import { companyApi } from '@/services/api/company.api'
import type { Company } from '@/types'
import {
  maintenanceApi,
  MAINTENANCE_SOLUTIONS,
  MAINTENANCE_SOLUTION_LABELS,
  MAINTENANCE_TYPES,
  MAINTENANCE_TYPE_LABELS,
  EQUIPMENT_STATUSES,
  EQUIPMENT_STATUS_LABELS,
  type MaintenanceChecklistItem,
  type MaintenanceEquipmentInput,
  type MaintenanceSheetPayload,
  type MaintenanceType,
  type MaintenanceSolution,
} from '@/services/api/maintenance.api'
import { installationApi, type InstallationSheet } from '@/services/api/installation.api'
import { useToast } from '@/composables/useToast'
import { extractApiErrorMessage } from '@/utils/api-error'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppSpinner from '@/components/ui/AppSpinner.vue'
import SignaturePad from '@/components/ui/SignaturePad.vue'

const router = useRouter()
const toast = useToast()

const companies = ref<Company[]>([])
const companyOptions = ref<{ value: string; label: string }[]>([])
const loadingData = ref(true)
const saving = ref(false)
const errors = ref<Record<string, string>>({})

const solutionOptions = [
  { value: '', label: 'Sélectionner une solution' },
  ...MAINTENANCE_SOLUTIONS.map((s) => ({ value: s, label: MAINTENANCE_SOLUTION_LABELS[s] })),
]
const typeOptions = MAINTENANCE_TYPES.map((t) => ({ value: t, label: MAINTENANCE_TYPE_LABELS[t] }))
const statusOptions = EQUIPMENT_STATUSES.map((s) => ({ value: s, label: EQUIPMENT_STATUS_LABELS[s] }))

const checklist = ref<MaintenanceChecklistItem[]>([
  { key: 'clean', label: 'Nettoyage du matériel et des capteurs', done: false },
  { key: 'fixation', label: 'Vérification des fixations et du support', done: false },
  { key: 'power', label: "Vérification de l'alimentation électrique", done: false },
  { key: 'network', label: 'Vérification de la connexion réseau / WiFi', done: false },
  { key: 'read_test', label: 'Test de lecture / pointage', done: false },
  { key: 'firmware', label: 'Mise à jour firmware (si nécessaire)', done: false },
  { key: 'server_sync', label: 'Synchronisation avec le serveur OK', done: false },
  { key: 'data_backup', label: 'Sauvegarde des données effectuée', done: false },
])

const satisfactionRating = ref<string | number>('')

function emptyEquipment(): MaintenanceEquipmentInput {
  return { solution: '', serialNumber: '', operation: '', status: 'operational' }
}
const equipments = ref<MaintenanceEquipmentInput[]>([emptyEquipment()])
const equipmentErrors = ref<{ solution?: string; serialNumber?: string }[]>([])

// Fiche d'installation d'origine (optionnel) : permet de pré-remplir les
// équipements déjà posés chez le client.
const installationSheets = ref<InstallationSheet[]>([])
const selectedInstallationId = ref('')
const loadingInstallations = ref(false)

const installationOptions = computed(() => [
  { value: '', label: 'Aucune (saisie manuelle)' },
  ...installationSheets.value.map((s) => {
    const serials = (s.materials ?? []).map((m) => m.serial_number).join(', ')
    const date = new Date(s.installed_at).toLocaleDateString('fr-FR')
    return { value: s.id, label: serials ? `${date} (${serials})` : date }
  }),
])

async function loadInstallationSheets() {
  installationSheets.value = []
  selectedInstallationId.value = ''
  if (!form.value.companyId) return
  loadingInstallations.value = true
  try {
    const r = await installationApi.list({ company_id: form.value.companyId })
    installationSheets.value = r.data
  } catch {
    // Pré-remplissage optionnel : on n'interrompt pas la saisie en cas d'échec.
  } finally {
    loadingInstallations.value = false
  }
}

/** Pré-remplit les équipements depuis les matériels de la fiche d'installation choisie. */
function onInstallationSelect() {
  const sheet = installationSheets.value.find((s) => s.id === selectedInstallationId.value)
  if (!sheet) return
  const mats = sheet.materials ?? []
  if (!mats.length) {
    toast.error('Aucun matériel', "Cette fiche d'installation ne contient aucun matériel.")
    return
  }
  equipments.value = mats.map((m) => ({
    solution: (MAINTENANCE_SOLUTIONS as readonly string[]).includes(m.solution) ? (m.solution as MaintenanceSolution) : '',
    serialNumber: m.serial_number,
    operation: '',
    status: 'operational',
  }))
  toast.success('Équipements pré-remplis', `${mats.length} équipement(s) repris de la fiche d'installation.`)
}

function addEquipment() {
  equipments.value.push(emptyEquipment())
}
function removeEquipment(index: number) {
  if (equipments.value.length > 1) equipments.value.splice(index, 1)
}

const form = ref({
  companyId: '',
  clientContactName: '',
  clientContactRole: '',
  clientPhone: '',
  clientEmail: '',
  siteAddress: '',
  maintenanceType: 'preventive' as MaintenanceType,
  reportedIssue: '',
  resolved: true,
  durationMinutes: '' as string | number,
  observations: '',
  nextMaintenanceAt: '',
  maintainedAt: '',
  clientSignatureBase64: '',
  technicianSignatureBase64: '',
})

onMounted(async () => {
  try {
    companies.value = (await companyApi.getAll({ perPage: 200 })).data
    companyOptions.value = companies.value.map((c) => ({ value: c.id, label: c.name }))
  } catch (error: unknown) {
    toast.error('Erreur', extractApiErrorMessage(error, 'Impossible de charger les entreprises'))
  } finally {
    loadingData.value = false
  }
})

/**
 * Pré-remplit les coordonnées depuis la fiche entreprise sélectionnée.
 * On ne renseigne que les valeurs connues côté entreprise, sans écraser un
 * champ par une valeur vide si l'entreprise ne la fournit pas.
 */
function onCompanyChange() {
  loadInstallationSheets()
  const company = companies.value.find((c) => c.id === form.value.companyId)
  if (!company) return
  if (company.phone) form.value.clientPhone = company.phone
  if (company.email) form.value.clientEmail = company.email
  const siteAddress = company.sites?.[0]?.address || company.address
  if (siteAddress) form.value.siteAddress = siteAddress

  const admin = company.admin
  if (admin) {
    if (admin.name) form.value.clientContactName = admin.name
    if (!form.value.clientContactRole) form.value.clientContactRole = "Administrateur de l'entreprise"
    if (!form.value.clientPhone && admin.phone) form.value.clientPhone = admin.phone
    if (!form.value.clientEmail && admin.email) form.value.clientEmail = admin.email
  }
}

function validate(): boolean {
  errors.value = {}
  if (!form.value.companyId) errors.value.companyId = 'Entreprise requise'
  if (!form.value.maintenanceType) errors.value.maintenanceType = "Type d'intervention requis"
  equipmentErrors.value = equipments.value.map((e) => {
    const err: { solution?: string; serialNumber?: string } = {}
    if (!e.solution) err.solution = 'Solution requise'
    if (!e.serialNumber?.trim()) err.serialNumber = 'N° série requis'
    return err
  })
  if (equipmentErrors.value.some((e) => e.solution || e.serialNumber)) {
    errors.value.equipments = 'Chaque équipement doit avoir une solution et un numéro de série.'
  }
  if (form.value.durationMinutes !== '' && Number(form.value.durationMinutes) < 0) {
    errors.value.durationMinutes = 'Durée invalide'
  }
  if (!form.value.clientSignatureBase64) errors.value.clientSignature = 'Signature client requise'
  if (!form.value.technicianSignatureBase64) errors.value.technicianSignature = 'Signature technicien requise'
  return Object.keys(errors.value).length === 0
}

async function submit() {
  if (!validate()) {
    toast.error('Champs manquants', 'Vérifiez les champs obligatoires et les signatures.')
    return
  }
  saving.value = true
  try {
    const payload: MaintenanceSheetPayload = {
      companyId: form.value.companyId,
      installationSheetId: selectedInstallationId.value || undefined,
      clientContactName: form.value.clientContactName,
      clientContactRole: form.value.clientContactRole,
      clientPhone: form.value.clientPhone,
      clientEmail: form.value.clientEmail,
      siteAddress: form.value.siteAddress,
      maintenanceType: form.value.maintenanceType,
      reportedIssue: form.value.reportedIssue,
      resolved: form.value.resolved,
      durationMinutes: form.value.durationMinutes !== '' ? Number(form.value.durationMinutes) : null,
      satisfactionRating: satisfactionRating.value ? Number(satisfactionRating.value) : null,
      nextMaintenanceAt: form.value.nextMaintenanceAt || undefined,
      observations: form.value.observations,
      maintainedAt: form.value.maintainedAt || undefined,
      clientSignatureBase64: form.value.clientSignatureBase64,
      technicianSignatureBase64: form.value.technicianSignatureBase64,
      equipments: equipments.value,
      checklist: checklist.value,
    }
    const sheet = await maintenanceApi.create(payload)
    const count = sheet.equipments?.length ?? equipments.value.length
    toast.success('Fiche enregistrée', `${count} équipement(s) maintenu(s).`)
    router.push({ name: 'technicien-maintenance-sheets' })
  } catch (error: unknown) {
    toast.error('Erreur', extractApiErrorMessage(error, "Échec de l'enregistrement de la fiche"))
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center gap-4">
      <AppButton variant="ghost" @click="router.back()">
        <ArrowLeftIcon class="w-4 h-4 mr-1" />
        Retour
      </AppButton>
      <h1 class="text-2xl font-bold text-gray-900">Nouvelle fiche de maintenance</h1>
    </div>

    <div v-if="loadingData" class="flex justify-center py-16">
      <AppSpinner size="lg" class="text-primary-600" />
    </div>

    <template v-else>
      <AppCard title="Client &amp; site">
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <AppSelect v-model="form.companyId" :options="companyOptions" label="Entreprise" placeholder="Sélectionner" required :error="errors.companyId" @update:model-value="onCompanyChange" />
          <AppInput v-model="form.maintainedAt" type="date" label="Date d'intervention" placeholder="Aujourd'hui par défaut" />
          <AppInput v-model="form.clientContactName" label="Contact client" placeholder="Admin de l'entreprise par défaut" />
          <AppInput v-model="form.clientContactRole" label="Fonction du contact" />
          <AppInput v-model="form.clientPhone" type="tel" label="Téléphone client" placeholder="Pré-rempli depuis l'entreprise" />
          <AppInput v-model="form.clientEmail" type="email" label="Email client" placeholder="Pré-rempli depuis l'entreprise" />
          <div class="md:col-span-2">
            <AppInput v-model="form.siteAddress" label="Adresse du site" placeholder="Pré-remplie depuis l'entreprise" />
          </div>
        </div>
      </AppCard>

      <AppCard title="Intervention">
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <AppSelect v-model="form.maintenanceType" :options="typeOptions" label="Type d'intervention" required :error="errors.maintenanceType" />
          <AppInput v-model="form.durationMinutes" type="number" label="Durée (minutes)" placeholder="ex. 45" :error="errors.durationMinutes" />
          <div class="md:col-span-2">
            <label class="mb-1 block text-sm font-medium text-gray-700">Problème signalé par le client</label>
            <textarea v-model="form.reportedIssue" rows="3" class="w-full rounded-lg border border-gray-300 p-2 text-sm" placeholder="Motif de l'intervention (surtout pour une maintenance corrective)" />
          </div>
          <label class="flex items-center gap-3 text-sm text-gray-800">
            <input v-model="form.resolved" type="checkbox" class="h-4 w-4 rounded border-gray-300 text-primary-700 focus:ring-primary-700" />
            Problème résolu / intervention terminée
          </label>
          <AppInput v-model="form.nextMaintenanceAt" type="date" label="Prochaine maintenance recommandée" />
        </div>
      </AppCard>

      <AppCard title="Équipements maintenus">
        <template #actions>
          <AppButton variant="outline" size="sm" @click="addEquipment">+ Ajouter un équipement</AppButton>
        </template>

        <div v-if="form.companyId" class="mb-4 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-3">
          <AppSelect
            v-model="selectedInstallationId"
            :options="installationOptions"
            :disabled="loadingInstallations"
            label="Pré-remplir depuis une fiche d'installation (optionnel)"
            @update:model-value="onInstallationSelect"
          />
          <p class="mt-1 text-xs text-gray-500">
            {{ loadingInstallations
              ? 'Chargement des fiches d\'installation…'
              : installationSheets.length
                ? 'Reprend les matériels posés lors de l\'installation ; vous pourrez les ajuster.'
                : 'Aucune fiche d\'installation pour ce client : saisissez les équipements manuellement.' }}
          </p>
        </div>

        <p v-if="errors.equipments" class="mb-3 text-sm text-red-600">{{ errors.equipments }}</p>

        <div class="space-y-4">
          <div v-for="(equipment, i) in equipments" :key="i" class="rounded-lg border border-gray-200 p-4">
            <div class="mb-3 flex items-center justify-between">
              <span class="text-sm font-medium text-gray-700">Équipement {{ i + 1 }}</span>
              <button
                v-if="equipments.length > 1"
                type="button"
                class="text-sm text-red-600 underline"
                @click="removeEquipment(i)"
              >
                Retirer
              </button>
            </div>
            <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
              <AppSelect v-model="equipment.solution" :options="solutionOptions" label="Solution" required :error="equipmentErrors[i]?.solution" />
              <AppInput v-model="equipment.serialNumber" label="Numéro de série" required :error="equipmentErrors[i]?.serialNumber" />
              <AppSelect v-model="equipment.status" :options="statusOptions" label="État après intervention" />
              <div class="md:col-span-1">
                <label class="mb-1 block text-sm font-medium text-gray-700">Intervention effectuée</label>
                <textarea v-model="equipment.operation" rows="2" class="w-full rounded-lg border border-gray-300 p-2 text-sm" placeholder="ex. Nettoyage capteur, remplacement batterie…" />
              </div>
            </div>
          </div>
        </div>
      </AppCard>

      <AppCard title="Contrôles effectués">
        <div class="space-y-2">
          <label v-for="item in checklist" :key="item.key" class="flex items-center gap-3 text-sm text-gray-800">
            <input v-model="item.done" type="checkbox" class="h-4 w-4 rounded border-gray-300 text-primary-700 focus:ring-primary-700" />
            {{ item.label }}
          </label>
        </div>
        <div class="mt-4 max-w-xs">
          <AppSelect
            v-model="satisfactionRating"
            label="Satisfaction client (1-5)"
            :options="[
              { value: '', label: '-' },
              { value: 1, label: '1' }, { value: 2, label: '2' }, { value: 3, label: '3' },
              { value: 4, label: '4' }, { value: 5, label: '5' },
            ]"
          />
        </div>
        <div class="mt-4">
          <label class="mb-1 block text-sm font-medium text-gray-700">Observations</label>
          <textarea v-model="form.observations" rows="4" class="w-full rounded-lg border border-gray-300 p-2 text-sm" />
        </div>
      </AppCard>

      <AppCard title="Signatures">
        <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <SignaturePad v-model="form.clientSignatureBase64" label="Signature client" required />
            <p v-if="errors.clientSignature" class="mt-1 text-sm text-red-600">{{ errors.clientSignature }}</p>
          </div>
          <div>
            <SignaturePad v-model="form.technicianSignatureBase64" label="Signature technicien" required />
            <p v-if="errors.technicianSignature" class="mt-1 text-sm text-red-600">{{ errors.technicianSignature }}</p>
          </div>
        </div>
      </AppCard>

      <div class="flex gap-3">
        <AppButton variant="primary" :loading="saving" @click="submit">Enregistrer la fiche</AppButton>
        <AppButton variant="outline" :disabled="saving" @click="router.back()">Annuler</AppButton>
      </div>
    </template>
  </div>
</template>
