<template>
  <div class="card-list-page">
    <div class="page-header">
      <h1>{{ t('cards.title') }}</h1>
      <AppButton
        v-if="permissions.isAdminOrSuperOrTech.value"
        @click="navigateToRegister"
        variant="primary"
      >
        <PlusIcon class="w-4 h-4 mr-1" />
        {{ t('cards.register') }}
      </AppButton>
    </div>

    <AppCard>
      <div class="filters">
        <div class="filter-group">
          <label for="status-filter">{{ t('common.status') }}</label>
          <select
            id="status-filter"
            v-model="filters.status"
            class="filter-select"
          >
            <option value="">{{ t('cards.allStatuses') }}</option>
            <option value="active">{{ t('cards.status.active') }}</option>
            <option value="inactive">{{ t('cards.status.inactive') }}</option>
            <option value="blocked">{{ t('cards.status.blocked') }}</option>
            <option value="lost">{{ t('cards.status.lost') }}</option>
          </select>
        </div>

        <div class="filter-group">
          <label for="search-filter">{{ t('cards.searchByUid') }}</label>
          <input
            id="search-filter"
            v-model="filters.search"
            type="text"
            class="filter-input"
            :placeholder="t('cards.enterUid')"
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
          <span v-if="row.employeeName">{{ row.employeeName }}</span>
          <span v-else class="unassigned">{{ t('cards.notUnassigned') }}</span>
        </template>

        <template #company="{ row }">
          <span>{{ getCompanyName(row.companyId) }}</span>
        </template>

        <template #status="{ row }">
          <AppBadge :variant="getStatusVariant(row.status)">
            {{ getStatusLabel(row.status) }}
          </AppBadge>
        </template>

        <template #assignedDate="{ row }">
          <span v-if="row.assignedAt">{{ formatDate(row.assignedAt) }}</span>
          <span v-else>-</span>
        </template>

        <template #actions="{ row }">
          <div class="actions" @click.stop>
            <AppButton size="sm" variant="ghost" @click="navigateToDetail(row.id)" :title="t('common.view')">
              <EyeIcon class="w-4 h-4" />
            </AppButton>
            <AppButton
              v-if="!row.employeeId && (permissions.isAdminOrSuperOrTech.value)"
              size="sm"
              variant="ghost"
              class="text-blue-600 hover:text-blue-700"
              @click="handleAssign(row)"
              :title="t('cards.assign')"
            >
              <CheckIcon class="w-4 h-4" />
            </AppButton>
            <AppButton
              v-if="row.status === CardStatus.ACTIVE && (permissions.isAdminOrSuperOrTech.value)"
              size="sm"
              variant="ghost"
              class="text-red-600 hover:text-red-700"
              @click="handleBlock(row)"
              :title="t('cards.block')"
            >
              <NoSymbolIcon class="w-4 h-4" />
            </AppButton>
            <AppButton
              v-if="row.status === CardStatus.BLOCKED && (permissions.isAdminOrSuperOrTech.value)"
              size="sm"
              variant="ghost"
              class="text-green-600 hover:text-green-700"
              @click="handleUnblock(row)"
              :title="t('cards.unblock')"
            >
              <LockOpenIcon class="w-4 h-4" />
            </AppButton>
          </div>
        </template>
      </DataTable>
    </AppCard>

    <AppModal
      v-model="assignModalVisible"
      :title="t('cards.assignModal')"
    >
      <div class="modal-content">
        <p>{{ t('cards.uid') }}: <strong>{{ selectedCard?.uid }}</strong></p>
        <template v-if="permissions.isSuperAdmin.value">
          <div class="form-group">
            <AppSelect
              v-model="assignFilterCompanyId"
              :label="t('cards.allCompanies')"
              :options="assignCompanyOptions"
              @update:model-value="assignFilterSiteId = ''; selectedEmployeeId = ''"
            />
          </div>
          <div class="form-group">
            <AppSelect
              v-model="assignFilterSiteId"
              :label="t('cards.allSites')"
              :options="assignSiteOptions"
              @update:model-value="selectedEmployeeId = ''"
            />
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
              v-for="employee in availableEmployees"
              :key="employee.id"
              :value="employee.id"
            >
              {{ employee.firstName }} {{ employee.lastName }}
            </option>
          </select>
        </div>
      </div>
      <template #footer>
        <AppButton variant="secondary" @click="cancelAssign">{{ t('common.cancel') }}</AppButton>
        <AppButton variant="primary" @click="confirmAssign">{{ t('cards.assign') }}</AppButton>
      </template>
    </AppModal>

    <AppModal
      v-model="blockModalVisible"
      :title="t('cards.blockModal')"
    >
      <div class="modal-content">
        <p>{{ t('cards.blockConfirm') }}</p>
        <p>{{ t('cards.uid') }}: <strong>{{ selectedCard?.uid }}</strong></p>
        <div class="form-group">
          <label for="block-reason">{{ t('cards.blockReason') }}</label>
          <textarea
            id="block-reason"
            v-model="blockReason"
            class="form-textarea"
            rows="3"
            :placeholder="t('cards.blockReasonPlaceholder')"
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
        <p>{{ t('cards.uid') }}: <strong>{{ selectedCard?.uid }}</strong></p>
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
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import DataTable from '@/components/data-display/DataTable.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppCard from '@/components/ui/AppCard.vue';
import AppBadge from '@/components/ui/AppBadge.vue';
import AppModal from '@/components/ui/AppModal.vue';
import AppSelect from '@/components/ui/AppSelect.vue';
import { useCardStore } from '@/stores/card.store';
import { useEmployeeStore } from '@/stores/employee.store';
import { useCompanyStore } from '@/stores/company.store';
import { useSiteStore } from '@/stores/site.store';
import { usePermissions } from '@/composables/usePermissions';
import { useToast } from '@/composables/useToast';
import type { RfidCard } from '@/types/card'
import { CardStatus } from '@/types/enums';
import { EyeIcon, CheckIcon, NoSymbolIcon, LockOpenIcon, PlusIcon } from '@heroicons/vue/24/outline';

const { t } = useI18n();
const router = useRouter();
const cardStore = useCardStore();
const employeeStore = useEmployeeStore();
const companyStore = useCompanyStore();
const siteStore = useSiteStore();
const permissions = usePermissions();
const toast = useToast();

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
const assignFilterCompanyId = ref('');
const assignFilterSiteId = ref('');

const columns = computed(() => [
  { key: 'uid', label: t('cards.uid'), sortable: true },
  { key: 'employee', label: t('employees.employee'), sortable: false },
  { key: 'company', label: t('employees.company'), sortable: false },
  { key: 'status', label: t('common.status'), sortable: true },
  { key: 'assignedDate', label: t('cards.assignDate'), sortable: true },
  { key: 'actions', label: t('common.actions'), sortable: false }
]);

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

const assignCompanyOptions = computed(() => [
  { label: t('cards.allCompanies'), value: '' },
  ...companyStore.companies.map((c) => ({ label: c.name, value: c.id })),
]);

const assignSiteOptions = computed(() => {
  const sites = assignFilterCompanyId.value
    ? siteStore.sites.filter((s) => s.companyId === assignFilterCompanyId.value)
    : siteStore.sites;
  return [
    { label: t('cards.allSites'), value: '' },
    ...sites.map((s) => ({ label: s.name, value: s.id })),
  ];
});

const availableEmployees = computed(() => {
  let emps = employeeStore.employees.filter(emp => !emp.rfidCardId);
  if (permissions.isSuperAdmin.value) {
    if (assignFilterCompanyId.value) {
      emps = emps.filter(e => e.companyId === assignFilterCompanyId.value);
    }
    if (assignFilterSiteId.value) {
      emps = emps.filter(e => e.siteId === assignFilterSiteId.value);
    }
  }
  return emps;
});

const getCompanyName = (companyId: string): string => {
  return companyStore.companies.find(c => c.id === companyId)?.name || '-';
};

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
  assignFilterCompanyId.value = '';
  assignFilterSiteId.value = '';
  assignModalVisible.value = true;
};

const confirmAssign = async () => {
  if (!selectedCard.value || !selectedEmployeeId.value) return;

  try {
    await cardStore.assignCard(selectedCard.value.id, selectedEmployeeId.value);
    toast.success(t('common.success'), t('cards.assignedSuccess'));
    assignModalVisible.value = false;
    selectedCard.value = null;
    selectedEmployeeId.value = '';
  } catch (error: any) {
    toast.error(t('common.error'), error.message || t('cards.assignError'));
  }
};

const cancelAssign = () => {
  assignModalVisible.value = false;
  selectedCard.value = null;
  selectedEmployeeId.value = '';
  assignFilterCompanyId.value = '';
  assignFilterSiteId.value = '';
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
    toast.success(t('common.success'), t('cards.blockedSuccess'));
    blockModalVisible.value = false;
    selectedCard.value = null;
    blockReason.value = '';
  } catch (error: any) {
    toast.error(t('common.error'), error.message || t('cards.blockError'));
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
    toast.success(t('common.success'), t('cards.unblockedSuccess'));
    unblockModalVisible.value = false;
    selectedCard.value = null;
  } catch (error: any) {
    toast.error(t('common.error'), error.message || t('cards.unblockError'));
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
      cardStore.fetchCards({ perPage: 500 }),
      employeeStore.fetchEmployees({ perPage: 500, companyId: undefined, siteId: undefined, departmentId: undefined, search: undefined }),
      companyStore.fetchCompanies({ perPage: 100 }),
      siteStore.fetchSites({ perPage: 500 }),
    ]);
  } catch {
    toast.error(t('common.error'), t('cards.loadListError'));
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
