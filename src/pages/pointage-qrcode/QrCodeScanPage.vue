<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useDeviceFingerprint } from '@/composables/useDeviceFingerprint'
import { qrcodeApi } from '@/services/api/qrcode.api'
import type { QrAttendanceRecord, DeviceIdentifyResponse } from '@/types'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppBadge from '@/components/ui/AppBadge.vue'

const route = useRoute()
const { getOrCreate, getDeviceInfo } = useDeviceFingerprint()

// Token du QR Code du site (passé en query param quand l'employé scanne le QR)
const token = ref((route.query.token as string) ?? '')
// Token de session d'enrôlement (quand l'employé scanne le QR d'enrôlement admin)
const enrollToken = ref((route.query.enroll as string) ?? '')
const fingerprint = getOrCreate()
const deviceInfo = getDeviceInfo()

const step = ref<'identify' | 'ready' | 'scanning' | 'result' | 'error' | 'enrolling' | 'enrolled' | 'enroll-error'>('identify')
const identity = ref<DeviceIdentifyResponse | null>(null)
const result = ref<QrAttendanceRecord | null>(null)
const errorMsg = ref('')
const gpsStatus = ref<'idle' | 'loading' | 'ok' | 'denied' | 'unavailable'>('idle')
const coords = ref<{ lat: number; lng: number } | null>(null)
const enrolledName = ref('')

const statusLabel: Record<string, string> = {
  present: 'Present',
  late: 'En retard',
  left_early: 'Parti tot',
  absent: 'Absent',
}
const statusVariant: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
  present: 'success',
  late: 'warning',
  left_early: 'info',
  absent: 'danger',
}

onMounted(async () => {
  // Mode enrôlement : le QR de l'admin contient ?enroll=sessionToken
  if (enrollToken.value) {
    step.value = 'enrolling'
    try {
      await qrcodeApi.submitEnrollSession(enrollToken.value, fingerprint, deviceInfo)
      enrolledName.value = ''
      step.value = 'enrolled'
      // Ne pas continuer — rester sur l'écran de confirmation
      return
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
      errorMsg.value = msg || 'Erreur lors de l\'enrolement'
      step.value = 'enroll-error'
      return
    }
  }

  // Mode pointage normal : vérifier si cet appareil est enrôlé
  try {
    identity.value = await qrcodeApi.identifyDevice(fingerprint, deviceInfo)
    step.value = identity.value.enrolled ? 'ready' : 'identify'
  } catch {
    step.value = 'ready'
  }
})

async function requestGps(): Promise<{ lat: number; lng: number } | null> {
  if (!navigator.geolocation) {
    gpsStatus.value = 'unavailable'
    return null
  }
  gpsStatus.value = 'loading'
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        coords.value = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        gpsStatus.value = 'ok'
        resolve(coords.value)
      },
      () => {
        gpsStatus.value = 'denied'
        resolve(null)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  })
}

async function doScan() {
  if (!token.value.trim()) {
    errorMsg.value = 'Token manquant. Scannez le QR Code du site.'
    step.value = 'error'
    return
  }

  step.value = 'scanning'
  errorMsg.value = ''

  const position = await requestGps()

  try {
    result.value = await qrcodeApi.scan({
      token: token.value.trim(),
      deviceFingerprint: fingerprint,
      latitude: position?.lat,
      longitude: position?.lng,
    })
    step.value = 'result'
  } catch (e: unknown) {
    const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
    errorMsg.value = msg || 'Erreur lors du pointage'
    step.value = 'error'
  }
}

function reset() {
  step.value = 'ready'
  result.value = null
  errorMsg.value = ''
  gpsStatus.value = 'idle'
}
</script>

<template>
  <div class="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
    <div class="w-full max-w-sm space-y-4">
      <!-- En-tête -->
      <div class="text-center">
        <h1 class="text-2xl font-bold text-gray-900">Pointage QR Code</h1>
        <p class="mt-1 text-sm text-gray-500">Systeme de presence en ligne</p>
      </div>

      <!-- Étape : enrôlement en cours (soumission auto) -->
      <AppCard v-if="step === 'enrolling'" class="text-center">
        <div class="flex flex-col items-center gap-3 py-6">
          <div class="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-gray-700" />
          <p class="text-sm font-medium text-gray-700">Enrolement en cours...</p>
        </div>
      </AppCard>

      <!-- Étape : enrôlement réussi -->
      <AppCard v-else-if="step === 'enrolled'" class="border-green-200 bg-green-50">
        <div class="flex flex-col items-center gap-4 py-4 text-center">
          <div class="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg class="h-9 w-9 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h2 class="text-lg font-bold text-green-900">Telephone enrole</h2>
            <p class="mt-1 text-sm text-green-700">
              Votre telephone est maintenant associe a votre compte. Vous pouvez pointer via QR Code.
            </p>
          </div>
        </div>
      </AppCard>

      <!-- Étape : erreur enrôlement -->
      <AppCard v-else-if="step === 'enroll-error'" class="border-red-200 bg-red-50">
        <div class="flex flex-col items-center gap-4 py-4 text-center">
          <div class="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <svg class="h-9 w-9 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <div>
            <h2 class="text-lg font-bold text-red-900">Enrolement impossible</h2>
            <p class="mt-1 text-sm text-red-700">{{ errorMsg }}</p>
          </div>
        </div>
      </AppCard>

      <!-- Étape : appareil non enrôlé -->
      <AppCard v-else-if="step === 'identify'" class="border-yellow-200 bg-yellow-50">
        <h2 class="mb-2 font-semibold text-yellow-900">Telephone non reconnu</h2>
        <p class="mb-4 text-sm text-yellow-800">
          Cet appareil n'est pas encore enrole. Donnez l'identifiant ci-dessous a votre responsable pour qu'il enrole votre telephone.
        </p>
        <div class="rounded-lg bg-white p-3">
          <p class="mb-1 text-xs text-gray-500">Votre identifiant appareil :</p>
          <p class="font-mono text-sm font-bold text-gray-900 break-all">{{ fingerprint }}</p>
          <p class="mt-1 text-xs text-gray-400">{{ deviceInfo }}</p>
        </div>
        <AppButton variant="ghost" size="sm" class="mt-3 w-full" @click="step = 'ready'">
          Continuer quand meme
        </AppButton>
      </AppCard>

      <!-- Étape : prêt à pointer -->
      <AppCard v-else-if="step === 'ready'">
        <div v-if="identity?.enrolled" class="mb-4 rounded-lg bg-green-50 p-3">
          <p class="text-sm font-medium text-green-800">
            Bonjour, <strong>{{ identity.employeeName }}</strong>
          </p>
          <p class="text-xs text-green-600">Appareil reconnu</p>
        </div>

        <div class="space-y-3">
          <div v-if="token" class="rounded-lg bg-gray-50 p-3">
            <p class="text-xs text-gray-500">Site detecte depuis le QR :</p>
            <p class="font-mono text-xs text-gray-700 break-all">{{ token }}</p>
          </div>
          <div v-else class="space-y-2">
            <label class="block text-sm font-medium text-gray-700">Token QR Code</label>
            <input
              v-model="token"
              type="text"
              placeholder="Entrez le token manuellement..."
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <p class="text-xs text-gray-500">
            Votre position GPS sera verifiee au moment du pointage.
            Autorisez la localisation quand le navigateur vous le demande.
          </p>

          <AppButton variant="primary" class="w-full" @click="doScan">
            Pointer ma presence
          </AppButton>
        </div>
      </AppCard>

      <!-- Étape : scan en cours -->
      <AppCard v-else-if="step === 'scanning'" class="text-center">
        <div class="flex flex-col items-center gap-3 py-4">
          <div class="h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
          <p class="text-sm font-medium text-gray-700">
            <template v-if="gpsStatus === 'loading'">Verification de votre position GPS...</template>
            <template v-else>Enregistrement du pointage...</template>
          </p>
        </div>
      </AppCard>

      <!-- Étape : résultat -->
      <AppCard v-else-if="step === 'result' && result" class="border-green-200 bg-green-50">
        <div class="text-center">
          <div class="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
            <svg class="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 class="text-lg font-bold text-green-900">Pointage enregistre</h2>
          <p v-if="result.employeeName" class="mt-1 text-sm text-green-700">{{ result.employeeName }}</p>
        </div>

        <div class="mt-4 space-y-2 rounded-lg bg-white p-3">
          <div class="flex justify-between text-sm">
            <span class="text-gray-500">Date</span>
            <span class="font-medium">{{ result.date }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-gray-500">Entree</span>
            <span class="font-medium">{{ result.entryTime ?? '-' }}</span>
          </div>
          <div v-if="result.exitTime" class="flex justify-between text-sm">
            <span class="text-gray-500">Sortie</span>
            <span class="font-medium">{{ result.exitTime }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-gray-500">Statut</span>
            <AppBadge :variant="statusVariant[result.status] ?? 'neutral'">
              {{ statusLabel[result.status] ?? result.status }}
            </AppBadge>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-gray-500">GPS verifie</span>
            <AppBadge :variant="result.gpsVerified ? 'success' : 'warning'">
              {{ result.gpsVerified ? `Oui (${result.distanceMeters}m)` : 'Non verifie' }}
            </AppBadge>
          </div>
        </div>

        <AppButton variant="ghost" class="mt-4 w-full" @click="reset">
          Nouveau pointage
        </AppButton>
      </AppCard>

      <!-- Étape : erreur -->
      <AppCard v-else-if="step === 'error'" class="border-red-200 bg-red-50">
        <div class="text-center">
          <div class="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
            <svg class="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 class="text-lg font-bold text-red-900">Pointage refuse</h2>
          <p class="mt-2 text-sm text-red-700">{{ errorMsg }}</p>
        </div>
        <AppButton variant="ghost" class="mt-4 w-full" @click="reset">
          Reessayer
        </AppButton>
      </AppCard>

      <!-- Fingerprint affiché en bas pour l'enrôlement -->
      <p class="text-center font-mono text-xs text-gray-300">
        ID: {{ fingerprint }}
      </p>
    </div>
  </div>
</template>
