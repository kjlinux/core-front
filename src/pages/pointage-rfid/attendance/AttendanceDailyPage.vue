<template>
  <div class="attendance-daily-page">
    <div class="page-header">
      <h1 class="text-gray-900">{{ t('attendance.dailyTitle') }}</h1>
      <div class="header-actions">
        <AppInput
          v-model="selectedDate"
          type="date"
          :placeholder="t('attendance.selectDate')"
        />
        <AppButton @click="handleExport">
          {{ t('attendance.exportBtn') }}
        </AppButton>
      </div>
    </div>

    <div class="summary-stats">
      <AppCard>
        <div class="summary-grid">
          <div class="summary-item">
            <span class="summary-label text-gray-500">{{ t('attendance.totalEmployees') }}</span>
            <span class="summary-value text-gray-900">{{ summary.totalEmployees }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label text-gray-500">{{ t('attendance.present') }}</span>
            <span class="summary-value text-emerald-600">{{ summary.presentPercentage }}%</span>
          </div>
          <div class="summary-item">
            <span class="summary-label text-gray-500">{{ t('attendance.absent') }}</span>
            <span class="summary-value text-red-600">{{ summary.absentPercentage }}%</span>
          </div>
          <div class="summary-item">
            <span class="summary-label text-gray-500">{{ t('attendance.late') }}</span>
            <span class="summary-value text-orange-600">{{ summary.latePercentage }}%</span>
          </div>
        </div>
      </AppCard>
    </div>

    <AppCard>
      <div class="filters">
        <AppSelect
          v-model="filters.departmentId"
          :options="departmentOptions"
          :placeholder="t('attendance.allDepts')"
        />
        <AppSelect
          v-model="filters.siteId"
          :options="siteOptions"
          :placeholder="t('attendance.allSites')"
        />
        <AppSelect
          v-model="filters.status"
          :options="statusOptions"
          :placeholder="t('attendance.allStatuses')"
        />
        <AppSelect
          v-model="filters.source"
          :options="sourceOptions"
          :placeholder="t('attendance.allSources')"
        />
      </div>

      <div v-if="loading" class="loading-spinner">
        <div class="spinner"></div>
      </div>

      <DataTable
        v-else
        :columns="columns"
        :data="pagedRecords"
        :pagination="paginationObj"
        @page-change="handlePageChange"
      >
        <template #status="{ row }">
          <span :class="['status-badge', `status-${row.status}`]">
            {{ getStatusLabel(row.status) }}
          </span>
        </template>
        <template #entryTime="{ row }">
          {{ formatTime(row.entryTime) }}
        </template>
        <template #exitTime="{ row }">
          {{ formatTime(row.exitTime) }}
        </template>
        <template #lateMinutes="{ row }">
          <span v-if="row.lateMinutes > 0" class="late-minutes text-orange-600">
            {{ row.lateMinutes }} min
          </span>
          <span v-else>-</span>
        </template>
        <template #presence="{ row }">
          <AttendanceSegmentCell :record="row" />
        </template>
        <template #actions="{ row }">
          <AppButton size="small" variant="ghost" @click="viewDetail(row)">
            {{ t('common.detail') }}
          </AppButton>
        </template>
      </DataTable>
    </AppCard>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, onMounted, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAttendanceStore } from '@/stores/attendance.store';
import type { AttendanceRecord } from '@/types/attendance';
import DataTable from '@/components/data-display/DataTable.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppCard from '@/components/ui/AppCard.vue';
import AppSelect from '@/components/ui/AppSelect.vue';
import AppInput from '@/components/ui/AppInput.vue';
import AttendanceSegmentCell from '@/components/attendance/AttendanceSegmentCell.vue';
import { useToast } from '@/composables/useToast';
import { departmentApi } from '@/services/api/department.api';
import { siteApi } from '@/services/api/site.api';

const { t } = useI18n();
const router = useRouter();
const attendanceStore = useAttendanceStore();
const { info, error: toastError } = useToast();

const loading = ref(false);
const selectedDate = ref(new Date().toISOString().split('T')[0]);
const currentPage = ref(1);
const perPage = ref(20);

// Sequence pour ignorer les reponses obsoletes (race conditions sur changement
// rapide de filtre/date : la 2eme requete peut arriver avant la 1ere, ou inversement).
let fetchSeq = 0;

const filters = ref({
  departmentId: '',
  siteId: '',
  status: '',
  source: '',
});

const departmentOptions = computed(() => [{ label: t('attendance.allDepts'), value: '' }, ...rawDepartments.value]);
const siteOptions = computed(() => [{ label: t('attendance.allSites'), value: '' }, ...rawSites.value]);

const rawDepartments = ref<{ label: string; value: string }[]>([]);
const rawSites = ref<{ label: string; value: string }[]>([]);

const statusOptions = computed(() => [
  { label: t('attendance.allStatuses'), value: '' },
  { label: t('attendance.status.present'), value: 'present' },
  { label: t('attendance.status.absent'), value: 'absent' },
  { label: t('attendance.status.late'), value: 'late' },
  { label: t('attendance.status.left_early'), value: 'left_early' },
  { label: t('attendance.status.partial'), value: 'partial' },
  { label: t('attendance.status.on_leave'), value: 'on_leave' },
]);

const sourceOptions = computed(() => [
  { label: t('attendance.allSources'), value: '' },
  { label: 'RFID', value: 'rfid' },
  { label: t('attendance.biometric'), value: 'biometric' },
  { label: 'QR Code', value: 'qrcode' },
]);

const attendanceRecords = computed(() => {
  const recs = [...(attendanceStore.dailyAttendance || [])];
  return recs.sort((a, b) => {
    const ta = a.entryTime ? new Date(a.entryTime).getTime() : 0;
    const tb = b.entryTime ? new Date(b.entryTime).getTime() : 0;
    return tb - ta;
  });
});

const pagedRecords = computed(() => {
  const start = (currentPage.value - 1) * perPage.value;
  return attendanceRecords.value.slice(start, start + perPage.value);
});

const paginationObj = computed(() => {
  const total = attendanceRecords.value.length;
  const totalPages = Math.ceil(total / perPage.value) || 1;
  return { currentPage: currentPage.value, totalPages, perPage: perPage.value, total };
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

const columns = computed(() => [
  { key: 'employeeName', label: t('attendance.employee'), sortable: true },
  { key: 'department', label: t('attendance.dept'), sortable: true },
  { key: 'entryTime', label: t('attendance.entryTime'), sortable: true },
  { key: 'exitTime', label: t('attendance.exitTime'), sortable: true },
  { key: 'status', label: t('common.status'), sortable: true },
  { key: 'lateMinutes', label: t('attendance.lateTime'), sortable: true },
  { key: 'presence', label: t('attendance.presenceDetail'), sortable: false },
  { key: 'actions', label: t('common.actions'), sortable: false },
]);

const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    present: t('attendance.status.present'),
    absent: t('attendance.status.absent'),
    late: t('attendance.status.late'),
    left_early: t('attendance.status.left_early'),
    partial: t('attendance.status.partial'),
    on_leave: t('attendance.status.on_leave'),
  };
  return labels[status] || status;
};

const formatTime = (iso: string | null | undefined): string => {
  if (!iso) return '-';
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
};

const fetchData = async () => {
  const seq = ++fetchSeq;
  loading.value = true;
  try {
    await attendanceStore.fetchDailyAttendance({
      date: selectedDate.value,
      source: (filters.value.source || undefined) as 'rfid' | 'biometric' | undefined,
      departmentId: filters.value.departmentId || undefined,
      siteId: filters.value.siteId || undefined,
      status: filters.value.status || undefined,
      page: currentPage.value,
      perPage: perPage.value,
    });
  } catch {
    if (seq === fetchSeq) {
      toastError('Échec du chargement des présences');
    }
  } finally {
    // Ne baisse le spinner que si on est la derniere requete en vol
    if (seq === fetchSeq) {
      loading.value = false;
    }
  }
};

const loadFilters = async () => {
  try {
    const [depts, sites] = await Promise.all([
      departmentApi.getAll({ perPage: 200 }),
      siteApi.getAll({ perPage: 200 }),
    ]);
    rawDepartments.value = (depts.data || []).map((d) => ({ label: d.name, value: d.id }));
    rawSites.value = (sites.data || []).map((s) => ({ label: s.name, value: s.id }));
  } catch {
    // silently fail
  }
};

const handlePageChange = (page: number) => {
  currentPage.value = page;
};

const handleExport = () => {
  info(t('attendance.exporting'));
};

const viewDetail = (record: AttendanceRecord) => {
  router.push({
    name: 'attendance-by-employee',
    params: { id: record.employeeId },
  });
};

watch(selectedDate, () => {
  currentPage.value = 1;
  fetchData();
});

watch([() => filters.value.departmentId, () => filters.value.siteId, () => filters.value.status, () => filters.value.source], () => {
  currentPage.value = 1;
  fetchData();
});

onMounted(() => {
  loadFilters();
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
}

.summary-value {
  font-size: 24px;
  font-weight: 600;
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

.status-left_early {
  background-color: #fef3c7;
  color: #92400e;
}

.status-partial {
  background-color: #fef3c7;
  color: #92400e;
}

.status-on_leave {
  background-color: #dbeafe;
  color: #1e40af;
}

.late-minutes {
  font-weight: 500;
}

/* Dark mode: pastilles de statut (classes dynamiques) — aligne sur le retrofit de main.css */
.dark .status-present   { background-color: rgb(34 197 94 / 0.18); color: #86efac; }
.dark .status-absent    { background-color: rgb(239 68 68 / 0.18); color: #fca5a5; }
.dark .status-late      { background-color: rgb(249 115 22 / 0.18); color: #fdba74; }
.dark .status-left_early,
.dark .status-partial   { background-color: rgb(245 158 11 / 0.18); color: #fcd34d; }
.dark .status-on_leave  { background-color: rgb(59 130 246 / 0.18); color: #93c5fd; }
</style>
