<template>
  <div class="attendance-dashboard-page">
    <div class="page-header">
      <h1 class="text-gray-900">{{ t('attendance.dashboard') }}</h1>
      <div class="header-actions">
        <AppInput
          v-model="selectedDate"
          type="date"
          :placeholder="t('attendance.selectDate')"
        />
        <AppButton @click="refreshData" :loading="loading">
          {{ t('common.refresh') }}
        </AppButton>
      </div>
    </div>

    <div v-if="loading" class="loading-spinner">
      <div class="spinner"></div>
    </div>

    <template v-else>
      <div class="stats-grid">
        <StatCard
          :title="t('attendance.totalEmployees')"
          :value="stats.totalEmployees"
          iconBgClass="bg-blue-100"
          iconColorClass="text-blue-600"
        />
        <StatCard
          :title="t('attendance.present')"
          :value="stats.present"
          :suffix="`(${stats.presentPercentage}%)`"
          iconBgClass="bg-green-100"
          iconColorClass="text-green-600"
        />
        <StatCard
          :title="t('attendance.absent')"
          :value="stats.absent"
          :suffix="`(${stats.absentPercentage}%)`"
          iconBgClass="bg-red-100"
          iconColorClass="text-red-600"
        />
        <StatCard
          :title="t('attendance.late')"
          :value="stats.late"
          :suffix="`(${stats.latePercentage}%)`"
          iconBgClass="bg-orange-100"
          iconColorClass="text-orange-600"
        />
      </div>

      <div class="quick-stats">
        <AppCard>
          <h3 class="text-gray-900">{{ t('attendance.quickStats') }}</h3>
          <div class="quick-stats-grid">
            <div class="stat-item">
              <span class="stat-label text-gray-500">{{ t('attendance.avgEntry') }}</span>
              <span class="stat-value text-gray-900">{{ stats.averageEntryTime }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label text-gray-500">{{ t('attendance.lateEmployees') }}</span>
              <span class="stat-value text-gray-900">{{ stats.lateCount }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label text-gray-500">{{ t('attendance.earlyLeaves') }}</span>
              <span class="stat-value text-gray-900">{{ stats.earlyDepartures }}</span>
            </div>
          </div>
        </AppCard>
      </div>

      <AppCard class="recent-activity">
        <h3 class="text-gray-900">{{ t('attendance.recentActivity') }}</h3>
        <DataTable
          :columns="activityColumns"
          :data="recentActivity"
          :pagination="activityPagination"
          @page-change="activityPage = $event"
        >
          <template #entryTime="{ row }">
            {{ formatTime(row.entryTime) }}
          </template>
          <template #exitTime="{ row }">
            {{ row.exitTime ? formatTime(row.exitTime) : '-' }}
          </template>
          <template #pointageType="{ row }">
            <span :class="['status-badge', row.exitTime ? 'status-exit' : 'status-entry']">
              {{ row.exitTime ? t('attendance.exit') : t('attendance.entry') }}
            </span>
          </template>
          <template #status="{ row }">
            <span :class="['type-badge', `type-${row.status}`]">
              {{ getStatusLabel(row.status) }}
            </span>
          </template>
        </DataTable>
      </AppCard>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAttendanceStore } from '@/stores/attendance.store';
import DataTable from '@/components/data-display/DataTable.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppCard from '@/components/ui/AppCard.vue';
import StatCard from '@/components/data-display/StatCard.vue';
import AppInput from '@/components/ui/AppInput.vue';

const { t } = useI18n();
const attendanceStore = useAttendanceStore();
const loading = ref(false);
const selectedDate = ref(new Date().toISOString().split('T')[0]);

const stats = computed(() => {
  const report = attendanceStore.dailyReport;
  const records = attendanceStore.dailyAttendance || [];

  const total = report?.totalEmployees || records.length || 0;
  const present = records.filter((r) => r.status === 'present').length;
  const absent = records.filter((r) => r.status === 'absent').length;
  const late = records.filter((r) => r.status === 'late').length;

  const entryMinutes = records
    .filter((r) => r.entryTime)
    .map((r) => {
      const d = new Date(r.entryTime!);
      return d.getHours() * 60 + d.getMinutes();
    });
  let averageEntryTime = '-';
  if (entryMinutes.length > 0) {
    const avgMin = Math.round(entryMinutes.reduce((a, b) => a + b, 0) / entryMinutes.length);
    const hh = String(Math.floor(avgMin / 60)).padStart(2, '0');
    const mm = String(avgMin % 60).padStart(2, '0');
    averageEntryTime = `${hh}:${mm}`;
  }

  const earlyDepartures = records.filter((r) => (r.earlyDepartureMinutes ?? 0) > 0).length;

  return {
    totalEmployees: total,
    present,
    absent,
    late,
    presentPercentage: total > 0 ? Math.round((present / total) * 100) : 0,
    absentPercentage: total > 0 ? Math.round((absent / total) * 100) : 0,
    latePercentage: total > 0 ? Math.round((late / total) * 100) : 0,
    averageEntryTime,
    lateCount: late,
    earlyDepartures,
  };
});

const activityPage = ref(1);
const activityPerPage = 20;

const allActivity = computed(() => {
  const recs = [...(attendanceStore.dailyAttendance || [])];
  return recs.sort((a, b) => {
    const ta = a.entryTime ? new Date(a.entryTime).getTime() : 0;
    const tb = b.entryTime ? new Date(b.entryTime).getTime() : 0;
    return tb - ta;
  });
});

const recentActivity = computed(() => {
  const start = (activityPage.value - 1) * activityPerPage;
  return allActivity.value.slice(start, start + activityPerPage);
});

const activityPagination = computed(() => {
  const total = allActivity.value.length;
  const totalPages = Math.ceil(total / activityPerPage) || 1;
  return { currentPage: activityPage.value, totalPages, perPage: activityPerPage, total };
});

const activityColumns = computed(() => [
  { key: 'employeeName', label: t('attendance.employee'), sortable: true },
  { key: 'entryTime', label: t('attendance.entryTime'), sortable: true },
  { key: 'exitTime', label: t('attendance.exitTime'), sortable: true },
  { key: 'pointageType', label: t('attendance.type'), sortable: false },
  { key: 'status', label: t('common.status'), sortable: true },
]);

const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    present: t('attendance.status.present'),
    late: t('attendance.status.late'),
    absent: t('attendance.status.absent'),
    left_early: t('attendance.status.left_early'),
  };
  return labels[status] || status;
};

const formatTime = (iso: string | null | undefined): string => {
  if (!iso) return '-';
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
};

const refreshData = async () => {
  loading.value = true;
  activityPage.value = 1;
  try {
    await attendanceStore.fetchDailyAttendance({ date: selectedDate.value });
  } finally {
    loading.value = false;
  }
};

watch(selectedDate, () => {
  refreshData();
});

onMounted(() => {
  refreshData();
});
</script>

<style scoped>
.attendance-dashboard-page {
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

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.quick-stats {
  margin-bottom: 24px;
}

.quick-stats h3 {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 16px 0;
}

.quick-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 24px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-label {
  font-size: 14px;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
}

.recent-activity h3 {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 16px 0;
}

.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.status-entry {
  background-color: #dbeafe;
  color: #1e40af;
}

.status-exit {
  background-color: #fef3c7;
  color: #92400e;
}

.type-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.type-present {
  background-color: #d1fae5;
  color: #065f46;
}

.type-late {
  background-color: #fed7aa;
  color: #9a3412;
}

.type-absent {
  background-color: #fee2e2;
  color: #991b1b;
}

.type-left_early {
  background-color: #fef3c7;
  color: #92400e;
}

.dark .status-entry { background-color: rgb(59 130 246 / 0.18); color: #93c5fd; }
.dark .status-exit { background-color: rgb(245 158 11 / 0.18); color: #fcd34d; }
.dark .type-present { background-color: rgb(34 197 94 / 0.18); color: #86efac; }
.dark .type-late { background-color: rgb(249 115 22 / 0.18); color: #fdba74; }
.dark .type-absent { background-color: rgb(239 68 68 / 0.18); color: #fca5a5; }
.dark .type-left_early { background-color: rgb(245 158 11 / 0.18); color: #fcd34d; }
</style>
