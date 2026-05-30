<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeftIcon } from '@heroicons/vue/24/outline'
import { companyApi } from '@/services/api/company.api'
import type { Company } from '@/types'
import {
  installationApi,
  INSTALLATION_SOLUTIONS,
  INSTALLATION_SOLUTION_LABELS,
  type InstallationChecklistItem,
  type InstallationMaterialInput,
  type InstallationSheetPayload,
} from '@/services/api/installation.api'
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
  ...INSTALLATION_SOLUTIONS.map((s) => ({ value: s, label: INSTALLATION_SOLUTION_LABELS[s] })),
]

const checklist = ref<InstallationChecklistItem[]>([
  { key: 'mounted', label: 'Matériel monté et fixé', done: false },
  { key: 'power', label: 'Alimentation électrique OK', done: false },
  { key: 'network', label: 'Connexion réseau / WiFi OK', done: false },
  { key: 'punch_test', label: 'Test de pointage réussi', done: false },
  { key: 'server_sync', label: 'Synchronisation serveur OK', done: false },
  { key: 'training', label: 'Formation utilisateur effectuée', done: false },
])

const trainingRating = ref<string | number>('')

function emptyMaterial(): InstallationMaterialInput {
  return { solution: '', serialNumber: '', quantity: '', firmwareVersion: '', wifiSsid: '', staticIp: '', remoteAccess: '' }
}
const materials = ref<InstallationMaterialInput[]>([emptyMaterial()])
const materialErrors = ref<{ solution?: string; serialNumber?: string }[]>([])

function addMaterial() {
  materials.value.push(emptyMaterial())
}
function removeMaterial(index: number) {
  if (materials.value.length > 1) materials.value.splice(index, 1)
}

const form = ref<Omit<InstallationSheetPayload, 'checklist' | 'trainingRating' | 'materials'>>({
  companyId: '',
  clientContactName: '',
  clientContactRole: '',
  clientPhone: '',
  clientEmail: '',
  siteAddress: '',
  observations: '',
  clientSignatureBase64: '',
  technicianSignatureBase64: '',
  installedAt: '',
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
  const company = companies.value.find((c) => c.id === form.value.companyId)
  if (!company) return
  if (company.phone) form.value.clientPhone = company.phone
  if (company.email) form.value.clientEmail = company.email
  const siteAddress = company.sites?.[0]?.address || company.address
  if (siteAddress) form.value.siteAddress = siteAddress

  // Contact par défaut = admin de l'entreprise (embarqué dans la réponse Company,
  // donc fiable aussi bien pour super_admin que pour technicien).
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
  materialErrors.value = materials.value.map((m) => {
    const e: { solution?: string; serialNumber?: string } = {}
    if (!m.solution) e.solution = 'Solution requise'
    if (!m.serialNumber?.trim()) e.serialNumber = 'N° série requis'
    return e
  })
  if (materialErrors.value.some((e) => e.solution || e.serialNumber)) {
    errors.value.materials = 'Chaque matériel doit avoir une solution et un numéro de série.'
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
    const payload: InstallationSheetPayload = {
      ...form.value,
      installedAt: form.value.installedAt || undefined,
      trainingRating: trainingRating.value ? Number(trainingRating.value) : null,
      materials: materials.value,
      checklist: checklist.value,
    }
    const sheet = await installationApi.create(payload)
    const count = sheet.materials?.length ?? materials.value.length
    toast.success('Fiche enregistrée', `${count} matériel(s) installé(s), 3 relances planifiées (J+2 / J+7 / J+30).`)
    router.push({ name: 'technicien-installation-sheets' })
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
      <h1 class="text-2xl font-bold text-gray-900">Nouvelle fiche d'installation</h1>
    </div>

    <div v-if="loadingData" class="flex justify-center py-16">
      <AppSpinner size="lg" class="text-primary-600" />
    </div>

    <template v-else>
      <AppCard title="Client &amp; site">
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <AppSelect v-model="form.companyId" :options="companyOptions" label="Entreprise" placeholder="Sélectionner" required :error="errors.companyId" @update:model-value="onCompanyChange" />
          <AppInput v-model="form.installedAt" type="date" label="Date d'installation" placeholder="Aujourd'hui par défaut" />
          <AppInput v-model="form.clientContactName" label="Contact client" placeholder="Admin de l'entreprise par défaut" />
          <AppInput v-model="form.clientContactRole" label="Fonction du contact" />
          <AppInput v-model="form.clientPhone" type="tel" label="Téléphone client" placeholder="Pré-rempli depuis l'entreprise" />
          <AppInput v-model="form.clientEmail" type="email" label="Email client" placeholder="Pré-rempli depuis l'entreprise" />
          <div class="md:col-span-2">
            <AppInput v-model="form.siteAddress" label="Adresse du site" placeholder="Pré-remplie depuis l'entreprise" />
          </div>
        </div>
      </AppCard>

      <AppCard title="Matériels installés">
        <template #actions>
          <AppButton variant="outline" size="sm" @click="addMaterial">+ Ajouter un matériel</AppButton>
        </template>

        <p v-if="errors.materials" class="mb-3 text-sm text-red-600">{{ errors.materials }}</p>

        <div class="space-y-4">
          <div v-for="(material, i) in materials" :key="i" class="rounded-lg border border-gray-200 p-4">
            <div class="mb-3 flex items-center justify-between">
              <span class="text-sm font-medium text-gray-700">Matériel {{ i + 1 }}</span>
              <button
                v-if="materials.length > 1"
                type="button"
                class="text-sm text-red-600 underline"
                @click="removeMaterial(i)"
              >
                Retirer
              </button>
            </div>
            <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
              <AppSelect v-model="material.solution" :options="solutionOptions" label="Solution" required :error="materialErrors[i]?.solution" />
              <AppInput v-model="material.serialNumber" label="Numéro de série" required :error="materialErrors[i]?.serialNumber" />
              <AppInput v-model="material.quantity" label="Quantité" />
              <AppInput v-model="material.firmwareVersion" label="Version firmware" />
              <AppInput v-model="material.wifiSsid" label="SSID WiFi" />
              <AppInput v-model="material.staticIp" label="IP statique" />
              <AppInput v-model="material.remoteAccess" label="Accès distant" />
            </div>
          </div>
        </div>
      </AppCard>

      <AppCard title="Check-list de mise en service">
        <div class="space-y-2">
          <label v-for="item in checklist" :key="item.key" class="flex items-center gap-3 text-sm text-gray-800">
            <input v-model="item.done" type="checkbox" class="h-4 w-4 rounded border-gray-300 text-primary-700 focus:ring-primary-700" />
            {{ item.label }}
          </label>
        </div>
        <div class="mt-4 max-w-xs">
          <AppSelect
            v-model="trainingRating"
            label="Note de formation (1-5)"
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
