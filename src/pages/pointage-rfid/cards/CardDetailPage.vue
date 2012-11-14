<template>
  <div class="card-detail-page">
    <div class="page-header">
      <AppButton variant="secondary" @click="navigateBack">
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
          v-if="!card.employee && permissions.canUpdate('cards')"
          variant="primary"
          @click="openAssignModal"
        >
          Attribuer a un employe
        </AppButton>

        <AppButton
          v-if="card.employee && permissions.canUpdate('cards')"
          variant="secondary"
          @click="openUnassignModal"
        >
          Desattribuer
        </AppButton>

        <AppButton
          v-if="card.status === CardStatus.ACTIVE && permissions.canUpdate('cards')"
          variant="danger"
          @click="openBlockModal"
        >
          Bloquer la carte
        </AppButton>

        <AppButton
          v-if="card.status === CardStatus.BLOCKED && permissions.canUpdate('cards')"
          variant="success"
          @click="openUnblockModal"
        >
          Debloquer la carte
        </AppButton>

        <AppButton
          variant="secondary"
          @click="navigateToHistory"
        >
          Voir l'historique
        </AppButton>
      </div>
    </div>

    <div v-else class="error">
      Carte non trouvee
    </div>

    <AppModal
      v-model:visible="assignModalVisible"
      title="Attribuer la carte"
      @confirm="confirmAssign"
      @cancel="cancelAssign"
    >
      <div class="modal-content">
        <div class="form-group">
          <label for="employee-select">Selectionner un employe</label>
          <select
            id="employee-select"
            v-model="selectedEmployeeId"
            class="form-select"
          >
            <option value="">-- Choisir un employe --</option>
            <option
              v-for="employee in availableEmployees"
              :key="employee.id"
              :value="employee.id"
            >
              {{ employee.firstName }} {{ employee.lastName }} - {{ employee.company?.name }}
            </option>
          </select>
        </div>
      </div>
    </AppModal>

    <AppModal
      v-model:visible="unassignModalVisible"
      title="Desattribuer la carte"
      @confirm="confirmUnassign"
      @cancel="cancelUnassign"
    >
      <div class="modal-content">
        <p>Etes-vous sur de vouloir desattribuer cette carte?</p>
        <p v-if="card?.employee">
          Employe actuel: <strong>{{ card.employee.firstName }} {{ card.employee.lastName }}</strong>
        </p>
      </div>
    </AppModal>

    <AppModal
      v-model:visible="blockModalVisible"
      title="Bloquer la carte"
      @confirm="confirmBlock"
      @cancel="cancelBlock"
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
    </AppModal>

    <AppModal
      v-model:visible="unblockModalVisible"
      title="Debloquer la carte"
      @confirm="confirmUnblock"
      @cancel="cancelUnblock"
    >
      <div class="modal-content">
        <p>Etes-vous sur de vouloir debloquer cette carte?</p>
      </div>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import AppButton from '@/components/common/AppButton.vue';
import AppCard from '@/components/common/AppCard.vue';
import AppBadge from '@/components/common/AppBadge.vue';
import AppModal from '@/components/common/AppModal.vue';
import { useCardStore } from '@/stores/cardStore';
import { useEmployeeStore } from '@/stores/employeeStore';
import { usePermissions } from '@/composables/usePermissions';
import { CardStatus } from '@/types/rfid';

const router = useRouter();
const route = useRoute();
const cardStore = useCardStore();
const employeeStore = useEmployeeStore();
const permissions = usePermissions();

const loading = ref(false);
const assignModalVisible = ref(false);
const unassignModalVisible = ref(false);
const blockModalVisible = ref(false);
const unblockModalVisible = ref(false);
const selectedEmployeeId = ref('');
const blockReason = ref('');

const cardId = computed(() => route.params.id as string);

const card = computed(() => cardStore.currentCard);

const availableEmployees = computed(() => {
  return employeeStore.employees.filter(emp => !emp.rfidCard);
});

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
  assignModalVisible.value = true;
};

const confirmAssign = async () => {
  if (!selectedEmployeeId.value) return;

  try {
    await cardStore.assignCard(cardId.value, selectedEmployeeId.value);
    assignModalVisible.value = false;
    selectedEmployeeId.value = '';
    await cardStore.fetchCard(cardId.value);
  } catch (error) {
    console.error('Failed to assign card:', error);
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
    unassignModalVisible.value = false;
    await cardStore.fetchCard(cardId.value);
  } catch (error) {
    console.error('Failed to unassign card:', error);
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
    blockModalVisible.value = false;
    blockReason.value = '';
    await cardStore.fetchCard(cardId.value);
  } catch (error) {
    console.error('Failed to block card:', error);
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
    unblockModalVisible.value = false;
    await cardStore.fetchCard(cardId.value);
  } catch (error) {
    console.error('Failed to unblock card:', error);
  }
};

const cancelUnblock = () => {
  unblockModalVisible.value = false;
};

onMounted(async () => {
  loading.value = true;
  try {
    await Promise.all([
      cardStore.fetchCard(cardId.value),
      employeeStore.fetchEmployees()
    ]);
  } catch (error) {
    console.error('Failed to load card:', error);
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
