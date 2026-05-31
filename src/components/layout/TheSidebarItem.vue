<script setup lang="ts">
import { computed, type Component } from 'vue'
import { RouterLink } from 'vue-router'
import { LockClosedIcon } from '@heroicons/vue/24/outline'
import { usePlan } from '@/composables/usePlan'
import type { PlanFeature } from '@/types/subscription'

const props = defineProps<{
  label: string
  to: string
  icon: Component
  collapsed: boolean
  active: boolean
  nested?: boolean
  feature?: PlanFeature
  badgeCount?: number
}>()

const { hasFeature } = usePlan()

// Entree visible mais verrouillee : le plan courant n'inclut pas la fonctionnalite.
// On laisse la navigation se faire ; la page affichera le verrou (FeatureLock).
const locked = computed(() => !!props.feature && !hasFeature(props.feature))
</script>

<template>
  <RouterLink
    :to="to"
    :class="[
      'relative flex items-center gap-3 px-4 py-2.5 text-sm transition-colors',
      nested ? 'pl-12' : 'pl-4',
      active
        ? 'bg-sidebar-active text-white'
        : 'text-gray-300 hover:bg-sidebar-hover hover:text-white',
    ]"
  >
    <component :is="icon" class="h-5 w-5 shrink-0" />
    <span v-if="!collapsed" class="truncate">{{ label }}</span>
    <LockClosedIcon
      v-if="!collapsed && locked"
      class="ml-auto h-4 w-4 shrink-0 text-amber-400"
      title="Disponible avec un abonnement superieur"
    />
    <!-- Pastille "attention" : nombre quand deplie, point quand replie. Masquee si verrouille. -->
    <span
      v-if="!collapsed && !locked && badgeCount && badgeCount > 0"
      class="ml-auto inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-danger-500 px-1.5 text-[10px] font-bold text-white"
    >{{ badgeCount > 99 ? '99+' : badgeCount }}</span>
    <span
      v-else-if="collapsed && !locked && badgeCount && badgeCount > 0"
      class="absolute right-2 top-2 h-2 w-2 rounded-full bg-danger-500"
    />
  </RouterLink>
</template>
