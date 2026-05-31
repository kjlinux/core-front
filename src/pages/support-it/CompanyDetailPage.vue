<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSupportStore } from '@/stores/support.store'
import { supportApi, type SupportCompanyUser } from '@/services/api/support.api'
import { useAuthStore } from '@/stores/auth.store'
import { useI18n } from 'vue-i18n'
import { useToast } from '@/composables/useToast'
import { extractApiErrorMessage } from '@/utils/api-error'
import { ROLE_LABELS } from '@/utils/constants'
import AppCard from '@/components/ui/AppCard.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppSearchInput from '@/components/ui/AppSearchInput.vue'
import AppSpinner from '@/components/ui/AppSpinner.vue'
import { ArrowLeftIcon, ArrowRightOnRectangleIcon, KeyIcon, PhoneIcon } from '@heroicons/vue/24/outline'
import {
  alertSeverityLabel,
  alertSeverityVariant,
  alertStatusLabel,
  alertStatusVariant,
  labelOf,
  variantOf,
} from '@/utils/support-labels'

const route = useRoute()
const router = useRouter()
const store = useSupportStore()
const authStore = useAuthStore()
const toast = useToast()
const { t } = useI18n()

const takingControl = ref<string | null>(null)
const takingControlCompany = ref(false)

async function takeControl(user: SupportCompanyUser) {
  takingControl.value = user.id
  try {
    const res = await supportApi.impersonateUser(user.id)
    authStore.startImpersonation(res, route.fullPath)
    toast.success('Prise de contrôle activée')
    router.push('/')
  } catch (e) {
    toast.error(t('common.failed'), extractApiErrorMessage(e, t('common.genericError')))
  } finally {
    takingControl.value = null
  }
}

async function takeControlCompany() {
  takingControlCompany.value = true
  try {
    const res = await supportApi.impersonateCompany(id.value)
    authStore.startImpersonation(res, route.fullPath)
    toast.success('Prise de contrôle activée')
    router.push('/')
  } catch (e) {
    toast.error(t('common.failed'), extractApiErrorMessage(e, t('common.genericError')))
  } finally {
    takingControlCompany.value = false
  }
}

const id = computed(() => route.params.id as string)
const detail = computed(() => store.companyDetail)

const userSearch = ref('')
const filteredUsers = computed(() => {
  const users = detail.value?.users ?? []
  const q = userSearch.value.trim().toLowerCase()
  if (!q) return users
  return users.filter(
    (u) =>
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q) ||
      (ROLE_LABELS[u.role] ?? '').toLowerCase().includes(q),
  )
})

const confirmUser = ref<SupportCompanyUser | null>(null)
const resetting = ref(false)
const tempPassword = ref<string | null>(null)

function fmtDate(s: string | null | undefined) {
  if (!s) return '-'
  return new Date(s).toLocaleString('fr-FR')
}

function askReset(user: SupportCompanyUser) {
  tempPassword.value = null
  confirmUser.value = user
}

async function doReset() {
  if (!confirmUser.value) return
  resetting.value = true
  try {
    const res = await supportApi.resetUserPassword(confirmUser.value.id)
    tempPassword.value = res.tempPassword
    toast.success(t('toast.support.passwordReset'))
  } catch (e) {
    toast.error(t('common.failed'), extractApiErrorMessage(e, t('common.genericError')))
  } finally {
    resetting.value = false
  }
}

function closeModal() {
  confirmUser.value = null
  tempPassword.value = null
}

onMounted(async () => {
  try {
    await store.fetchCompanyDetail(id.value)
  } catch (e) {
    toast.error(t('toast.support.loadError'), extractApiErrorMessage(e, t('common.genericError')))
  }
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-3">
        <AppButton variant="ghost" size="sm" @click="router.back()">
          <ArrowLeftIcon class="w-4 h-4" /> Retour
        </AppButton>
        <div v-if="detail">
          <h1 class="text-2xl font-semibold text-gray-900">{{ detail.company.name }}</h1>
          <p class="text-sm text-gray-500">{{ detail.company.email ?? '-' }} · {{ detail.company.phone ?? '-' }}</p>
        </div>
      </div>
      <AppButton
        v-if="detail"
        variant="primary"
        :disabled="takingControlCompany"
        :title="'Prendre le contrôle du compte administrateur de cette entreprise'"
        @click="takeControlCompany"
      >
        <ArrowRightOnRectangleIcon class="w-4 h-4" /> Prendre le contrôle de l'entreprise
      </AppButton>
    </div>

    <div v-if="store.isLoading" class="py-12 flex justify-center text-gray-400">
      <AppSpinner size="lg" />
    </div>

    <div v-if="detail" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <AppCard title="Capteurs" class="lg:col-span-1">
        <dl class="space-y-2 text-sm">
          <div class="flex justify-between"><dt class="text-gray-500">Total</dt><dd>{{ detail.devices.total }}</dd></div>
          <div class="flex justify-between"><dt class="text-gray-500">En ligne</dt><dd>{{ detail.devices.online }}</dd></div>
          <div class="flex justify-between"><dt class="text-gray-500">Hors ligne</dt><dd>{{ detail.devices.total - detail.devices.online }}</dd></div>
          <div class="flex justify-between"><dt class="text-gray-500">Plus ancien hors ligne</dt><dd>{{ fmtDate(detail.devices.oldestOfflineSince) }}</dd></div>
        </dl>
        <a v-if="detail.company.phone" :href="`tel:${detail.company.phone}`" class="mt-4 block">
          <AppButton variant="outline" size="sm" class="w-full"><PhoneIcon class="w-4 h-4" /> Appeler la compagnie</AppButton>
        </a>
      </AppCard>

      <AppCard title="Utilisateurs" class="lg:col-span-2">
        <div class="mb-3 flex items-center justify-between gap-3">
          <AppSearchInput
            v-model="userSearch"
            placeholder="Rechercher un utilisateur (nom, email, rôle)"
            class="flex-1"
          />
          <span class="shrink-0 text-xs text-gray-500">{{ filteredUsers.length }} / {{ detail.users.length }}</span>
        </div>
        <div class="max-h-96 overflow-y-auto divide-y divide-gray-100 pr-1">
          <div v-for="u in filteredUsers" :key="u.id" class="py-3 flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-900">{{ u.name }}</p>
              <p class="text-xs text-gray-500">{{ u.email }} · {{ ROLE_LABELS[u.role] ?? u.role }}</p>
            </div>
            <div class="flex items-center gap-1">
              <AppButton variant="ghost" size="sm" :title="'Réinitialiser le mot de passe'" @click="askReset(u)">
                <KeyIcon class="w-4 h-4" /> Reset MDP
              </AppButton>
              <AppButton
                v-if="u.role !== 'super_admin'"
                variant="outline"
                size="sm"
                :disabled="takingControl === u.id"
                :title="'Prendre le contrôle de ce compte'"
                @click="takeControl(u)"
              >
                <ArrowRightOnRectangleIcon class="w-4 h-4" /> Contrôler
              </AppButton>
            </div>
          </div>
          <div v-if="detail.users.length === 0" class="py-3 text-sm text-gray-500">Aucun utilisateur.</div>
          <div v-else-if="filteredUsers.length === 0" class="py-3 text-sm text-gray-500">
            Aucun utilisateur ne correspond à la recherche.
          </div>
        </div>
      </AppCard>
    </div>

    <AppCard v-if="detail" title="Alertes récentes">
      <div v-if="detail.alerts.length === 0" class="text-sm text-gray-500 py-3">Aucune alerte.</div>
      <div v-else class="divide-y divide-gray-100">
        <div v-for="a in detail.alerts" :key="a.id" class="py-3 flex items-start justify-between">
          <div>
            <p class="text-sm font-medium text-gray-900">{{ a.title }}</p>
            <p class="text-xs text-gray-500">{{ fmtDate(a.created_at) }}</p>
          </div>
          <div class="flex gap-2">
            <AppBadge :variant="variantOf(alertSeverityVariant, a.severity)" size="sm">{{ labelOf(alertSeverityLabel, a.severity) }}</AppBadge>
            <AppBadge :variant="variantOf(alertStatusVariant, a.status)" size="sm">{{ labelOf(alertStatusLabel, a.status) }}</AppBadge>
          </div>
        </div>
      </div>
    </AppCard>

    <AppModal :model-value="confirmUser !== null" title="Réinitialiser le mot de passe" @update:model-value="closeModal">
      <div v-if="!tempPassword" class="space-y-3">
        <p class="text-sm text-gray-700">
          Réinitialiser le mot de passe de <strong>{{ confirmUser?.name }}</strong> ({{ confirmUser?.email }}) ?
          Un mot de passe temporaire sera généré et ses sessions seront déconnectées.
        </p>
        <div class="flex justify-end gap-2">
          <AppButton variant="ghost" @click="closeModal">Annuler</AppButton>
          <AppButton variant="primary" :disabled="resetting" @click="doReset">Confirmer</AppButton>
        </div>
      </div>
      <div v-else class="space-y-3">
        <p class="text-sm text-gray-700">Mot de passe temporaire (à communiquer à l'utilisateur) :</p>
        <p class="font-mono text-lg bg-gray-50 rounded p-3 text-center select-all">{{ tempPassword }}</p>
        <div class="flex justify-end">
          <AppButton variant="primary" @click="closeModal">Fermer</AppButton>
        </div>
      </div>
    </AppModal>
  </div>
</template>
