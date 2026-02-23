<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useOrderStore } from '@/stores/order.store'
import { useToast } from '@/composables/useToast'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppInput from '@/components/ui/AppInput.vue'

const router = useRouter()
const store = useOrderStore()
const toast = useToast()

const filterStatus = ref('')
const filterPayment = ref('')
const filterStartDate = ref('')

const statusOptions = [
  { label: 'Tous les statuts', value: '' },
  { label: 'En attente', value: 'pending' },
  { label: 'Confirmee', value: 'confirmed' },
  { label: 'En traitement', value: 'processing' },
  { label: 'Expediee', value: 'shipped' },
  { label: 'Livree', value: 'delivered' },
  { label: 'Annulee', value: 'cancelled' },
]

const paymentStatusOptions = [
  { label: 'Tous les paiements', value: '' },
  { label: 'En attente', value: 'pending' },
  { label: 'Paye', value: 'paid' },
  { label: 'Echec', value: 'failed' },
]

const statusVariants: Record<string, string> = {
  pending: 'warning', confirmed: 'info', processing: 'info',
  shipped: 'info', delivered: 'success', cancelled: 'danger',
}

const paymentVariants: Record<string, string> = {
  pending: 'warning', paid: 'success', failed: 'danger', refunded: 'default',
}

const statusLabels: Record<string, string> = {
  pending: 'En attente', confirmed: 'Confirmee', processing: 'En traitement',
  shipped: 'Expediee', delivered: 'Livree', cancelled: 'Annulee',
}

const filteredOrders = computed(() => {
  let list = store.orders
  if (filterStatus.value) list = list.filter((o) => o.status === filterStatus.value)
  if (filterPayment.value) list = list.filter((o) => o.paymentStatus === filterPayment.value)
  return list
})

function formatPrice(amount: number, currency = 'FCFA') {
  return `${amount.toLocaleString('fr-FR')} ${currency}`
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('fr-FR')
}

function handleExport() {
  toast.showSuccess('Export en cours...')
}

onMounted(async () => {
  await store.fetchAllOrders()
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-900">Toutes les commandes</h1>
      <AppButton variant="secondary" @click="handleExport">Exporter</AppButton>
    </div>

    <AppCard>
      <div class="flex flex-wrap gap-4 mb-6">
        <AppSelect v-model="filterStatus" :options="statusOptions" class="w-48" />
        <AppSelect v-model="filterPayment" :options="paymentStatusOptions" class="w-48" />
        <AppInput v-model="filterStartDate" type="date" placeholder="Date debut" />
      </div>

      <p class="text-sm text-gray-500 mb-4">{{ filteredOrders.length }} commande(s)</p>

      <div v-if="store.isLoading" class="flex justify-center py-12">
        <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">N° commande</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entreprise</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paiement</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="order in filteredOrders" :key="order.id" class="hover:bg-gray-50">
              <td class="px-4 py-3 font-mono text-sm font-medium text-gray-900">{{ order.orderNumber }}</td>
              <td class="px-4 py-3 text-sm text-gray-600">{{ order.companyName }}</td>
              <td class="px-4 py-3 text-sm text-gray-600">{{ formatDate(order.createdAt) }}</td>
              <td class="px-4 py-3 text-sm font-semibold text-primary">{{ formatPrice(order.total, order.currency) }}</td>
              <td class="px-4 py-3">
                <AppBadge :variant="(statusVariants[order.status] ?? 'default') as any">
                  {{ statusLabels[order.status] ?? order.status }}
                </AppBadge>
              </td>
              <td class="px-4 py-3">
                <AppBadge :variant="(paymentVariants[order.paymentStatus] ?? 'default') as any">
                  {{ order.paymentStatus }}
                </AppBadge>
              </td>
              <td class="px-4 py-3">
                <AppButton size="sm" variant="ghost" @click="router.push(`/marketplace/admin/orders/${order.id}`)">
                  Voir
                </AppButton>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </AppCard>
  </div>
</template>
