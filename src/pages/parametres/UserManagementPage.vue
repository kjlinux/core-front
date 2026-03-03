<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
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
import { PencilIcon, EyeIcon, EyeSlashIcon, KeyIcon, UserPlusIcon, TrashIcon } from '@heroicons/vue/24/outline'

const permissions = usePermissions()
const toast = useToast()
const authStore = useAuthStore()
const companyStore = useCompanyStore()

const isLoading = ref(false)
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showDeleteConfirm = ref(false)
const editingUser = ref<UserData | null>(null)
const deletingUser = ref<UserData | null>(null)
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

const roleLabels: Record<string, string> = {
  super_admin: 'Super Admin',
  admin_enterprise: 'Admin Entreprise',
  manager: 'Manager',
}

const roleBadgeVariant: Record<string, string> = {
  super_admin: 'danger',
  admin_enterprise: 'warning',
  manager: 'info',
}

const roleOptions = computed(() => {
  if (permissions.isSuperAdmin.value) {
    return [
      { label: 'Selectionner un role', value: '' },
      { label: 'Super Administrateur', value: 'super_admin' },
      { label: 'Administrateur Entreprise', value: 'admin_enterprise' },
      { label: 'Manager', value: 'manager' },
    ]
  }
  return [
    { label: 'Selectionner un role', value: '' },
    { label: 'Manager', value: 'manager' },
  ]
})

const companyOptions = computed(() => {
  return [
    { label: 'Selectionner une entreprise', value: '' },
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
    users.value = await userApi.getAll()
  } catch {
    toast.showError('Erreur lors du chargement des utilisateurs')
  } finally {
    isLoading.value = false
  }
}

function openEditModal(user: UserData) {
  editingUser.value = { ...user }
  showEditModal.value = true
}

function openDeleteConfirm(user: UserData) {
  deletingUser.value = user
  showDeleteConfirm.value = true
}

async function toggleActive(user: UserData) {
  try {
    const updated = await userApi.toggleActive(user.id)
    const index = users.value.findIndex((u) => u.id === user.id)
    if (index !== -1) {
      users.value[index] = updated
    }
    toast.showSuccess(updated.isActive ? 'Utilisateur active' : 'Utilisateur desactive')
  } catch {
    toast.showError('Erreur lors du changement de statut')
  }
}

async function resetPassword(user: UserData) {
  try {
    await userApi.resetPassword(user.id)
    toast.showSuccess(`Email de reinitialisation envoye a ${user.email}`)
  } catch {
    toast.showError('Erreur lors de la reinitialisation du mot de passe')
  }
}

async function handleCreate() {
  if (!createForm.value.firstName || !createForm.value.email || !createForm.value.role) {
    toast.showError('Veuillez remplir tous les champs obligatoires')
    return
  }
  if (!createForm.value.password) {
    toast.showError('Veuillez saisir un mot de passe')
    return
  }
  if (createForm.value.password !== createForm.value.confirmPassword) {
    toast.showError('Les mots de passe ne correspondent pas')
    return
  }
  // super_admin doit choisir une entreprise pour les roles non-super_admin
  if (permissions.isSuperAdmin.value && createForm.value.role !== 'super_admin' && !createForm.value.companyId) {
    toast.showError('Veuillez selectionner une entreprise')
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
    toast.showSuccess('Utilisateur cree avec succes')
    showCreateModal.value = false
    createForm.value = { firstName: '', lastName: '', email: '', role: '', companyId: '', password: '', confirmPassword: '' }
  } catch {
    toast.showError("Erreur lors de la creation de l'utilisateur")
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
    toast.showSuccess('Utilisateur mis a jour')
    showEditModal.value = false
  } catch {
    toast.showError("Erreur lors de la mise a jour de l'utilisateur")
  } finally {
    isSaving.value = false
  }
}

async function handleDelete() {
  if (!deletingUser.value) return
  isSaving.value = true
  try {
    await userApi.getById(deletingUser.value.id) // Verify user still exists
    // Use a simple DELETE via the API
    const { default: apiClient } = await import('@/services/api/client')
    await apiClient.delete(`/users/${deletingUser.value.id}`)
    users.value = users.value.filter((u) => u.id !== deletingUser.value!.id)
    toast.showSuccess('Utilisateur supprime')
    showDeleteConfirm.value = false
    deletingUser.value = null
  } catch {
    toast.showError("Erreur lors de la suppression de l'utilisateur")
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
        <h1 class="text-2xl font-bold text-gray-900">Gestion des utilisateurs</h1>
        <p class="text-sm text-gray-500 mt-1">{{ users.length }} utilisateur(s) dans le systeme</p>
      </div>
      <AppButton variant="primary" @click="showCreateModal = true">
        <UserPlusIcon class="w-4 h-4 mr-1" />
        Creer un utilisateur
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
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entreprise</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date creation</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
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
                  {{ u.isActive ? 'Actif' : 'Inactif' }}
                </AppBadge>
              </td>
              <td class="px-4 py-3 text-sm text-gray-600">{{ formatDate(u.createdAt) }}</td>
              <td class="px-4 py-3">
                <div class="flex gap-1">
                  <AppButton size="sm" variant="ghost" @click="openEditModal(u)" title="Modifier">
                    <PencilIcon class="w-4 h-4" />
                  </AppButton>
                  <AppButton
                    size="sm"
                    variant="ghost"
                    :class="u.isActive ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'"
                    @click="toggleActive(u)"
                    :title="u.isActive ? 'Desactiver' : 'Activer'"
                    :disabled="u.id === authStore.user?.id"
                  >
                    <EyeSlashIcon v-if="u.isActive" class="w-4 h-4" />
                    <EyeIcon v-else class="w-4 h-4" />
                  </AppButton>
                  <AppButton size="sm" variant="ghost" @click="resetPassword(u)" title="Reinitialiser le mot de passe">
                    <KeyIcon class="w-4 h-4" />
                  </AppButton>
                  <AppButton
                    v-if="permissions.isSuperAdmin.value && u.id !== authStore.user?.id"
                    size="sm"
                    variant="ghost"
                    class="text-red-600 hover:text-red-700"
                    @click="openDeleteConfirm(u)"
                    title="Supprimer"
                  >
                    <TrashIcon class="w-4 h-4" />
                  </AppButton>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="!isLoading && users.length === 0" class="text-center py-8 text-gray-500">
        Aucun utilisateur trouve
      </div>
    </AppCard>

    <!-- Create User Modal -->
    <AppModal v-model="showCreateModal" title="Creer un utilisateur" size="lg">
      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <AppInput v-model="createForm.firstName" label="Prenom *" />
          <AppInput v-model="createForm.lastName" label="Nom *" />
        </div>
        <AppInput v-model="createForm.email" label="Email *" type="email" />
        <AppSelect v-model="createForm.role" label="Role *" :options="roleOptions" />
        <AppSelect
          v-if="permissions.isSuperAdmin.value && createForm.role && createForm.role !== 'super_admin'"
          v-model="createForm.companyId"
          label="Entreprise *"
          :options="companyOptions"
        />
        <AppInput v-model="createForm.password" label="Mot de passe *" type="password" />
        <AppInput v-model="createForm.confirmPassword" label="Confirmer le mot de passe *" type="password" />
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <AppButton variant="secondary" @click="showCreateModal = false">Annuler</AppButton>
          <AppButton variant="primary" :loading="isSaving" @click="handleCreate">Creer</AppButton>
        </div>
      </template>
    </AppModal>

    <!-- Edit User Modal -->
    <AppModal v-if="editingUser" v-model="showEditModal" title="Modifier l'utilisateur" size="lg">
      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <AppInput v-model="editingUser.firstName" label="Prenom" />
          <AppInput v-model="editingUser.lastName" label="Nom" />
        </div>
        <AppInput v-model="editingUser.email" label="Email" type="email" />
        <AppSelect v-model="editingUser.role" label="Role" :options="roleOptions" />
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <AppButton variant="secondary" @click="showEditModal = false">Annuler</AppButton>
          <AppButton variant="primary" :loading="isSaving" @click="handleEditSave">Enregistrer</AppButton>
        </div>
      </template>
    </AppModal>

    <!-- Delete Confirmation Modal -->
    <AppModal v-if="deletingUser" v-model="showDeleteConfirm" title="Confirmer la suppression">
      <p class="text-sm text-gray-700">
        Voulez-vous vraiment supprimer l'utilisateur
        <span class="font-semibold">{{ deletingUser.firstName }} {{ deletingUser.lastName }}</span> ?
        Cette action est irreversible.
      </p>
      <template #footer>
        <div class="flex justify-end gap-3">
          <AppButton variant="secondary" @click="showDeleteConfirm = false">Annuler</AppButton>
          <AppButton variant="danger" :loading="isSaving" @click="handleDelete">Supprimer</AppButton>
        </div>
      </template>
    </AppModal>
  </div>
</template>
