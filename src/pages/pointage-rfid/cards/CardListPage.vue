<template>
  <div class="card-list-page">
    <div class="page-header">
      <h1>Cartes RFID</h1>
      <AppButton
        v-if="permissions.canCreate('cards')"
        @click="navigateToRegister"
        variant="primary"
      >
        Enregistrer une carte
      </AppButton>
    </div>

    <AppCard>
      <div class="filters">
        <div class="filter-group">
          <label for="status-filter">Statut</label>
          <select
            id="status-filter"
            v-model="filters.status"
            class="filter-select"
          >
            <option value="">Tous</option>
            <option value="active">Actif</option>
            <option value="inactive">Inactif</option>
            <option value="blocked">Bloque</option>
            <option value="lost">Perdu</option>
          </select>
        </div>

        <div class="filter-group">
          <label for="search-filter">Rechercher par UID</label>
          <input
            id="search-filter"
            v-model="filters.search"
            type="text"
            class="filter-input"
            placeholder="Entrez l'UID de la carte"
          />
        </div>
      </div>

      <DataTable
        :columns="columns"
        :data="filteredCards"
        :loading="loading"
        @row-click="handleRowClick"
      >
        <template #employee="{ row }">
          <span v-if="row.employee">{{ row.employee.firstName }} {{ row.employee.lastName }}</span>
          <span v-else class="unassigned">Non attribuee</span>
        </template>

        <template #company="{ row }">
          <span v-if="row.employee">{{ row.employee.company?.name || '-' }}</span>
          <span v-else>-</span>
        </template>

        <template #status="{ row }">
          <AppBadge :variant="getStatusVariant(row.status)">
            {{ getStatusLabel(row.status) }}
          </AppBadge>
        </template>

        <template #assignedDate="{ row }">
          <span v-if="row.assignedDate">{{ formatDate(row.assignedDate) }}</span>
          <span v-else>-</span>
        </template>

        <template #actions="{ row }">
          <div class="actions" @click.stop>
            <AppButton
              size="small"
              variant="secondary"
              @click="navigateToDetail(row.id)"
            >
              Voir
            </AppButton>
            <AppButton
              v-if="!row.employee && permissions.canUpdate('cards')"
              size="small"
              variant="primary"
              @click="handleAssign(row)"
            >
              Attribuer
            </AppButton>
            <AppButton
              v-if="row.status === CardStatus.ACTIVE && permissions.canUpdate('cards')"
              size="small"
              variant="danger"
              @click="handleBlock(row)"
            >
              Bloquer
            </AppButton>
            <AppButton
              v-if="row.status === CardStatus.BLOCKED && permissions.canUpdate('cards')"
              size="small"
              variant="success"
              @click="handleUnblock(row)"
            >
              Debloquer
            </AppButton>
          </div>
        </template>
      </DataTable>
    </AppCard>

    <AppModal
      v-model:visible="assignModalVisible"
      title="Attribuer la carte"
      @confirm="confirmAssign"
      @cancel="cancelAssign"
    >
      <div class="modal-content">
        <p>Carte UID: <strong>{{ selectedCard?.uid }}</strong></p>
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
      v-model:visible="blockModalVisible"
      title="Bloquer la carte"
      @confirm="confirmBlock"
      @cancel="cancelBlock"
    >
      <div class="modal-content">
        <p>Etes-vous sur de vouloir bloquer cette carte?</p>
        <p>UID: <strong>{{ selectedCard?.uid }}</strong></p>
        <div class="form-group">
          <label for="block-reason">Raison</label>
          <textarea
            id="block-reason"
            v-model="blockReason"
            class="form-textarea"
            rows="3"
            placeholder="Entrez la raison du blocage"
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
        <p>UID: <strong>{{ selectedCard?.uid }}</strong></p>
      </div>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import DataTable from '@/components/common/DataTable.vue';
import AppButton from '@/components/common/AppButton.vue';
import AppCard from '@/components/common/AppCard.vue';
import AppBadge from '@/components/common/AppBadge.vue';
import AppModal from '@/components/common/AppModal.vue';
import { useCardStore } from '@/stores/cardStore';
import { useEmployeeStore } from '@/stores/employeeStore';
import { usePermissions } from '@/composables/usePermissions';
import { RfidCard, CardStatus } from '@/types/rfid';

const router = useRouter();
const cardStore = useCardStore();
const employeeStore = useEmployeeStore();
const permissions = usePermissions();

const loading = ref(false);
const filters = ref({
  status: '',
  search: ''
});

const assignModalVisible = ref(false);
const blockModalVisible = ref(false);
const unblockModalVisible = ref(false);
const selectedCard = ref<RfidCard | null>(null);
const selectedEmployeeId = ref('');
const blockReason = ref('');

const columns = [
  { key: 'uid', label: 'UID', sortable: true },
  { key: 'employee', label: 'Employe', sortable: false },
  { key: 'company', label: 'Entreprise', sortable: false },
  { key: 'status', label: 'Statut', sortable: true },
  { key: 'assignedDate', label: 'Date d\'attribution', sortable: true },
  { key: 'actions', label: 'Actions', sortable: false }
];

const filteredCards = computed(() => {
  let cards = cardStore.cards;

  if (filters.value.status) {
    cards = cards.filter(card => card.status === filters.value.status);
  }

  if (filters.value.search) {
    const searchLower = filters.value.search.toLowerCase();
    cards = cards.filter(card =>
      card.uid.toLowerCase().includes(searchLower)
    );
  }

  return cards;
});

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
    day: 'numeric'
  });
};

const navigateToRegister = () => {
  router.push('/pointage-rfid/cards/register');
};

const navigateToDetail = (cardId: string) => {
  router.push(`/pointage-rfid/cards/${cardId}`);
};

const handleRowClick = (card: RfidCard) => {
  navigateToDetail(card.id);
};

const handleAssign = (card: RfidCard) => {
  selectedCard.value = card;
  selectedEmployeeId.value = '';
  assignModalVisible.value = true;
};

const confirmAssign = async () => {
  if (!selectedCard.value || !selectedEmployeeId.value) return;

  try {
    await cardStore.assignCard(selectedCard.value.id, selectedEmployeeId.value);
    assignModalVisible.value = false;
    selectedCard.value = null;
    selectedEmployeeId.value = '';
  } catch (error) {
    console.error('Failed to assign card:', error);
  }
};

const cancelAssign = () => {
  assignModalVisible.value = false;
  selectedCard.value = null;
  selectedEmployeeId.value = '';
};

const handleBlock = (card: RfidCard) => {
  selectedCard.value = card;
  blockReason.value = '';
  blockModalVisible.value = true;
};

const confirmBlock = async () => {
  if (!selectedCard.value) return;

  try {
    await cardStore.blockCard(selectedCard.value.id, blockReason.value);
    blockModalVisible.value = false;
    selectedCard.value = null;
    blockReason.value = '';
  } catch (error) {
    console.error('Failed to block card:', error);
  }
};

const cancelBlock = () => {
  blockModalVisible.value = false;
  selectedCard.value = null;
  blockReason.value = '';
};

const handleUnblock = (card: RfidCard) => {
  selectedCard.value = card;
  unblockModalVisible.value = true;
};

const confirmUnblock = async () => {
  if (!selectedCard.value) return;

  try {
    await cardStore.unblockCard(selectedCard.value.id);
    unblockModalVisible.value = false;
    selectedCard.value = null;
  } catch (error) {
    console.error('Failed to unblock card:', error);
  }
};

const cancelUnblock = () => {
  unblockModalVisible.value = false;
  selectedCard.value = null;
};

onMounted(async () => {
  loading.value = true;
  try {
    await Promise.all([
      cardStore.fetchCards(),
      employeeStore.fetchEmployees()
    ]);
  } catch (error) {
    console.error('Failed to load data:', error);
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.card-list-page {
  padding: 2rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.page-header h1 {
  font-size: 2rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.filters {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
  min-width: 200px;
}

.filter-group label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.filter-select,
.filter-input {
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  transition: border-color 0.2s;
}

.filter-select:focus,
.filter-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.unassigned {
  color: #6b7280;
  font-style: italic;
}

.actions {
  display: flex;
  gap: 0.5rem;
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
