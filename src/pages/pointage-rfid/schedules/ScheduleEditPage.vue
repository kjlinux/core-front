<template>
  <div class="schedule-edit-page">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">Modifier horaire</h1>
      <AppButton
        v-if="canDelete && schedule"
        @click="showDeleteModal = true"
        variant="danger"
      >
        <TrashIcon class="w-4 h-4 mr-1" />
        Supprimer
      </AppButton>
    </div>

    <AppCard>
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

    <AppConfirmDialog
      :open="showDeleteModal"
      title="Confirmer la suppression"
      :message="`Etes-vous sur de vouloir supprimer l\'horaire &quot;${schedule?.name}&quot; ? Cette action est irreversible.`"
      @confirm="handleDelete"
      @cancel="showDeleteModal = false"
    />
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppConfirmDialog from '@/components/ui/AppConfirmDialog.vue'
import ScheduleForm from '@/components/forms/ScheduleForm.vue'
import { useScheduleStore } from '@/stores/schedule.store'
import { usePermissions } from '@/composables/usePermissions'
import type { Schedule } from '@/types/schedule'
import { TrashIcon } from '@heroicons/vue/24/outline'

const router = useRouter()
const route = useRoute()
const scheduleStore = useScheduleStore()
const { isSuperAdmin, isAdminEnterprise } = usePermissions()

const loading = ref(false)
const loadingSchedule = ref(false)
const showDeleteModal = ref(false)
const schedule = ref<Schedule | null>(null)

const canDelete = computed(() => isSuperAdmin.value || isAdminEnterprise.value)

const scheduleId = computed(() => String(route.params.id))

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
