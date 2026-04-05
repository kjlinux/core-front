<template>
  <div class="attendance-by-employee-page">
    <div class="page-header">
      <div class="header-left">
        <AppButton variant="ghost" @click="goBack">
          {{ t('common.back') }}
        </AppButton>
        <h1>{{ t('attendance.byEmployeeTitle', { employeeName }) }}</h1>
      </div>
    </div>

    <div v-if="loading" class="loading-spinner">
      <div class="spinner"></div>
    </div>

    <template v-else>
      <div class="date-range-selector">
        <AppCard>
          <div class="date-range-controls">
            <AppInput
              v-model="startDate"
              type="date"
              :placeholder="t('attendance.startDate')"
            />
            <span class="separator">-</span>
            <AppInput
              v-model="endDate"
              type="date"
              :placeholder="t('attendance.endDate')"
            />
            <AppButton @click="setCurrentMonth">
              {{ t('attendance.thisMonth') }}
            </AppButton>
          </div>
        </AppCard>
      </div>

      <div class="stats-grid">
        <StatCard
          :title="t('attendance.workedDays')"
          :value="stats.totalDays"
          icon="calendar"
          color="blue"
        />
        <StatCard
          :title="t('attendance.presentDays')"
          :value="stats.presentDays"
          icon="check-circle"
          color="green"
        />
        <StatCard
          :title="t('attendance.lateDays')"
          :value="stats.lateDays"
          icon="clock"
          color="orange"
        />
        <StatCard
          :title="t('attendance.punctuality')"
          :value="`${stats.onTimePercentage}%`"
          icon="award"
          color="purple"
        />
      </div>

      <AppCard class="calendar-view">
        <h3>{{ t('attendance.calendarView') }}</h3>
        <div class="calendar-grid">
          <div
            v-for="day in calendarDays"
            :key="day.date"
            :class="['calendar-day', `status-${day.status}`]"
            :title="day.tooltip"
          >
            <div class="day-number">{{ day.dayNumber }}</div>
            <div class="day-status">{{ day.statusLabel }}</div>
          </div>
        </div>
        <div class="calendar-legend">
          <div class="legend-item">
            <span class="legend-color status-present"></span>
            <span>{{ t('attendance.status.present') }}</span>
          </div>
          <div class="legend-item">
            <span class="legend-color status-late"></span>
            <span>{{ t('attendance.status.late') }}</span>
          </div>
          <div class="legend-item">
            <span class="legend-color status-absent"></span>
            <span>{{ t('attendance.status.absent') }}</span>
          </div>
          <div class="legend-item">
            <span class="legend-color status-weekend"></span>
            <span>{{ t('attendance.weekend') }}</span>
          </div>
        </div>
      </AppCard>

      <AppCard class="details-table">
        <h3>{{ t('attendance.attendanceDetails') }}</h3>
        <DataTable
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
        </DataTable>
      </AppCard>
    </template>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAttendanceStore } from '@/stores/attendance.store';
import { useDateRange } from '@/composables/useDateRange';
import { formatDate } from '@/utils/format';
import DataTable from '@/components/data-display/DataTable.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppCard from '@/components/ui/AppCard.vue';
import StatCard from '@/components/data-display/StatCard.vue';
import AppInput from '@/components/ui/AppInput.vue';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const attendanceStore = useAttendanceStore();
const { startDate, endDate, dateRange, setCurrentMonth: setCurrentMonthRange } = useDateRange();

const loading = ref(false);
const employeeId = ref(route.params.id as string);
const employeeName = ref('');
const currentPage = ref(1);
const perPage = ref(20);

const stats = computed(() => {
  return {
    totalDays: attendanceStore.employeeStats?.totalDays || 0,
    presentDays: attendanceStore.employeeStats?.presentDays || 0,
    lateDays: attendanceStore.employeeStats?.lateDays || 0,
    onTimePercentage: attendanceStore.employeeStats?.onTimePercentage || 0,
  };
});

const attendanceRecords = computed(() => {
  return attendanceStore.employeeAttendance || [];
});

const total = computed(() => {
  return attendanceStore.employeeAttendanceTotal || 0;
});

const calendarDays = computed(() => {
  return attendanceStore.employeeCalendar || [];
});

const columns = computed(() => [
  { key: 'date', label: t('common.date'), sortable: true },
  { key: 'entryTime', label: t('attendance.entryTime'), sortable: true },
  { key: 'exitTime', label: t('attendance.exitTime'), sortable: true },
  { key: 'status', label: t('common.status'), sortable: true },
  { key: 'lateMinutes', label: t('attendance.lateTime'), sortable: true },
  { key: 'notes', label: t('attendance.notes'), sortable: false },
]);

const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    present: t('attendance.status.present'),
    absent: t('attendance.status.absent'),
    late: t('attendance.status.late'),
  };
  return labels[status] || status;
};

const fetchData = async () => {
  loading.value = true;
  try {
    const employeeData = await attendanceStore.fetchEmployeeAttendance({
      employeeId: employeeId.value,
      startDate: dateRange.value.startDate,
      endDate: dateRange.value.endDate,
      page: currentPage.value,
      perPage: perPage.value,
    });

    if (employeeData?.employeeName) {
      employeeName.value = employeeData.employeeName;
    }

    await attendanceStore.fetchEmployeeStats({
      employeeId: employeeId.value,
      startDate: dateRange.value.startDate,
      endDate: dateRange.value.endDate,
    });

    await attendanceStore.fetchEmployeeCalendar({
      employeeId: employeeId.value,
      startDate: dateRange.value.startDate,
      endDate: dateRange.value.endDate,
    });
  } finally {
    loading.value = false;
  }
};

const handlePageChange = (page: number) => {
  currentPage.value = page;
  fetchData();
};

const setCurrentMonth = () => {
  setCurrentMonthRange();
  fetchData();
};

const goBack = () => {
  router.back();
};

watch([startDate, endDate], () => {
  currentPage.value = 1;
  fetchData();
});

onMounted(() => {
  setCurrentMonth();
});
</script>

<style scoped>
.attendance-by-employee-page {
  padding: 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.page-header h1 {
  font-size: 28px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.loading-spinner {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
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

.date-range-selector {
  margin-bottom: 24px;
}

.date-range-controls {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.separator {
  color: #6b7280;
  font-weight: 500;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.calendar-view {
  margin-bottom: 24px;
}

.calendar-view h3 {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 16px 0;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
  margin-bottom: 16px;
}

.calendar-day {
  aspect-ratio: 1;
  border-radius: 8px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  cursor: pointer;
  transition: transform 0.2s;
}

.calendar-day:hover {
  transform: scale(1.05);
}

.day-number {
  font-weight: 600;
  margin-bottom: 4px;
}

.day-status {
  font-size: 10px;
  text-align: center;
}

.calendar-day.status-present {
  background-color: #d1fae5;
  color: #065f46;
}

.calendar-day.status-late {
  background-color: #fed7aa;
  color: #9a3412;
}

.calendar-day.status-absent {
  background-color: #fee2e2;
  color: #991b1b;
}

.calendar-day.status-weekend {
  background-color: #f3f4f6;
  color: #6b7280;
}

.calendar-legend {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #6b7280;
}

.legend-color {
  width: 16px;
  height: 16px;
  border-radius: 4px;
}

.details-table h3 {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 16px 0;
}

.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.status-present {
  background-color: #d1fae5;
  color: #065f46;
}

.status-badge.status-absent {
  background-color: #fee2e2;
  color: #991b1b;
}

.status-badge.status-late {
  background-color: #fed7aa;
  color: #9a3412;
}

.late-minutes {
  color: #ea580c;
  font-weight: 500;
}
</style>
