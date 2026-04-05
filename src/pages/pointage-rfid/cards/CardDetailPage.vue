<template>
  <div class="card-detail-page">
    <div class="page-header">
      <AppButton variant="secondary" @click="navigateBack">
        <ArrowLeftIcon class="w-4 h-4 mr-1" />
        {{ t('common.back') }}
      </AppButton>
      <h1>{{ t('cards.details') }}</h1>
    </div>

    <div v-if="loading" class="loading">
      {{ t('common.loading') }}
    </div>

    <div v-else-if="card" class="card-content">
      <AppCard>
        <div class="card-info">
          <div class="uid-section">
            <label>{{ t('cards.uid') }}</label>
            <div class="uid-value">{{ card.uid }}</div>
          </div>

          <div class="info-row">
            <label>{{ t('cards.currentStatus') }}</label>
            <AppBadge :variant="getStatusVariant(card.status)">
              {{ getStatusLabel(card.status) }}
            </AppBadge>
          </div>

          <div v-if="card.employeeId" class="employee-section">
            <h3>{{ t('cards.employeeInfo') }}</h3>
            <div class="employee-info">
              <div class="employee-photo">
                <div class="photo-placeholder">
                  {{ card.employeeName ? card.employeeName.split(' ').map((n: string) => n[0]).join('').toUpperCase() : '?' }}
                </div>
              </div>
              <div class="employee-details">
                <div class="info-row">
                  <label>{{ t('cards.fullName') }}</label>
                  <span>{{ card.employeeName || '-' }}</span>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="unassigned-section">
            <p class="unassigned-text">{{ t('cards.notAssigned') }}</p>
          </div>

          <div class="info-row">
            <label>{{ t('cards.assignedDate') }}</label>
            <span>{{ card.assignedAt ? formatDate(card.assignedAt) : '-' }}</span>
          </div>

          <div class="info-row">
            <label>{{ t('cards.company') }}</label>
            <span>{{ companyStore.companies.find(c => c.id === card.companyId)?.name || card.companyId || '-' }}</span>
          </div>

          <div class="info-row">
            <label>{{ t('cards.createdAt') }}</label>
            <span>{{ formatDate(card.createdAt) }}</span>
          </div>
        </div>
      </AppCard>

      <div class="action-buttons">
        <AppButton
          v-if="!card.employeeId && (permissions.isAdminOrSuperOrTech.value)"
          variant="primary"
          @click="openAssignModal"
        >
          <CheckIcon class="w-4 h-4 mr-1" />
          {{ t('cards.assignToEmployee') }}
        </AppButton>

        <AppButton
          v-if="card.employeeId && (permissions.isAdminOrSuperOrTech.value)"
          variant="secondary"
          @click="openUnassignModal"
        >
          <XMarkIcon class="w-4 h-4 mr-1" />
          {{ t('cards.unassignCard') }}
        </AppButton>

        <AppButton
          v-if="card.status === CardStatus.ACTIVE && (permissions.isAdminOrSuperOrTech.value)"
          variant="danger"
          @click="openBlockModal"
        >
          <NoSymbolIcon class="w-4 h-4 mr-1" />
          {{ t('cards.blockCard') }}
        </AppButton>

        <AppButton
          v-if="card.status === CardStatus.BLOCKED && (permissions.isAdminOrSuperOrTech.value)"
          variant="success"
          @click="openUnblockModal"
        >
          <LockOpenIcon class="w-4 h-4 mr-1" />
          {{ t('cards.unblockCard') }}
        </AppButton>

        <AppButton
          variant="secondary"
          @click="navigateToHistory"
        >
          <ClockIcon class="w-4 h-4 mr-1" />
          {{ t('cards.viewHistory') }}
        </AppButton>
      </div>
    </div>

    <div v-else class="error">
      {{ t('cards.notFound') }}
    </div>

    <AppModal
      v-model="assignModalVisible"
      :title="t('cards.assignModal')"
    >
      <div class="modal-content">
        <!-- Filtres entreprise+site : super admin seulement -->
        <template v-if="permissions.isSuperAdmin.value">
          <div class="form-group">
            <label>{{ t('cards.allCompanies') }}</label>
            <select v-model="assignFilterCompanyId" class="form-select" @change="handleAssignCompanyChange">
              <option value="">{{ t('cards.allCompanies') }}</option>
              <option v-for="c in companyStore.companies" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>{{ t('cards.allSites') }}</label>
            <select v-model="assignFilterSiteId" class="form-select" :disabled="!assignFilterCompanyId">
              <option value="">{{ t('cards.allSites') }}</option>
              <option v-for="s in assignSiteOptions" :key="s.id" :value="s.id">{{ s.name }}</option>
            </select>
          </div>
        </template>

        <div class="form-group">
          <label for="employee-select">{{ t('cards.selectEmployee') }}</label>
          <select
            id="employee-select"
            v-model="selectedEmployeeId"
            class="form-select"
          >
            <option value="">{{ t('cards.chooseEmployee') }}</option>
            <option
              v-for="employee in filteredAvailableEmployees"
              :key="employee.id"
              :value="employee.id"
            >
              {{ employee.firstName }} {{ employee.lastName }}{{ employee.employeeNumber ? ` (${employee.employeeNumber})` : '' }}
            </option>
          </select>
          <p v-if="filteredAvailableEmployees.length === 0" class="mt-1 text-sm text-gray-500">
            {{ t('cards.noEmployeeAvailable', { suffix: assignFilterCompanyId ? ' pour cette selection' : '' }) }}
          </p>
        </div>
      </div>
      <template #footer>
        <AppButton variant="secondary" @click="cancelAssign">{{ t('common.cancel') }}</AppButton>
        <AppButton variant="primary" :disabled="!selectedEmployeeId" @click="confirmAssign">{{ t('cards.assign') }}</AppButton>
      </template>
    </AppModal>

    <AppModal
      v-model="unassignModalVisible"
      :title="t('cards.unassignModal')"
    >
      <div class="modal-content">
        <p>{{ t('cards.unassignConfirm') }}</p>
        <p v-if="card?.employeeName">
          {{ t('cards.currentEmployee', { name: card.employeeName }) }}
        </p>
      </div>
      <template #footer>
        <AppButton variant="secondary" @click="cancelUnassign">{{ t('common.cancel') }}</AppButton>
        <AppButton variant="primary" @click="confirmUnassign">{{ t('cards.unassign') }}</AppButton>
      </template>
    </AppModal>

    <AppModal
      v-model="blockModalVisible"
      :title="t('cards.blockModal')"
    >
      <div class="modal-content">
        <p>{{ t('cards.blockConfirm') }}</p>
        <div class="form-group">
          <label for="block-reason">{{ t('cards.blockReason') }}</label>
          <textarea
            id="block-reason"
            v-model="blockReason"
            class="form-textarea"
            rows="3"
            :placeholder="t('cards.blockReasonPlaceholder')"
            required
          ></textarea>
        </div>
      </div>
      <template #footer>
        <AppButton variant="secondary" @click="cancelBlock">{{ t('common.cancel') }}</AppButton>
        <AppButton variant="danger" @click="confirmBlock">{{ t('cards.block') }}</AppButton>
      </template>
    </AppModal>

    <AppModal
      v-model="unblockModalVisible"
      :title="t('cards.unblockModal')"
    >
      <div class="modal-content">
        <p>{{ t('cards.unblockConfirm') }}</p>
      </div>
      <template #footer>
        <AppButton variant="secondary" @click="cancelUnblock">{{ t('common.cancel') }}</AppButton>
        <AppButton variant="success" @click="confirmUnblock">{{ t('cards.unblock') }}</AppButton>
      </template>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
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

const { t } = useI18n();
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
      return t('cards.status.active');
    case CardStatus.INACTIVE:
      return t('cards.status.inactive');
    case CardStatus.BLOCKED:
      return t('cards.status.blocked');
    case CardStatus.LOST:
      return t('cards.status.lost');
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
    toast.showSuccess(t('cards.assignedSuccess'));
    assignModalVisible.value = false;
    selectedEmployeeId.value = '';
    await cardStore.fetchCard(cardId.value);
  } catch (error: any) {
    toast.showError(error.message || t('cards.assignError'));
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
    toast.showSuccess(t('cards.unassignedSuccess'));
    unassignModalVisible.value = false;
    await cardStore.fetchCard(cardId.value);
  } catch (error: any) {
    toast.showError(error.message || t('cards.unassignError'));
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
    toast.showSuccess(t('cards.blockedSuccess'));
    blockModalVisible.value = false;
    blockReason.value = '';
    await cardStore.fetchCard(cardId.value);
  } catch (error: any) {
    toast.showError(error.message || t('cards.blockError'));
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
    toast.showSuccess(t('cards.unblockedSuccess'));
    unblockModalVisible.value = false;
    await cardStore.fetchCard(cardId.value);
  } catch (error: any) {
    toast.showError(error.message || t('cards.unblockError'));
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
    toast.showError(t('cards.loadError'));
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
