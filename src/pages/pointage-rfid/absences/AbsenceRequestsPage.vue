<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAbsenceStore } from '@/stores/absence.store'
import { useAuthStore } from '@/stores/auth.store'
import { useToast } from '@/composables/useToast'
import AppCard from '@/components/ui/AppCard.vue'
import AppAvatar from '@/components/ui/AppAvatar.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import { CheckCircleIcon, XCircleIcon, EyeIcon, PaperClipIcon } from '@heroicons/vue/24/outline'
import type { AbsenceRequest, AbsenceStatus, ReviewAbsencePayload } from '@/types/absence'
import { sortByRecent } from '@/utils/sort'

const absenceStore = useAbsenceStore()
const authStore = useAuthStore()
const toast = useToast()
const { t } = useI18n()

const filterStatus = ref<AbsenceStatus | ''>('')
const showReviewModal = ref(false)
const showDetailModal = ref(false)
const selectedRequest = ref<AbsenceRequest | null>(null)
const reviewAction = ref<'approved' | 'rejected'>('approved')
const reviewNote = ref('')
const editDateStart = ref('')
const editDateEnd = ref('')
const editReason = ref('')

const statusOptions = [
  { label: 'Tous les statuts', value: '' },
  { label: 'En attente', value: 'pending' },
  { label: 'Approuvé', value: 'approved' },
  { label: 'Rejeté', value: 'rejected' },
]

const statusLabels: Record<AbsenceStatus, string> = {
  pending: 'En attente',
  approved: 'Approuvé',
  rejected: 'Rejeté',
}

const statusVariants: Record<AbsenceStatus, string> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'error',
}

const companyId = computed(() => authStore.user?.companyId ?? undefined)
const sortedRequests = computed(() => sortByRecent(absenceStore.requests))

async function loadRequests() {
  await absenceStore.fetchRequests({
    companyId: companyId.value,
    status: filterStatus.value || undefined,
    page: 1,
  })
}

async function onFilterChange() {
  await loadRequests()
}

function openDetail(request: AbsenceRequest) {
  selectedRequest.value = request
  showDetailModal.value = true
}

function openReview(request: AbsenceRequest, action: 'approved' | 'rejected') {
  selectedRequest.value = request
  reviewAction.value = action
  reviewNote.value = ''
  editDateStart.value = request.dateStart
  editDateEnd.value = request.dateEnd
  editReason.value = request.reason
  showReviewModal.value = true
}

async function confirmReview() {
  if (!selectedRequest.value) return
  try {
    // L'admin peut ajuster les dates/motif avant de valider : ce sont les valeurs
    // modifiees qui font foi (prises en compte pour les pointages et la paie).
    // Tout part dans un seul appel atomique a /review (statut + ajustements),
    // ce qui evite la fragilite d'un update separe dependant du statut "pending".
    const payload: ReviewAbsencePayload = {
      status: reviewAction.value,
      reviewNote: reviewNote.value.trim() || undefined,
    }
    if (reviewAction.value === 'approved') {
      payload.dateStart = editDateStart.value
      payload.dateEnd = editDateEnd.value
      payload.reason = editReason.value.trim()
    }
    await absenceStore.reviewRequest(selectedRequest.value.id, payload)
    toast.showSuccess(
      reviewAction.value === 'approved' ? t('toast.absence.approved') : t('toast.absence.rejected'),
    )
    showReviewModal.value = false
    await absenceStore.fetchRequests({ page: absenceStore.pagination.currentPage })
    selectedRequest.value = null
  } catch {
    toast.showError(t('toast.absence.genericError'))
  }
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('fr-FR')
}

function daysDiff(start: string, end: string) {
  const s = new Date(start)
  const e = new Date(end)
  const diff = Math.round((e.getTime() - s.getTime()) / 86400000) + 1
  return diff === 1 ? '1 jour' : `${diff} jours`
}

onMounted(loadRequests)
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Justificatifs d'absence</h1>
      <p class="text-sm text-gray-500 mt-1">
        Consultez et traitez les demandes soumises par les employés
      </p>
    </div>

    <!-- Filtres -->
    <AppCard>
      <div class="flex items-center gap-4 flex-wrap">
        <div class="w-52">
          <AppSelect
            v-model="filterStatus"
            :options="statusOptions"
            @update:model-value="onFilterChange"
          />
        </div>
        <div class="text-sm text-gray-500">
          {{ absenceStore.pagination.total }} demande(s) au total
        </div>
      </div>
    </AppCard>

    <!-- Liste -->
    <div v-if="absenceStore.isLoading" class="flex justify-center py-16">
      <div
        class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"
      ></div>
    </div>

    <div v-else-if="sortedRequests.length === 0" class="text-center py-16 text-gray-400">
      Aucune demande d'absence
    </div>

    <div v-else class="space-y-3">
      <AppCard v-for="req in sortedRequests" :key="req.id">
        <div class="flex items-start justify-between gap-4 flex-wrap">
          <div class="flex items-start gap-4 min-w-0">
            <AppAvatar :src="req.employeeAvatar" :name="req.employeeName" size="lg" />
            <div class="min-w-0">
              <p class="font-semibold text-gray-900">{{ req.employeeName }}</p>
              <p class="text-sm text-gray-500">
                {{ formatDate(req.dateStart) }} - {{ formatDate(req.dateEnd) }}
                <span class="text-gray-400">({{ daysDiff(req.dateStart, req.dateEnd) }})</span>
              </p>
              <p class="text-sm text-gray-600 mt-1 truncate max-w-md">{{ req.reason }}</p>
              <div v-if="req.justificatifUrl" class="flex items-center gap-1 mt-1">
                <PaperClipIcon class="w-3.5 h-3.5 text-gray-400" />
                <a
                  :href="req.justificatifUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-xs text-primary hover:underline"
                >
                  Voir le justificatif
                </a>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-3 flex-shrink-0">
            <AppBadge :variant="(statusVariants[req.status] ?? 'neutral') as any">
              {{ statusLabels[req.status] }}
            </AppBadge>

            <button
              type="button"
              class="text-gray-400 hover:text-gray-600"
              title="Voir le détail"
              @click="openDetail(req)"
            >
              <EyeIcon class="w-5 h-5" />
            </button>

            <template v-if="req.status === 'pending'">
              <button
                type="button"
                class="text-green-600 hover:text-green-800"
                title="Approuver"
                @click="openReview(req, 'approved')"
              >
                <CheckCircleIcon class="w-5 h-5" />
              </button>
              <button
                type="button"
                class="text-red-500 hover:text-red-700"
                title="Rejeter"
                @click="openReview(req, 'rejected')"
              >
                <XCircleIcon class="w-5 h-5" />
              </button>
            </template>
          </div>
        </div>

        <div
          v-if="req.reviewNote"
          class="mt-3 pt-3 border-t border-gray-100 text-sm text-gray-500 italic"
        >
          Note : {{ req.reviewNote }}
        </div>
      </AppCard>
    </div>

    <!-- Pagination -->
    <div v-if="absenceStore.pagination.totalPages > 1" class="flex justify-center gap-2 pt-2">
      <AppButton
        variant="secondary"
        :disabled="absenceStore.pagination.currentPage === 1"
        @click="absenceStore.fetchRequests({ page: absenceStore.pagination.currentPage - 1 })"
      >
        Précédent
      </AppButton>
      <span class="flex items-center text-sm text-gray-600 px-2">
        Page {{ absenceStore.pagination.currentPage }} / {{ absenceStore.pagination.totalPages }}
      </span>
      <AppButton
        variant="secondary"
        :disabled="absenceStore.pagination.currentPage === absenceStore.pagination.totalPages"
        @click="absenceStore.fetchRequests({ page: absenceStore.pagination.currentPage + 1 })"
      >
        Suivant
      </AppButton>
    </div>

    <!-- Modal détail -->
    <AppModal v-model="showDetailModal" title="Détails de la demande" size="md">
      <div v-if="selectedRequest" class="space-y-4 text-sm">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <p class="text-gray-400 text-xs mb-0.5">Employé</p>
            <p class="font-medium text-gray-900">{{ selectedRequest.employeeName }}</p>
          </div>
          <div>
            <p class="text-gray-400 text-xs mb-0.5">Statut</p>
            <AppBadge :variant="(statusVariants[selectedRequest.status] ?? 'neutral') as any">
              {{ statusLabels[selectedRequest.status] }}
            </AppBadge>
          </div>
          <div>
            <p class="text-gray-400 text-xs mb-0.5">Date de début</p>
            <p class="font-medium text-gray-900">{{ formatDate(selectedRequest.dateStart) }}</p>
          </div>
          <div>
            <p class="text-gray-400 text-xs mb-0.5">Date de fin</p>
            <p class="font-medium text-gray-900">{{ formatDate(selectedRequest.dateEnd) }}</p>
          </div>
          <div>
            <p class="text-gray-400 text-xs mb-0.5">Durée</p>
            <p class="font-medium text-gray-900">
              {{ daysDiff(selectedRequest.dateStart, selectedRequest.dateEnd) }}
            </p>
          </div>
          <div>
            <p class="text-gray-400 text-xs mb-0.5">Soumis le</p>
            <p class="font-medium text-gray-900">{{ formatDate(selectedRequest.createdAt) }}</p>
          </div>
        </div>
        <div>
          <p class="text-gray-400 text-xs mb-0.5">Motif</p>
          <p class="text-gray-800 bg-gray-50 rounded-lg p-3">{{ selectedRequest.reason }}</p>
        </div>
        <div v-if="selectedRequest.justificatifUrl">
          <p class="text-gray-400 text-xs mb-0.5">Pièce jointe</p>
          <a
            :href="selectedRequest.justificatifUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center gap-2 text-primary hover:underline"
          >
            <PaperClipIcon class="w-4 h-4" />
            Télécharger le justificatif
          </a>
        </div>
        <div v-if="selectedRequest.reviewNote">
          <p class="text-gray-400 text-xs mb-0.5">Note de révision</p>
          <p class="text-gray-700 italic">{{ selectedRequest.reviewNote }}</p>
        </div>
        <div v-if="selectedRequest.reviewedBy">
          <p class="text-gray-400 text-xs mb-0.5">Traité par</p>
          <p class="text-gray-700">{{ selectedRequest.reviewedBy }}</p>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <template v-if="selectedRequest?.status === 'pending'">
            <AppButton
              variant="danger"
              @click="
                openReview(selectedRequest, 'rejected');
                showDetailModal = false;
              "
            >
              Rejeter
            </AppButton>
            <AppButton
              variant="primary"
              @click="
                openReview(selectedRequest, 'approved');
                showDetailModal = false;
              "
            >
              Approuver
            </AppButton>
          </template>
          <AppButton v-else variant="secondary" @click="showDetailModal = false">{{
            t('common.close')
          }}</AppButton>
        </div>
      </template>
    </AppModal>

    <!-- Modal révision -->
    <AppModal
      v-model="showReviewModal"
      :title="reviewAction === 'approved' ? 'Approuver la demande' : 'Rejeter la demande'"
      size="sm"
    >
      <div class="space-y-4">
        <p class="text-sm text-gray-600">
          <template v-if="reviewAction === 'approved'">
            Vous allez approuver la demande d'absence de
            <strong>{{ selectedRequest?.employeeName }}</strong
            >.
          </template>
          <template v-else>
            Vous allez rejeter la demande d'absence de
            <strong>{{ selectedRequest?.employeeName }}</strong
            >.
          </template>
        </p>

        <div v-if="reviewAction === 'approved'" class="space-y-3 rounded-lg bg-gray-50 p-3">
          <p class="text-xs text-gray-500">
            Vous pouvez ajuster les dates ou le motif avant de valider. Les valeurs modifiées seront
            prises en compte pour les pointages et la paie.
          </p>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Date de début</label>
              <input
                v-model="editDateStart"
                type="date"
                class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Date de fin</label>
              <input
                v-model="editDateEnd"
                type="date"
                class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Motif</label>
            <textarea
              v-model="editReason"
              rows="2"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1"> Note (optionnel) </label>
          <textarea
            v-model="reviewNote"
            rows="3"
            class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="Ajoutez une note pour l'employé..."
          />
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <AppButton variant="secondary" @click="showReviewModal = false">{{
            t('common.cancel')
          }}</AppButton>
          <AppButton
            :variant="reviewAction === 'approved' ? 'primary' : 'danger'"
            :loading="absenceStore.isSubmitting"
            @click="confirmReview"
          >
            {{ reviewAction === 'approved' ? 'Modifier et approuver' : 'Rejeter' }}
          </AppButton>
        </div>
      </template>
    </AppModal>
  </div>
</template>
