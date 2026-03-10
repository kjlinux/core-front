<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useReviewStore } from '@/stores/review.store'
import { useAuthStore } from '@/stores/auth.store'
import { useToast } from '@/composables/useToast'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import QuestionBuilder from '@/components/review/QuestionBuilder.vue'
import ChannelBuilder from '@/components/review/ChannelBuilder.vue'
import PieChart from '@/components/charts/PieChart.vue'
import { QrCodeIcon, DocumentArrowDownIcon, ArrowPathIcon, Cog6ToothIcon, ChartBarIcon } from '@heroicons/vue/24/outline'

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
    toast.error('Ajoutez au moins une question avant de sauvegarder.')
    return
  }

  isSubmitting.value = true
  try {
    await reviewStore.saveConfig({
      questions: validQuestions,
      channels: validChannels,
    })
    toast.success('Questionnaire sauvegardé avec succès.')
  } catch {
    toast.error('Erreur lors de la sauvegarde.')
  } finally {
    isSubmitting.value = false
  }
}

async function regenerateToken() {
  if (!confirm('Regénérer le lien ? L\'ancien QR code ne fonctionnera plus.')) return
  isSubmitting.value = true
  try {
    await reviewStore.regenerateToken()
    toast.success('Nouveau lien généré.')
  } catch {
    toast.error('Erreur lors de la génération du lien.')
  } finally {
    isSubmitting.value = false
  }
}

async function generateAndDownloadPdf() {
  if (!config.value) {
    toast.error('Configurez d\'abord votre questionnaire.')
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

    // Header background - couleur sidebar #1e293b
    doc.setFillColor(30, 41, 59)
    doc.rect(0, 0, pageWidth, 45, 'F')

    // Company name
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(22)
    doc.setFont('helvetica', 'bold')
    doc.text(companyName.value, centerX, 20, { align: 'center' })

    // Subtitle
    doc.setFontSize(13)
    doc.setFont('helvetica', 'normal')
    doc.text('Donnez-nous votre avis', centerX, 33, { align: 'center' })

    // QR code
    const qrSize = 110
    const qrX = (pageWidth - qrSize) / 2
    doc.addImage(qrDataUrl, 'PNG', qrX, 55, qrSize, qrSize)

    // Border around QR
    doc.setDrawColor(200, 200, 200)
    doc.setLineWidth(0.5)
    doc.rect(qrX - 5, 50, qrSize + 10, qrSize + 10)

    // Instruction text
    doc.setTextColor(30, 30, 30)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Scannez ce code QR avec votre téléphone', centerX, 180, { align: 'center' })

    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 100, 100)
    doc.text('Votre avis nous aide à améliorer nos services.', centerX, 190, { align: 'center' })
    doc.text('Merci de prendre quelques secondes pour répondre.', centerX, 198, { align: 'center' })

    doc.save(`avis-qr-${companyName.value}.pdf`)
    toast.success('PDF téléchargé avec succès.')
  } catch (err) {
    console.error(err)
    toast.error('Erreur lors de la génération du PDF.')
  } finally {
    isGeneratingPdf.value = false
  }
}

function copyLink() {
  if (!config.value) return
  navigator.clipboard.writeText(config.value.reviewUrl)
  toast.success('Lien copié dans le presse-papier.')
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
      <h1 class="text-2xl font-bold text-gray-900">Avis QR</h1>
      <p class="mt-1 text-sm text-gray-500">
        Générez un QR code imprimable pour collecter les avis de vos clients.
      </p>
    </div>

    <!-- Tabs -->
    <div class="border-b border-gray-200">
      <nav class="-mb-px flex gap-6">
        <button
          v-for="tab in [
            { key: 'qr', label: 'QR Code', icon: QrCodeIcon },
            { key: 'questionnaire', label: 'Questionnaire', icon: Cog6ToothIcon },
            { key: 'stats', label: 'Statistiques', icon: ChartBarIcon },
          ]"
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
              Aucun QR code configuré. Configurez d'abord votre questionnaire, puis revenez ici pour générer votre QR code.
            </p>
            <AppButton variant="primary" @click="activeTab = 'questionnaire'">
              Configurer le questionnaire
            </AppButton>
          </div>

          <template v-else>
            <!-- Review URL -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Lien de votre page d'avis</label>
              <div class="flex items-center gap-2">
                <input
                  :value="config.reviewUrl"
                  readonly
                  class="flex-1 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-600"
                />
                <AppButton variant="secondary" size="sm" @click="copyLink">
                  Copier
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
                Télécharger le PDF
              </AppButton>
              <AppButton
                variant="secondary"
                :loading="isSubmitting"
                @click="regenerateToken"
              >
                <ArrowPathIcon class="w-4 h-4 mr-2" />
                Regénérer le lien
              </AppButton>
            </div>

            <div class="rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
              Si vous regénérez le lien, l'ancien QR code imprimé ne fonctionnera plus. Pensez à réimprimer et remplacer les affiches.
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
            <h2 class="text-base font-semibold text-gray-900 mb-1">Questions (notation sur 5 étoiles)</h2>
            <p class="text-sm text-gray-500 mb-4">
              Ces questions seront présentées à vos clients avec un système de notation par étoiles.
            </p>
            <QuestionBuilder v-model="localQuestions" />
          </div>

          <div class="border-t border-gray-100 pt-6">
            <h2 class="text-base font-semibold text-gray-900 mb-1">Canaux de découverte</h2>
            <p class="text-sm text-gray-500 mb-4">
              Indiquez les canaux sur lesquels vous êtes présents. Vos clients pourront indiquer comment ils vous ont connus.
            </p>
            <ChannelBuilder v-model="localChannels" />
          </div>

          <div class="flex justify-end pt-2">
            <AppButton variant="primary" :loading="isSubmitting" @click="saveQuestionnaire">
              Enregistrer le questionnaire
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
        <p class="text-gray-500">Aucun avis reçu pour l'instant.</p>
      </div>

      <template v-else>
        <!-- Summary stat -->
        <AppCard>
          <div class="p-6">
            <p class="text-sm text-gray-500">Total des avis reçus</p>
            <p class="text-4xl font-bold text-gray-900 mt-1">{{ stats.totalSubmissions }}</p>
          </div>
        </AppCard>

        <!-- Average per question -->
        <AppCard v-if="stats.averagePerQuestion.length">
          <div class="p-6 space-y-4">
            <h2 class="text-base font-semibold text-gray-900">Moyennes par question</h2>
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
            <h2 class="text-base font-semibold text-gray-900 mb-4">Canaux de découverte</h2>
            <PieChart
              :data="channelChartData"
              height="280px"
            />
          </div>
        </AppCard>

        <!-- Submissions list (recommendations) -->
        <AppCard v-if="submissions.length">
          <div class="p-6 space-y-4">
            <h2 class="text-base font-semibold text-gray-900">Recommandations et suggestions</h2>
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
              Aucune recommandation textuelle pour l'instant.
            </p>
          </div>
        </AppCard>
      </template>
    </div>
  </div>
</template>
