import { useUiStore } from '@/stores/ui.store'

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

  // Aliases for compatibility with showSuccess/showError pattern
  const showSuccess = success
  const showError = error
  const showWarning = warning
  const showInfo = info

  return { success, error, warning, info, showSuccess, showError, showWarning, showInfo }
}
