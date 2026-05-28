<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { subscriptionApi } from '@/services/api/subscription.api'
import { PLAN_LABELS } from '@/config/plan-features'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppInput from '@/components/ui/AppInput.vue'
import type { PlanCode } from '@/types/subscription'

const companies = ref<any[]>([])
const analytics = ref<any>(null)
const isLoading = ref(false)
const editing = ref<any | null>(null)
const editPlan = ref<PlanCode>('freemium')
const editExpiresAt = ref<string>('')
const editWarrantyEndsAt = ref<string>('')

const planOptions = (Object.keys(PLAN_LABELS) as PlanCode[]).map((c) => ({ value: c, label: PLAN_LABELS[c] }))

async function load() {
  isLoading.value = true
  try {
    const [list, ana] = await Promise.all([subscriptionApi.adminList(), subscriptionApi.adminAnalytics()])
    companies.value = list.data
    analytics.value = ana
  } finally {
    isLoading.value = false
  }
}

function openEdit(c: any) {
  editing.value = c
  editPlan.value = c.subscription
  editExpiresAt.value = c.subscription_expires_at?.slice(0, 10) ?? ''
  editWarrantyEndsAt.value = c.warranty_ends_at?.slice(0, 10) ?? ''
}
async function save() {
  if (!editing.value) return
  await subscriptionApi.adminUpdate(editing.value.id, {
    plan_code: editPlan.value,
    expires_at: editExpiresAt.value || null,
    warranty_ends_at: editWarrantyEndsAt.value || null,
  })
  editing.value = null
  await load()
}

onMounted(load)
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-bold text-gray-900">Gestion des abonnements</h1>

    <div v-if="analytics" class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <AppCard>
        <div class="text-xs text-gray-500 uppercase">Revenu du mois</div>
        <div class="text-2xl font-bold">{{ Number(analytics.revenue_current_month_xof).toLocaleString('fr-FR') }} FCFA</div>
      </AppCard>
      <AppCard>
        <div class="text-xs text-gray-500 uppercase">Répartition par plan</div>
        <ul class="text-sm mt-1">
          <li v-for="(total, code) in analytics.by_plan" :key="code">
            <strong>{{ PLAN_LABELS[code as PlanCode] ?? code }}</strong> : {{ total }}
          </li>
        </ul>
      </AppCard>
      <AppCard>
        <div class="text-xs text-gray-500 uppercase">Compagnies suivies</div>
        <div class="text-2xl font-bold">{{ companies.length }}</div>
      </AppCard>
    </div>

    <AppCard>
      <table class="min-w-full text-sm">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-3 py-2 text-left">Compagnie</th>
            <th class="px-3 py-2 text-left">Plan</th>
            <th class="px-3 py-2 text-left">Echéance</th>
            <th class="px-3 py-2 text-left">Mois suivant</th>
            <th class="px-3 py-2 text-left">Garantie</th>
            <th class="px-3 py-2"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in companies" :key="c.id" class="border-t">
            <td class="px-3 py-2">{{ c.name }}<div class="text-xs text-gray-500">{{ c.email }}</div></td>
            <td class="px-3 py-2">
              <AppBadge :variant="c.subscription === 'premium' ? 'success' : (c.subscription === 'garantie' ? 'info' : 'neutral')">
                {{ PLAN_LABELS[c.subscription as PlanCode] ?? c.subscription }}
              </AppBadge>
            </td>
            <td class="px-3 py-2">{{ c.subscription_expires_at ? new Date(c.subscription_expires_at).toLocaleDateString('fr-FR') : '-' }}</td>
            <td class="px-3 py-2">{{ c.subscription_next_period_paid ? '✓ payé' : '-' }}</td>
            <td class="px-3 py-2">{{ c.warranty_ends_at ? new Date(c.warranty_ends_at).toLocaleDateString('fr-FR') : '-' }}</td>
            <td class="px-3 py-2 text-right">
              <AppButton variant="secondary" size="sm" @click="openEdit(c)">Changer le plan</AppButton>
            </td>
          </tr>
        </tbody>
      </table>
    </AppCard>

    <AppModal v-if="editing" :model-value="!!editing" :title="`Changer le plan : ${editing.name}`" @update:model-value="editing = null">
      <div class="space-y-3">
        <AppSelect v-model="editPlan" :options="planOptions" label="Plan" />
        <AppInput v-model="editExpiresAt" type="date" label="Date d'échéance (optionnelle)" />
        <AppInput v-model="editWarrantyEndsAt" type="date" label="Fin de garantie matérielle (optionnelle)" />
        <p class="text-xs text-gray-500">Aucun paiement n'est déclenché. La modification est immédiate et enregistrée dans l'audit.</p>
      </div>
      <template #footer>
        <AppButton variant="secondary" @click="editing = null">Annuler</AppButton>
        <AppButton variant="primary" @click="save">Enregistrer</AppButton>
      </template>
    </AppModal>
  </div>
</template>
