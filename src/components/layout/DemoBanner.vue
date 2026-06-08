<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import {
  isDemoMode,
  switchDemoRole,
  resetDemoData,
  exitDemo,
  DEMO_ROLES,
  type DemoRole,
} from '@/services/demo'

const auth = useAuthStore()
const show = computed(() => isDemoMode())
const currentRole = computed<DemoRole | null>(() => (auth.user?.role as DemoRole) ?? null)
const collapsed = ref(false)

function changeRole(role: DemoRole) {
  if (role === currentRole.value) return
  const home = switchDemoRole(role)
  window.location.assign(home)
}

function reset() {
  resetDemoData()
  window.location.reload()
}

function quit() {
  exitDemo()
  window.location.assign('/demo')
}
</script>

<template>
  <div v-if="show" class="fixed inset-x-0 bottom-0 z-[60] flex justify-center px-3 pb-3 pointer-events-none">
    <div
      class="pointer-events-auto flex max-w-full flex-wrap items-center gap-2 rounded-full border border-white/10 bg-slate-900/95 px-3 py-2 text-sm text-white shadow-2xl ring-1 ring-black/20 backdrop-blur sm:gap-3"
    >
      <span class="flex items-center gap-2 pl-1 font-semibold">
        <span class="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <span class="hidden sm:inline">Mode demo</span>
      </span>

      <span class="h-5 w-px bg-white/15"></span>

      <!-- Sélecteur de rôle -->
      <div class="flex items-center gap-1 rounded-full bg-white/5 p-0.5">
        <button
          v-for="r in DEMO_ROLES"
          :key="r.role"
          type="button"
          class="rounded-full px-3 py-1 text-xs font-medium transition"
          :class="r.role === currentRole
            ? 'bg-emerald-500 text-white shadow'
            : 'text-slate-300 hover:bg-white/10'"
          @click="changeRole(r.role)"
        >
          {{ r.label }}
        </button>
      </div>

      <span class="h-5 w-px bg-white/15"></span>

      <button
        type="button"
        class="rounded-full px-3 py-1 text-xs font-medium text-slate-300 transition hover:bg-white/10"
        @click="reset"
      >
        Reinitialiser
      </button>
      <button
        type="button"
        class="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white transition hover:bg-white/20"
        @click="quit"
      >
        Quitter
      </button>
    </div>
  </div>
</template>
