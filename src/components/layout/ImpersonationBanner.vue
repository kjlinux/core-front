<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { ShieldExclamationIcon, ArrowLeftOnRectangleIcon } from '@heroicons/vue/24/outline'

const authStore = useAuthStore()
const router = useRouter()

function quit() {
  const returnPath = authStore.stopImpersonation()
  router.push(returnPath || '/support-it/tickets')
}
</script>

<template>
  <div
    v-if="authStore.impersonation"
    class="flex flex-wrap items-center justify-between gap-3 bg-amber-500 px-4 py-2 text-sm text-white"
  >
    <div class="flex items-center gap-2 min-w-0">
      <ShieldExclamationIcon class="h-5 w-5 shrink-0" />
      <span class="truncate">
        Vous contrôlez
        <strong>{{ authStore.impersonation.companyName || 'cette entreprise' }}</strong>
        en tant que {{ authStore.impersonation.userName }}
        <span v-if="authStore.impersonation.impersonatorName" class="opacity-80">
          (support : {{ authStore.impersonation.impersonatorName }})
        </span>
      </span>
    </div>
    <button
      type="button"
      class="inline-flex shrink-0 items-center gap-1 rounded-md bg-white/20 px-3 py-1 font-medium hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/70"
      @click="quit"
    >
      <ArrowLeftOnRectangleIcon class="h-4 w-4" />
      Quitter le contrôle
    </button>
  </div>
</template>
