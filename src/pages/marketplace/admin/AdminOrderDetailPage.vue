<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useOrderStore } from '@/stores/order.store'
import { useToast } from '@/composables/useToast'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppInput from '@/components/ui/AppInput.vue'

const route = useRoute()
const router = useRouter()
const store = useOrderStore()
const toast = useToast()

const orderId = route.params.id as string
const order = computed(() => store.currentOrder)

const showTrackingModal = ref(false)
const newStatus = ref('')
const trackingInfo = ref({ carrier: '', trackingNumber: '' })

const statusOptions = [
  { label: 'En attente', value: 'pending' },
  { label: 'Confirmee', value: 'confirmed' },
  { label: 'En traitement', value: 'processing' },
  { label: 'Expediee', value: 'shipped' },
  { label: 'Livree', value: 'delivered' },
  { label: 'Annulee', value: 'cancelled' },
]

const statusLabels: Record<string, string> = {
  pending: 'En attente', confirmed: 'Confirmee', processing: 'En traitement',
  shipped: 'Expediee', delivered: 'Livree', cancelled: 'Annulee',
}

const statusVariants: Record<string, string> = {
  pending: 'warning', confirmed: 'info', processing: 'info',
  shipped: 'info', delivered: 'success', cancelled: 'danger',
}

function formatPrice(amount: number, currency = 'FCFA') {
  return `${amount.toLocaleString('fr-FR')} ${currency}`
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('fr-FR')
}

function updateStatus() {
  if (newStatus.value) {
    toast.showSuccess(`Statut mis a jour : ${statusLabels[newStatus.value]}`)
  }
}

function saveTracking() {
  toast.showSuccess('Informations de suivi enregistrees')
  showTrackingModal.value = false
}

onMounted(async () => {
  await store.fetchOrder(orderId)
  if (order.value) {
    newStatus.value = order.value.status
  }
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center gap-4">
      <AppButton variant="ghost" @click="router.push('/marketplace/admin/orders')">&larr; Retour</AppButton>
      <h1 class="text-2xl font-bold text-gray-900">Detail commande (Admin)</h1>
    </div>

    <div v-if="store.isLoading && !order" class="flex justify-center py-12">
      <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
    </div>

    <template v-else-if="order">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 space-y-4">
          <AppCard title="Articles">
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Produit</th>
                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Qte</th>
                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Prix U.</th>
                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                  <tr v-for="item in order.items" :key="item.productId">
                    <td class="px-4 py-2 text-sm font-medium text-gray-900">{{ item.productName }}</td>
                    <td class="px-4 py-2 text-sm text-gray-600">{{ item.quantity }}</td>
                    <td class="px-4 py-2 text-sm text-gray-600">{{ formatPrice(item.unitPrice, order.currency) }}</td>
                    <td class="px-4 py-2 text-sm font-semibold">{{ formatPrice(item.totalPrice, order.currency) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="mt-3 pt-3 border-t text-right space-y-1">
              <p class="text-sm text-gray-600">Sous-total : {{ formatPrice(order.subtotal, order.currency) }}</p>
              <p class="text-sm text-gray-600">Livraison : {{ formatPrice(order.deliveryFee, order.currency) }}</p>
              <p class="font-bold text-primary">Total : {{ formatPrice(order.total, order.currency) }}</p>
            </div>
          </AppCard>

          <AppCard title="Adresse de livraison">
            <div class="text-sm space-y-1">
              <p class="font-semibold text-gray-900">{{ order.deliveryAddress.fullName }}</p>
              <p class="text-gray-600">{{ order.deliveryAddress.phone }}</p>
              <p class="text-gray-600">{{ order.deliveryAddress.street }}</p>
              <p class="text-gray-600">{{ order.deliveryAddress.city }}, {{ order.deliveryAddress.country }}</p>
            </div>
          </AppCard>
        </div>

        <div class="space-y-4">
          <AppCard title="Statut de la commande">
            <div class="space-y-3">
              <div>
                <p class="text-xs text-gray-500">Statut actuel</p>
                <AppBadge :variant="(statusVariants[order.status] ?? 'neutral') as any">
                  {{ statusLabels[order.status] }}
                </AppBadge>
              </div>
              <div>
                <label class="text-sm font-medium text-gray-700">Nouveau statut</label>
                <AppSelect v-model="newStatus" :options="statusOptions" class="mt-1" />
              </div>
              <AppButton variant="primary" class="w-full" @click="updateStatus">Mettre a jour</AppButton>
            </div>
          </AppCard>

          <AppCard title="Informations">
            <div class="space-y-2 text-sm">
              <div>
                <p class="text-gray-500">Entreprise</p>
                <p class="font-medium text-gray-900">{{ order.companyName }}</p>
              </div>
              <div>
                <p class="text-gray-500">Date</p>
                <p class="font-medium">{{ formatDate(order.createdAt) }}</p>
              </div>
              <div>
                <p class="text-gray-500">Paiement</p>
                <p class="font-medium">{{ order.paymentMethod }} - {{ order.paymentStatus }}</p>
              </div>
            </div>
          </AppCard>

          <AppCard title="Actions">
            <div class="space-y-2">
              <AppButton variant="secondary" class="w-full" @click="showTrackingModal = true">
                Ajouter suivi livraison
              </AppButton>
              <AppButton
                v-if="order.invoiceUrl"
                variant="ghost"
                class="w-full"
              >
                Telecharger facture
              </AppButton>
            </div>
          </AppCard>
        </div>
      </div>
    </template>

    <AppModal v-model="showTrackingModal" title="Informations de suivi" size="sm">
      <div class="space-y-4">
        <AppInput v-model="trackingInfo.carrier" label="Transporteur" placeholder="Ex: DHL, Colissimo" />
        <AppInput v-model="trackingInfo.trackingNumber" label="Numero de suivi" placeholder="Ex: 1Z999AA10123456784" />
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <AppButton variant="secondary" @click="showTrackingModal = false">Annuler</AppButton>
          <AppButton variant="primary" @click="saveTracking">Enregistrer</AppButton>
        </div>
      </template>
    </AppModal>
  </div>
</template>
