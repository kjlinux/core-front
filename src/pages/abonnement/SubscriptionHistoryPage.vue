<script setup lang="ts">
import { onMounted } from 'vue'
import { useSubscriptionStore } from '@/stores/subscription.store'
import { formatCurrency } from '@/utils/format'
import AppCard from '@/components/ui/AppCard.vue'
import AppBadge from '@/components/ui/AppBadge.vue'

const store = useSubscriptionStore()
onMounted(() => store.fetchHistory())
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-bold text-gray-900">Historique des paiements</h1>
    <AppCard>
      <table class="min-w-full text-sm">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-3 py-2 text-left">Date</th>
            <th class="px-3 py-2 text-left">De → Vers</th>
            <th class="px-3 py-2 text-right">Montant</th>
            <th class="px-3 py-2 text-left">Type</th>
            <th class="px-3 py-2 text-left">Statut</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in store.payments" :key="p.id" class="border-t">
            <td class="px-3 py-2">{{ new Date(p.created_at).toLocaleString('fr-FR') }}</td>
            <td class="px-3 py-2">{{ p.from_plan }} → {{ p.to_plan }}</td>
            <td class="px-3 py-2 text-right">{{ formatCurrency(p.amount_xof) }}</td>
            <td class="px-3 py-2">{{ p.is_prorata ? 'Prorata' : 'Mois plein' }}</td>
            <td class="px-3 py-2">
              <AppBadge :variant="p.payment_status === 'paid' ? 'success' : (p.payment_status === 'failed' ? 'danger' : 'neutral')">
                {{ p.payment_status }}
              </AppBadge>
            </td>
          </tr>
          <tr v-if="!store.payments.length"><td colspan="5" class="px-3 py-6 text-center text-gray-500">Aucun paiement.</td></tr>
        </tbody>
      </table>
    </AppCard>
  </div>
</template>
