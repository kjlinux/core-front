<template>
  <div class="card-history-page">
    <div class="page-header">
      <AppButton variant="secondary" @click="navigateBack">
        Retour
      </AppButton>
      <h1>Historique carte {{ card?.uid }}</h1>
    </div>

    <div v-if="loading" class="loading">
      Chargement...
    </div>

    <div v-else-if="card" class="history-content">
      <AppCard>
        <div class="card-summary">
          <div class="summary-item">
            <label>UID</label>
            <span class="uid">{{ card.uid }}</span>
          </div>
          <div class="summary-item">
            <label>Statut actuel</label>
            <AppBadge :variant="getStatusVariant(card.status)">
              {{ getStatusLabel(card.status) }}
            </AppBadge>
          </div>
          <div class="summary-item">
            <label>Employe</label>
            <span v-if="card.employee">
              {{ card.employee.firstName }} {{ card.employee.lastName }}
            </span>
            <span v-else class="unassigned">Non attribuee</span>
          </div>
        </div>
      </AppCard>

      <AppCard class="timeline-card">
        <h2>Historique des actions</h2>

        <div v-if="history.length === 0" class="no-history">
          Aucune action enregistree pour cette carte
        </div>

        <div v-else class="timeline">
          <div
            v-for="(action, index) in history"
            :key="index"
            class="timeline-item"
          >
            <div class="timeline-marker" :class="getActionClass(action.type)">
              <div class="marker-dot"></div>
            </div>
            <div class="timeline-content">
              <div class="action-header">
                <h3>{{ getActionLabel(action.type) }}</h3>
                <span class="action-time">{{ formatDateTime(action.timestamp) }}</span>
              </div>
              <div class="action-details">
                <p v-if="action.performedBy" class="performed-by">
                  Par: <strong>{{ action.performedBy.firstName }} {{ action.performedBy.lastName }}</strong>
                </p>
                <p v-if="action.details" class="action-description">
                  {{ action.details }}
                </p>
                <div v-if="action.reason" class="action-reason">
                  <label>Raison:</label>
                  <p>{{ action.reason }}</p>
                </div>
                <div v-if="action.employee" class="action-employee">
                  <label>Employe:</label>
                  <p>{{ action.employee.firstName }} {{ action.employee.lastName }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AppCard>
    </div>

    <div v-else class="error">
      Carte non trouvee
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import AppButton from '@/components/common/AppButton.vue';
import AppCard from '@/components/common/AppCard.vue';
import AppBadge from '@/components/common/AppBadge.vue';
import { useCardStore } from '@/stores/cardStore';
import { CardStatus } from '@/types/rfid';

const router = useRouter();
const route = useRoute();
const cardStore = useCardStore();

const loading = ref(false);

const cardId = computed(() => route.params.id as string);
const card = computed(() => cardStore.currentCard);
const history = computed(() => cardStore.cardHistory || []);

const getStatusVariant = (status: CardStatus): string => {
  switch (status) {
    case CardStatus.ACTIVE:
      return 'success';
    case CardStatus.INACTIVE:
      return 'secondary';
    case CardStatus.BLOCKED:
      return 'danger';
    case CardStatus.LOST:
      return 'warning';
    default:
      return 'secondary';
  }
};

const getStatusLabel = (status: CardStatus): string => {
  switch (status) {
    case CardStatus.ACTIVE:
      return 'Actif';
    case CardStatus.INACTIVE:
      return 'Inactif';
    case CardStatus.BLOCKED:
      return 'Bloque';
    case CardStatus.LOST:
      return 'Perdu';
    default:
      return status;
  }
};

const getActionClass = (actionType: string): string => {
  switch (actionType) {
    case 'assigned':
      return 'action-assigned';
    case 'unassigned':
      return 'action-unassigned';
    case 'activated':
      return 'action-activated';
    case 'deactivated':
      return 'action-deactivated';
    case 'blocked':
      return 'action-blocked';
    case 'unblocked':
      return 'action-unblocked';
    case 'created':
      return 'action-created';
    default:
      return 'action-default';
  }
};

const getActionLabel = (actionType: string): string => {
  switch (actionType) {
    case 'assigned':
      return 'Carte attribuee';
    case 'unassigned':
      return 'Carte desattribuee';
    case 'activated':
      return 'Carte activee';
    case 'deactivated':
      return 'Carte desactivee';
    case 'blocked':
      return 'Carte bloquee';
    case 'unblocked':
      return 'Carte debloquee';
    case 'created':
      return 'Carte creee';
    default:
      return actionType;
  }
};

const formatDateTime = (date: string | Date): string => {
  return new Date(date).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const navigateBack = () => {
  router.push(`/pointage-rfid/cards/${cardId.value}`);
};

onMounted(async () => {
  loading.value = true;
  try {
    await Promise.all([
      cardStore.fetchCard(cardId.value),
      cardStore.fetchHistory(cardId.value)
    ]);
  } catch (error) {
    console.error('Failed to load card history:', error);
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.card-history-page {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.page-header h1 {
  font-size: 2rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.loading,
.error {
  text-align: center;
  padding: 3rem;
  color: #6b7280;
  font-size: 1.125rem;
}

.error {
  color: #ef4444;
}

.history-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.card-summary {
  display: flex;
  gap: 2rem;
  padding: 1rem 0;
  flex-wrap: wrap;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.summary-item label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b7280;
}

.summary-item span,
.summary-item .uid {
  font-size: 1rem;
  color: #1f2937;
}

.uid {
  font-family: 'Courier New', monospace;
  font-weight: 600;
  letter-spacing: 0.05em;
}

.unassigned {
  color: #6b7280;
  font-style: italic;
}

.timeline-card h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 2rem 0;
}

.no-history {
  text-align: center;
  padding: 3rem;
  color: #6b7280;
  font-style: italic;
}

.timeline {
  position: relative;
}

.timeline::before {
  content: '';
  position: absolute;
  left: 20px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #e5e7eb;
}

.timeline-item {
  position: relative;
  display: flex;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.timeline-item:last-child {
  margin-bottom: 0;
}

.timeline-marker {
  position: relative;
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  z-index: 1;
}

.marker-dot {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 3px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.action-assigned .marker-dot {
  background: #10b981;
}

.action-unassigned .marker-dot {
  background: #6b7280;
}

.action-activated .marker-dot {
  background: #3b82f6;
}

.action-deactivated .marker-dot {
  background: #9ca3af;
}

.action-blocked .marker-dot {
  background: #ef4444;
}

.action-unblocked .marker-dot {
  background: #10b981;
}

.action-created .marker-dot {
  background: #8b5cf6;
}

.action-default .marker-dot {
  background: #6b7280;
}

.timeline-content {
  flex: 1;
  background: #f9fafb;
  border-radius: 0.5rem;
  padding: 1.25rem;
  border: 1px solid #e5e7eb;
}

.action-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.action-header h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.action-time {
  font-size: 0.875rem;
  color: #6b7280;
}

.action-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.action-details p {
  margin: 0;
  font-size: 0.875rem;
  color: #374151;
}

.performed-by {
  color: #6b7280;
}

.performed-by strong {
  color: #1f2937;
}

.action-description {
  color: #374151;
}

.action-reason,
.action-employee {
  margin-top: 0.5rem;
  padding: 0.75rem;
  background: white;
  border-radius: 0.375rem;
  border: 1px solid #e5e7eb;
}

.action-reason label,
.action-employee label {
  display: block;
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.25rem;
}

.action-reason p,
.action-employee p {
  margin: 0;
  font-size: 0.875rem;
  color: #1f2937;
}
</style>
