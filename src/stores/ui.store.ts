import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { ToastMessage } from '@/types'

export const useUiStore = defineStore('ui', () => {
  const sidebarCollapsed = ref(false)
  const sidebarMobileOpen = ref(false)
  const toasts = ref<ToastMessage[]>([])

  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  function openMobileSidebar() {
    sidebarMobileOpen.value = true
  }

  function closeMobileSidebar() {
    sidebarMobileOpen.value = false
  }

  function addToast(toast: Omit<ToastMessage, 'id'>) {
    const id = Date.now().toString()
    const newToast: ToastMessage = { ...toast, id }
    toasts.value.push(newToast)

    const duration = toast.duration || 5000
    setTimeout(() => {
      removeToast(id)
    }, duration)
  }

  function removeToast(id: string) {
    const index = toasts.value.findIndex((t) => t.id === id)
    if (index !== -1) {
      toasts.value.splice(index, 1)
    }
  }

  return { sidebarCollapsed, sidebarMobileOpen, toasts, toggleSidebar, openMobileSidebar, closeMobileSidebar, addToast, removeToast }
})
