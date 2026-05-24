import { ref, watch, onScopeDispose, getCurrentScope } from 'vue'
import { useDebounceFn } from '@vueuse/core'

export function useDebouncedSearch(callback: (value: string) => void, delay = 300) {
  const searchQuery = ref('')

  const debouncedCallback = useDebounceFn((value: string) => {
    callback(value)
  }, delay)

  const stop = watch(searchQuery, (value) => {
    debouncedCallback(value)
  })

  // Si appele dans un setup() / composable, on stoppe le watch au demontage.
  if (getCurrentScope()) {
    onScopeDispose(stop)
  }

  function clear() {
    searchQuery.value = ''
    callback('')
  }

  return { searchQuery, clear, stop }
}
