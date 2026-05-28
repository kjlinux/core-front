<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { followupApi } from '@/services/api/followup.api'
import AppCard from '@/components/ui/AppCard.vue'

const data = ref<any>(null)
onMounted(async () => { data.value = await followupApi.dashboard() })
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-bold text-gray-900">Tableau de bord - Routine clients</h1>

    <div v-if="data" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <AppCard>
        <div class="text-xs text-gray-500 uppercase">Appels J+2 en retard</div>
        <div class="text-3xl font-bold text-red-600">{{ data.missing_j2_overdue }}</div>
      </AppCard>
      <AppCard>
        <div class="text-xs text-gray-500 uppercase">Taux d'utilisation moyen (J+7)</div>
        <div class="text-3xl font-bold">{{ data.avg_usage_j7 ?? '-' }}{{ data.avg_usage_j7 ? '%' : '' }}</div>
      </AppCard>
      <AppCard>
        <div class="text-xs text-gray-500 uppercase">Note satisfaction moyenne (J+30)</div>
        <div class="text-3xl font-bold">{{ data.avg_satisfaction_j30 ?? '-' }}{{ data.avg_satisfaction_j30 ? '/10' : '' }}</div>
      </AppCard>
      <AppCard>
        <div class="text-xs text-gray-500 uppercase mb-1">Statuts</div>
        <ul class="text-sm">
          <li v-for="(n, s) in data.by_status" :key="s"><strong>{{ s }}</strong> : {{ n }}</li>
        </ul>
      </AppCard>
    </div>
  </div>
</template>
