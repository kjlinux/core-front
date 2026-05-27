<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSubscriptionStore } from '@/stores/subscription.store'
import { useToast } from '@/composables/useToast'
import { PLAN_LABELS, PLAN_PRICES_XOF } from '@/config/plan-features'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import { formatCurrency } from '@/utils/format'
import type { PlanCode } from '@/types/subscription'

const router = useRouter()
const store = useSubscriptionStore()
const toast = useToast()

onMounted(() => store.fetchMe())

async function handlePayNext() {
  try {
    const r = await store.payNextPeriod()
    if (r.payment_url) window.location.href = r.payment_url
  } catch (e: any) {
    toast.error(e.response?.data?.message ?? e.message)
  }
}
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-bold text-gray-900">Mon abonnement</h1>

    <AppCard v-if="store.state">
      <div class="flex items-center justify-between mb-4">
        <div>
          <div class="text-sm text-gray-500">Plan actuel</div>
          <div class="text-xl font-semibold">
            {{ PLAN_LABELS[store.state.subscription as PlanCode] }}
            <span class="text-gray-400 text-base ml-2">{{ formatCurrency(PLAN_PRICES_XOF[store.state.subscription as PlanCode]) }} / mois</span>
          </div>
        </div>
        <AppBadge :variant="(store.state.is_active || store.state.subscription === 'freemium') ? 'success' : 'neutral'">
          {{ (store.state.is_active || store.state.subscription === 'freemium') ? 'Actif' : 'Inactif' }}
        </AppBadge>
      </div>

      <div v-if="store.state.expires_at" class="text-sm text-gray-600 mb-2">
        Echéance : <strong>{{ new Date(store.state.expires_at).toLocaleDateString('fr-FR') }}</strong>
      </div>
      <div v-if="store.state.next_period_paid && store.state.next_expires_at" class="text-sm text-green-700 mb-2">
        ✓ Mois suivant payé — couvert jusqu'au <strong>{{ new Date(store.state.next_expires_at).toLocaleDateString('fr-FR') }}</strong>
      </div>
      <div v-if="store.state.warranty_ends_at" class="text-sm text-gray-600">
        Garantie matériel jusqu'au {{ new Date(store.state.warranty_ends_at).toLocaleDateString('fr-FR') }}
      </div>

      <div class="mt-6 flex gap-3 flex-wrap">
        <AppButton variant="primary" @click="router.push({ name: 'abonnement-plans' })">
          Changer de plan
        </AppButton>
        <AppButton
          v-if="store.state.is_active && !store.state.next_period_paid"
          variant="secondary"
          @click="handlePayNext"
        >
          Payer le mois suivant
        </AppButton>
        <AppButton variant="tertiary" @click="router.push({ name: 'abonnement-history' })">
          Historique des paiements
        </AppButton>
      </div>
    </AppCard>
  </div>
</template>
