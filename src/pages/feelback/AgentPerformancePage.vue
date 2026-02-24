<script setup lang="ts">
import { ref } from 'vue'
import AppCard from '@/components/ui/AppCard.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import StatCard from '@/components/data-display/StatCard.vue'
import BarChart from '@/components/charts/BarChart.vue'

const filterStartDate = ref('')
const filterEndDate = ref('')
const filterSite = ref('')

const siteOptions = [
  { label: 'Tous les sites', value: '' },
  { label: 'Siege Social', value: '1' },
  { label: 'Agence Nord', value: '2' },
  { label: 'Agence Est', value: '3' },
]

const agents = [
  { id: '1', name: 'Mamadou Diallo', site: 'Siege Social', total: 234, bon: 78, neutre: 15, mauvais: 7, rate: 78 },
  { id: '2', name: 'Aissata Traore', site: 'Agence Nord', total: 187, bon: 72, neutre: 18, mauvais: 10, rate: 72 },
  { id: '3', name: 'Oumarou Kone', site: 'Agence Est', total: 156, bon: 65, neutre: 22, mauvais: 13, rate: 65 },
  { id: '4', name: 'Fanta Coulibaly', site: 'Siege Social', total: 143, bon: 61, neutre: 25, mauvais: 14, rate: 61 },
  { id: '5', name: 'Bakary Sawadogo', site: 'Agence Nord', total: 128, bon: 55, neutre: 28, mauvais: 17, rate: 55 },
]

const barXData = agents.slice(0, 5).map((a) => a.name.split(' ')[0] || a.name)
const barSeries = [
  { name: 'Taux satisfaction (%)', data: agents.slice(0, 5).map((a) => a.rate) },
]
const barData: Array<{name: string, value: number}> = barXData.map((name, i) => ({ name, value: barSeries[0]?.data[i] ?? 0 }))
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <h1 class="text-2xl font-bold text-gray-900">Performance des agents</h1>
      <div class="flex flex-wrap gap-3">
        <AppInput v-model="filterStartDate" type="date" />
        <AppInput v-model="filterEndDate" type="date" />
        <AppSelect v-model="filterSite" :options="siteOptions" class="w-48" />
      </div>
    </div>

    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard title="Total agents" :value="agents.length" />
      <StatCard title="Meilleure satisfaction" value="78%" />
      <StatCard title="Satisfaction moyenne" :value="`${Math.round(agents.reduce((s, a) => s + a.rate, 0) / agents.length)}%`" />
      <StatCard title="Total reponses" :value="agents.reduce((s, a) => s + a.total, 0)" />
    </div>

    <AppCard title="Classement par satisfaction">
      <BarChart :data="barData" title="Top 5 agents" />
    </AppCard>

    <AppCard title="Detail par agent">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Agent</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Site</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bon %</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Neutre %</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mauvais %</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Satisfaction</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="agent in agents" :key="agent.id" class="hover:bg-gray-50">
              <td class="px-4 py-3 text-sm font-medium text-gray-900">{{ agent.name }}</td>
              <td class="px-4 py-3 text-sm text-gray-600">{{ agent.site }}</td>
              <td class="px-4 py-3 text-sm text-gray-600">{{ agent.total }}</td>
              <td class="px-4 py-3 text-sm text-green-600 font-medium">{{ agent.bon }}%</td>
              <td class="px-4 py-3 text-sm text-amber-600">{{ agent.neutre }}%</td>
              <td class="px-4 py-3 text-sm text-red-600">{{ agent.mauvais }}%</td>
              <td class="px-4 py-3">
                <div class="flex items-center gap-2">
                  <div class="flex-1 bg-gray-200 rounded-full h-2 w-20">
                    <div
                      class="h-2 rounded-full"
                      :class="agent.rate >= 70 ? 'bg-green-500' : agent.rate >= 50 ? 'bg-amber-500' : 'bg-red-500'"
                      :style="{ width: `${agent.rate}%` }"
                    ></div>
                  </div>
                  <span class="text-sm font-medium">{{ agent.rate }}%</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </AppCard>
  </div>
</template>
