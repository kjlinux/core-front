import { ref, computed } from 'vue'
import dayjs from 'dayjs'

export function useDateRange() {
  const startDate = ref(dayjs().startOf('month').format('YYYY-MM-DD'))
  const endDate = ref(dayjs().endOf('month').format('YYYY-MM-DD'))

  // Objet réactif compatible avec les pages qui utilisent dateRange.value.startDate
  const dateRange = computed(() => ({
    startDate: startDate.value,
    endDate: endDate.value,
  }))

  const formattedRange = computed(() => {
    return `${dayjs(startDate.value).format('DD/MM/YYYY')} - ${dayjs(endDate.value).format('DD/MM/YYYY')}`
  })

  function setToday() {
    const today = dayjs().format('YYYY-MM-DD')
    startDate.value = today
    endDate.value = today
  }

  function setThisWeek() {
    startDate.value = dayjs().startOf('week').format('YYYY-MM-DD')
    endDate.value = dayjs().endOf('week').format('YYYY-MM-DD')
  }

  function setThisMonth() {
    startDate.value = dayjs().startOf('month').format('YYYY-MM-DD')
    endDate.value = dayjs().endOf('month').format('YYYY-MM-DD')
  }

  function setLastMonth() {
    startDate.value = dayjs().subtract(1, 'month').startOf('month').format('YYYY-MM-DD')
    endDate.value = dayjs().subtract(1, 'month').endOf('month').format('YYYY-MM-DD')
  }

  // Alias utilisé par AttendanceByEmployeePage et AttendanceByDepartmentPage
  const setCurrentMonth = setThisMonth

  return {
    startDate,
    endDate,
    dateRange,
    formattedRange,
    setToday,
    setThisWeek,
    setThisMonth,
    setLastMonth,
    setCurrentMonth,
  }
}
