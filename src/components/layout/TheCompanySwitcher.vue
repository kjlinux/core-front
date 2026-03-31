<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useActiveCompanyStore } from '@/stores/active-company.store'
import { useCompanyStore } from '@/stores/company.store'
import { BuildingOffice2Icon, ChevronDownIcon } from '@heroicons/vue/24/outline'
import { onClickOutside } from '@vueuse/core'

const router = useRouter()
const activeCompanyStore = useActiveCompanyStore()
const companyStore = useCompanyStore()

const isOpen = ref(false)
const menuRef = ref<HTMLElement | null>(null)

onClickOutside(menuRef, () => { isOpen.value = false })

onMounted(() => {
  companyStore.fetchCompanies({ perPage: 100 })
})

const companies = computed(() => companyStore.companies)

async function select(companyId: string) {
  await activeCompanyStore.selectCompany(companyId)
  isOpen.value = false
  // Recharger la page courante pour que toutes les données se rechargent avec la nouvelle entreprise
  router.go(0)
}
</script>

<template>
  <div ref="menuRef" class="relative">
    <button
      type="button"
      class="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
      @click="isOpen = !isOpen"
    >
      <BuildingOffice2Icon class="h-4 w-4 text-gray-400 shrink-0" />
      <span class="max-w-[160px] truncate font-medium">
        {{ activeCompanyStore.activeCompanyName ?? 'Selectionner une entreprise' }}
      </span>
      <ChevronDownIcon :class="['h-4 w-4 text-gray-400 transition-transform', isOpen ? 'rotate-180' : '']" />
    </button>

    <div
      v-if="isOpen"
      class="absolute left-0 top-full z-50 mt-1 w-64 rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
    >
      <p class="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
        Entreprises
      </p>
      <div class="max-h-64 overflow-y-auto">
        <button
          v-for="company in companies"
          :key="company.id"
          type="button"
          class="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          :class="{ 'bg-gray-50 font-medium': company.id === activeCompanyStore.activeCompanyId }"
          @click="select(company.id)"
        >
          <BuildingOffice2Icon class="h-4 w-4 shrink-0 text-gray-400" />
          <span class="truncate">{{ company.name }}</span>
          <span
            v-if="company.id === activeCompanyStore.activeCompanyId"
            class="ml-auto h-2 w-2 rounded-full bg-primary shrink-0"
          />
        </button>
        <p v-if="companies.length === 0" class="px-3 py-2 text-sm text-gray-400">
          Aucune entreprise disponible
        </p>
      </div>
    </div>
  </div>
</template>
