<template>
  <div class="attendance-daily-page">
    <div class="page-header">
      <h1>Pointage journalier</h1>
      <div class="header-actions">
        <AppInput
          v-model="selectedDate"
          type="date"
          placeholder="Sélectionner une date"
          @change="fetchData"
        />
        <AppButton @click="handleExport">
          Exporter
        </AppButton>
      </div>
    </div>

    <div class="summary-stats">
      <AppCard>
        <div class="summary-grid">
          <div class="summary-item">
            <span class="summary-label">Total Employés</span>
            <span class="summary-value">{{ summary.totalEmployees }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Présents</span>
            <span class="summary-value text-green">{{ summary.presentPercentage }}%</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Absents</span>
            <span class="summary-value text-red">{{ summary.absentPercentage }}%</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">En Retard</span>
            <span class="summary-value text-orange">{{ summary.latePercentage }}%</span>
          </div>
        </div>
      </AppCard>
    </div>

    <AppCard>
      <div class="filters">
        <AppSelect
          v-model="filters.department"
          :options="departmentOptions"
          placeholder="Tous les départements"
          @change="fetchData"
        />
        <AppSelect
          v-model="filters.site"
          :options="siteOptions"
          placeholder="Tous les sites"
          @change="fetchData"
        />
        <AppSelect
          v-model="filters.status"
          :options="statusOptions"
          placeholder="Tous les statuts"
          @change="fetchData"
        />
      </div>

      <div v-if="loading" class="loading-spinner">
        <div class="spinner"></div>
      </div>

      <DataTable
        v-else
        :columns="columns"
        :data="attendanceRecords"
        :total="total"
        :per-page="perPage"
        :current-page="currentPage"
        @page-change="handlePageChange"
      >
        <template #cell-status="{ row }">
          <span :class="['status-badge', `status-${row.status}`]">
            {{ getStatusLabel(row.status) }}
          </span>
        </template>
        <template #cell-lateMinutes="{ row }">
          <span v-if="row.lateMinutes > 0" class="late-minutes">
            {{ row.lateMinutes }} min
          </span>
          <span v-else>-</span>
        </template>
        <template #cell-actions="{ row }">
          <AppButton size="small" variant="ghost" @click="viewDetail(row)">
            Détail
          </AppButton>
        </template>
      </DataTable>
    </AppCard>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAttendanceStore } from '@/stores/attendance';
import { formatDate } from '@/utils/format';
import type { AttendanceRecord } from '@/types/attendance';
import DataTable from '@/components/common/DataTable.vue';
import AppButton from '@/components/common/AppButton.vue';
import AppCard from '@/components/common/AppCard.vue';
import AppSelect from '@/components/common/AppSelect.vue';
import AppInput from '@/components/common/AppInput.vue';
import { useToast } from '@/composables/useToast';

const router = useRouter();
const attendanceStore = useAttendanceStore();
const { showToast } = useToast();

const loading = ref(false);
const selectedDate = ref(formatDate(new Date(), 'yyyy-MM-dd'));
const currentPage = ref(1);
const perPage = ref(20);

const filters = ref({
  department: '',
  site: '',
  status: '',
});

const departmentOptions = [
  { label: 'Tous les départements', value: '' },
  { label: 'IT', value: 'it' },
  { label: 'RH', value: 'rh' },
  { label: 'Finance', value: 'finance' },
  { label: 'Commercial', value: 'commercial' },
];

const siteOptions = [
  { label: 'Tous les sites', value: '' },
  { label: 'Casablanca', value: 'casablanca' },
  { label: 'Rabat', value: 'rabat' },
  { label: 'Tanger', value: 'tanger' },
];

const statusOptions = [
  { label: 'Tous les statuts', value: '' },
  { label: 'Présent', value: 'present' },
  { label: 'Absent', value: 'absent' },
  { label: 'En retard', value: 'late' },
];

const attendanceRecords = computed(() => {
  return attendanceStore.dailyAttendance || [];
});

const total = computed(() => {
  return attendanceStore.dailyAttendanceTotal || 0;
});

const summary = computed(() => {
  const totalEmployees = attendanceStore.dailyStats?.totalEmployees || 0;
  const present = attendanceStore.dailyStats?.present || 0;
  const absent = attendanceStore.dailyStats?.absent || 0;
  const late = attendanceStore.dailyStats?.late || 0;

  return {
    totalEmployees,
    presentPercentage: totalEmployees > 0 ? Math.round((present / totalEmployees) * 100) : 0,
    absentPercentage: totalEmployees > 0 ? Math.round((absent / totalEmployees) * 100) : 0,
    latePercentage: totalEmployees > 0 ? Math.round((late / totalEmployees) * 100) : 0,
  };
});

const columns = [
  { key: 'employeeName', label: 'Employé', sortable: true },
  { key: 'department', label: 'Département', sortable: true },
  { key: 'entryTime', label: 'Heure d\'entrée', sortable: true },
  { key: 'exitTime', label: 'Heure de sortie', sortable: true },
  { key: 'status', label: 'Statut', sortable: true },
  { key: 'lateMinutes', label: 'Retard', sortable: true },
  { key: 'actions', label: 'Actions', sortable: false },
];

const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    present: 'Présent',
    absent: 'Absent',
    late: 'En retard',
  };
  return labels[status] || status;
};

const fetchData = async () => {
  loading.value = true;
  try {
    await attendanceStore.fetchDailyAttendance({
      date: selectedDate.value,
      department: filters.value.department,
      site: filters.value.site,
      status: filters.value.status,
      page: currentPage.value,
      perPage: perPage.value,
    });
    await attendanceStore.fetchDailyStats(selectedDate.value);
  } finally {
    loading.value = false;
  }
};

const handlePageChange = (page: number) => {
  currentPage.value = page;
  fetchData();
};

const handleExport = () => {
  showToast('Export en cours...', 'info');
};

const viewDetail = (record: AttendanceRecord) => {
  router.push({
    name: 'attendance-by-employee',
    params: { id: record.employeeId },
  });
};

onMounted(() => {
  fetchData();
});
</script>

<style scoped>
.attendance-daily-page {
  padding: 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-header h1 {
  font-size: 28px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.summary-stats {
  margin-bottom: 24px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 24px;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.summary-label {
  font-size: 14px;
  color: #6b7280;
}

.summary-value {
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
}

.text-green {
  color: #059669;
}

.text-red {
  color: #dc2626;
}

.text-orange {
  color: #ea580c;
}

.filters {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.loading-spinner {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #f3f4f6;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.status-present {
  background-color: #d1fae5;
  color: #065f46;
}

.status-absent {
  background-color: #fee2e2;
  color: #991b1b;
}

.status-late {
  background-color: #fed7aa;
  color: #9a3412;
}

.late-minutes {
  color: #ea580c;
  font-weight: 500;
}
</style>
