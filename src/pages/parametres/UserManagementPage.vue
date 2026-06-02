<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePermissions } from '@/composables/usePermissions'
import { useToast } from '@/composables/useToast'
import { useServerTable } from '@/composables/useServerTable'
import { useAuthStore } from '@/stores/auth.store'
import { useCompanyStore } from '@/stores/company.store'
import { userApi } from '@/services/api/user.api'
import type { UserData } from '@/services/api/user.api'
import type { PaginatedResponse } from '@/types'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import DataTable from '@/components/data-display/DataTable.vue'
import {
  PencilIcon,
  EyeIcon,
  EyeSlashIcon,
  KeyIcon,
  UserPlusIcon,
  TrashIcon,
} from '@heroicons/vue/24/outline'

const { t } = useI18n()
const permissions = usePermissions()
const toast = useToast()
const authStore = useAuthStore()
const companyStore = useCompanyStore()

// Seul le super_admin peut réellement supprimer un compte (le reste désactive).
const isSuperAdmin = permissions.isSuperAdmin

const isLoading = ref(false)
const showCreateModal = ref(false)
const showEditModal = ref(false)
const editingUser = ref<UserData | null>(null)
const editPassword = ref('')
const editConfirmPassword = ref('')
const isSaving = ref(false)

// Le changement manuel de mot de passe depuis la fiche d'édition est réservé
// au super_admin et au technicien (l'admin_enterprise ne voit pas le champ).
const canSetPassword = computed(
  () => permissions.isSuperAdmin.value || permissions.isTechnicien.value,
)
const showDeleteModal = ref(false)
const deletingUser = ref<UserData | null>(null)
const isDeleting = ref(false)

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
const pagination = ref<PaginatedResponse<UserData>['meta'] | null>(null)

const { filters, search, applyFilters, handlePageChange, reload } = useServerTable({
  initialFilters: {
    role: '',
    companyId: '',
    status: '' as '' | 'active' | 'inactive',
  },
  fetcher: async (p) => {
    isLoading.value = true
    try {
      const r = await userApi.getAll({
        page: p.page,
        perPage: p.perPage,
        search: p.search || undefined,
        role: p.role || undefined,
        companyId: p.companyId || undefined,
        isActive: p.status === '' ? undefined : p.status === 'active',
      })
      // Le technicien ne doit jamais voir les comptes super_admin (filtre defensif)
      users.value = permissions.isTechnicien.value
        ? r.data.filter((u) => u.role !== 'super_admin')
        : r.data
      pagination.value = r.meta
    } catch {
      toast.showError(t('parametres.userCreateError'))
    } finally {
      isLoading.value = false
    }
  },
})

const columns = computed(() => [
  { key: 'fullName', label: t('common.name') },
  { key: 'email', label: t('common.email') },
  { key: 'role', label: t('parametres.role') },
  { key: 'companyName', label: t('companies.title') },
  { key: 'status', label: t('common.status') },
  { key: 'createdAt', label: t('common.date') },
  { key: 'actions', label: t('common.actions'), sortable: false },
])

const roleLabels = computed<Record<string, string>>(() => ({
  super_admin: t('parametres.superAdmin'),
  admin_enterprise: t('parametres.adminEnterprise'),
  manager: t('parametres.managerRole'),
  technicien: t('parametres.technicienRole'),
  support_it: t('roles.support_it'),
  employe: t('roles.employe'),
}))

const roleBadgeVariant: Record<string, string> = {
  super_admin: 'danger',
  admin_enterprise: 'warning',
  manager: 'info',
  technicien: 'success',
  support_it: 'info',
  employe: 'neutral',
}

const roleOptions = computed(() => {
  if (permissions.isSuperAdmin.value) {
    return [
      { label: t('parametres.selectRole'), value: '' },
      { label: t('roles.super_admin'), value: 'super_admin' },
      { label: t('roles.admin_enterprise'), value: 'admin_enterprise' },
      { label: t('roles.manager'), value: 'manager' },
      { label: t('roles.technicien'), value: 'technicien' },
      { label: t('roles.support_it'), value: 'support_it' },
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

// Options de rôle pour la modale d'édition : on inclut « employe » (les comptes
// créés via la fiche employé portent ce rôle, sinon le select s'afficherait vide)
// et on retire le placeholder vide puisqu'un utilisateur a toujours un rôle.
const editRoleOptions = computed(() => {
  if (permissions.isSuperAdmin.value) {
    return [
      { label: t('roles.super_admin'), value: 'super_admin' },
      { label: t('roles.admin_enterprise'), value: 'admin_enterprise' },
      { label: t('roles.manager'), value: 'manager' },
      { label: t('roles.technicien'), value: 'technicien' },
      { label: t('roles.support_it'), value: 'support_it' },
      { label: t('roles.employe'), value: 'employe' },
    ]
  }
  // admin_enterprise et technicien ne peuvent éditer que des managers (cf. backend).
  return [{ label: t('roles.manager'), value: 'manager' }]
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

// Options du filtre rôle (toolbar) : tous les rôles, indépendant des permissions de création.
const roleFilterOptions = computed(() => [
  { label: t('parametres.allRoles') || 'Tous les rôles', value: '' },
  { label: t('roles.super_admin'), value: 'super_admin' },
  { label: t('roles.admin_enterprise'), value: 'admin_enterprise' },
  { label: t('roles.manager'), value: 'manager' },
  { label: t('roles.technicien'), value: 'technicien' },
  { label: t('roles.support_it'), value: 'support_it' },
  { label: t('roles.employe'), value: 'employe' },
])

// Options du filtre entreprise (toolbar).
const companyFilterOptions = computed(() => [
  { label: t('companies.allCompanies') || 'Toutes les entreprises', value: '' },
  ...companyStore.companies.map((c) => ({
    label: c.name,
    value: c.id,
  })),
])

const statusFilterOptions = computed(() => [
  { label: t('companies.allStatuses') || 'Tous les statuts', value: '' },
  { label: t('common.active'), value: 'active' },
  { label: t('common.inactive'), value: 'inactive' },
])

// Seuls admin_enterprise et manager sont rattaches a une entreprise.
// super_admin, technicien et support_it interviennent sans entreprise fixe.
const requiresCompany = computed(
  () =>
    permissions.isSuperAdmin.value &&
    !!createForm.value.role &&
    createForm.value.role !== 'super_admin' &&
    createForm.value.role !== 'technicien' &&
    createForm.value.role !== 'support_it',
)

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('fr-FR')
}

function openEditModal(user: UserData) {
  editingUser.value = { ...user }
  editPassword.value = ''
  editConfirmPassword.value = ''
  showEditModal.value = true
}

async function toggleActive(user: UserData) {
  try {
    const updated = await userApi.toggleActive(user.id)
    toast.showSuccess(
      updated.isActive ? t('parametres.userActivated') : t('parametres.userDeactivated'),
    )
    await reload()
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

function openDeleteModal(user: UserData) {
  deletingUser.value = user
  showDeleteModal.value = true
}

async function confirmDelete() {
  if (!deletingUser.value) return
  isDeleting.value = true
  try {
    await userApi.remove(deletingUser.value.id)
    toast.showSuccess(t('parametres.userDeleted'))
    showDeleteModal.value = false
    deletingUser.value = null
    await reload()
  } catch {
    toast.showError(t('parametres.userDeleteError'))
  } finally {
    isDeleting.value = false
  }
}

async function handleCreate() {
  if (
    !createForm.value.firstName ||
    !createForm.value.lastName ||
    !createForm.value.email ||
    !createForm.value.role
  ) {
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
  // super_admin doit choisir une entreprise pour admin_enterprise et manager
  // (pas pour super_admin ni technicien, qui n'ont pas d'entreprise fixe)
  if (requiresCompany.value && !createForm.value.companyId) {
    toast.showError(t('parametres.companyRequired'))
    return
  }

  isSaving.value = true
  try {
    await userApi.create({
      first_name: createForm.value.firstName,
      last_name: createForm.value.lastName,
      email: createForm.value.email,
      role: createForm.value.role,
      company_id: requiresCompany.value ? createForm.value.companyId || undefined : undefined,
      password: createForm.value.password,
      password_confirmation: createForm.value.confirmPassword,
      is_active: true,
    })
    toast.showSuccess(t('parametres.userCreated'))
    showCreateModal.value = false
    await reload()
    createForm.value = {
      firstName: '',
      lastName: '',
      email: '',
      role: '',
      companyId: '',
      password: '',
      confirmPassword: '',
    }
  } catch {
    toast.showError(t('parametres.userCreateError'))
  } finally {
    isSaving.value = false
  }
}

async function handleEditSave() {
  if (!editingUser.value) return
  if (!editingUser.value.role) {
    toast.showError(t('parametres.fillRequired'))
    return
  }
  // Mot de passe optionnel : on ne valide/n'envoie que si un mot de passe est saisi.
  const wantsPasswordChange = canSetPassword.value && editPassword.value.length > 0
  if (wantsPasswordChange) {
    if (editPassword.value.length < 8) {
      toast.showError(t('parametres.min8'))
      return
    }
    if (editPassword.value !== editConfirmPassword.value) {
      toast.showError(t('parametres.passwordMismatch'))
      return
    }
  }
  isSaving.value = true
  try {
    await userApi.update(editingUser.value.id, {
      first_name: editingUser.value.firstName,
      last_name: editingUser.value.lastName,
      email: editingUser.value.email,
      role: editingUser.value.role,
      ...(wantsPasswordChange
        ? {
            password: editPassword.value,
            password_confirmation: editConfirmPassword.value,
          }
        : {}),
    })
    toast.showSuccess(t('parametres.userUpdated'))
    showEditModal.value = false
    await reload()
  } catch {
    toast.showError(t('parametres.userUpdateError'))
  } finally {
    isSaving.value = false
  }
}

onMounted(async () => {
  if (permissions.isSuperAdmin.value) {
    await companyStore.fetchCompanies({ perPage: 200 })
  }
  await reload()
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">{{ t('parametres.usersTitle') }}</h1>
        <p class="text-sm text-gray-500 mt-1">
          {{ pagination?.total ?? 0 }} {{ t('parametres.usersCount') }}
        </p>
      </div>
      <AppButton variant="primary" @click="showCreateModal = true">
        <UserPlusIcon class="w-4 h-4 mr-1" />
        {{ t('parametres.createUser') }}
      </AppButton>
    </div>

    <AppCard class="mb-6">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <AppInput
          v-model="search"
          :placeholder="t('common.search') || 'Rechercher...'"
          :label="t('common.search') || 'Rechercher'"
        />
        <AppSelect
          v-model="filters.role"
          :options="roleFilterOptions"
          :label="t('parametres.role')"
          @update:model-value="applyFilters"
        />
        <AppSelect
          v-if="isSuperAdmin"
          v-model="filters.companyId"
          :options="companyFilterOptions"
          :label="t('companies.title')"
          @update:model-value="applyFilters"
        />
        <AppSelect
          v-model="filters.status"
          :options="statusFilterOptions"
          :label="t('common.status')"
          @update:model-value="applyFilters"
        />
      </div>
    </AppCard>

    <AppCard>
      <DataTable
        :columns="columns"
        :data="users"
        :loading="isLoading"
        :pagination="pagination ?? undefined"
        :empty-message="t('parametres.noUser')"
        @page-change="handlePageChange"
      >
        <template #fullName="{ row }">
          <span class="font-medium text-gray-900">{{ row.firstName }} {{ row.lastName }}</span>
        </template>
        <template #role="{ row }">
          <AppBadge :variant="(roleBadgeVariant[row.role] as any) ?? 'info'">{{
            roleLabels[row.role] ?? row.role
          }}</AppBadge>
        </template>
        <template #companyName="{ row }">
          {{ row.companyName ?? '-' }}
        </template>
        <template #status="{ row }">
          <AppBadge :variant="row.isActive ? 'success' : 'neutral'">
            {{ row.isActive ? t('common.active') : t('common.inactive') }}
          </AppBadge>
        </template>
        <template #createdAt="{ row }">
          {{ formatDate(row.createdAt) }}
        </template>
        <template #actions="{ row }">
          <div class="flex gap-1">
            <AppButton
              size="sm"
              variant="ghost"
              @click.stop="openEditModal(row)"
              :title="t('parametres.edit')"
            >
              <PencilIcon class="w-4 h-4" />
            </AppButton>
            <AppButton
              size="sm"
              variant="ghost"
              :class="
                row.isActive
                  ? 'text-red-600 hover:text-red-700'
                  : 'text-green-600 hover:text-green-700'
              "
              @click.stop="toggleActive(row)"
              :title="row.isActive ? t('parametres.deactivate') : t('parametres.activate')"
              :disabled="row.id === authStore.user?.id"
            >
              <EyeSlashIcon v-if="row.isActive" class="w-4 h-4" />
              <EyeIcon v-else class="w-4 h-4" />
            </AppButton>
            <AppButton
              size="sm"
              variant="ghost"
              @click.stop="resetPassword(row)"
              :title="t('parametres.resetPassword')"
            >
              <KeyIcon class="w-4 h-4" />
            </AppButton>
            <AppButton
              v-if="isSuperAdmin"
              size="sm"
              variant="ghost"
              class="text-red-600 hover:text-red-700"
              @click.stop="openDeleteModal(row)"
              :title="t('parametres.deleteUser')"
              :disabled="row.id === authStore.user?.id"
            >
              <TrashIcon class="w-4 h-4" />
            </AppButton>
          </div>
        </template>
      </DataTable>
    </AppCard>

    <!-- Create User Modal -->
    <AppModal v-model="showCreateModal" :title="t('parametres.createUserTitle')" size="lg">
      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <AppInput
            v-model="createForm.firstName"
            :label="t('parametres.firstNameLabel')"
            :required="true"
          />
          <AppInput
            v-model="createForm.lastName"
            :label="t('parametres.lastNameLabel')"
            :required="true"
          />
        </div>
        <AppInput v-model="createForm.email" :label="t('parametres.emailLabel')" type="email" />
        <AppSelect
          v-model="createForm.role"
          :label="t('parametres.roleLabel')"
          :options="roleOptions"
        />
        <AppSelect
          v-if="requiresCompany"
          v-model="createForm.companyId"
          :label="t('companies.title')"
          :options="companyOptions"
        />
        <AppInput
          v-model="createForm.password"
          :label="t('parametres.passwordLabel')"
          type="password"
        />
        <AppInput
          v-model="createForm.confirmPassword"
          :label="t('parametres.confirmPasswordLabel')"
          type="password"
        />
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <AppButton variant="secondary" @click="showCreateModal = false">{{
            t('common.cancel')
          }}</AppButton>
          <AppButton variant="primary" :loading="isSaving" @click="handleCreate">{{
            t('common.create')
          }}</AppButton>
        </div>
      </template>
    </AppModal>

    <!-- Edit User Modal -->
    <AppModal
      v-if="editingUser"
      v-model="showEditModal"
      :title="t('parametres.editUserTitle')"
      size="lg"
    >
      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <AppInput v-model="editingUser.firstName" :label="t('parametres.firstName')" />
          <AppInput v-model="editingUser.lastName" :label="t('parametres.lastName')" />
        </div>
        <AppInput v-model="editingUser.email" :label="t('common.email')" type="email" />
        <AppSelect
          v-model="editingUser.role"
          :label="t('parametres.role')"
          :options="editRoleOptions"
        />
        <div v-if="canSetPassword" class="pt-2 border-t border-gray-100 space-y-4">
          <p class="text-sm font-medium text-gray-700">
            {{ t('parametres.changePasswordOptional') }}
          </p>
          <div class="grid grid-cols-2 gap-4">
            <AppInput
              v-model="editPassword"
              :label="t('parametres.newPassword')"
              type="password"
              autocomplete="new-password"
            />
            <AppInput
              v-model="editConfirmPassword"
              :label="t('parametres.confirmPassword')"
              type="password"
              autocomplete="new-password"
            />
          </div>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <AppButton variant="secondary" @click="showEditModal = false">{{
            t('common.cancel')
          }}</AppButton>
          <AppButton variant="primary" :loading="isSaving" @click="handleEditSave">{{
            t('common.save')
          }}</AppButton>
        </div>
      </template>
    </AppModal>

    <!-- Delete User Modal (super_admin only) -->
    <AppModal
      v-if="deletingUser"
      v-model="showDeleteModal"
      :title="t('parametres.deleteUserTitle')"
      size="md"
    >
      <p class="text-sm text-gray-600">
        {{
          t('parametres.deleteUserConfirm', {
            name: `${deletingUser.firstName} ${deletingUser.lastName}`,
          })
        }}
      </p>
      <template #footer>
        <div class="flex justify-end gap-3">
          <AppButton variant="secondary" @click="showDeleteModal = false">{{
            t('common.cancel')
          }}</AppButton>
          <AppButton variant="danger" :loading="isDeleting" @click="confirmDelete">{{
            t('common.delete')
          }}</AppButton>
        </div>
      </template>
    </AppModal>
  </div>
</template>
