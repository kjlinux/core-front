<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { subscriptionApi } from '@/services/api/subscription.api'
import { PLAN_LABELS } from '@/config/plan-features'
import { useToast } from '@/composables/useToast'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppSearchInput from '@/components/ui/AppSearchInput.vue'
import DataTable from '@/components/data-display/DataTable.vue'
import type { PlanCode } from '@/types/subscription'
import type { TableColumn } from '@/types/common'

const toast = useToast()

const companies = ref<any[]>([])
const analytics = ref<any>(null)
const isLoading = ref(false)
const editing = ref<any | null>(null)
const editPlan = ref<PlanCode>('freemium')
const editExpiresAt = ref<string>('')
const editWarrantyEndsAt = ref<string>('')

const search = ref('')
const currentPage = ref(1)
const perPage = 10

const planOptions = (Object.keys(PLAN_LABELS) as PlanCode[]).map((c) => ({ value: c, label: PLAN_LABELS[c] }))

const columns: TableColumn[] = [
  { key: 'name', label: 'Compagnie' },
  { key: 'subscription', label: 'Plan' },
  { key: 'expires', label: 'Echéance' },
  { key: 'next', label: 'Mois suivant' },
  { key: 'warranty', label: 'Garantie' },
  { key: 'actions', label: '', sortable: false, align: 'right' },
]

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return companies.value
  return companies.value.filter(
    (c) => (c.name ?? '').toLowerCase().includes(q) || (c.email ?? '').toLowerCase().includes(q),
  )
})

const sorted = computed(() =>
  [...filtered.value].sort(
    (a, b) =>
      new Date(b.subscription_expires_at ?? 0).getTime() -
      new Date(a.subscription_expires_at ?? 0).getTime(),
  ),
)

const pagedCompanies = computed(() =>
  sorted.value.slice((currentPage.value - 1) * perPage, currentPage.value * perPage),
)

const paginationObj = computed(() => ({
  currentPage: currentPage.value,
  perPage,
  total: sorted.value.length,
  totalPages: Math.max(1, Math.ceil(sorted.value.length / perPage)),
}))

async function load() {
  isLoading.value = true
  try {
    const [list, ana] = await Promise.all([subscriptionApi.adminList(), subscriptionApi.adminAnalytics()])
    companies.value = list.data
    analytics.value = ana
  } catch (e) {
    toast.error('Impossible de charger les abonnements', String((e as Error).message))
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
  try {
    await subscriptionApi.adminUpdate(editing.value.id, {
      plan_code: editPlan.value,
      expires_at: editExpiresAt.value || null,
      warranty_ends_at: editWarrantyEndsAt.value || null,
    })
    toast.success('Plan mis à jour')
    editing.value = null
    await load()
  } catch (e) {
    toast.error('Échec de la mise à jour', String((e as Error).message))
  }
}

function fmtDate(s: string | null) {
  return s ? new Date(s).toLocaleDateString('fr-FR') : '-'
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

    <AppCard padding="sm">
      <div class="flex flex-wrap gap-3 items-end">
        <div class="flex-1 min-w-55">
          <AppSearchInput v-model="search" placeholder="Rechercher (compagnie, email)..." />
        </div>
      </div>
    </AppCard>

    <AppCard padding="none">
      <DataTable
        :columns="columns"
        :data="pagedCompanies"
        :loading="isLoading"
        :pagination="paginationObj"
        default-sort-column="expires"
        default-sort-direction="desc"
        empty-message="Aucune compagnie"
        @page-change="(p) => (currentPage = p)"
      >
        <template #name="{ row }">
          {{ row.name }}<div class="text-xs text-gray-500">{{ row.email }}</div>
        </template>
        <template #subscription="{ row }">
          <AppBadge :variant="row.subscription === 'premium' ? 'success' : (row.subscription === 'garantie' ? 'info' : 'neutral')">
            {{ PLAN_LABELS[row.subscription as PlanCode] ?? row.subscription }}
          </AppBadge>
        </template>
        <template #expires="{ row }">{{ fmtDate(row.subscription_expires_at) }}</template>
        <template #next="{ row }">{{ row.subscription_next_period_paid ? 'Payé' : '-' }}</template>
        <template #warranty="{ row }">{{ fmtDate(row.warranty_ends_at) }}</template>
        <template #actions="{ row }">
          <div class="text-right" @click.stop>
            <AppButton variant="secondary" size="sm" @click="openEdit(row)">Changer le plan</AppButton>
          </div>
        </template>
      </DataTable>
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
