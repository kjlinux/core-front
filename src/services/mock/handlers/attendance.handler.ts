import type MockAdapter from 'axios-mock-adapter'

const mockRecords = [
  { id: 'rec-1', employeeId: 'emp-1', employeeName: 'Kofi Mensah', time: '08:05', status: 'entry', type: 'present' },
  { id: 'rec-2', employeeId: 'emp-2', employeeName: 'Ama Owusu', time: '08:22', status: 'entry', type: 'late' },
  { id: 'rec-3', employeeId: 'emp-3', employeeName: 'Kwame Asante', time: '08:01', status: 'entry', type: 'present' },
  { id: 'rec-4', employeeId: 'emp-4', employeeName: 'Akua Boateng', time: '09:15', status: 'entry', type: 'late' },
  { id: 'rec-5', employeeId: 'emp-5', employeeName: 'Yaw Darko', time: '08:00', status: 'entry', type: 'present' },
]

export function setupAttendanceHandlers(mock: MockAdapter) {
  mock.onGet('/attendance/daily').reply(200, {
    data: {
      date: new Date().toISOString().split('T')[0],
      totalEmployees: 45,
      present: 38,
      absent: 5,
      late: 2,
      averageEntryTime: '08:12',
      earlyDepartures: 1,
      records: mockRecords,
    },
    success: true,
  })

  mock.onGet('/attendance/monthly').reply(200, { data: [], success: true })
  mock.onGet(/\/attendance\/employee\/[^/]+/).reply(200, { data: [], success: true })
  mock.onGet(/\/attendance\/department\/[^/]+/).reply(200, { data: [], success: true })
  mock.onGet('/attendance/summary').reply(200, { data: [], success: true })
}
