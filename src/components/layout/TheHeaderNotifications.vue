<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { BellIcon, CheckIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import { onClickOutside } from '@vueuse/core'
import { useNotificationStore } from '@/stores/notification.store'
import type { AppNotification } from '@/stores/notification.store'
import dayjs from 'dayjs'

const notificationStore = useNotificationStore()
const isOpen = ref(false)
const panelRef = ref<HTMLElement | null>(null)

onClickOutside(panelRef, () => {
  isOpen.value = false
})

onMounted(() => {
  notificationStore.fetchNotifications()
})

function formatTimeAgo(dateStr: string): string {
  const now = dayjs()
  const date = dayjs(dateStr)
  const diffSec = now.diff(date, 'second')

  if (diffSec < 60) return 'A l\'instant'
  const diffMin = now.diff(date, 'minute')
  if (diffMin < 60) return `Il y a ${diffMin} min`
  const diffHour = now.diff(date, 'hour')
  if (diffHour < 24) return `Il y a ${diffHour}h`
  const diffDay = now.diff(date, 'day')
  if (diffDay < 7) return `Il y a ${diffDay}j`
  return date.format('DD/MM/YYYY')
}

function getTypeColor(notification: AppNotification): string {
  if (notification.type === 'feelback') return 'bg-amber-500'
  if (notification.type === 'attendance') return 'bg-primary-500'
  return 'bg-gray-500'
}

function getFlashAccent(notification: AppNotification): string {
  if (notification.type === 'feelback') return 'border-amber-400'
  if (notification.type === 'attendance') return 'border-primary-400'
  return 'border-gray-400'
}
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="opacity-0 translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-all duration-500 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-2"
    >
      <div
        v-if="notificationStore.flashNotification"
        class="fixed bottom-6 right-6 z-9999 w-80 rounded-lg border-l-4 bg-white shadow-xl"
        :class="getFlashAccent(notificationStore.flashNotification)"
        @mouseenter="notificationStore.dismissFlash()"
      >
        <div class="flex items-start gap-3 px-4 py-3">
          <span
            class="mt-1 h-2 w-2 shrink-0 rounded-full"
            :class="getTypeColor(notificationStore.flashNotification)"
          />
          <div class="min-w-0 flex-1">
            <p class="text-sm font-semibold text-gray-800">{{ notificationStore.flashNotification.title }}</p>
            <p class="mt-0.5 text-sm text-gray-600">{{ notificationStore.flashNotification.message }}</p>
          </div>
          <button
            type="button"
            class="shrink-0 text-gray-400 hover:text-gray-600"
            @click="notificationStore.dismissFlash()"
          >
            <XMarkIcon class="h-4 w-4" />
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>

  <div ref="panelRef" class="relative">
    <button
      type="button"
      class="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
      @click="isOpen = !isOpen"
    >
      <BellIcon class="h-5 w-5" />
      <span
        v-if="notificationStore.unreadCount > 0"
        class="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-danger-500 text-[10px] font-bold text-white"
      >
        {{ notificationStore.unreadCount > 9 ? '9+' : notificationStore.unreadCount }}
      </span>
    </button>

    <div
      v-if="isOpen"
      class="absolute right-0 top-full z-50 mt-1 w-96 rounded-lg border border-gray-200 bg-white shadow-lg"
    >
      <div class="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <h3 class="text-sm font-semibold text-gray-800">
          Notifications
          <span
            v-if="notificationStore.unreadCount > 0"
            class="ml-1.5 inline-flex items-center rounded-full bg-danger-50 px-2 py-0.5 text-xs font-medium text-danger-700"
          >
            {{ notificationStore.unreadCount }}
          </span>
        </h3>
        <button
          v-if="notificationStore.unreadCount > 0"
          type="button"
          class="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700"
          @click="notificationStore.markAllAsRead()"
        >
          <CheckIcon class="h-3.5 w-3.5" />
          Tout marquer comme lu
        </button>
      </div>

      <div class="max-h-80 overflow-y-auto">
        <p
          v-if="notificationStore.notifications.length === 0"
          class="px-4 py-8 text-center text-sm text-gray-500"
        >
          Aucune notification
        </p>

        <button
          v-for="notification in notificationStore.notifications"
          :key="notification.id"
          type="button"
          class="flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50"
          :class="{ 'bg-primary-50/50': !notification.isRead }"
          @click="notificationStore.markAsRead(notification.id)"
        >
          <span
            class="mt-1.5 h-2 w-2 shrink-0 rounded-full"
            :class="notification.isRead ? 'bg-transparent' : getTypeColor(notification)"
          />
          <div class="min-w-0 flex-1">
            <p class="text-sm font-medium text-gray-800 truncate">
              {{ notification.title }}
            </p>
            <p class="text-sm text-gray-600 truncate">
              {{ notification.message }}
            </p>
            <p class="mt-0.5 text-xs text-gray-400">
              {{ formatTimeAgo(notification.createdAt) }}
            </p>
          </div>
        </button>
      </div>
    </div>
  </div>
</template>
