<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { followupApi, type ClientFollowupCall } from '@/services/api/followup.api'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppSelect from '@/components/ui/AppSelect.vue'

const route = useRoute()
const router = useRouter()
const call = ref<ClientFollowupCall | null>(null)

const statusOpts = ['pending','done','skipped','escalated'].map((v) => ({ value: v, label: v }))
const resultOpts = [{ value: '', label: '—' }, { value: 'ok', label: 'OK' }, { value: 'partial', label: 'Partiel' }, { value: 'problem', label: 'Problème' }]

const waLink = computed(() => {
  if (!call.value?.company?.phone) return null
  const text = call.value.call_type === 'j30'
    ? `Bonjour, suite à notre appel de bilan, voici votre rapport du premier mois...`
    : `Bonjour, suivi de votre installation TANGA GROUP — type ${call.value.call_type.toUpperCase()}.`
  const phone = call.value.company.phone.replace(/[^\d+]/g, '')
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
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
  <div v-if="call" class="space-y-6 max-w-3xl">
    <h1 class="text-2xl font-bold text-gray-900">Appel {{ call.call_type.toUpperCase() }} — {{ call.company?.name }}</h1>

    <AppCard>
      <div class="grid grid-cols-2 gap-4">
        <AppSelect v-model="call.status" :options="statusOpts" label="Statut" />
        <AppSelect v-model="call.result" :options="resultOpts" label="Résultat" />
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
        <a v-if="waLink" :href="waLink" target="_blank" class="text-green-600 underline self-center">Ouvrir WhatsApp</a>
      </div>
    </AppCard>
  </div>
</template>
