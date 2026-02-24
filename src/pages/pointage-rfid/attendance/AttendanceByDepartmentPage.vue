<template>
  <div class="attendance-by-department-page">
    <div class="page-header">
      <div class="header-left">
        <AppButton variant="ghost" @click="goBack">
          Retour
        </AppButton>
        <h1>Pointage - {{ departmentName }}</h1>
      </div>
      <div class="header-actions">
        <AppButton @click="handleExport">
          Exporter
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
              v-model="dateRange.startDate"
              type="date"
              placeholder="Date de début"
              @change="fetchData"
            />
            <span class="separator">-</span>
            <AppInput
              v-model="dateRange.endDate"
              type="date"
              placeholder="Date de fin"
              @change="fetchData"
            />
            <AppButton @click="setCurrentMonth">
              Ce mois
            </AppButton>
          </div>
        </AppCard>
      </div>

      <div class="stats-grid">
        <StatCard
          title="Total Employés"
          :value="stats.totalEmployees"
          icon="users"
          color="blue"
        />
        <StatCard
          title="Taux de présence moyen"
          :value="`${stats.averageAttendanceRate}%`"
          icon="trending-up"
          color="green"
        />
        <StatCard
          title="Total Absences"
          :value="stats.totalAbsences"
          icon="x-circle"
          color="red"
        />
        <StatCard
          title="Total Retards"
          :value="stats.totalLateInstances"
          icon="clock"
          color="orange"
        />
      </div>

      <AppCard>
        <h3>Employés du département</h3>
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
            <button class="employee-link" @click="viewEmployee(row.employeeId)">
              {{ row.name }}
            </button>
          </template>
        </DataTable>
      </AppCard>
    </template>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAttendanceStore } from '@/stores/attendance.store';
import { useDateRange } from '@/composables/useDateRange';
import DataTable from '@/components/data-display/DataTable.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppCard from '@/components/ui/AppCard.vue';
import StatCard from '@/components/data-display/StatCard.vue';
import AppInput from '@/components/ui/AppInput.vue';
import { useToast } from '@/composables/useToast';

const route = useRoute();
const router = useRouter();
const attendanceStore = useAttendanceStore();
const { dateRange, setCurrentMonth: setCurrentMonthRange } = useDateRange();
const { info, success, error } = useToast();

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

const columns = [
  { key: 'name', label: 'Nom', sortable: true },
  { key: 'position', label: 'Poste', sortable: true },
  { key: 'presentDays', label: 'Jours présents', sortable: true },
  { key: 'absentDays', label: 'Jours absents', sortable: true },
  { key: 'lateDays', label: 'Jours en retard', sortable: true },
  { key: 'attendanceRate', label: 'Taux de présence', sortable: true },
];

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
  info('Export en cours...');
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
  color: #1f2937;
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
  color: #6b7280;
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
  color: #1f2937;
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
  color: #2563eb;
  cursor: pointer;
  text-decoration: none;
  font-weight: 500;
  padding: 0;
  font-size: 14px;
}

.employee-link:hover {
  text-decoration: underline;
}
</style>
