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
          title="Total Employés"
          :value="stats.totalEmployees"
          icon="users"
          color="blue"
        />
        <StatCard
          title="Présents"
          :value="stats.present"
          :subtitle="`${stats.presentPercentage}%`"
          icon="check-circle"
          color="green"
        />
        <StatCard
          title="Absents"
          :value="stats.absent"
          :subtitle="`${stats.absentPercentage}%`"
          icon="x-circle"
          color="red"
        />
        <StatCard
          title="En Retard"
          :value="stats.late"
          :subtitle="`${stats.latePercentage}%`"
          icon="clock"
          color="orange"
        />
      </div>

      <div class="quick-stats">
        <AppCard>
          <h3>Statistiques Rapides</h3>
          <div class="quick-stats-grid">
            <div class="stat-item">
              <span class="stat-label">Heure moyenne d'entrée</span>
              <span class="stat-value">{{ stats.averageEntryTime }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Employés en retard</span>
              <span class="stat-value">{{ stats.lateCount }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Départs anticipés</span>
              <span class="stat-value">{{ stats.earlyDepartures }}</span>
            </div>
          </div>
        </AppCard>
      </div>

      <AppCard class="recent-activity">
        <h3>Activité Récente</h3>
        <DataTable
          :columns="activityColumns"
          :data="recentActivity"
          :total="recentActivity.length"
          :per-page="10"
        >
          <template #cell-status="{ row }">
            <span :class="['status-badge', `status-${row.status}`]">
              {{ row.status === 'entry' ? 'Entrée' : 'Sortie' }}
            </span>
          </template>
          <template #cell-type="{ row }">
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
import { ref, onMounted, computed } from 'vue';
import { useAttendanceStore } from '@/stores/attendance';
import { formatDate } from '@/utils/format';
import DataTable from '@/components/common/DataTable.vue';
import AppButton from '@/components/common/AppButton.vue';
import AppCard from '@/components/common/AppCard.vue';
import StatCard from '@/components/common/StatCard.vue';
import AppInput from '@/components/common/AppInput.vue';

const attendanceStore = useAttendanceStore();
const loading = ref(false);
const selectedDate = ref(formatDate(new Date(), 'yyyy-MM-dd'));

const stats = computed(() => {
  const total = attendanceStore.dailyStats?.totalEmployees || 0;
  const present = attendanceStore.dailyStats?.present || 0;
  const absent = attendanceStore.dailyStats?.absent || 0;
  const late = attendanceStore.dailyStats?.late || 0;

  return {
    totalEmployees: total,
    present,
    absent,
    late,
    presentPercentage: total > 0 ? Math.round((present / total) * 100) : 0,
    absentPercentage: total > 0 ? Math.round((absent / total) * 100) : 0,
    latePercentage: total > 0 ? Math.round((late / total) * 100) : 0,
    averageEntryTime: attendanceStore.dailyStats?.averageEntryTime || '00:00',
    lateCount: late,
    earlyDepartures: attendanceStore.dailyStats?.earlyDepartures || 0,
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
