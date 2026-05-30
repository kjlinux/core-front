<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeftIcon } from '@heroicons/vue/24/outline'
import {
  followupApi,
  followupTypeLabel,
  FOLLOWUP_STATUS_LABELS,
  FOLLOWUP_RESULT_LABELS,
  type ClientFollowupCall,
} from '@/services/api/followup.api'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppSpinner from '@/components/ui/AppSpinner.vue'

const route = useRoute()
const router = useRouter()
const call = ref<ClientFollowupCall | null>(null)

const statusOpts = (Object.keys(FOLLOWUP_STATUS_LABELS) as Array<keyof typeof FOLLOWUP_STATUS_LABELS>)
  .map((v) => ({ value: v, label: FOLLOWUP_STATUS_LABELS[v] }))
const resultOpts = [
  { value: '', label: 'Non renseigné' },
  { value: 'ok', label: FOLLOWUP_RESULT_LABELS.ok },
  { value: 'partial', label: FOLLOWUP_RESULT_LABELS.partial },
  { value: 'problem', label: FOLLOWUP_RESULT_LABELS.problem },
]

/** Message WhatsApp chaleureux et personnalisé selon le type d'appel. */
const waMessage = computed(() => {
  if (!call.value) return ''
  const company = call.value.company?.name?.trim()
  const greeting = company ? `Bonjour ${company} 👋` : 'Bonjour 👋'
  switch (call.value.call_type) {
    case 'j2':
      return `${greeting}\n\nC'est l'équipe TANGA GROUP 🙂 Cela fait déjà deux jours que votre solution est en place et nous voulions simplement prendre de vos nouvelles : est-ce que tout se passe bien de votre côté ?\n\nLa moindre question, le moindre doute, écrivez-nous ici : on est là pour vous accompagner. 🙌`
    case 'j7':
      return `${greeting}\n\nDéjà une semaine avec votre solution TANGA GROUP ! 🎉 On aimerait beaucoup savoir comment se passe la prise en main au quotidien et si vos équipes l'utilisent sans difficulté.\n\nDites-nous tout : vos retours nous aident à mieux vous accompagner. 🙏`
    case 'j30':
      return `${greeting}\n\nUn mois s'est déjà écoulé depuis votre installation 🗓️ Quel beau moment pour faire le point ensemble ! On serait ravis de connaître votre ressenti et de préparer avec vous le bilan de ce premier mois.\n\nQuand seriez-vous disponible pour en discuter ? 😊`
    default:
      return `${greeting}\n\nL'équipe TANGA GROUP revient vers vous pour le suivi de votre installation. N'hésitez pas à nous faire part de vos retours. 🙏`
  }
})

const waLink = computed(() => {
  if (!call.value?.company?.phone) return null
  const phone = call.value.company.phone.replace(/[^\d+]/g, '')
  return `https://wa.me/${phone}?text=${encodeURIComponent(waMessage.value)}`
})

onMounted(async () => { call.value = await followupApi.get(route.params.id as string) })

async function save() {
  if (!call.value) return
  await followupApi.update(call.value.id, {
    status: call.value.status,
    result: call.value.result,
    usage_rate: call.value.usage_rate,
    satisfaction_score: call.value.satisfaction_score,
    notes: call.value.notes,
  })
  router.back()
}
async function escalate() {
  if (!call.value) return
  await followupApi.escalate(call.value.id)
  router.back()
}
</script>

<template>
  <div v-if="!call" class="flex justify-center py-16">
    <AppSpinner size="lg" class="text-primary-600" />
  </div>

  <div v-else class="space-y-6">
    <div class="flex items-center gap-4">
      <AppButton variant="ghost" @click="router.back()">
        <ArrowLeftIcon class="w-4 h-4 mr-1" />
        Retour
      </AppButton>
      <h1 class="text-2xl font-bold text-gray-900">Appel {{ followupTypeLabel(call.call_type) }} - {{ call.company?.name }}</h1>
    </div>

    <AppCard>
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <AppSelect v-model="call.status" :options="statusOpts" label="Statut de l'appel" />
        <div>
          <AppSelect v-model="call.result" :options="resultOpts" label="Résultat de l'appel" />
          <p class="mt-1 text-xs text-gray-500">Comment s'est passé l'échange avec le client ?</p>
        </div>
        <AppInput v-if="call.call_type === 'j7'" v-model.number="call.usage_rate" type="number" label="Taux d'utilisation (%)" />
        <AppInput v-if="call.call_type === 'j30'" v-model.number="call.satisfaction_score" type="number" label="Note satisfaction (1-10)" />
      </div>
      <div class="mt-4">
        <label class="text-sm text-gray-600">Notes</label>
        <textarea v-model="call.notes" class="w-full mt-1 border rounded p-2" rows="5" />
      </div>

      <div class="mt-4 flex gap-3 flex-wrap">
        <AppButton variant="primary" @click="save">Enregistrer</AppButton>
        <AppButton variant="secondary" @click="escalate">Escalader</AppButton>
        <a
          v-if="waLink"
          :href="waLink"
          target="_blank"
          rel="noopener"
          class="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
        >
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.82 11.82 0 018.413 3.488 11.82 11.82 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.51 5.26l-.999 3.648 3.978-1.215zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
          Ouvrir WhatsApp
        </a>
      </div>

      <div v-if="waLink" class="mt-3 rounded-lg border border-green-200 bg-green-50 p-3">
        <p class="mb-1 text-xs font-medium text-green-700">Aperçu du message envoyé</p>
        <p class="whitespace-pre-line text-sm text-gray-700">{{ waMessage }}</p>
      </div>
    </AppCard>
  </div>
</template>
