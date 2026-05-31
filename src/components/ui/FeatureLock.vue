<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { LockClosedIcon } from '@heroicons/vue/24/outline'
import { usePlan } from '@/composables/usePlan'
import { FEATURE_LABELS, FEATURE_MIN_PLANS, PLAN_LABELS } from '@/config/plan-features'
import AppButton from '@/components/ui/AppButton.vue'
import AppCard from '@/components/ui/AppCard.vue'
import type { PlanFeature } from '@/types/subscription'

const props = defineProps<{ feature: PlanFeature }>()

const { hasFeature } = usePlan()
const router = useRouter()

const requiredPlanLabel = computed(() => {
  const min = FEATURE_MIN_PLANS[props.feature] ?? []
  // Premier plan accepté par ordre logique freemium < garantie < premium
  const ordered = ['freemium', 'garantie', 'premium'] as const
  const found = ordered.find((p) => min.includes(p))
  return found ? PLAN_LABELS[found] : 'Abonnement supérieur'
})

const featureLabel = computed(() => FEATURE_LABELS[props.feature] ?? props.feature)

function goUpgrade() {
  router.push({ name: 'abonnement-plans', query: { feature: props.feature } })
}
</script>

<template>
  <div v-if="hasFeature(feature)">
    <slot />
  </div>
  <AppCard v-else class="text-center p-8 bg-amber-50 border border-amber-200">
    <LockClosedIcon class="mx-auto mb-3 h-12 w-12 text-amber-500" />
    <div class="text-amber-800 font-semibold text-lg mb-2">
      {{ featureLabel }} - disponible avec {{ requiredPlanLabel }}
    </div>
    <p class="text-amber-700 text-sm mb-4">
      Cette fonctionnalité nécessite un abonnement supérieur pour être activée sur votre compte.
    </p>
    <AppButton variant="primary" @click="goUpgrade">Voir les abonnements</AppButton>
  </AppCard>
</template>
