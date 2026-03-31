<script setup lang="ts">
import { onMounted } from 'vue'
import { useTechnicienReport } from '@/composables/useTechnicienReport'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppBadge from '@/components/ui/AppBadge.vue'

const { isLoading, reportData, buildReport, generatePdf } = useTechnicienReport()

const statusVariant: Record<string, 'success' | 'warning' | 'danger'> = {
  ok: 'success',
  warning: 'warning',
  error: 'danger',
}

const statusLabel: Record<string, string> = {
  ok: 'OK',
  warning: 'Incomplet',
  error: 'Probleme',
}

onMounted(() => buildReport())
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Rapport de mise en service</h1>
        <p class="mt-1 text-sm text-gray-500">
          Bilan automatique de la configuration client — ce rapport peut etre telecharge en PDF.
        </p>
      </div>
      <div class="flex gap-3">
        <AppButton variant="ghost" :disabled="isLoading" @click="buildReport">
          Actualiser
        </AppButton>
        <AppButton
          v-if="reportData"
          variant="primary"
          :disabled="isLoading"
          @click="generatePdf(reportData!)"
        >
          Telecharger PDF
        </AppButton>
      </div>
    </div>

    <!-- Chargement -->
    <div v-if="isLoading" class="flex flex-col items-center justify-center py-20 text-gray-500">
      <div class="mb-3 h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
      <p class="text-sm">Collecte des donnees en cours...</p>
    </div>

    <template v-else-if="reportData">
      <!-- Score global -->
      <div
        class="rounded-xl p-6 text-white"
        :class="{
          'bg-green-600': reportData.globalScore >= 80,
          'bg-yellow-500': reportData.globalScore >= 50 && reportData.globalScore < 80,
          'bg-red-600': reportData.globalScore < 50,
        }"
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium opacity-90">Score global de mise en service</p>
            <p class="mt-1 text-4xl font-bold">{{ reportData.globalScore }}%</p>
            <p class="mt-1 text-sm opacity-80">
              {{ reportData.sections.filter((s) => s.status === 'ok').length }} /
              {{ reportData.sections.length }} sections completes
            </p>
          </div>
          <div class="text-right text-sm opacity-80">
            <p>{{ reportData.technicienName }}</p>
            <p>{{ reportData.companyName }}</p>
            <p class="mt-1">{{ reportData.generatedAt }}</p>
          </div>
        </div>

        <!-- Barre de progression -->
        <div class="mt-4 h-2 w-full rounded-full bg-white/30">
          <div
            class="h-2 rounded-full bg-white transition-all duration-500"
            :style="{ width: `${reportData.globalScore}%` }"
          />
        </div>
      </div>

      <!-- Sections -->
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
        <AppCard
          v-for="section in reportData.sections"
          :key="section.title"
          class="border"
          :class="{
            'border-green-200 bg-green-50': section.status === 'ok',
            'border-yellow-200 bg-yellow-50': section.status === 'warning',
            'border-red-200 bg-red-50': section.status === 'error',
          }"
        >
          <div class="flex items-start justify-between">
            <div>
              <h3 class="font-semibold text-gray-900">{{ section.title }}</h3>
              <p class="mt-0.5 text-sm text-gray-500">
                {{ section.done }} / {{ section.total }} realise(s)
              </p>
            </div>
            <AppBadge :variant="statusVariant[section.status]">
              {{ statusLabel[section.status] }}
            </AppBadge>
          </div>

          <!-- Barre de progression section -->
          <div class="mt-3 h-1.5 w-full rounded-full bg-gray-200">
            <div
              class="h-1.5 rounded-full transition-all duration-300"
              :class="{
                'bg-green-500': section.status === 'ok',
                'bg-yellow-500': section.status === 'warning',
                'bg-red-500': section.status === 'error',
              }"
              :style="{ width: section.total > 0 ? `${Math.round((section.done / section.total) * 100)}%` : '0%' }"
            />
          </div>

          <!-- Points d'attention -->
          <ul v-if="section.issues.length > 0" class="mt-3 space-y-1">
            <li
              v-for="(issue, i) in section.issues.slice(0, 5)"
              :key="i"
              class="text-xs text-red-700"
            >
              • {{ issue }}
            </li>
            <li v-if="section.issues.length > 5" class="text-xs text-gray-500 italic">
              ... et {{ section.issues.length - 5 }} autre(s) point(s)
            </li>
          </ul>
          <p v-else class="mt-3 text-xs text-green-700">
            Configuration complete, aucun point d'attention.
          </p>
        </AppCard>
      </div>

      <!-- Note pied de page -->
      <p class="text-center text-xs text-gray-400">
        Ce rapport est genere automatiquement a partir des donnees du systeme au moment de la consultation.
        Cliquez sur "Telecharger PDF" pour obtenir un document imprimable.
      </p>
    </template>
  </div>
</template>
