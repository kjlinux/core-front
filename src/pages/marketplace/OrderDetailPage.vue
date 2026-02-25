<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useOrderStore } from '@/stores/order.store'
import { useToast } from '@/composables/useToast'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppBadge from '@/components/ui/AppBadge.vue'

const route = useRoute()
const router = useRouter()
const store = useOrderStore()
const toast = useToast()

const orderId = route.params.id as string
const order = computed(() => store.currentOrder)

const statusSteps = ['pending', 'confirmed', 'processing', 'shipped', 'delivered']
const stepLabels: Record<string, string> = {
  pending: 'En attente',
  confirmed: 'Confirmee',
  processing: 'En traitement',
  shipped: 'Expediee',
  delivered: 'Livree',
}

const paymentMethodLabels: Record<string, string> = {
  mobile_money: 'LigdiCash / Mobile Money',
  bank_card: 'Carte bancaire',
  manual: 'Paiement manuel',
}

const paymentStatusLabels: Record<string, string> = {
  pending: 'En attente',
  paid: 'Paye',
  failed: 'Echec',
  refunded: 'Rembourse',
}

function formatPrice(amount: number, currency = 'FCFA') {
  return `${amount.toLocaleString('fr-FR')} ${currency}`
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('fr-FR')
}

function getCurrentStepIndex() {
  if (!order.value) return -1
  if (order.value.status === 'cancelled') return -1
  return statusSteps.indexOf(order.value.status)
}

async function cancelOrder() {
  try {
    await store.cancelOrder(orderId)
    toast.showSuccess('Commande annulee')
  } catch {
    toast.showError("Erreur lors de l'annulation")
  }
}

const openInvoice = (url?: string) => {
  if (url) window.open(url, '_blank')
}

onMounted(async () => {
  await store.fetchOrder(orderId)
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center gap-4">
      <AppButton variant="ghost" @click="router.push('/marketplace/orders')">&larr; Mes commandes</AppButton>
      <h1 class="text-2xl font-bold text-gray-900">
        Commande {{ order?.orderNumber ?? orderId }}
      </h1>
    </div>

    <div v-if="store.isLoading && !order" class="flex justify-center py-12">
      <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
    </div>

    <template v-else-if="order">
      <!-- Status stepper -->
      <AppCard v-if="order.status !== 'cancelled'" title="Suivi de la commande">
        <div class="flex items-center overflow-x-auto">
          <template v-for="(status, index) in statusSteps" :key="status">
            <div class="flex flex-col items-center gap-1 flex-shrink-0">
              <div
                class="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                :class="index <= getCurrentStepIndex() ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-400'"
              >{{ index + 1 }}</div>
              <span class="text-xs text-center" :class="index <= getCurrentStepIndex() ? 'text-primary-600 font-medium' : 'text-gray-400'">
                {{ stepLabels[status] }}
              </span>
            </div>
            <div v-if="index < statusSteps.length - 1" class="h-0.5 flex-1 min-w-8"
              :class="index < getCurrentStepIndex() ? 'bg-primary-600' : 'bg-gray-200'"></div>
          </template>
        </div>
      </AppCard>
      <div v-else class="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
        Cette commande a ete annulee
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Items -->
        <div class="lg:col-span-2 space-y-4">
          <AppCard title="Articles commandes">
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produit</th>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qte</th>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prix unitaire</th>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                  <tr v-for="item in order.items" :key="item.productId">
                    <td class="px-4 py-3 text-sm font-medium text-gray-900">{{ item.productName }}</td>
                    <td class="px-4 py-3 text-sm text-gray-600">{{ item.quantity }}</td>
                    <td class="px-4 py-3 text-sm text-gray-600">{{ formatPrice(item.unitPrice, order.currency) }}</td>
                    <td class="px-4 py-3 text-sm font-semibold">{{ formatPrice(item.totalPrice, order.currency) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="mt-4 pt-4 border-t space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-600">Sous-total</span>
                <span>{{ formatPrice(order.subtotal, order.currency) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Livraison</span>
                <span>{{ formatPrice(order.deliveryFee, order.currency) }}</span>
              </div>
              <div class="flex justify-between font-bold text-base pt-1 border-t">
                <span>Total</span>
                <span class="text-primary">{{ formatPrice(order.total, order.currency) }}</span>
              </div>
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

        <!-- Sidebar -->
        <div class="space-y-4">
          <AppCard title="Paiement">
            <div class="space-y-2 text-sm">
              <div>
                <p class="text-gray-500">Methode</p>
                <p class="font-medium">{{ paymentMethodLabels[order.paymentMethod] }}</p>
              </div>
              <div>
                <p class="text-gray-500">Statut</p>
                <AppBadge :variant="order.paymentStatus === 'paid' ? 'success' : order.paymentStatus === 'failed' ? 'danger' : 'warning'">
                  {{ paymentStatusLabels[order.paymentStatus] }}
                </AppBadge>
              </div>
            </div>
          </AppCard>

          <AppCard title="Actions">
            <div class="space-y-3">
              <AppButton
                v-if="order.invoiceUrl"
                variant="secondary"
                class="w-full"
                @click="openInvoice(order.invoiceUrl)"
              >
                Telecharger la facture
              </AppButton>
              <AppButton v-else variant="ghost" class="w-full" disabled>
                Facture non disponible
              </AppButton>
              <AppButton
                v-if="order.status === 'pending'"
                variant="danger"
                class="w-full"
                @click="cancelOrder"
              >
                Annuler la commande
              </AppButton>
            </div>
          </AppCard>

          <AppCard title="Informations">
            <div class="space-y-2 text-sm">
              <div>
                <p class="text-gray-500">Date de commande</p>
                <p class="font-medium">{{ formatDate(order.createdAt) }}</p>
              </div>
              <div>
                <p class="text-gray-500">Derniere mise a jour</p>
                <p class="font-medium">{{ formatDate(order.updatedAt) }}</p>
              </div>
            </div>
          </AppCard>
        </div>
      </div>
    </template>

    <div v-else class="text-center py-12 text-gray-500">Commande introuvable</div>
  </div>
</template>
