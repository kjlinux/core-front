<template>
  <div class="card-register-page">
    <div class="page-header">
      <h1>Enregistrer une carte RFID</h1>
    </div>

    <AppCard>
      <CardForm
        v-model="formData"
        :employees="employeeStore.employees"
        :loading="loading"
        @submit="handleSubmit"
        @cancel="handleCancel"
      />
    </AppCard>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import AppCard from '@/components/ui/AppCard.vue';
import CardForm from '@/components/forms/CardForm.vue';
import { useCardStore } from '@/stores/card.store';
import { useEmployeeStore } from '@/stores/employee.store';
import type { RfidCard } from '@/types';

const router = useRouter();
const cardStore = useCardStore();
const employeeStore = useEmployeeStore();

const loading = ref(false);
const formData = ref<Partial<RfidCard>>({ status: 'active' });

onMounted(() => {
  if (employeeStore.employees.length === 0) {
    employeeStore.fetchEmployees();
  }
});

const handleSubmit = async () => {
  loading.value = true;
  try {
    await cardStore.registerCard(formData.value);
    router.push('/pointage-rfid/cards');
  } catch (error) {
    console.error('Failed to register card:', error);
  } finally {
    loading.value = false;
  }
};

const handleCancel = () => {
  router.back();
};
</script>

<style scoped>
.card-register-page {
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 2rem;
}

.page-header h1 {
  font-size: 2rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}
</style>
