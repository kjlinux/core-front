<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useConfirm } from '@/composables/useConfirm'
import AppModal from './AppModal.vue'
import AppButton from './AppButton.vue'

const { t } = useI18n()
const { isOpen, options, handleConfirm, handleCancel } = useConfirm()

const confirmVariant = computed(() => (options.value.variant === 'danger' ? 'danger' : 'primary'))

function onModelUpdate(open: boolean) {
  if (!open) handleCancel()
}
</script>

<template>
  <AppModal
    :model-value="isOpen"
    :title="options.title"
    size="sm"
    @update:model-value="onModelUpdate"
  >
    <p class="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line">{{ options.message }}</p>
    <template #footer>
      <AppButton variant="secondary" @click="handleCancel">
        {{ options.cancelLabel || t('common.cancel') }}
      </AppButton>
      <AppButton :variant="confirmVariant" @click="handleConfirm">
        {{ options.confirmLabel || t('common.confirm') }}
      </AppButton>
    </template>
  </AppModal>
</template>
