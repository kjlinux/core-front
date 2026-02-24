<template>
  <AppModal
    :isOpen="open"
    :title="title"
    size="sm"
    @close="$emit('cancel')"
  >
    <p class="text-sm text-gray-600">
      {{ message }}
    </p>

    <template #footer>
      <AppButton
        variant="secondary"
        size="sm"
        @click="$emit('cancel')"
      >
        {{ cancelLabel }}
      </AppButton>
      <AppButton
        :variant="variant === 'info' ? 'primary' : 'danger'"
        size="sm"
        @click="$emit('confirm')"
      >
        {{ confirmLabel }}
      </AppButton>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import AppModal from './AppModal.vue'
import AppButton from './AppButton.vue'

interface Props {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning' | 'info'
}

withDefaults(defineProps<Props>(), {
  confirmLabel: 'Confirmer',
  cancelLabel: 'Annuler',
  variant: 'danger',
})

defineEmits<{
  confirm: []
  cancel: []
}>()
</script>
