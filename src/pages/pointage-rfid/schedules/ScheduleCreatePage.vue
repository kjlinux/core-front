<template>
  <div class="schedule-create-page">
    <h1 class="text-2xl font-bold mb-6">Nouvel horaire</h1>

    <AppCard>
      <ScheduleForm
        :loading="loading"
        @submit="handleSubmit"
        @cancel="handleCancel"
      />
    </AppCard>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AppCard from '@/components/ui/AppCard.vue'
import ScheduleForm from '@/components/forms/ScheduleForm.vue'
import { useScheduleStore } from '@/stores/schedule.store'
import type { Schedule } from '@/types/schedule'

const router = useRouter()
const scheduleStore = useScheduleStore()

const loading = ref(false)

const handleSubmit = async (data: Partial<Schedule>) => {
  loading.value = true
  try {
    await scheduleStore.createSchedule(data)
    router.push('/pointage-rfid/schedules')
  } catch (error) {
    console.error('Failed to create schedule:', error)
  } finally {
    loading.value = false
  }
}

const handleCancel = () => {
  router.back()
}
</script>

<style scoped>
.schedule-create-page {
  padding: 1.5rem;
}
</style>
