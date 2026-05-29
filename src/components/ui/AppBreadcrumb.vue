<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { HomeIcon, ChevronRightIcon } from '@heroicons/vue/24/outline'

const route = useRoute()

interface Crumb {
  label: string
  to?: string
}

const crumbs = computed<Crumb[]>(() => {
  const items: Crumb[] = []
  for (const r of route.matched) {
    const title = r.meta?.title as string | undefined
    if (!title) continue
    items.push({ label: title, to: r.path })
  }
  // dedupe consecutive duplicates
  return items.filter((c, i, arr) => i === 0 || c.label !== arr[i - 1].label)
})

const hideOnRoot = computed(() => route.path === '/' || route.path === '/dashboard')
</script>

<template>
  <nav
    v-if="!hideOnRoot && crumbs.length > 0"
    aria-label="Fil d'Ariane"
    class="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400"
  >
    <RouterLink
      to="/"
      class="inline-flex items-center hover:text-gray-900 dark:hover:text-gray-100"
      aria-label="Accueil"
    >
      <HomeIcon class="h-3.5 w-3.5" />
    </RouterLink>
    <template v-for="(c, i) in crumbs" :key="i">
      <ChevronRightIcon class="h-3 w-3 text-gray-300 dark:text-gray-600" aria-hidden="true" />
      <RouterLink
        v-if="i < crumbs.length - 1 && c.to"
        :to="c.to"
        class="hover:text-gray-900 dark:hover:text-gray-100"
      >
        {{ c.label }}
      </RouterLink>
      <span v-else aria-current="page" class="font-medium text-gray-700 dark:text-gray-200">
        {{ c.label }}
      </span>
    </template>
  </nav>
</template>
