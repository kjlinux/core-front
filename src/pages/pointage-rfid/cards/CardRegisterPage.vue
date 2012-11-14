<template>
  <div class="card-register-page">
    <div class="page-header">
      <h1>Enregistrer une carte RFID</h1>
    </div>

    <AppCard>
      <CardForm
        :loading="loading"
        @submit="handleSubmit"
        @cancel="handleCancel"
      />
    </AppCard>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import AppCard from '@/components/common/AppCard.vue';
import CardForm from '@/components/pointage-rfid/CardForm.vue';
import { useCardStore } from '@/stores/cardStore';

const router = useRouter();
const cardStore = useCardStore();

const loading = ref(false);

const handleSubmit = async (formData: any) => {
  loading.value = true;
  try {
    await cardStore.registerCard(formData);
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
