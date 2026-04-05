<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import QRCode from 'qrcode'
import { useQrcodeStore } from '@/stores/qrcode.store'
import { useSiteStore } from '@/stores/site.store'
import { useToast } from '@/composables/useToast'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppInput from '@/components/ui/AppInput.vue'

const { t } = useI18n()
const store = useQrcodeStore()
const siteStore = useSiteStore()
const toast = useToast()

const selectedSiteId = ref('')
const label = ref('')
const qrDataUrl = ref<string | null>(null)
const generatedQr = ref<{ token: string; siteName?: string } | null>(null)

onMounted(() => siteStore.fetchSites({ perPage: 200 }))

const siteOptions = computed(() => [
  { label: t('qrcode.selectSite'), value: '' },
  ...siteStore.sites.map((s) => ({ label: s.name, value: s.id })),
])

async function generate() {
  if (!selectedSiteId.value) {
    toast.error(t('qrcode.siteRequired'))
    return
  }
  try {
    const qrCode = await store.generateQrCode(selectedSiteId.value, label.value || undefined)
    generatedQr.value = {
      token: qrCode.token,
      siteName: qrCode.siteName ?? siteStore.sites.find((s) => s.id === selectedSiteId.value)?.name,
    }
    // Le contenu du QR est l'URL de la page de scan avec le token en paramètre
    const scanUrl = `${window.location.origin}/qr-scan?token=${qrCode.token}`
    qrDataUrl.value = await QRCode.toDataURL(scanUrl, { width: 300, margin: 2 })
    toast.success(t('qrcode.generatedSuccess'))
  } catch {
    toast.error(t('qrcode.generateError'))
  }
}

function downloadQr() {
  if (!qrDataUrl.value || !generatedQr.value) return
  const a = document.createElement('a')
  a.href = qrDataUrl.value
  a.download = `qr-site-${generatedQr.value.siteName ?? 'site'}.png`
  a.click()
}

function printQr() {
  if (!qrDataUrl.value) return
  const win = window.open('', '_blank')
  if (!win) return
  win.document.write(`
    <html><body style="display:flex;flex-direction:column;align-items:center;padding:40px;font-family:sans-serif">
      <h2 style="margin-bottom:8px">${generatedQr.value?.siteName ?? 'Site'}</h2>
      ${label.value ? `<p style="color:#64748b;margin-bottom:16px">${label.value}</p>` : ''}
      <img src="${qrDataUrl.value}" style="width:280px;height:280px" />
      <p style="margin-top:16px;font-size:13px;color:#94a3b8">${t('qrcode.scanInstruction')}</p>
    </body></html>
  `)
  win.document.close()
  win.print()
}
</script>

<template>
  <div class="mx-auto max-w-lg space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">{{ t('qrcode.generateTitle') }}</h1>
      <p class="mt-1 text-sm text-gray-500">
        {{ t('qrcode.generateDesc') }}
      </p>
    </div>

    <AppCard>
      <div class="space-y-4">
        <AppSelect
          v-model="selectedSiteId"
          label="Site"
          :options="siteOptions"
        />
        <AppInput
          v-model="label"
          :label="t('qrcode.labelOptional')"
          :placeholder="t('qrcode.labelPlaceholder')"
        />
        <AppButton
          variant="primary"
          :loading="store.isLoading"
          :disabled="!selectedSiteId"
          class="w-full"
          @click="generate"
        >
          {{ t('qrcode.generateButton') }}
        </AppButton>
      </div>
    </AppCard>

    <AppCard v-if="qrDataUrl && generatedQr">
      <div class="flex flex-col items-center gap-4">
        <div class="text-center">
          <p class="font-semibold text-gray-900">{{ generatedQr.siteName }}</p>
          <p v-if="label" class="text-sm text-gray-500">{{ label }}</p>
        </div>
        <img :src="qrDataUrl" alt="QR Code du site" class="rounded-lg border border-gray-200 shadow-sm" />
        <p class="text-xs text-gray-400">
          {{ t('qrcode.generateNote') }}
        </p>
        <div class="flex gap-3">
          <AppButton variant="ghost" @click="downloadQr">{{ t('qrcode.downloadPng') }}</AppButton>
          <AppButton variant="outline" @click="printQr">{{ t('qrcode.print') }}</AppButton>
        </div>
      </div>
    </AppCard>

  </div>
</template>
