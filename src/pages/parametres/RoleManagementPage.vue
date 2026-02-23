<script setup lang="ts">
import { ref } from 'vue'
import { useToast } from '@/composables/useToast'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppToggle from '@/components/ui/AppToggle.vue'

const toast = useToast()

const adminPermissions = ref({
  manageSites: true,
  manageEmployees: true,
  manageCards: true,
  viewAttendanceReports: true,
  manageBiometric: true,
  viewFeelback: true,
  orderMarketplace: true,
  manageUsers: true,
})

const managerPermissions = ref({
  viewSiteEmployees: true,
  validateAttendance: true,
  viewDeptReports: true,
  viewFeelback: false,
})

const superAdminPermissions = [
  'Gestion de toutes les entreprises',
  'Gestion des utilisateurs et roles',
  'Acces aux parametres globaux',
  'Gestion des produits marketplace',
  'Acces aux rapports complets',
  'Gestion des terminaux biometriques',
  'Gestion des terminaux Feelback',
  'Configuration des alertes',
]

function saveAdminPermissions() {
  toast.showSuccess('Permissions Administrateur Entreprise mises a jour')
}

function saveManagerPermissions() {
  toast.showSuccess('Permissions Manager mises a jour')
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Gestion des roles et permissions</h1>
      <p class="text-sm text-gray-500 mt-1">Configurez les permissions pour chaque role dans le systeme</p>
    </div>

    <!-- Super Admin -->
    <AppCard title="Super Administrateur">
      <p class="text-sm text-gray-600 mb-4">Acces complet a toutes les fonctionnalites de la plateforme</p>
      <div class="flex flex-wrap gap-2">
        <AppBadge v-for="perm in superAdminPermissions" :key="perm" variant="success">
          {{ perm }}
        </AppBadge>
      </div>
      <p class="text-xs text-gray-400 mt-4">Ce role n'est pas modifiable</p>
    </AppCard>

    <!-- Admin Entreprise -->
    <AppCard title="Administrateur Entreprise">
      <p class="text-sm text-gray-600 mb-6">Gestion de son entreprise et de ses employes</p>
      <div class="space-y-4 max-w-lg">
        <div class="flex items-center justify-between py-2 border-b border-gray-100">
          <div>
            <p class="text-sm font-medium text-gray-800">Gerer les sites et departements</p>
            <p class="text-xs text-gray-500">Creer, modifier et supprimer les sites</p>
          </div>
          <AppToggle v-model="adminPermissions.manageSites" />
        </div>
        <div class="flex items-center justify-between py-2 border-b border-gray-100">
          <div>
            <p class="text-sm font-medium text-gray-800">Gerer les employes</p>
            <p class="text-xs text-gray-500">Ajouter, modifier et archiver les employes</p>
          </div>
          <AppToggle v-model="adminPermissions.manageEmployees" />
        </div>
        <div class="flex items-center justify-between py-2 border-b border-gray-100">
          <div>
            <p class="text-sm font-medium text-gray-800">Gerer les cartes RFID</p>
            <p class="text-xs text-gray-500">Enregistrer et gerer les cartes d'acces</p>
          </div>
          <AppToggle v-model="adminPermissions.manageCards" />
        </div>
        <div class="flex items-center justify-between py-2 border-b border-gray-100">
          <div>
            <p class="text-sm font-medium text-gray-800">Voir les rapports de pointage</p>
            <p class="text-xs text-gray-500">Acceder aux rapports d'attendance</p>
          </div>
          <AppToggle v-model="adminPermissions.viewAttendanceReports" />
        </div>
        <div class="flex items-center justify-between py-2 border-b border-gray-100">
          <div>
            <p class="text-sm font-medium text-gray-800">Gerer les terminaux biometriques</p>
            <p class="text-xs text-gray-500">Configurer les lecteurs d'empreintes</p>
          </div>
          <AppToggle v-model="adminPermissions.manageBiometric" />
        </div>
        <div class="flex items-center justify-between py-2 border-b border-gray-100">
          <div>
            <p class="text-sm font-medium text-gray-800">Voir les donnees Feelback</p>
            <p class="text-xs text-gray-500">Consulter les statistiques de satisfaction</p>
          </div>
          <AppToggle v-model="adminPermissions.viewFeelback" />
        </div>
        <div class="flex items-center justify-between py-2 border-b border-gray-100">
          <div>
            <p class="text-sm font-medium text-gray-800">Commander des cartes (Marketplace)</p>
            <p class="text-xs text-gray-500">Passer des commandes de cartes RFID</p>
          </div>
          <AppToggle v-model="adminPermissions.orderMarketplace" />
        </div>
        <div class="flex items-center justify-between py-2 border-b border-gray-100">
          <div>
            <p class="text-sm font-medium text-gray-800">Gerer les utilisateurs (managers)</p>
            <p class="text-xs text-gray-500">Creer et gerer les managers de son entreprise</p>
          </div>
          <AppToggle v-model="adminPermissions.manageUsers" />
        </div>
        <div class="pt-2">
          <AppButton variant="primary" @click="saveAdminPermissions">Enregistrer les permissions</AppButton>
        </div>
      </div>
    </AppCard>

    <!-- Manager -->
    <AppCard title="Manager">
      <p class="text-sm text-gray-600 mb-6">Consultation et validation des presences de son departement</p>
      <div class="space-y-4 max-w-lg">
        <div class="flex items-center justify-between py-2 border-b border-gray-100">
          <div>
            <p class="text-sm font-medium text-gray-800">Voir les employes de son site</p>
            <p class="text-xs text-gray-500">Consulter la liste des employes de son site</p>
          </div>
          <AppToggle v-model="managerPermissions.viewSiteEmployees" />
        </div>
        <div class="flex items-center justify-between py-2 border-b border-gray-100">
          <div>
            <p class="text-sm font-medium text-gray-800">Valider les presences</p>
            <p class="text-xs text-gray-500">Approuver ou corriger les pointages</p>
          </div>
          <AppToggle v-model="managerPermissions.validateAttendance" />
        </div>
        <div class="flex items-center justify-between py-2 border-b border-gray-100">
          <div>
            <p class="text-sm font-medium text-gray-800">Voir les rapports de son departement</p>
            <p class="text-xs text-gray-500">Acceder aux rapports d'attendance de son equipe</p>
          </div>
          <AppToggle v-model="managerPermissions.viewDeptReports" />
        </div>
        <div class="flex items-center justify-between py-2 border-b border-gray-100">
          <div>
            <p class="text-sm font-medium text-gray-800">Consulter les donnees Feelback</p>
            <p class="text-xs text-gray-500">Voir les statistiques de satisfaction de son site</p>
          </div>
          <AppToggle v-model="managerPermissions.viewFeelback" />
        </div>
        <div class="pt-2">
          <AppButton variant="primary" @click="saveManagerPermissions">Enregistrer les permissions</AppButton>
        </div>
      </div>
    </AppCard>

    <div class="p-4 bg-blue-50 rounded-lg border border-blue-200">
      <p class="text-sm text-blue-700">
        Les modifications de permissions prennent effet immediatement pour les nouveaux acces.
        Les sessions actives seront mises a jour lors de la prochaine connexion.
      </p>
    </div>
  </div>
</template>
