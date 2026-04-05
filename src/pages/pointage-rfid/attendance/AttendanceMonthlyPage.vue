<template>
  <div class="attendance-monthly-page">
    <div class="page-header">
      <h1>{{ t('attendance.monthlyTitle') }}</h1>
      <div class="header-actions">
        <AppSelect
          v-model="selectedMonth"
          :options="monthOptions"
          :placeholder="t('attendance.selectMonth')"
        />
        <AppSelect
          v-model="selectedYear"
          :options="yearOptions"
          :placeholder="t('attendance.selectYear')"
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
            <span class="summary-label">{{ t('attendance.avgRate') }}</span>
            <span class="summary-value text-blue">{{ summary.averageAttendanceRate }}%</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">{{ t('attendance.totalAbsencesStat') }}</span>
            <span class="summary-value text-red">{{ summary.totalAbsences }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">{{ t('attendance.totalLateMinutes') }}</span>
            <span class="summary-value text-orange">{{ summary.totalLateMinutes }}</span>
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
        <AppInput
          v-model="filters.employeeName"
          type="text"
          :placeholder="t('attendance.searchEmployee')"
          @input="handleSearchDebounce"
        />
      </div>

      <div v-if="loading" class="loading-spinner">
        <div class="spinner"></div>
      </div>

      <DataTable
        v-else
        :columns="columns"
        :data="monthlyRecords"
        :total="total"
        :per-page="perPage"
        :current-page="currentPage"
        @page-change="handlePageChange"
      >
        <template #cell-attendanceRate="{ row }">
          <span :class="['attendance-rate', getAttendanceRateClass(row.attendanceRate)]">
            {{ row.attendanceRate }}%
          </span>
        </template>
        <template #cell-totalLateMinutes="{ row }">
          <span class="late-minutes">{{ row.totalLateMinutes }} min</span>
        </template>
      </DataTable>
    </AppCard>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, onMounted, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAttendanceStore } from '@/stores/attendance.store';
import DataTable from '@/components/data-display/DataTable.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppCard from '@/components/ui/AppCard.vue';
import AppSelect from '@/components/ui/AppSelect.vue';
import AppInput from '@/components/ui/AppInput.vue';
import { useToast } from '@/composables/useToast';
import { departmentApi } from '@/services/api/department.api';

const { t } = useI18n();
const attendanceStore = useAttendanceStore();
const { info } = useToast();

const loading = ref(false);
const currentDate = new Date();
const selectedMonth = ref((currentDate.getMonth() + 1).toString());
const selectedYear = ref(currentDate.getFullYear().toString());
const currentPage = ref(1);
const perPage = ref(20);

const filters = ref({
  departmentId: '',
  employeeName: '',
});

let searchTimeout: number | null = null;

const monthOptions = computed(() => [
  { label: t('attendance.months.jan'), value: '1' },
  { label: t('attendance.months.feb'), value: '2' },
  { label: t('attendance.months.mar'), value: '3' },
  { label: t('attendance.months.apr'), value: '4' },
  { label: t('attendance.months.may'), value: '5' },
  { label: t('attendance.months.jun'), value: '6' },
  { label: t('attendance.months.jul'), value: '7' },
  { label: t('attendance.months.aug'), value: '8' },
  { label: t('attendance.months.sep'), value: '9' },
  { label: t('attendance.months.oct'), value: '10' },
  { label: t('attendance.months.nov'), value: '11' },
  { label: t('attendance.months.dec'), value: '12' },
]);

const yearOptions = computed(() => {
  const years = [];
  const currentYear = new Date().getFullYear();
  for (let i = currentYear; i >= currentYear - 5; i--) {
    years.push({ label: i.toString(), value: i.toString() });
  }
  return years;
});

const rawDepartments = ref<{ label: string; value: string }[]>([]);
const departmentOptions = computed(() => [
  { label: t('attendance.allDepts'), value: '' },
  ...rawDepartments.value,
]);

const monthlyRecords = computed(() => {
  let data = attendanceStore.monthlyAttendance || [];
  if (filters.value.employeeName) {
    const search = filters.value.employeeName.toLowerCase();
    data = data.filter((r) => r.employeeName?.toLowerCase().includes(search));
  }
  return data;
});

const total = computed(() => monthlyRecords.value.length);

const summary = computed(() => ({
  averageAttendanceRate: attendanceStore.monthlyStats?.averageAttendanceRate || 0,
  totalAbsences: attendanceStore.monthlyStats?.totalAbsences || 0,
  totalLateMinutes: attendanceStore.monthlyStats?.totalLateMinutes || 0,
}));

const columns = computed(() => [
  { key: 'employeeName', label: t('attendance.employee'), sortable: true },
  { key: 'totalDays', label: t('attendance.totalDays'), sortable: true },
  { key: 'presentDays', label: t('attendance.presentDays'), sortable: true },
  { key: 'absentDays', label: t('attendance.absentCount'), sortable: true },
  { key: 'lateDays', label: t('attendance.lateCount'), sortable: true },
  { key: 'totalLateMinutes', label: t('attendance.totalLateTime'), sortable: true },
  { key: 'averageEntryTime', label: t('attendance.avgTime'), sortable: true },
  { key: 'attendanceRate', label: t('attendance.attendanceRate'), sortable: true },
]);

const getAttendanceRateClass = (rate: number): string => {
  if (rate > 95) return 'rate-high';
  if (rate >= 80) return 'rate-medium';
  return 'rate-low';
};

const fetchData = async () => {
  loading.value = true;
  try {
    await Promise.all([
      attendanceStore.fetchMonthlyAttendance({
        month: selectedMonth.value,
        year: selectedYear.value,
        page: currentPage.value,
        perPage: perPage.value,
      }),
      attendanceStore.fetchMonthlyStats({
        month: selectedMonth.value,
        year: selectedYear.value,
      }),
    ]);
  } finally {
    loading.value = false;
  }
};

const loadFilters = async () => {
  try {
    const depts = await departmentApi.getAll({ perPage: 200 });
    rawDepartments.value = (depts.data || []).map((d) => ({ label: d.name, value: d.id }));
  } catch {
    // silently fail
  }
};

const handlePageChange = (page: number) => {
  currentPage.value = page;
  fetchData();
};

const handleSearchDebounce = () => {
  if (searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = window.setTimeout(() => {
    currentPage.value = 1;
  }, 300);
};

const handleExport = () => {
  info(t('attendance.exporting'));
};

watch([selectedMonth, selectedYear], () => {
  currentPage.value = 1;
  fetchData();
});

watch(() => filters.value.departmentId, () => {
  currentPage.value = 1;
  fetchData();
});

onMounted(() => {
  loadFilters();
  fetchData();
});
</script>

<style scoped>
.attendance-monthly-page {
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
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
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

.text-blue {
  color: #2563eb;
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

.attendance-rate {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.rate-high {
  background-color: #d1fae5;
  color: #065f46;
}

.rate-medium {
  background-color: #fed7aa;
  color: #9a3412;
}

.rate-low {
  background-color: #fee2e2;
  color: #991b1b;
}

.late-minutes {
  color: #ea580c;
  font-weight: 500;
}
</style>
