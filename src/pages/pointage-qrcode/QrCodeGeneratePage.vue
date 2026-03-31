<script setup lang="ts">
import { ref, onMounted } from 'vue'
import QRCode from 'qrcode'
import { useQrcodeStore } from '@/stores/qrcode.store'
import { useToast } from '@/composables/useToast'
import { employeeApi } from '@/services/api/employee.api'
import type { Employee } from '@/types'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppSelect from '@/components/ui/AppSelect.vue'

const store = useQrcodeStore()
const toast = useToast()

const employees = ref<Employee[]>([])
const selectedEmployeeId = ref('')
const qrDataUrl = ref<string | null>(null)
const generatedToken = ref<string | null>(null)

onMounted(async () => {
  const response = await employeeApi.getAll({ perPage: 200 })
  employees.value = response.data
})

const employeeOptions = ref<{ label: string; value: string }[]>([])
function updateOptions() {
  employeeOptions.value = [
    { label: 'Selectionner un employe', value: '' },
    ...employees.value.map((e) => ({
      label: `${e.firstName} ${e.lastName}`,
      value: e.id,
    })),
  ]
}
onMounted(() => {
  updateOptions()
})
import { watch } from 'vue'
watch(employees, updateOptions)

async function generate() {
  if (!selectedEmployeeId.value) {
    toast.error('Veuillez selectionner un employe')
    return
  }
  try {
    const qrCode = await store.generateQrCode(selectedEmployeeId.value)
    generatedToken.value = qrCode.token
    qrDataUrl.value = await QRCode.toDataURL(qrCode.token, { width: 256, margin: 2 })
    toast.success('QR Code genere avec succes')
  } catch {
    toast.error('Erreur lors de la generation du QR Code')
  }
}

function downloadQr() {
  if (!qrDataUrl.value) return
  const a = document.createElement('a')
  a.href = qrDataUrl.value
  a.download = `qrcode-employe-${selectedEmployeeId.value}.png`
  a.click()
}
</script>

<template>
  <div class="mx-auto max-w-lg space-y-6">
    <h1 class="text-2xl font-bold text-gray-900">Generer un QR Code</h1>

    <AppCard>
      <div class="space-y-4">
        <AppSelect
          v-model="selectedEmployeeId"
          label="Employe"
          :options="employeeOptions"
        />

        <AppButton
          variant="primary"
          :loading="store.isLoading"
          :disabled="!selectedEmployeeId"
          class="w-full"
          @click="generate"
        >
          Generer le QR Code
        </AppButton>
      </div>
    </AppCard>

    <AppCard v-if="qrDataUrl">
      <div class="flex flex-col items-center gap-4">
        <img :src="qrDataUrl" alt="QR Code" class="rounded-lg border border-gray-200" />
        <p class="font-mono text-xs text-gray-500">{{ generatedToken }}</p>
        <AppButton variant="outline" @click="downloadQr">
          Telecharger le QR Code
        </AppButton>
      </div>
    </AppCard>
  </div>
</template>
