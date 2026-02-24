<script setup lang="ts">
import { ref, computed } from 'vue'
import { usePermissions } from '@/composables/usePermissions'
import { useToast } from '@/composables/useToast'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import { PencilIcon, EyeIcon, EyeSlashIcon, KeyIcon, UserPlusIcon } from '@heroicons/vue/24/outline'

const permissions = usePermissions()
const toast = useToast()

const showCreateModal = ref(false)
const showEditModal = ref(false)
const editingUser = ref<any>(null)

const createForm = ref({
  firstName: '',
  lastName: '',
  email: '',
  role: '',
  companyName: '',
  password: '',
  confirmPassword: '',
})

const mockUsers = ref([
  { id: '1', firstName: 'Admin', lastName: 'System', email: 'admin@tanga.com', role: 'super_admin', companyName: '-', isActive: true, createdAt: '2024-01-01' },
  { id: '2', firstName: 'Moussa', lastName: 'Traore', email: 'moussa@company.com', role: 'admin_enterprise', companyName: 'TechBurk SARL', isActive: true, createdAt: '2024-02-15' },
  { id: '3', firstName: 'Fatou', lastName: 'Coulibaly', email: 'fatou@company.com', role: 'manager', companyName: 'TechBurk SARL', isActive: true, createdAt: '2024-03-20' },
  { id: '4', firstName: 'Ibrahim', lastName: 'Sawadogo', email: 'ibrahim@corp.com', role: 'admin_enterprise', companyName: 'WestLink Corp', isActive: false, createdAt: '2024-04-05' },
])

const roleLabels: Record<string, string> = {
  super_admin: 'Super Admin',
  admin_enterprise: 'Admin Entreprise',
  manager: 'Manager',
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

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('fr-FR')
}

function openEditModal(user: any) {
  editingUser.value = { ...user }
  showEditModal.value = true
}

function toggleActive(user: any) {
  user.isActive = !user.isActive
  toast.success(user.isActive ? 'Utilisateur active' : 'Utilisateur desactive')
}

function resetPassword(user: any) {
  toast.success(`Email de reinitialisation envoye a ${user.email}`)
}

function handleCreate() {
  if (!createForm.value.firstName || !createForm.value.email || !createForm.value.role) {
    toast.error('Veuillez remplir tous les champs obligatoires')
    return
  }
  if (createForm.value.password !== createForm.value.confirmPassword) {
    toast.error('Les mots de passe ne correspondent pas')
    return
  }
  mockUsers.value.push({
    id: String(mockUsers.value.length + 1),
    firstName: createForm.value.firstName,
    lastName: createForm.value.lastName,
    email: createForm.value.email,
    role: createForm.value.role as 'super_admin' | 'admin_enterprise' | 'manager',
    companyName: createForm.value.companyName || '-',
    isActive: true,
    createdAt: new Date().toISOString().split('T')[0]!,
  })
  toast.success('Utilisateur cree avec succes')
  showCreateModal.value = false
  createForm.value = { firstName: '', lastName: '', email: '', role: '', companyName: '', password: '', confirmPassword: '' }
}

function handleEditSave() {
  const index = mockUsers.value.findIndex((u) => u.id === editingUser.value.id)
  if (index !== -1) {
    mockUsers.value[index] = { ...editingUser.value }
  }
  toast.success('Utilisateur mis a jour')
  showEditModal.value = false
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Gestion des utilisateurs</h1>
        <p class="text-sm text-gray-500 mt-1">{{ mockUsers.length }} utilisateur(s) dans le systeme</p>
      </div>
      <AppButton variant="primary" @click="showCreateModal = true">
        <UserPlusIcon class="w-4 h-4 mr-1" />
        Creer un utilisateur
      </AppButton>
    </div>

    <AppCard>
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
            <tr v-for="user in mockUsers" :key="user.id" class="hover:bg-gray-50">
              <td class="px-4 py-3 text-sm font-medium text-gray-900">{{ user.firstName }} {{ user.lastName }}</td>
              <td class="px-4 py-3 text-sm text-gray-600">{{ user.email }}</td>
              <td class="px-4 py-3">
                <AppBadge variant="info">{{ roleLabels[user.role] ?? user.role }}</AppBadge>
              </td>
              <td class="px-4 py-3 text-sm text-gray-600">{{ user.companyName }}</td>
              <td class="px-4 py-3">
                <AppBadge :variant="user.isActive ? 'success' : 'neutral'">
                  {{ user.isActive ? 'Actif' : 'Inactif' }}
                </AppBadge>
              </td>
              <td class="px-4 py-3 text-sm text-gray-600">{{ formatDate(user.createdAt) }}</td>
              <td class="px-4 py-3">
                <div class="flex gap-1">
                  <AppButton size="sm" variant="ghost" @click="openEditModal(user)" title="Modifier">
                    <PencilIcon class="w-4 h-4" />
                  </AppButton>
                  <AppButton size="sm" variant="ghost" :class="user.isActive ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'" @click="toggleActive(user)" :title="user.isActive ? 'Desactiver' : 'Activer'">
                    <EyeSlashIcon v-if="user.isActive" class="w-4 h-4" />
                    <EyeIcon v-else class="w-4 h-4" />
                  </AppButton>
                  <AppButton size="sm" variant="ghost" @click="resetPassword(user)" title="Reinitialiser le mot de passe">
                    <KeyIcon class="w-4 h-4" />
                  </AppButton>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
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
        <AppInput v-model="createForm.companyName" label="Entreprise" />
        <AppInput v-model="createForm.password" label="Mot de passe *" type="password" />
        <AppInput v-model="createForm.confirmPassword" label="Confirmer le mot de passe *" type="password" />
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <AppButton variant="secondary" @click="showCreateModal = false">Annuler</AppButton>
          <AppButton variant="primary" @click="handleCreate">Creer</AppButton>
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
          <AppButton variant="primary" @click="handleEditSave">Enregistrer</AppButton>
        </div>
      </template>
    </AppModal>
  </div>
</template>
