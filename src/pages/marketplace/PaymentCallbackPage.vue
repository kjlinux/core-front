<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import AppButton from '@/components/ui/AppButton.vue'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const status = computed(() => route.query.status as string)
const orderNumber = computed(() => route.query.orderNumber as string)

onMounted(() => {
  if (status.value === 'success') {
    setTimeout(() => {
      router.push('/marketplace/orders')
    }, 5000)
  }
})
</script>

<template>
  <div class="flex items-center justify-center min-h-96">
    <div class="text-center max-w-md space-y-6 p-8">
      <!-- Processing -->
      <div v-if="!status">
        <div class="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
        <h2 class="text-xl font-bold text-gray-900 mt-4">{{ t('marketplace.paymentVerifying') }}</h2>
        <p class="text-gray-500 text-sm mt-2">{{ t('marketplace.paymentWait') }}</p>
      </div>

      <!-- Success -->
      <div v-else-if="status === 'success'" class="space-y-4">
        <div class="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
          <svg class="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 class="text-2xl font-bold text-gray-900">{{ t('marketplace.paymentSuccess') }}</h2>
        <p class="text-gray-600">{{ t('marketplace.paymentSuccessMsg') }}</p>
        <p v-if="orderNumber" class="text-sm text-gray-500">
          {{ t('marketplace.orderLabel') }} <span class="font-bold text-gray-900">{{ orderNumber }}</span>
        </p>
        <p class="text-xs text-gray-400">{{ t('marketplace.autoRedirect') }}</p>
        <AppButton variant="primary" @click="router.push('/marketplace/orders')">
          {{ t('marketplace.viewMyOrders') }}
        </AppButton>
      </div>

      <!-- Failed -->
      <div v-else-if="status === 'failed'" class="space-y-4">
        <div class="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto">
          <svg class="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 class="text-2xl font-bold text-gray-900">{{ t('marketplace.paymentFailed') }}</h2>
        <p class="text-gray-600">{{ t('marketplace.paymentFailedMsg') }}</p>
        <div class="flex flex-col gap-3">
          <AppButton variant="primary" @click="router.push('/marketplace/checkout')">
            {{ t('marketplace.retryPayment') }}
          </AppButton>
          <AppButton variant="secondary" @click="router.push('/marketplace/orders')">
            {{ t('marketplace.viewMyOrders') }}
          </AppButton>
        </div>
      </div>
    </div>
  </div>
</template>
