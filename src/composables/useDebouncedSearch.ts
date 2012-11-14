import { ref, watch } from 'vue'
import { useDebounceFn } from '@vueuse/core'

export function useDebouncedSearch(callback: (value: string) => void, delay = 300) {
  const searchQuery = ref('')

  const debouncedCallback = useDebounceFn((value: string) => {
    callback(value)
  }, delay)

  watch(searchQuery, (value) => {
    debouncedCallback(value)
  })

  function clear() {
    searchQuery.value = ''
    callback('')
  }

  return { searchQuery, clear }
}
