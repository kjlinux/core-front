<template>
  <div class="attendance-by-department-page">
    <div class="page-header">
      <div class="header-left">
        <AppButton variant="ghost" @click="goBack">
          {{ t('common.back') }}
        </AppButton>
        <h1 class="text-gray-900">{{ t('attendance.byDeptTitle', { departmentName }) }}</h1>
      </div>
      <div class="header-actions">
        <AppButton @click="handleExport">
          {{ t('attendance.exportBtn') }}
        </AppButton>
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
            <span class="separator text-gray-500">-</span>
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
          :title="t('attendance.totalEmployees')"
          :value="stats.totalEmployees"
          :icon="UsersIcon"
        />
        <StatCard
          :title="t('attendance.avgAttendanceRate')"
          :value="`${stats.averageAttendanceRate}%`"
          :icon="ArrowTrendingUpIcon"
        />
        <StatCard
          :title="t('attendance.totalAbsences')"
          :value="stats.totalAbsences"
          :icon="XCircleIcon"
        />
        <StatCard
          :title="t('attendance.totalLates')"
          :value="stats.totalLateInstances"
          :icon="ClockIcon"
        />
      </div>

      <AppCard>
        <h3 class="text-gray-900">{{ t('attendance.deptEmployees') }}</h3>
        <DataTable
          :columns="columns"
          :data="employeeRecords"
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
          <template #cell-name="{ row }">
            <button class="employee-link text-blue-600" @click="viewEmployee(row.employeeId)">
              {{ row.name }}
            </button>
          </template>
        </DataTable>
      </AppCard>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAttendanceStore } from '@/stores/attendance.store';
import { useDateRange } from '@/composables/useDateRange';
import DataTable from '@/components/data-display/DataTable.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppCard from '@/components/ui/AppCard.vue';
import StatCard from '@/components/data-display/StatCard.vue';
import AppInput from '@/components/ui/AppInput.vue';
import { useToast } from '@/composables/useToast';
import { UsersIcon, ArrowTrendingUpIcon, XCircleIcon, ClockIcon } from '@heroicons/vue/24/outline';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const attendanceStore = useAttendanceStore();
const { startDate, endDate, dateRange, setCurrentMonth: setCurrentMonthRange } = useDateRange();
const { info } = useToast();

const loading = ref(false);
const departmentId = ref(route.params.id as string);
const departmentName = ref('');
const currentPage = ref(1);
const perPage = ref(20);

const stats = computed(() => {
  return {
    totalEmployees: attendanceStore.departmentStats?.totalEmployees || 0,
    averageAttendanceRate: attendanceStore.departmentStats?.averageAttendanceRate || 0,
    totalAbsences: attendanceStore.departmentStats?.totalAbsences || 0,
    totalLateInstances: attendanceStore.departmentStats?.totalLateInstances || 0,
  };
});

const employeeRecords = computed(() => {
  return attendanceStore.departmentEmployees || [];
});

const total = computed(() => {
  return attendanceStore.departmentEmployeesTotal || 0;
});

const columns = computed(() => [
  { key: 'name', label: t('common.name'), sortable: true },
  { key: 'position', label: t('attendance.position'), sortable: true },
  { key: 'presentDays', label: t('attendance.presentCount'), sortable: true },
  { key: 'absentDays', label: t('attendance.absentCount'), sortable: true },
  { key: 'lateDays', label: t('attendance.lateCount'), sortable: true },
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
    const departmentData = await attendanceStore.fetchDepartmentAttendance({
      departmentId: departmentId.value,
      startDate: dateRange.value.startDate,
      endDate: dateRange.value.endDate,
      page: currentPage.value,
      perPage: perPage.value,
    });

    if (departmentData?.departmentName) {
      departmentName.value = departmentData.departmentName;
    }

    await attendanceStore.fetchDepartmentStats({
      departmentId: departmentId.value,
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

const handleExport = () => {
  info(t('attendance.exporting'));
};

const viewEmployee = (employeeId: string) => {
  router.push({
    name: 'attendance-by-employee',
    params: { id: employeeId },
  });
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
.attendance-by-department-page {
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
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
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
  font-weight: 500;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

h3 {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 16px 0;
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

.employee-link {
  background: none;
  border: none;
  cursor: pointer;
  text-decoration: none;
  font-weight: 500;
  padding: 0;
  font-size: 14px;
}

.employee-link:hover {
  text-decoration: underline;
}

.dark .rate-high   { background-color: rgb(34 197 94 / 0.18); color: #86efac; }
.dark .rate-medium { background-color: rgb(249 115 22 / 0.18); color: #fdba74; }
.dark .rate-low    { background-color: rgb(239 68 68 / 0.18); color: #fca5a5; }
</style>
