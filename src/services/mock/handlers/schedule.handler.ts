import type MockAdapter from 'axios-mock-adapter'

const mockSchedules = [
  {
    id: 'sch-1',
    name: 'Horaire standard',
    type: 'standard',
    startTime: '08:00',
    endTime: '17:00',
    breakStart: '12:00',
    breakEnd: '13:00',
    workDays: [1, 2, 3, 4, 5],
    lateTolerance: 15,
    assignedDepartments: ['dept-1', 'dept-2'],
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'sch-2',
    name: 'Horaire matinal',
    type: 'custom',
    startTime: '06:00',
    endTime: '14:00',
    breakStart: '10:00',
    breakEnd: '10:30',
    workDays: [1, 2, 3, 4, 5, 6],
    lateTolerance: 10,
    assignedDepartments: ['dept-3'],
    createdAt: '2024-02-01T00:00:00.000Z',
    updatedAt: '2024-02-01T00:00:00.000Z',
  },
  {
    id: 'sch-3',
    name: 'Horaire du soir',
    type: 'custom',
    startTime: '14:00',
    endTime: '22:00',
    breakStart: '18:00',
    breakEnd: '18:30',
    workDays: [1, 2, 3, 4, 5],
    lateTolerance: 15,
    assignedDepartments: [],
    createdAt: '2024-03-01T00:00:00.000Z',
    updatedAt: '2024-03-01T00:00:00.000Z',
  },
]

const mockHolidays = [
  {
    id: 'hol-1',
    name: 'Jour de l\'an',
    date: '2026-01-01',
    isRecurring: true,
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'hol-2',
    name: 'Fete du Travail',
    date: '2026-05-01',
    isRecurring: true,
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'hol-3',
    name: 'Fete Nationale',
    date: '2026-08-05',
    isRecurring: true,
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'hol-4',
    name: 'Noel',
    date: '2026-12-25',
    isRecurring: true,
    createdAt: '2024-01-01T00:00:00.000Z',
  },
]

let schedules = [...mockSchedules]
let holidays = [...mockHolidays]

export function setupScheduleHandlers(mock: MockAdapter) {
  // GET all schedules
  mock.onGet('/schedules').reply(200, {
    data: schedules,
    meta: { total: schedules.length, currentPage: 1, perPage: 20, totalPages: 1 },
    success: true,
  })

  // GET schedule by ID
  mock.onGet(/\/schedules\/[^/]+/).reply((config) => {
    const id = config.url?.split('/schedules/')[1]
    const schedule = schedules.find((s) => s.id === id)
    if (!schedule) return [404, { success: false, message: 'Horaire non trouve' }]
    return [200, { data: schedule, success: true }]
  })

  // POST create schedule
  mock.onPost('/schedules').reply((config) => {
    const body = JSON.parse(config.data)
    const newSchedule = {
      ...body,
      id: `sch-${Date.now()}`,
      assignedDepartments: body.assignedDepartments ?? [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    schedules.push(newSchedule)
    return [201, { data: newSchedule, success: true }]
  })

  // PUT update schedule
  mock.onPut(/\/schedules\/[^/]+/).reply((config) => {
    const id = config.url?.split('/schedules/')[1]
    const body = JSON.parse(config.data)
    const index = schedules.findIndex((s) => s.id === id)
    if (index === -1) return [404, { success: false, message: 'Horaire non trouve' }]
    schedules[index] = { ...schedules[index], ...body, updatedAt: new Date().toISOString() }
    return [200, { data: schedules[index], success: true }]
  })

  // DELETE schedule
  mock.onDelete(/\/schedules\/[^/]+/).reply((config) => {
    const id = config.url?.split('/schedules/')[1]
    schedules = schedules.filter((s) => s.id !== id)
    return [200, { success: true }]
  })

  // GET all holidays
  mock.onGet('/holidays').reply(200, {
    data: holidays,
    meta: { total: holidays.length, currentPage: 1, perPage: 20, totalPages: 1 },
    success: true,
  })

  // POST create holiday
  mock.onPost('/holidays').reply((config) => {
    const body = JSON.parse(config.data)
    const newHoliday = {
      ...body,
      id: `hol-${Date.now()}`,
      createdAt: new Date().toISOString(),
    }
    holidays.push(newHoliday)
    return [201, { data: newHoliday, success: true }]
  })

  // PUT update holiday
  mock.onPut(/\/holidays\/[^/]+/).reply((config) => {
    const id = config.url?.split('/holidays/')[1]
    const body = JSON.parse(config.data)
    const index = holidays.findIndex((h) => h.id === id)
    if (index === -1) return [404, { success: false, message: 'Jour ferie non trouve' }]
    holidays[index] = { ...holidays[index], ...body }
    return [200, { data: holidays[index], success: true }]
  })

  // DELETE holiday
  mock.onDelete(/\/holidays\/[^/]+/).reply((config) => {
    const id = config.url?.split('/holidays/')[1]
    holidays = holidays.filter((h) => h.id !== id)
    return [200, { success: true }]
  })
}
