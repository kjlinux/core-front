<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useReviewStore } from '@/stores/review.store'
import { useAuthStore } from '@/stores/auth.store'
import { useToast } from '@/composables/useToast'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import QuestionBuilder from '@/components/review/QuestionBuilder.vue'
import ChannelBuilder from '@/components/review/ChannelBuilder.vue'
import PieChart from '@/components/charts/PieChart.vue'
import { QrCodeIcon, DocumentArrowDownIcon, ArrowPathIcon, Cog6ToothIcon, ChartBarIcon } from '@heroicons/vue/24/outline'

const { t } = useI18n()
const reviewStore = useReviewStore()
const authStore = useAuthStore()
const toast = useToast()

const activeTab = ref<'qr' | 'questionnaire' | 'stats'>('qr')
const isSubmitting = ref(false)
const isGeneratingPdf = ref(false)

const localQuestions = ref<{ text: string; orderIndex: number }[]>([])
const localChannels = ref<{ name: string }[]>([])

const companyName = computed(() => authStore.user?.companyName ?? '')
const config = computed(() => reviewStore.config)
const stats = computed(() => reviewStore.stats)
const submissions = computed(() => reviewStore.submissions)

const tabs = computed(() => [
  { key: 'qr', label: t('feelback.qrCodeTab'), icon: QrCodeIcon },
  { key: 'questionnaire', label: t('feelback.questionnaireTab'), icon: Cog6ToothIcon },
  { key: 'stats', label: t('feelback.statsTab'), icon: ChartBarIcon },
])

onMounted(async () => {
  await reviewStore.fetchConfig()
  if (config.value) {
    localQuestions.value = config.value.questions.map((q) => ({ text: q.text, orderIndex: q.orderIndex }))
    localChannels.value = config.value.channels.map((c) => ({ name: c.name }))
  }
  await reviewStore.fetchStats()
  await reviewStore.fetchSubmissions()
})

async function saveQuestionnaire() {
  const validQuestions = localQuestions.value.filter((q) => q.text.trim())
  const validChannels = localChannels.value.filter((c) => c.name.trim())

  if (validQuestions.length === 0) {
    toast.error(t('feelback.addQuestionFirst'))
    return
  }

  isSubmitting.value = true
  try {
    await reviewStore.saveConfig({
      questions: validQuestions,
      channels: validChannels,
    })
    toast.success(t('feelback.questionnaireSaved'))
  } catch {
    toast.error(t('feelback.questionnaireSaveError'))
  } finally {
    isSubmitting.value = false
  }
}

async function regenerateToken() {
  if (!confirm(t('feelback.regenerateWarning'))) return
  isSubmitting.value = true
  try {
    await reviewStore.regenerateToken()
    toast.success(t('feelback.regenerateLink'))
  } catch {
    toast.error(t('feelback.questionnaireSaveError'))
  } finally {
    isSubmitting.value = false
  }
}

async function generateAndDownloadPdf() {
  if (!config.value) {
    toast.error(t('feelback.noQrConfigured'))
    return
  }

  isGeneratingPdf.value = true
  try {
    const { default: QRCode } = await import('qrcode')
    const { jsPDF } = await import('jspdf')

    const reviewUrl = config.value.reviewUrl
    const qrDataUrl = await QRCode.toDataURL(reviewUrl, {
      width: 400,
      margin: 2,
      color: { dark: '#000000', light: '#FFFFFF' },
    })

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const pageWidth = doc.internal.pageSize.getWidth()
    const centerX = pageWidth / 2

    doc.setFillColor(30, 41, 59)
    doc.rect(0, 0, pageWidth, 45, 'F')

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(22)
    doc.setFont('helvetica', 'bold')
    doc.text(companyName.value, centerX, 20, { align: 'center' })

    doc.setFontSize(13)
    doc.setFont('helvetica', 'normal')
    doc.text('Donnez-nous votre avis', centerX, 33, { align: 'center' })

    const qrSize = 110
    const qrX = (pageWidth - qrSize) / 2
    doc.addImage(qrDataUrl, 'PNG', qrX, 55, qrSize, qrSize)

    doc.setDrawColor(200, 200, 200)
    doc.setLineWidth(0.5)
    doc.rect(qrX - 5, 50, qrSize + 10, qrSize + 10)

    doc.setTextColor(30, 30, 30)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text(t('feelback.scanQrInstruction'), centerX, 180, { align: 'center' })

    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 100, 100)
    doc.text(t('feelback.scanQrHint'), centerX, 190, { align: 'center' })
    doc.text(t('feelback.scanQrHint2'), centerX, 198, { align: 'center' })

    doc.save(`avis-qr-${companyName.value}.pdf`)
    toast.success(t('feelback.downloadPdf'))
  } catch (err) {
    console.error(err)
    toast.error(t('feelback.questionnaireSaveError'))
  } finally {
    isGeneratingPdf.value = false
  }
}

function copyLink() {
  if (!config.value) return
  navigator.clipboard.writeText(config.value.reviewUrl)
  toast.success(t('feelback.copy'))
}

async function switchTab(tab: 'qr' | 'questionnaire' | 'stats') {
  activeTab.value = tab
  if (tab === 'stats') {
    await Promise.all([reviewStore.fetchStats(), reviewStore.fetchSubmissions()])
  }
}

const channelChartData = computed(() => {
  if (!stats.value?.channelDistribution.length) return null
  return stats.value.channelDistribution.map((c) => ({
    name: c.channel,
    value: c.count,
  }))
})
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">{{ t('feelback.qrAvisTitle') }}</h1>
      <p class="mt-1 text-sm text-gray-500">
        {{ t('feelback.qrAvisSubtitle') }}
      </p>
    </div>

    <!-- Tabs -->
    <div class="border-b border-gray-200">
      <nav class="-mb-px flex gap-6">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          type="button"
          :class="[
            'flex items-center gap-2 pb-3 text-sm font-medium border-b-2 transition-colors',
            activeTab === tab.key
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
          ]"
          @click="switchTab(tab.key as 'qr' | 'questionnaire' | 'stats')"
        >
          <component :is="tab.icon" class="w-4 h-4" />
          {{ tab.label }}
        </button>
      </nav>
    </div>

    <!-- Tab: QR Code -->
    <div v-if="activeTab === 'qr'" class="space-y-4">
      <AppCard>
        <div class="p-6 space-y-6">
          <div v-if="!config" class="text-center py-8">
            <QrCodeIcon class="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p class="text-gray-500 mb-4">
              {{ t('feelback.noQrConfigured') }}
            </p>
            <AppButton variant="primary" @click="activeTab = 'questionnaire'">
              {{ t('feelback.configQuestionnaire') }}
            </AppButton>
          </div>

          <template v-else>
            <!-- Review URL -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">{{ t('feelback.reviewPageLink') }}</label>
              <div class="flex items-center gap-2">
                <input
                  :value="config.reviewUrl"
                  readonly
                  class="flex-1 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-600"
                />
                <AppButton variant="secondary" size="sm" @click="copyLink">
                  {{ t('feelback.copy') }}
                </AppButton>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex flex-wrap gap-3">
              <AppButton
                variant="primary"
                :loading="isGeneratingPdf"
                @click="generateAndDownloadPdf"
              >
                <DocumentArrowDownIcon class="w-4 h-4 mr-2" />
                {{ t('feelback.downloadPdf') }}
              </AppButton>
              <AppButton
                variant="secondary"
                :loading="isSubmitting"
                @click="regenerateToken"
              >
                <ArrowPathIcon class="w-4 h-4 mr-2" />
                {{ t('feelback.regenerateLink') }}
              </AppButton>
            </div>

            <div class="rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
              {{ t('feelback.regenerateWarning') }}
            </div>
          </template>
        </div>
      </AppCard>
    </div>

    <!-- Tab: Questionnaire -->
    <div v-if="activeTab === 'questionnaire'" class="space-y-4">
      <AppCard>
        <div class="p-6 space-y-6">
          <div>
            <h2 class="text-base font-semibold text-gray-900 mb-1">{{ t('feelback.questionsTitle') }}</h2>
            <p class="text-sm text-gray-500 mb-4">
              {{ t('feelback.questionsHint') }}
            </p>
            <QuestionBuilder v-model="localQuestions" />
          </div>

          <div class="border-t border-gray-100 pt-6">
            <h2 class="text-base font-semibold text-gray-900 mb-1">{{ t('feelback.channelsTitle') }}</h2>
            <p class="text-sm text-gray-500 mb-4">
              {{ t('feelback.channelsHint') }}
            </p>
            <ChannelBuilder v-model="localChannels" />
          </div>

          <div class="flex justify-end pt-2">
            <AppButton variant="primary" :loading="isSubmitting" @click="saveQuestionnaire">
              {{ t('feelback.saveQuestionnaire') }}
            </AppButton>
          </div>
        </div>
      </AppCard>
    </div>

    <!-- Tab: Statistiques -->
    <div v-if="activeTab === 'stats'" class="space-y-4">
      <div v-if="reviewStore.isLoadingStats" class="text-center py-12">
        <svg class="w-8 h-8 animate-spin text-gray-400 mx-auto" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
      <div v-else-if="!stats || stats.totalSubmissions === 0" class="text-center py-12">
        <ChartBarIcon class="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p class="text-gray-500">{{ t('feelback.noReviews') }}</p>
      </div>

      <template v-else>
        <!-- Summary stat -->
        <AppCard>
          <div class="p-6">
            <p class="text-sm text-gray-500">{{ t('feelback.totalReviews') }}</p>
            <p class="text-4xl font-bold text-gray-900 mt-1">{{ stats.totalSubmissions }}</p>
          </div>
        </AppCard>

        <!-- Average per question -->
        <AppCard v-if="stats.averagePerQuestion.length">
          <div class="p-6 space-y-4">
            <h2 class="text-base font-semibold text-gray-900">{{ t('feelback.avgByQuestion') }}</h2>
            <div
              v-for="q in stats.averagePerQuestion"
              :key="q.questionId"
              class="space-y-1"
            >
              <div class="flex justify-between text-sm">
                <span class="text-gray-700">{{ q.text }}</span>
                <span class="font-semibold text-gray-900">{{ q.average.toFixed(1) }} / 5</span>
              </div>
              <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  class="h-full bg-blue-500 rounded-full transition-all"
                  :style="{ width: `${(q.average / 5) * 100}%` }"
                />
              </div>
            </div>
          </div>
        </AppCard>

        <!-- Channel distribution -->
        <AppCard v-if="channelChartData">
          <div class="p-6">
            <h2 class="text-base font-semibold text-gray-900 mb-4">{{ t('feelback.channelsDistrib') }}</h2>
            <PieChart
              :data="channelChartData"
              height="280px"
            />
          </div>
        </AppCard>

        <!-- Submissions list (recommendations) -->
        <AppCard v-if="submissions.length">
          <div class="p-6 space-y-4">
            <h2 class="text-base font-semibold text-gray-900">{{ t('feelback.suggestions') }}</h2>
            <div
              v-for="sub in submissions.filter((s) => s.recommendations)"
              :key="sub.id"
              class="border-l-4 border-blue-200 pl-4 py-2"
            >
              <p class="text-sm text-gray-700 italic">"{{ sub.recommendations }}"</p>
              <p class="text-xs text-gray-400 mt-1">
                {{ sub.channel ? `Via ${sub.channel} · ` : '' }}{{ new Date(sub.createdAt).toLocaleDateString('fr-FR') }}
              </p>
            </div>
            <p v-if="!submissions.some((s) => s.recommendations)" class="text-sm text-gray-400 italic">
              {{ t('feelback.noSuggestions') }}
            </p>
          </div>
        </AppCard>
      </template>
    </div>
  </div>
</template>
