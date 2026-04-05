<template>
  <div class="attendance-daily-page">
    <div class="page-header">
      <h1>{{ t('attendance.dailyTitle') }}</h1>
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
            <span class="summary-label">{{ t('attendance.totalEmployees') }}</span>
            <span class="summary-value">{{ summary.totalEmployees }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">{{ t('attendance.present') }}</span>
            <span class="summary-value text-green">{{ summary.presentPercentage }}%</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">{{ t('attendance.absent') }}</span>
            <span class="summary-value text-red">{{ summary.absentPercentage }}%</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">{{ t('attendance.late') }}</span>
            <span class="summary-value text-orange">{{ summary.latePercentage }}%</span>
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
          <span v-if="row.lateMinutes > 0" class="late-minutes">
            {{ row.lateMinutes }} min
          </span>
          <span v-else>-</span>
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
import { useToast } from '@/composables/useToast';
import { departmentApi } from '@/services/api/department.api';
import { siteApi } from '@/services/api/site.api';

const { t } = useI18n();
const router = useRouter();
const attendanceStore = useAttendanceStore();
const { info } = useToast();

const loading = ref(false);
const selectedDate = ref(new Date().toISOString().split('T')[0]);
const currentPage = ref(1);
const perPage = ref(20);

const filters = ref({
  departmentId: '',
  siteId: '',
  status: '',
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
  { key: 'actions', label: t('common.actions'), sortable: false },
]);

const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    present: t('attendance.status.present'),
    absent: t('attendance.status.absent'),
    late: t('attendance.status.late'),
    left_early: t('attendance.status.left_early'),
  };
  return labels[status] || status;
};

const formatTime = (iso: string | null | undefined): string => {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
};

const fetchData = async () => {
  loading.value = true;
  try {
    await attendanceStore.fetchDailyAttendance({
      date: selectedDate.value,
      source: 'rfid' as const,
      departmentId: filters.value.departmentId || undefined,
      siteId: filters.value.siteId || undefined,
      status: filters.value.status || undefined,
      page: currentPage.value,
      perPage: perPage.value,
    });
  } finally {
    loading.value = false;
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

watch([() => filters.value.departmentId, () => filters.value.siteId, () => filters.value.status], () => {
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

.status-left_early {
  background-color: #fef3c7;
  color: #92400e;
}

.late-minutes {
  color: #ea580c;
  font-weight: 500;
}
</style>
