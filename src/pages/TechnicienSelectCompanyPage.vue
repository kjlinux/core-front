<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useActiveCompanyStore } from '@/stores/active-company.store'
import { useCompanyStore } from '@/stores/company.store'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import { BuildingOffice2Icon } from '@heroicons/vue/24/outline'

const { t } = useI18n()
const router = useRouter()
const activeCompanyStore = useActiveCompanyStore()
const companyStore = useCompanyStore()

const selectedId = ref('')

onMounted(async () => {
  await companyStore.fetchCompanies({ perPage: 200 })
})

async function confirm() {
  if (!selectedId.value) return
  const company = companyStore.companies.find((c) => c.id === selectedId.value)
  await activeCompanyStore.selectCompany(selectedId.value, company?.name)
  router.push({ name: 'dashboard' })
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-gray-50 p-4">
    <div class="w-full max-w-md space-y-6">
      <div class="text-center">
        <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <BuildingOffice2Icon class="h-7 w-7 text-primary" />
        </div>
        <h1 class="text-2xl font-bold text-gray-900">{{ t('technicien.selectCompany') }}</h1>
        <p class="mt-1 text-sm text-gray-500">
          {{ t('technicien.selectCompanyHint') }}
        </p>
      </div>

      <AppCard>
        <div class="divide-y divide-gray-100">
          <button
            v-for="company in companyStore.companies"
            :key="company.id"
            type="button"
            class="flex w-full items-center gap-3 px-2 py-3 text-left transition-colors hover:bg-gray-50 rounded-lg"
            :class="{ 'bg-primary/5 ring-1 ring-primary': selectedId === company.id }"
            @click="selectedId = company.id"
          >
            <div
              class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
              :class="selectedId === company.id ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'"
            >
              <BuildingOffice2Icon class="h-5 w-5" />
            </div>
            <span class="font-medium text-gray-900">{{ company.name }}</span>
            <span
              v-if="selectedId === company.id"
              class="ml-auto h-2 w-2 rounded-full bg-primary shrink-0"
            />
          </button>

          <p v-if="companyStore.companies.length === 0" class="py-4 text-center text-sm text-gray-400">
            {{ t('technicien.noCompany') }}
          </p>
        </div>

        <div class="mt-4 pt-4 border-t border-gray-100">
          <AppButton
            variant="primary"
            class="w-full"
            :disabled="!selectedId"
            :loading="activeCompanyStore.isLoading"
            @click="confirm"
          >
            {{ t('technicien.confirm') }}
          </AppButton>
        </div>
      </AppCard>
    </div>
  </div>
</template>
