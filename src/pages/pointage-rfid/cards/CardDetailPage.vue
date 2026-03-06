<template>
  <div class="card-detail-page">
    <div class="page-header">
      <AppButton variant="secondary" @click="navigateBack">
        <ArrowLeftIcon class="w-4 h-4 mr-1" />
        Retour
      </AppButton>
      <h1>Details de la carte RFID</h1>
    </div>

    <div v-if="loading" class="loading">
      Chargement...
    </div>

    <div v-else-if="card" class="card-content">
      <AppCard>
        <div class="card-info">
          <div class="uid-section">
            <label>UID de la carte</label>
            <div class="uid-value">{{ card.uid }}</div>
          </div>

          <div class="info-row">
            <label>Statut</label>
            <AppBadge :variant="getStatusVariant(card.status)">
              {{ getStatusLabel(card.status) }}
            </AppBadge>
          </div>

          <div v-if="card.employee" class="employee-section">
            <h3>Informations de l'employe</h3>
            <div class="employee-info">
              <div class="employee-photo">
                <div class="photo-placeholder">
                  {{ getInitials(card.employee.firstName, card.employee.lastName) }}
                </div>
              </div>
              <div class="employee-details">
                <div class="info-row">
                  <label>Nom complet</label>
                  <span>{{ card.employee.firstName }} {{ card.employee.lastName }}</span>
                </div>
                <div class="info-row">
                  <label>Poste</label>
                  <span>{{ card.employee.position || '-' }}</span>
                </div>
                <div class="info-row">
                  <label>Entreprise</label>
                  <span>{{ card.employee.company?.name || '-' }}</span>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="unassigned-section">
            <p class="unassigned-text">Cette carte n'est pas attribuee a un employe</p>
          </div>

          <div class="info-row">
            <label>Date d'attribution</label>
            <span>{{ card.assignedDate ? formatDate(card.assignedDate) : '-' }}</span>
          </div>

          <div class="info-row">
            <label>Entreprise</label>
            <span>{{ card.company?.name || '-' }}</span>
          </div>

          <div class="info-row">
            <label>Date de creation</label>
            <span>{{ formatDate(card.createdAt) }}</span>
          </div>
        </div>
      </AppCard>

      <div class="action-buttons">
        <AppButton
          v-if="!card.employee && (permissions.isSuperAdmin.value || permissions.isAdminEnterprise.value)"
          variant="primary"
          @click="openAssignModal"
        >
          <CheckIcon class="w-4 h-4 mr-1" />
          Attribuer a un employe
        </AppButton>

        <AppButton
          v-if="card.employee && (permissions.isSuperAdmin.value || permissions.isAdminEnterprise.value)"
          variant="secondary"
          @click="openUnassignModal"
        >
          <XMarkIcon class="w-4 h-4 mr-1" />
          Desattribuer
        </AppButton>

        <AppButton
          v-if="card.status === CardStatus.ACTIVE && (permissions.isSuperAdmin.value || permissions.isAdminEnterprise.value)"
          variant="danger"
          @click="openBlockModal"
        >
          <NoSymbolIcon class="w-4 h-4 mr-1" />
          Bloquer la carte
        </AppButton>

        <AppButton
          v-if="card.status === CardStatus.BLOCKED && (permissions.isSuperAdmin.value || permissions.isAdminEnterprise.value)"
          variant="success"
          @click="openUnblockModal"
        >
          <LockOpenIcon class="w-4 h-4 mr-1" />
          Debloquer la carte
        </AppButton>

        <AppButton
          variant="secondary"
          @click="navigateToHistory"
        >
          <ClockIcon class="w-4 h-4 mr-1" />
          Voir l'historique
        </AppButton>
      </div>
    </div>

    <div v-else class="error">
      Carte non trouvee
    </div>

    <AppModal
      v-model="assignModalVisible"
      title="Attribuer la carte"
    >
      <div class="modal-content">
        <!-- Filtres entreprise+site : super admin seulement -->
        <template v-if="permissions.isSuperAdmin.value">
          <div class="form-group">
            <label>Entreprise</label>
            <select v-model="assignFilterCompanyId" class="form-select" @change="handleAssignCompanyChange">
              <option value="">Toutes les entreprises</option>
              <option v-for="c in companyStore.companies" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>Site</label>
            <select v-model="assignFilterSiteId" class="form-select" :disabled="!assignFilterCompanyId">
              <option value="">Tous les sites</option>
              <option v-for="s in assignSiteOptions" :key="s.id" :value="s.id">{{ s.name }}</option>
            </select>
          </div>
        </template>

        <div class="form-group">
          <label for="employee-select">Selectionner un employe</label>
          <select
            id="employee-select"
            v-model="selectedEmployeeId"
            class="form-select"
          >
            <option value="">-- Choisir un employe --</option>
            <option
              v-for="employee in filteredAvailableEmployees"
              :key="employee.id"
              :value="employee.id"
            >
              {{ employee.firstName }} {{ employee.lastName }}{{ employee.employeeNumber ? ` (${employee.employeeNumber})` : '' }}
            </option>
          </select>
          <p v-if="filteredAvailableEmployees.length === 0" class="mt-1 text-sm text-gray-500">
            Aucun employe disponible{{ assignFilterCompanyId ? ' pour cette selection' : '' }}.
          </p>
        </div>
      </div>
      <template #footer>
        <AppButton variant="secondary" @click="cancelAssign">Annuler</AppButton>
        <AppButton variant="primary" :disabled="!selectedEmployeeId" @click="confirmAssign">Attribuer</AppButton>
      </template>
    </AppModal>

    <AppModal
      v-model="unassignModalVisible"
      title="Desattribuer la carte"
    >
      <div class="modal-content">
        <p>Etes-vous sur de vouloir desattribuer cette carte?</p>
        <p v-if="card?.employee">
          Employe actuel: <strong>{{ card.employee.firstName }} {{ card.employee.lastName }}</strong>
        </p>
      </div>
      <template #footer>
        <AppButton variant="secondary" @click="cancelUnassign">Annuler</AppButton>
        <AppButton variant="primary" @click="confirmUnassign">Desattribuer</AppButton>
      </template>
    </AppModal>

    <AppModal
      v-model="blockModalVisible"
      title="Bloquer la carte"
    >
      <div class="modal-content">
        <p>Etes-vous sur de vouloir bloquer cette carte?</p>
        <div class="form-group">
          <label for="block-reason">Raison du blocage</label>
          <textarea
            id="block-reason"
            v-model="blockReason"
            class="form-textarea"
            rows="3"
            placeholder="Entrez la raison du blocage"
            required
          ></textarea>
        </div>
      </div>
      <template #footer>
        <AppButton variant="secondary" @click="cancelBlock">Annuler</AppButton>
        <AppButton variant="danger" @click="confirmBlock">Bloquer</AppButton>
      </template>
    </AppModal>

    <AppModal
      v-model="unblockModalVisible"
      title="Debloquer la carte"
    >
      <div class="modal-content">
        <p>Etes-vous sur de vouloir debloquer cette carte?</p>
      </div>
      <template #footer>
        <AppButton variant="secondary" @click="cancelUnblock">Annuler</AppButton>
        <AppButton variant="success" @click="confirmUnblock">Debloquer</AppButton>
      </template>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import AppButton from '@/components/ui/AppButton.vue';
import AppCard from '@/components/ui/AppCard.vue';
import AppBadge from '@/components/ui/AppBadge.vue';
import AppModal from '@/components/ui/AppModal.vue';
import { ArrowLeftIcon, CheckIcon, XMarkIcon, NoSymbolIcon, LockOpenIcon, ClockIcon } from '@heroicons/vue/24/outline';
import { useCardStore } from '@/stores/card.store';
import { useEmployeeStore } from '@/stores/employee.store';
import { useCompanyStore } from '@/stores/company.store';
import { useSiteStore } from '@/stores/site.store';
import { usePermissions } from '@/composables/usePermissions';
import { useToast } from '@/composables/useToast';
import { CardStatus } from '@/types/enums';

const router = useRouter();
const route = useRoute();
const cardStore = useCardStore();
const employeeStore = useEmployeeStore();
const companyStore = useCompanyStore();
const siteStore = useSiteStore();
const permissions = usePermissions();
const toast = useToast();

const loading = ref(false);
const assignModalVisible = ref(false);
const unassignModalVisible = ref(false);
const blockModalVisible = ref(false);
const unblockModalVisible = ref(false);
const selectedEmployeeId = ref('');
const blockReason = ref('');

// Filtres attribution (super admin seulement)
const assignFilterCompanyId = ref('');
const assignFilterSiteId = ref('');

const cardId = computed(() => route.params.id as string);

const card = computed(() => cardStore.currentCard);

const assignSiteOptions = computed(() => {
  if (!assignFilterCompanyId.value) return [];
  return siteStore.sites.filter(s => s.companyId === assignFilterCompanyId.value);
});

const filteredAvailableEmployees = computed(() => {
  let employees = employeeStore.employees.filter(e => !e.rfidCardId);
  if (permissions.isSuperAdmin.value) {
    if (assignFilterCompanyId.value) {
      employees = employees.filter(e => e.companyId === assignFilterCompanyId.value);
    }
    if (assignFilterSiteId.value) {
      employees = employees.filter(e => e.siteId === assignFilterSiteId.value);
    }
  }
  return employees;
});

function handleAssignCompanyChange() {
  assignFilterSiteId.value = '';
  selectedEmployeeId.value = '';
}

const getStatusVariant = (status: CardStatus): string => {
  switch (status) {
    case CardStatus.ACTIVE:
      return 'success';
    case CardStatus.INACTIVE:
      return 'secondary';
    case CardStatus.BLOCKED:
      return 'danger';
    case CardStatus.LOST:
      return 'warning';
    default:
      return 'secondary';
  }
};

const getStatusLabel = (status: CardStatus): string => {
  switch (status) {
    case CardStatus.ACTIVE:
      return 'Actif';
    case CardStatus.INACTIVE:
      return 'Inactif';
    case CardStatus.BLOCKED:
      return 'Bloque';
    case CardStatus.LOST:
      return 'Perdu';
    default:
      return status;
  }
};

const formatDate = (date: string | Date): string => {
  return new Date(date).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getInitials = (firstName: string, lastName: string): string => {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
};

const navigateBack = () => {
  router.push('/pointage-rfid/cards');
};

const navigateToHistory = () => {
  router.push(`/pointage-rfid/cards/${cardId.value}/history`);
};

const openAssignModal = () => {
  selectedEmployeeId.value = '';
  assignFilterCompanyId.value = '';
  assignFilterSiteId.value = '';
  assignModalVisible.value = true;
};

const confirmAssign = async () => {
  if (!selectedEmployeeId.value) return;

  try {
    await cardStore.assignCard(cardId.value, selectedEmployeeId.value);
    toast.success('Succes', 'Carte attribuee avec succes');
    assignModalVisible.value = false;
    selectedEmployeeId.value = '';
    await cardStore.fetchCard(cardId.value);
  } catch (error: any) {
    toast.error('Erreur', error.message || "Erreur lors de l'attribution");
  }
};

const cancelAssign = () => {
  assignModalVisible.value = false;
  selectedEmployeeId.value = '';
};

const openUnassignModal = () => {
  unassignModalVisible.value = true;
};

const confirmUnassign = async () => {
  try {
    await cardStore.unassignCard(cardId.value);
    toast.success('Succes', 'Carte desattribuee avec succes');
    unassignModalVisible.value = false;
    await cardStore.fetchCard(cardId.value);
  } catch (error: any) {
    toast.error('Erreur', error.message || 'Erreur lors de la desattribution');
  }
};

const cancelUnassign = () => {
  unassignModalVisible.value = false;
};

const openBlockModal = () => {
  blockReason.value = '';
  blockModalVisible.value = true;
};

const confirmBlock = async () => {
  if (!blockReason.value.trim()) return;

  try {
    await cardStore.blockCard(cardId.value, blockReason.value);
    toast.success('Succes', 'Carte bloquee avec succes');
    blockModalVisible.value = false;
    blockReason.value = '';
    await cardStore.fetchCard(cardId.value);
  } catch (error: any) {
    toast.error('Erreur', error.message || 'Erreur lors du blocage');
  }
};

const cancelBlock = () => {
  blockModalVisible.value = false;
  blockReason.value = '';
};

const openUnblockModal = () => {
  unblockModalVisible.value = true;
};

const confirmUnblock = async () => {
  try {
    await cardStore.unblockCard(cardId.value);
    toast.success('Succes', 'Carte debloquee avec succes');
    unblockModalVisible.value = false;
    await cardStore.fetchCard(cardId.value);
  } catch (error: any) {
    toast.error('Erreur', error.message || 'Erreur lors du deblocage');
  }
};

const cancelUnblock = () => {
  unblockModalVisible.value = false;
};

onMounted(async () => {
  loading.value = true;
  try {
    const promises: Promise<any>[] = [
      cardStore.fetchCard(cardId.value),
      employeeStore.fetchEmployees({ perPage: 500, companyId: undefined, siteId: undefined, departmentId: undefined, search: undefined, isActive: undefined }),
    ];
    if (permissions.isSuperAdmin.value) {
      promises.push(companyStore.fetchCompanies({ perPage: 100 }));
      promises.push(siteStore.fetchSites({ perPage: 200 }));
    }
    await Promise.all(promises);
  } catch {
    toast.error('Erreur', 'Impossible de charger les donnees de la carte');
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.card-detail-page {
  padding: 2rem;
  max-width: 1000px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.page-header h1 {
  font-size: 2rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.loading,
.error {
  text-align: center;
  padding: 3rem;
  color: #6b7280;
  font-size: 1.125rem;
}

.error {
  color: #ef4444;
}

.card-info {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.uid-section {
  border-bottom: 2px solid #e5e7eb;
  padding-bottom: 1.5rem;
}

.uid-section label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b7280;
  margin-bottom: 0.5rem;
}

.uid-value {
  font-size: 1.5rem;
  font-weight: 600;
  font-family: 'Courier New', monospace;
  color: #1f2937;
  letter-spacing: 0.05em;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid #f3f4f6;
}

.info-row label {
  font-weight: 500;
  color: #6b7280;
  font-size: 0.875rem;
}

.info-row span {
  color: #1f2937;
  font-size: 0.875rem;
}

.employee-section {
  background-color: #f9fafb;
  padding: 1.5rem;
  border-radius: 0.5rem;
}

.employee-section h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 1rem 0;
}

.employee-info {
  display: flex;
  gap: 1.5rem;
  align-items: flex-start;
}

.employee-photo {
  flex-shrink: 0;
}

.photo-placeholder {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5rem;
  font-weight: 600;
}

.employee-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.unassigned-section {
  background-color: #fef3c7;
  padding: 1rem;
  border-radius: 0.5rem;
  text-align: center;
}

.unassigned-text {
  color: #92400e;
  font-style: italic;
  margin: 0;
}

.action-buttons {
  margin-top: 2rem;
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.modal-content {
  padding: 1rem 0;
}

.modal-content p {
  margin-bottom: 1rem;
  color: #374151;
}

.form-group {
  margin-top: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.form-select,
.form-textarea {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  transition: border-color 0.2s;
}

.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-textarea {
  resize: vertical;
  font-family: inherit;
}
</style>
