<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePermissions } from '@/composables/usePermissions'
import { useToast } from '@/composables/useToast'
import { useAuthStore } from '@/stores/auth.store'
import { useCompanyStore } from '@/stores/company.store'
import { userApi } from '@/services/api/user.api'
import type { UserData } from '@/services/api/user.api'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import { PencilIcon, EyeIcon, EyeSlashIcon, KeyIcon, UserPlusIcon } from '@heroicons/vue/24/outline'

const { t } = useI18n()
const permissions = usePermissions()
const toast = useToast()
const authStore = useAuthStore()
const companyStore = useCompanyStore()

const isLoading = ref(false)
const showCreateModal = ref(false)
const showEditModal = ref(false)
const editingUser = ref<UserData | null>(null)
const isSaving = ref(false)

const createForm = ref({
  firstName: '',
  lastName: '',
  email: '',
  role: '',
  companyId: '',
  password: '',
  confirmPassword: '',
})

const users = ref<UserData[]>([])

const roleLabels = computed<Record<string, string>>(() => ({
  super_admin: t('parametres.superAdmin'),
  admin_enterprise: t('parametres.adminEnterprise'),
  manager: t('parametres.managerRole'),
  technicien: t('parametres.technicienRole'),
}))

const roleBadgeVariant: Record<string, string> = {
  super_admin: 'danger',
  admin_enterprise: 'warning',
  manager: 'info',
  technicien: 'success',
}

const roleOptions = computed(() => {
  if (permissions.isSuperAdmin.value) {
    return [
      { label: t('parametres.selectRole'), value: '' },
      { label: t('roles.super_admin'), value: 'super_admin' },
      { label: t('roles.admin_enterprise'), value: 'admin_enterprise' },
      { label: t('roles.manager'), value: 'manager' },
      { label: t('roles.technicien'), value: 'technicien' },
    ]
  }
  if (permissions.isTechnicien.value) {
    return [
      { label: t('parametres.selectRole'), value: '' },
      { label: t('roles.admin_enterprise'), value: 'admin_enterprise' },
      { label: t('roles.manager'), value: 'manager' },
    ]
  }
  return [
    { label: t('parametres.selectRole'), value: '' },
    { label: t('roles.manager'), value: 'manager' },
  ]
})

const companyOptions = computed(() => {
  return [
    { label: t('parametres.selectCompany'), value: '' },
    ...companyStore.companies.map((c) => ({
      label: c.name,
      value: c.id,
    })),
  ]
})

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('fr-FR')
}

async function fetchUsers() {
  isLoading.value = true
  try {
    const all = await userApi.getAll()
    // Le technicien ne doit jamais voir les comptes super_admin (filtre defensif)
    users.value = permissions.isTechnicien.value
      ? all.filter((u) => u.role !== 'super_admin')
      : all
  } catch {
    toast.showError(t('parametres.userCreateError'))
  } finally {
    isLoading.value = false
  }
}

function openEditModal(user: UserData) {
  editingUser.value = { ...user }
  showEditModal.value = true
}

async function toggleActive(user: UserData) {
  try {
    const updated = await userApi.toggleActive(user.id)
    const index = users.value.findIndex((u) => u.id === user.id)
    if (index !== -1) {
      users.value[index] = updated
    }
    toast.showSuccess(updated.isActive ? t('parametres.userActivated') : t('parametres.userDeactivated'))
  } catch {
    toast.showError(t('parametres.statusChangeError'))
  }
}

async function resetPassword(user: UserData) {
  try {
    await userApi.resetPassword(user.id)
    toast.showSuccess(t('parametres.resetEmailSent', { email: user.email }))
  } catch {
    toast.showError(t('parametres.resetEmailError'))
  }
}

async function handleCreate() {
  if (!createForm.value.firstName || !createForm.value.email || !createForm.value.role) {
    toast.showError(t('parametres.fillRequired'))
    return
  }
  if (!createForm.value.password) {
    toast.showError(t('parametres.enterPassword'))
    return
  }
  if (createForm.value.password !== createForm.value.confirmPassword) {
    toast.showError(t('parametres.passwordMismatch'))
    return
  }
  // super_admin doit choisir une entreprise pour les roles non-super_admin
  if (permissions.isSuperAdmin.value && createForm.value.role !== 'super_admin' && !createForm.value.companyId) {
    toast.showError(t('parametres.companyRequired'))
    return
  }

  isSaving.value = true
  try {
    const created = await userApi.create({
      first_name: createForm.value.firstName,
      last_name: createForm.value.lastName,
      email: createForm.value.email,
      role: createForm.value.role,
      company_id: permissions.isSuperAdmin.value ? createForm.value.companyId || undefined : undefined,
      password: createForm.value.password,
      password_confirmation: createForm.value.confirmPassword,
    })
    users.value.push(created)
    toast.showSuccess(t('parametres.userCreated'))
    showCreateModal.value = false
    createForm.value = { firstName: '', lastName: '', email: '', role: '', companyId: '', password: '', confirmPassword: '' }
  } catch {
    toast.showError(t('parametres.userCreateError'))
  } finally {
    isSaving.value = false
  }
}

async function handleEditSave() {
  if (!editingUser.value) return
  isSaving.value = true
  try {
    const updated = await userApi.update(editingUser.value.id, {
      first_name: editingUser.value.firstName,
      last_name: editingUser.value.lastName,
      email: editingUser.value.email,
      role: editingUser.value.role,
    })
    const index = users.value.findIndex((u) => u.id === updated.id)
    if (index !== -1) {
      users.value[index] = updated
    }
    toast.showSuccess(t('parametres.userUpdated'))
    showEditModal.value = false
  } catch {
    toast.showError(t('parametres.userUpdateError'))
  } finally {
    isSaving.value = false
  }
}

onMounted(async () => {
  await fetchUsers()
  if (permissions.isSuperAdmin.value) {
    await companyStore.fetchCompanies()
  }
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">{{ t('parametres.usersTitle') }}</h1>
        <p class="text-sm text-gray-500 mt-1">{{ users.length }} {{ t('parametres.usersCount') }}</p>
      </div>
      <AppButton variant="primary" @click="showCreateModal = true">
        <UserPlusIcon class="w-4 h-4 mr-1" />
        {{ t('parametres.createUser') }}
      </AppButton>
    </div>

    <div v-if="isLoading" class="flex justify-center py-12">
      <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
    </div>

    <AppCard v-else>
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{{ t('common.name') }}</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{{ t('common.email') }}</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{{ t('parametres.role') }}</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{{ t('companies.title') }}</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{{ t('common.status') }}</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{{ t('common.date') }}</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{{ t('common.actions') }}</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-100">
            <tr v-for="u in users" :key="u.id" class="hover:bg-gray-50">
              <td class="px-4 py-3 text-sm font-medium text-gray-900">{{ u.firstName }} {{ u.lastName }}</td>
              <td class="px-4 py-3 text-sm text-gray-600">{{ u.email }}</td>
              <td class="px-4 py-3">
                <AppBadge :variant="(roleBadgeVariant[u.role] as any) ?? 'info'">{{ roleLabels[u.role] ?? u.role }}</AppBadge>
              </td>
              <td class="px-4 py-3 text-sm text-gray-600">{{ u.companyName ?? '-' }}</td>
              <td class="px-4 py-3">
                <AppBadge :variant="u.isActive ? 'success' : 'neutral'">
                  {{ u.isActive ? t('common.active') : t('common.inactive') }}
                </AppBadge>
              </td>
              <td class="px-4 py-3 text-sm text-gray-600">{{ formatDate(u.createdAt) }}</td>
              <td class="px-4 py-3">
                <div class="flex gap-1">
                  <AppButton size="sm" variant="ghost" @click="openEditModal(u)" :title="t('parametres.edit')">
                    <PencilIcon class="w-4 h-4" />
                  </AppButton>
                  <AppButton
                    size="sm"
                    variant="ghost"
                    :class="u.isActive ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'"
                    @click="toggleActive(u)"
                    :title="u.isActive ? t('parametres.deactivate') : t('parametres.activate')"
                    :disabled="u.id === authStore.user?.id"
                  >
                    <EyeSlashIcon v-if="u.isActive" class="w-4 h-4" />
                    <EyeIcon v-else class="w-4 h-4" />
                  </AppButton>
                  <AppButton size="sm" variant="ghost" @click="resetPassword(u)" :title="t('parametres.resetPassword')">
                    <KeyIcon class="w-4 h-4" />
                  </AppButton>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="!isLoading && users.length === 0" class="text-center py-8 text-gray-500">
        {{ t('parametres.noUser') }}
      </div>
    </AppCard>

    <!-- Create User Modal -->
    <AppModal v-model="showCreateModal" :title="t('parametres.createUserTitle')" size="lg">
      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <AppInput v-model="createForm.firstName" :label="t('parametres.firstNameLabel')" />
          <AppInput v-model="createForm.lastName" :label="t('parametres.lastNameLabel')" />
        </div>
        <AppInput v-model="createForm.email" :label="t('parametres.emailLabel')" type="email" />
        <AppSelect v-model="createForm.role" :label="t('parametres.roleLabel')" :options="roleOptions" />
        <AppSelect
          v-if="permissions.isSuperAdmin.value && createForm.role && createForm.role !== 'super_admin'"
          v-model="createForm.companyId"
          :label="t('companies.title')"
          :options="companyOptions"
        />
        <AppInput v-model="createForm.password" :label="t('parametres.passwordLabel')" type="password" />
        <AppInput v-model="createForm.confirmPassword" :label="t('parametres.confirmPasswordLabel')" type="password" />
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <AppButton variant="secondary" @click="showCreateModal = false">{{ t('common.cancel') }}</AppButton>
          <AppButton variant="primary" :loading="isSaving" @click="handleCreate">{{ t('common.create') }}</AppButton>
        </div>
      </template>
    </AppModal>

    <!-- Edit User Modal -->
    <AppModal v-if="editingUser" v-model="showEditModal" :title="t('parametres.editUserTitle')" size="lg">
      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <AppInput v-model="editingUser.firstName" :label="t('parametres.firstName')" />
          <AppInput v-model="editingUser.lastName" :label="t('parametres.lastName')" />
        </div>
        <AppInput v-model="editingUser.email" :label="t('common.email')" type="email" />
        <AppSelect v-model="editingUser.role" :label="t('parametres.role')" :options="roleOptions" />
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <AppButton variant="secondary" @click="showEditModal = false">{{ t('common.cancel') }}</AppButton>
          <AppButton variant="primary" :loading="isSaving" @click="handleEditSave">{{ t('common.save') }}</AppButton>
        </div>
      </template>
    </AppModal>

  </div>
</template>
