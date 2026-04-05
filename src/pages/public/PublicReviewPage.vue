<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { publicReviewApi } from '@/services/api/public-review.api'
import StarRating from '@/components/review/StarRating.vue'
import type { PublicReviewConfig, ReviewAnswer } from '@/types/review'

const { t } = useI18n()
const route = useRoute()
const token = route.params.token as string

const config = ref<PublicReviewConfig | null>(null)
const isLoading = ref(true)
const isSubmitting = ref(false)
const submitted = ref(false)
const notFound = ref(false)
const error = ref('')

const answers = ref<Record<string, number>>({})
const recommendations = ref('')
const selectedChannel = ref('')

onMounted(async () => {
  try {
    config.value = await publicReviewApi.getPublicConfig(token)
    config.value.questions.forEach((q) => {
      answers.value[q.id] = 0
    })
  } catch {
    notFound.value = true
  } finally {
    isLoading.value = false
  }
})

async function submit() {
  if (!config.value) return

  const unanswered = config.value.questions.filter((q) => !answers.value[q.id])
  if (unanswered.length > 0) {
    error.value = t('publicReview.rateAll')
    return
  }

  error.value = ''
  isSubmitting.value = true

  try {
    const reviewAnswers: ReviewAnswer[] = config.value.questions.map((q) => ({
      questionId: q.id,
      stars: answers.value[q.id] ?? 0,
    }))

    await publicReviewApi.submitReview(token, {
      answers: reviewAnswers,
      recommendations: recommendations.value || undefined,
      channel: selectedChannel.value || undefined,
    })

    submitted.value = true
  } catch {
    error.value = t('publicReview.submitError')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex flex-col" style="background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);">

    <!-- Header -->
    <header style="background-color: #1e293b;" class="relative overflow-hidden">
      <!-- Decorative circles -->
      <div class="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-10" style="background-color: #fff;" />
      <div class="absolute -bottom-4 -left-4 w-20 h-20 rounded-full opacity-10" style="background-color: #fff;" />

      <div class="relative px-6 py-8 text-center">
        <div v-if="config">
          <div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/10 mb-4">
            <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"
                d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
            </svg>
          </div>
          <h1 class="text-2xl font-bold text-white tracking-tight">{{ config.companyName }}</h1>
          <p class="mt-2 text-slate-300 text-sm font-medium">{{ t('publicReview.title') }}</p>
        </div>
        <div v-else class="py-2">
          <div class="h-14 w-14 bg-white/10 rounded-2xl mx-auto mb-4 animate-pulse" />
          <div class="h-6 w-48 bg-white/20 rounded mx-auto mb-2 animate-pulse" />
          <div class="h-4 w-32 bg-white/10 rounded mx-auto animate-pulse" />
        </div>
      </div>
    </header>

    <main class="flex-1 max-w-lg mx-auto w-full px-4 py-6 space-y-4">

      <!-- Loading -->
      <template v-if="isLoading">
        <div v-for="i in 3" :key="i" class="bg-white rounded-2xl p-5 shadow-sm animate-pulse">
          <div class="h-4 bg-gray-100 rounded-full w-3/4 mb-5" />
          <div class="flex gap-3">
            <div v-for="j in 5" :key="j" class="h-9 w-9 bg-gray-100 rounded-full" />
          </div>
        </div>
      </template>

      <!-- Not found -->
      <div v-else-if="notFound" class="bg-white rounded-2xl p-10 shadow-sm text-center">
        <div class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 class="text-base font-semibold text-gray-800 mb-1">{{ t('publicReview.invalidLink') }}</h2>
        <p class="text-sm text-gray-400">{{ t('publicReview.invalidLinkMsg') }}</p>
      </div>

      <!-- Success -->
      <div v-else-if="submitted" class="bg-white rounded-2xl p-10 shadow-sm text-center">
        <div class="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5" style="background-color: #f0fdf4;">
          <svg class="w-10 h-10" style="color: #16a34a;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 class="text-xl font-bold text-gray-900 mb-2">{{ t('publicReview.thankYou') }}</h2>
        <p class="text-sm text-gray-500 leading-relaxed">
          {{ t('publicReview.thankYouMsg') }}
        </p>
      </div>

      <!-- Form -->
      <form v-else-if="config" class="space-y-4" @submit.prevent="submit">

        <!-- Intro text -->
        <p class="text-xs text-center text-slate-500 font-medium uppercase tracking-wider px-2">
          {{ t('publicReview.subtitle') }}
        </p>

        <!-- Questions -->
        <div
          v-for="(question, index) in config.questions"
          :key="question.id"
          class="bg-white rounded-2xl p-5 shadow-sm"
        >
          <div class="flex items-start gap-3 mb-4">
            <span class="shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold text-white" style="background-color: #1e293b;">
              {{ index + 1 }}
            </span>
            <p class="text-sm font-medium text-gray-800 leading-snug pt-0.5">{{ question.text }}</p>
          </div>
          <div class="pl-9">
            <StarRating :model-value="answers[question.id] ?? 0" @update:model-value="(v) => answers[question.id] = v" />
          </div>
        </div>

        <!-- Recommendations -->
        <div class="bg-white rounded-2xl p-5 shadow-sm">
          <div class="flex items-center gap-2 mb-3">
            <svg class="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
            <label class="text-sm font-medium text-gray-800">
              {{ t('publicReview.suggestions') }}
              <span class="font-normal text-gray-400 ml-1">{{ t('publicReview.optional') }}</span>
            </label>
          </div>
          <textarea
            v-model="recommendations"
            rows="3"
            :placeholder="t('publicReview.suggestionsPlaceholder')"
            class="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:border-transparent transition-all"
            style="--tw-ring-color: #1e293b;"
          />
        </div>

        <!-- Channel -->
        <div v-if="config.channels.length > 0" class="bg-white rounded-2xl p-5 shadow-sm">
          <div class="flex items-center gap-2 mb-3">
            <svg class="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            <label class="text-sm font-medium text-gray-800">
              {{ t('publicReview.discoveryChannel') }}
              <span class="font-normal text-gray-400 ml-1">{{ t('publicReview.optional') }}</span>
            </label>
          </div>
          <div class="relative">
            <select
              v-model="selectedChannel"
              class="w-full appearance-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all text-gray-700"
              style="--tw-ring-color: #1e293b;"
            >
              <option value="">{{ t('publicReview.discoveryPlaceholder') }}</option>
              <option v-for="channel in config.channels" :key="channel.id" :value="channel.name">
                {{ channel.name }}
              </option>
            </select>
            <svg class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        <!-- Error -->
        <div v-if="error" class="flex items-center gap-3 rounded-xl bg-red-50 border border-red-100 px-4 py-3">
          <svg class="w-4 h-4 text-red-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p class="text-sm text-red-600">{{ error }}</p>
        </div>

        <!-- Submit -->
        <button
          type="submit"
          :disabled="isSubmitting"
          class="w-full relative overflow-hidden text-white font-semibold py-4 px-6 rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
          style="background-color: #1e293b;"
        >
          <span v-if="isSubmitting" class="flex items-center justify-center gap-2">
            <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {{ t('common.loading') }}
          </span>
          <span v-else>{{ t('publicReview.submit') }}</span>
        </button>

        <p class="text-center text-xs text-slate-400 pb-2">
          {{ t('publicReview.anonymous') }}
        </p>
      </form>
    </main>
  </div>
</template>
