<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useOrderStore } from '@/stores/order.store'
import { useToast } from '@/composables/useToast'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppConfirmDialog from '@/components/ui/AppConfirmDialog.vue'

const router = useRouter()
const store = useOrderStore()
const toast = useToast()

const filterStatus = ref('')
const showCancelDialog = ref(false)
const cancelOrderId = ref('')

const statusOptions = [
  { label: 'Toutes les commandes', value: '' },
  { label: 'En attente', value: 'pending' },
  { label: 'Confirmee', value: 'confirmed' },
  { label: 'En traitement', value: 'processing' },
  { label: 'Expediee', value: 'shipped' },
  { label: 'Livree', value: 'delivered' },
  { label: 'Annulee', value: 'cancelled' },
]

const statusLabels: Record<string, string> = {
  pending: 'En attente',
  confirmed: 'Confirmee',
  processing: 'En traitement',
  shipped: 'Expediee',
  delivered: 'Livree',
  cancelled: 'Annulee',
}

const statusVariants: Record<string, string> = {
  pending: 'warning',
  confirmed: 'info',
  processing: 'info',
  shipped: 'info',
  delivered: 'success',
  cancelled: 'danger',
}

const paymentLabels: Record<string, string> = {
  pending: 'En attente',
  paid: 'Paye',
  failed: 'Echec',
  refunded: 'Rembourse',
}

const paymentVariants: Record<string, string> = {
  pending: 'warning',
  paid: 'success',
  failed: 'danger',
  refunded: 'default',
}

const filteredOrders = computed(() => {
  if (!filterStatus.value) return store.orders
  return store.orders.filter((o) => o.status === filterStatus.value)
})

function formatPrice(amount: number, currency = 'FCFA') {
  return `${amount.toLocaleString('fr-FR')} ${currency}`
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('fr-FR')
}

function openCancelDialog(orderId: string) {
  cancelOrderId.value = orderId
  showCancelDialog.value = true
}

async function confirmCancel() {
  try {
    await store.cancelOrder(cancelOrderId.value)
    toast.showSuccess('Commande annulee')
  } catch {
    toast.showError("Erreur lors de l'annulation")
  }
}

onMounted(async () => {
  await store.fetchOrders()
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-900">Mes commandes</h1>
      <AppButton variant="secondary" @click="router.push('/marketplace')">Nouveau catalogue</AppButton>
    </div>

    <AppCard>
      <div class="mb-6">
        <AppSelect v-model="filterStatus" :options="statusOptions" class="w-60" />
      </div>

      <div v-if="store.isLoading" class="flex justify-center py-12">
        <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>

      <div v-else-if="filteredOrders.length === 0" class="text-center py-12 text-gray-500">
        Aucune commande trouvee
      </div>

      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">N° commande</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Articles</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paiement</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="order in filteredOrders" :key="order.id" class="hover:bg-gray-50">
              <td class="px-4 py-3 font-mono text-sm font-medium text-gray-900">{{ order.orderNumber }}</td>
              <td class="px-4 py-3 text-sm text-gray-600">{{ formatDate(order.createdAt) }}</td>
              <td class="px-4 py-3 text-sm text-gray-600">{{ order.items.length }} article(s)</td>
              <td class="px-4 py-3 text-sm font-semibold text-primary">{{ formatPrice(order.total, order.currency) }}</td>
              <td class="px-4 py-3">
                <AppBadge :variant="(statusVariants[order.status] ?? 'default') as any">
                  {{ statusLabels[order.status] ?? order.status }}
                </AppBadge>
              </td>
              <td class="px-4 py-3">
                <AppBadge :variant="(paymentVariants[order.paymentStatus] ?? 'default') as any">
                  {{ paymentLabels[order.paymentStatus] ?? order.paymentStatus }}
                </AppBadge>
              </td>
              <td class="px-4 py-3">
                <div class="flex gap-2">
                  <AppButton size="sm" variant="ghost" @click="router.push(`/marketplace/orders/${order.id}`)">
                    Voir
                  </AppButton>
                  <AppButton
                    v-if="order.status === 'pending'"
                    size="sm"
                    variant="danger"
                    @click="openCancelDialog(order.id)"
                  >
                    Annuler
                  </AppButton>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </AppCard>

    <AppConfirmDialog
      v-model="showCancelDialog"
      title="Annuler la commande"
      message="Etes-vous sur de vouloir annuler cette commande ? Cette action est irreversible."
      @confirm="confirmCancel"
    />
  </div>
</template>
