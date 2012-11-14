import { useUiStore } from '@/stores/ui.store'
import type { ToastMessage } from '@/types/common'

export function useToast() {
  const ui = useUiStore()

  function success(title: string, message?: string) {
    ui.addToast({ type: 'success', title, message })
  }

  function error(title: string, message?: string) {
    ui.addToast({ type: 'error', title, message, duration: 8000 })
  }

  function warning(title: string, message?: string) {
    ui.addToast({ type: 'warning', title, message })
  }

  function info(title: string, message?: string) {
    ui.addToast({ type: 'info', title, message })
  }

  return { success, error, warning, info }
}
