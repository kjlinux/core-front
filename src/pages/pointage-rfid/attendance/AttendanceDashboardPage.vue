<template>
  <div class="attendance-dashboard-page">
    <div class="page-header">
      <h1>Pointage - Tableau de bord</h1>
      <div class="header-actions">
        <AppInput
          v-model="selectedDate"
          type="date"
          placeholder="Sélectionner une date"
        />
        <AppButton @click="refreshData" :loading="loading">
          Actualiser
        </AppButton>
      </div>
    </div>

    <div v-if="loading" class="loading-spinner">
      <div class="spinner"></div>
    </div>

    <template v-else>
      <div class="stats-grid">
        <StatCard
          title="Total Employes"
          :value="stats.totalEmployees"
          iconBgClass="bg-blue-100"
          iconColorClass="text-blue-600"
        />
        <StatCard
          title="Presents"
          :value="stats.present"
          :suffix="`(${stats.presentPercentage}%)`"
          iconBgClass="bg-green-100"
          iconColorClass="text-green-600"
        />
        <StatCard
          title="Absents"
          :value="stats.absent"
          :suffix="`(${stats.absentPercentage}%)`"
          iconBgClass="bg-red-100"
          iconColorClass="text-red-600"
        />
        <StatCard
          title="En Retard"
          :value="stats.late"
          :suffix="`(${stats.latePercentage}%)`"
          iconBgClass="bg-orange-100"
          iconColorClass="text-orange-600"
        />
      </div>

      <div class="quick-stats">
        <AppCard>
          <h3>Statistiques Rapides</h3>
          <div class="quick-stats-grid">
            <div class="stat-item">
              <span class="stat-label">Heure moyenne d'entree</span>
              <span class="stat-value">{{ stats.averageEntryTime }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Employes en retard</span>
              <span class="stat-value">{{ stats.lateCount }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Departs anticipes</span>
              <span class="stat-value">{{ stats.earlyDepartures }}</span>
            </div>
          </div>
        </AppCard>
      </div>

      <AppCard class="recent-activity">
        <h3>Activite Recente</h3>
        <DataTable
          :columns="activityColumns"
          :data="recentActivity"
          :total="recentActivity.length"
          :per-page="10"
        >
          <template #status="{ row }">
            <span :class="['status-badge', `status-${row.status}`]">
              {{ row.status === 'entry' ? 'Entree' : 'Sortie' }}
            </span>
          </template>
          <template #type="{ row }">
            <span :class="['type-badge', `type-${row.type}`]">
              {{ getTypeLabel(row.type) }}
            </span>
          </template>
        </DataTable>
      </AppCard>
    </template>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, onMounted, computed } from 'vue';
import { useAttendanceStore } from '@/stores/attendance.store';
import { formatDate } from '@/utils/format';
import DataTable from '@/components/data-display/DataTable.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppCard from '@/components/ui/AppCard.vue';
import StatCard from '@/components/data-display/StatCard.vue';
import AppInput from '@/components/ui/AppInput.vue';

const attendanceStore = useAttendanceStore();
const loading = ref(false);
const selectedDate = ref(new Date().toISOString().split('T')[0]);

const stats = computed(() => {
  const total = attendanceStore.dailyReport?.totalEmployees || 0;
  const present = attendanceStore.dailyReport?.present || 0;
  const absent = attendanceStore.dailyReport?.absent || 0;
  const late = attendanceStore.dailyReport?.late || 0;

  return {
    totalEmployees: total,
    present,
    absent,
    late,
    presentPercentage: total > 0 ? Math.round((present / total) * 100) : 0,
    absentPercentage: total > 0 ? Math.round((absent / total) * 100) : 0,
    latePercentage: total > 0 ? Math.round((late / total) * 100) : 0,
    averageEntryTime: attendanceStore.dailyReport?.averageEntryTime || '00:00',
    lateCount: late,
    earlyDepartures: attendanceStore.dailyReport?.earlyDepartures || 0,
  };
});

const recentActivity = computed(() => {
  return attendanceStore.recentActivity || [];
});

const activityColumns = [
  { key: 'employeeName', label: 'Employé', sortable: true },
  { key: 'time', label: 'Heure', sortable: true },
  { key: 'status', label: 'Type', sortable: true },
  { key: 'type', label: 'Statut', sortable: true },
];

const getTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    present: 'Présent',
    late: 'En retard',
    absent: 'Absent',
    early_departure: 'Départ anticipé',
  };
  return labels[type] || type;
};

const refreshData = async () => {
  loading.value = true;
  try {
    await attendanceStore.fetchDailyStats(selectedDate.value);
    await attendanceStore.fetchRecentActivity(selectedDate.value, 10);
  } finally {
    loading.value = false;
  }
};

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
  color: #1f2937;
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
  color: #6b7280;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
}

.recent-activity h3 {
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

.type-early_departure {
  background-color: #fef3c7;
  color: #92400e;
}
</style>
