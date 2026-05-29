<script setup lang="ts">
import { computed } from 'vue'
import type { SegmentEvaluation } from '@/types/attendance'
import AppBadge from '@/components/ui/AppBadge.vue'
import { shiftKindLabel, segmentStatusLabel } from '@/utils/schedule'

// Type structurel minimal : accepte tout enregistrement de pointage (RFID, QR,
// biometrique) tant qu'il porte les champs d'evaluation.
interface AttendanceLike {
  status: string
  segments?: SegmentEvaluation[]
  isOnLeave?: boolean
}

const props = defineProps<{
  record: AttendanceLike
}>()

type Variant = 'success' | 'warning' | 'danger' | 'info' | 'neutral'

const segments = computed<SegmentEvaluation[]>(() => props.record.segments ?? [])

const globalStatus = computed<string>(() => {
  if (props.record.isOnLeave) return 'on_leave'
  const segs = segments.value
  if (segs.length === 0) return props.record.status
  if (segs.every((s) => s.status === 'not_scheduled')) return 'not_scheduled'
  const active = segs.filter((s) => s.status !== 'not_scheduled')
  if (active.length === 0) return 'not_scheduled'
  if (active.every((s) => s.status === 'on_leave')) return 'on_leave'
  if (active.every((s) => s.status === 'complete')) return 'complete'
  if (active.some((s) => s.status === 'absent')) return 'partial'
  if (active.some((s) => s.status === 'late')) return 'late'
  if (active.some((s) => s.status === 'partial')) return 'partial'
  return 'complete'
})

const statusVariant = (status: string): Variant => {
  const map: Record<string, Variant> = {
    complete: 'success',
    present: 'success',
    partial: 'warning',
    late: 'warning',
    absent: 'danger',
    on_leave: 'info',
    not_scheduled: 'neutral',
  }
  return map[status] ?? 'neutral'
}

const punchVariant = (status: string): Variant => {
  const map: Record<string, Variant> = {
    on_time: 'success',
    late: 'warning',
    missing: 'danger',
  }
  return map[status] ?? 'neutral'
}
</script>

<template>
  <div class="space-y-2">
    <AppBadge :variant="statusVariant(globalStatus)" size="sm">
      {{ segmentStatusLabel(globalStatus) }}
    </AppBadge>

    <div v-if="segments.length" class="space-y-1">
      <div
        v-for="(seg, idx) in segments"
        :key="idx"
        class="flex flex-wrap items-center gap-1.5"
      >
        <span class="text-xs font-medium text-gray-600">
          {{ shiftKindLabel(seg.kind) }}
        </span>
        <span class="text-xs text-gray-400">{{ seg.startTime }}-{{ seg.endTime }}</span>
        <AppBadge
          v-for="(punch, pIdx) in seg.punches"
          :key="pIdx"
          :variant="punchVariant(punch.status)"
          size="sm"
          :title="punch.actualTime ? `Pointe a ${punch.actualTime}` : 'Non pointe'"
        >
          {{ punch.expectedTime }}
          <template v-if="punch.status === 'late'"> (+{{ punch.lateMinutes }} min)</template>
          <template v-else-if="punch.status === 'missing'"> (manque)</template>
        </AppBadge>
      </div>
    </div>
  </div>
</template>
