<template>
  <div class="schedule-edit-page">
    <AppCard>
      <template #header>
        <div class="flex justify-between items-center">
          <h1 class="text-2xl font-bold">Modifier horaire</h1>
          <AppButton
            v-if="canDelete && schedule"
            @click="showDeleteModal = true"
            variant="danger"
          >
            Supprimer
          </AppButton>
        </div>
      </template>

      <div v-if="loadingSchedule" class="flex justify-center py-8">
        <p>Chargement...</p>
      </div>

      <ScheduleForm
        v-else-if="schedule"
        :initial-data="schedule"
        :loading="loading"
        @submit="handleSubmit"
        @cancel="handleCancel"
      />

      <div v-else class="text-center py-8">
        <p class="text-gray-600">Horaire non trouvé</p>
      </div>
    </AppCard>

    <AppModal
      v-model:visible="showDeleteModal"
      title="Confirmer la suppression"
      @confirm="handleDelete"
    >
      <p>Êtes-vous sûr de vouloir supprimer l'horaire "{{ schedule?.name }}" ?</p>
      <p class="text-sm text-gray-600 mt-2">Cette action est irréversible.</p>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AppCard from '@/components/common/AppCard.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppModal from '@/components/common/AppModal.vue'
import ScheduleForm from '@/components/pointage-rfid/ScheduleForm.vue'
import { useScheduleStore } from '@/stores/scheduleStore'
import { usePermissions } from '@/composables/usePermissions'
import type { Schedule } from '@/types/schedule'

const router = useRouter()
const route = useRoute()
const scheduleStore = useScheduleStore()
const { hasPermission } = usePermissions()

const loading = ref(false)
const loadingSchedule = ref(false)
const showDeleteModal = ref(false)
const schedule = ref<Schedule | null>(null)

const canDelete = computed(() => hasPermission('schedules.delete'))

const scheduleId = computed(() => Number(route.params.id))

const handleSubmit = async (data: Partial<Schedule>) => {
  loading.value = true
  try {
    await scheduleStore.updateSchedule(scheduleId.value, data)
    router.push('/pointage-rfid/schedules')
  } catch (error) {
    console.error('Failed to update schedule:', error)
  } finally {
    loading.value = false
  }
}

const handleCancel = () => {
  router.back()
}

const handleDelete = async () => {
  try {
    await scheduleStore.deleteSchedule(scheduleId.value)
    showDeleteModal.value = false
    router.push('/pointage-rfid/schedules')
  } catch (error) {
    console.error('Failed to delete schedule:', error)
  }
}

onMounted(async () => {
  loadingSchedule.value = true
  try {
    schedule.value = await scheduleStore.fetchScheduleById(scheduleId.value)
  } catch (error) {
    console.error('Failed to load schedule:', error)
  } finally {
    loadingSchedule.value = false
  }
})
</script>

<style scoped>
.schedule-edit-page {
  padding: 1.5rem;
}
</style>
