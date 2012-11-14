import { ref, computed } from 'vue'

export function usePagination(defaultPerPage = 10) {
  const currentPage = ref(1)
  const perPage = ref(defaultPerPage)
  const total = ref(0)

  const totalPages = computed(() => Math.ceil(total.value / perPage.value))
  const offset = computed(() => (currentPage.value - 1) * perPage.value)

  function setPage(page: number) {
    currentPage.value = page
  }

  function setPerPage(value: number) {
    perPage.value = value
    currentPage.value = 1
  }

  function setTotal(value: number) {
    total.value = value
  }

  function reset() {
    currentPage.value = 1
    total.value = 0
  }

  return {
    currentPage,
    perPage,
    total,
    totalPages,
    offset,
    setPage,
    setPerPage,
    setTotal,
    reset,
  }
}
