import type MockAdapter from 'axios-mock-adapter'

// Fenêtre anti-double badge en minutes (même employé, même direction)
const DOUBLE_BADGE_WINDOW_MINUTES = 5

interface RawBadgeEvent {
  employeeId: string
  employeeName: string
  department: string
  time: string // HH:MM
  direction: 'entry' | 'exit'
  source: 'rfid' | 'biometric'
  scheduleStart: string // HH:MM
  scheduleEnd: string   // HH:MM
  lateTolerance: number // minutes
}

// Événements bruts du jour — certains contiennent des doublons volontaires
const rawBadgeEvents: RawBadgeEvent[] = [
  // Kofi : entrée normale RFID
  { employeeId: 'emp-1', employeeName: 'Kofi Mensah',     department: 'IT',        time: '07:58', direction: 'entry', source: 'rfid',      scheduleStart: '08:00', scheduleEnd: '17:00', lateTolerance: 15 },
  // Double badge RFID dans la foulée → doit être ignoré
  { employeeId: 'emp-1', employeeName: 'Kofi Mensah',     department: 'IT',        time: '08:02', direction: 'entry', source: 'rfid',      scheduleStart: '08:00', scheduleEnd: '17:00', lateTolerance: 15 },
  { employeeId: 'emp-1', employeeName: 'Kofi Mensah',     department: 'IT',        time: '17:05', direction: 'exit',  source: 'rfid',      scheduleStart: '08:00', scheduleEnd: '17:00', lateTolerance: 15 },

  // Ama : en retard, biométrique
  { employeeId: 'emp-2', employeeName: 'Ama Owusu',       department: 'RH',        time: '08:22', direction: 'entry', source: 'biometric', scheduleStart: '08:00', scheduleEnd: '17:00', lateTolerance: 15 },
  // Double badge biométrique (3 scans rapides) → seul le premier compte
  { employeeId: 'emp-2', employeeName: 'Ama Owusu',       department: 'RH',        time: '08:23', direction: 'entry', source: 'biometric', scheduleStart: '08:00', scheduleEnd: '17:00', lateTolerance: 15 },
  { employeeId: 'emp-2', employeeName: 'Ama Owusu',       department: 'RH',        time: '08:24', direction: 'entry', source: 'biometric', scheduleStart: '08:00', scheduleEnd: '17:00', lateTolerance: 15 },
  { employeeId: 'emp-2', employeeName: 'Ama Owusu',       department: 'RH',        time: '16:45', direction: 'exit',  source: 'biometric', scheduleStart: '08:00', scheduleEnd: '17:00', lateTolerance: 15 },

  // Kwame : ponctuel, RFID
  { employeeId: 'emp-3', employeeName: 'Kwame Asante',    department: 'Finance',   time: '08:01', direction: 'entry', source: 'rfid',      scheduleStart: '08:00', scheduleEnd: '17:00', lateTolerance: 15 },
  { employeeId: 'emp-3', employeeName: 'Kwame Asante',    department: 'Finance',   time: '17:02', direction: 'exit',  source: 'rfid',      scheduleStart: '08:00', scheduleEnd: '17:00', lateTolerance: 15 },

  // Akua : très en retard, biométrique
  { employeeId: 'emp-4', employeeName: 'Akua Boateng',    department: 'Commercial',time: '09:15', direction: 'entry', source: 'biometric', scheduleStart: '08:00', scheduleEnd: '17:00', lateTolerance: 15 },
  { employeeId: 'emp-4', employeeName: 'Akua Boateng',    department: 'Commercial',time: '17:00', direction: 'exit',  source: 'biometric', scheduleStart: '08:00', scheduleEnd: '17:00', lateTolerance: 15 },

  // Yaw : ponctuel, RFID, départ anticipé
  { employeeId: 'emp-5', employeeName: 'Yaw Darko',       department: 'IT',        time: '08:00', direction: 'entry', source: 'rfid',      scheduleStart: '08:00', scheduleEnd: '17:00', lateTolerance: 15 },
  { employeeId: 'emp-5', employeeName: 'Yaw Darko',       department: 'IT',        time: '15:30', direction: 'exit',  source: 'rfid',      scheduleStart: '08:00', scheduleEnd: '17:00', lateTolerance: 15 },

  // Efua : matin décalé, biométrique
  { employeeId: 'emp-6', employeeName: 'Efua Acheampong', department: 'RH',        time: '06:02', direction: 'entry', source: 'biometric', scheduleStart: '06:00', scheduleEnd: '14:00', lateTolerance: 10 },
  { employeeId: 'emp-6', employeeName: 'Efua Acheampong', department: 'RH',        time: '14:05', direction: 'exit',  source: 'biometric', scheduleStart: '06:00', scheduleEnd: '14:00', lateTolerance: 10 },

  // Ibrahim : absent (pas de badge ce jour)
  // emp-7 absent intentionnellement
]

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60).toString().padStart(2, '0')
  const m = (mins % 60).toString().padStart(2, '0')
  return `${h}:${m}`
}

interface ProcessedRecord {
  id: string
  employeeId: string
  employeeName: string
  department: string
  date: string
  entryTime: string | null
  exitTime: string | null
  status: 'present' | 'absent' | 'late' | 'left_early'
  lateMinutes: number
  earlyDepartureMinutes: number
  source: 'rfid' | 'biometric'
  isDoubleBadge: boolean
  ignoredBadges: number
  notes: string
}

function buildDailyRecords(date: string): ProcessedRecord[] {
  // Grouper par employé
  const byEmployee: Record<string, RawBadgeEvent[]> = {}
  for (const evt of rawBadgeEvents) {
    if (!byEmployee[evt.employeeId]) byEmployee[evt.employeeId] = []
    byEmployee[evt.employeeId].push(evt)
  }

  const records: ProcessedRecord[] = []

  for (const [empId, events] of Object.entries(byEmployee)) {
    // Traitement anti-double badge : pour chaque direction, garder le premier
    // et ignorer tout badge arrivant dans la fenêtre DOUBLE_BADGE_WINDOW_MINUTES suivante
    const accepted: RawBadgeEvent[] = []
    const lastAccepted: Record<string, number> = {} // direction → time en minutes

    let ignoredCount = 0

    for (const evt of events) {
      const evtMins = timeToMinutes(evt.time)
      const key = evt.direction
      const lastTime = lastAccepted[key]

      if (lastTime !== undefined && evtMins - lastTime <= DOUBLE_BADGE_WINDOW_MINUTES) {
        // Double badge détecté → ignorer
        ignoredCount++
        continue
      }

      accepted.push(evt)
      lastAccepted[key] = evtMins
    }

    const entryEvt = accepted.find(e => e.direction === 'entry')
    const exitEvt  = accepted.find(e => e.direction === 'exit')

    if (!entryEvt) continue // pas de badge d'entrée accepté (ne devrait pas arriver ici)

    const { scheduleStart, scheduleEnd, lateTolerance } = entryEvt
    const scheduleStartMins = timeToMinutes(scheduleStart)
    const scheduleEndMins   = timeToMinutes(scheduleEnd)
    const entryMins         = timeToMinutes(entryEvt.time)
    const exitMins          = exitEvt ? timeToMinutes(exitEvt.time) : null

    // Calcul retard
    const lateMinutes = Math.max(0, entryMins - (scheduleStartMins + lateTolerance))

    // Calcul départ anticipé (> 15 min avant la fin)
    const earlyDepartureMinutes = exitMins !== null
      ? Math.max(0, scheduleEndMins - exitMins - 15)
      : 0

    let status: ProcessedRecord['status'] = 'present'
    if (lateMinutes > 0) status = 'late'
    if (earlyDepartureMinutes > 0 && status === 'present') status = 'left_early'

    const notes: string[] = []
    if (ignoredCount > 0) notes.push(`${ignoredCount} badge(s) ignoré(s) (double badge)`)
    if (earlyDepartureMinutes > 0) notes.push(`Départ anticipé de ${earlyDepartureMinutes} min`)

    records.push({
      id: `rec-${empId}`,
      employeeId: empId,
      employeeName: entryEvt.employeeName,
      department: entryEvt.department,
      date,
      entryTime: entryEvt.time,
      exitTime: exitEvt?.time ?? null,
      status,
      lateMinutes,
      earlyDepartureMinutes,
      source: entryEvt.source,
      isDoubleBadge: ignoredCount > 0,
      ignoredBadges: ignoredCount,
      notes: notes.join(' | '),
    })
  }

  // Ajouter l'absent (emp-7 — pas de badge)
  records.push({
    id: 'rec-emp-7',
    employeeId: 'emp-7',
    employeeName: 'Ibrahim Sawadogo',
    department: 'Finance',
    date,
    entryTime: null,
    exitTime: null,
    status: 'absent',
    lateMinutes: 0,
    earlyDepartureMinutes: 0,
    source: 'rfid',
    isDoubleBadge: false,
    ignoredBadges: 0,
    notes: 'Absence non justifiée',
  })

  return records
}

function buildDailyStats(records: ProcessedRecord[]) {
  const totalEmployees = 7 // total théorique
  const present = records.filter(r => r.status === 'present').length
  const absent  = records.filter(r => r.status === 'absent').length
  const late    = records.filter(r => r.status === 'late').length
  const leftEarly = records.filter(r => r.status === 'left_early').length

  const entryTimes = records.filter(r => r.entryTime).map(r => timeToMinutes(r.entryTime!))
  const avgEntry = entryTimes.length
    ? minutesToTime(Math.round(entryTimes.reduce((a, b) => a + b, 0) / entryTimes.length))
    : '00:00'

  return {
    totalEmployees,
    present,
    absent,
    late,
    earlyDepartures: leftEarly,
    averageEntryTime: avgEntry,
    doubleBadgeCount: records.filter(r => r.isDoubleBadge).length,
  }
}

export function setupAttendanceHandlers(mock: MockAdapter) {
  mock.onGet('/attendance/daily').reply((config) => {
    const date = (config.params?.date as string) || new Date().toISOString().split('T')[0]
    const records = buildDailyRecords(date)
    const stats   = buildDailyStats(records)

    // Filtrage optionnel par source (rfid ou biometric)
    const sourceFilter = config.params?.source as string | undefined
    const filtered = sourceFilter
      ? records.filter(r => r.source === sourceFilter || r.status === 'absent')
      : records

    return [200, {
      data: {
        ...stats,
        date,
        records: filtered,
      },
      success: true,
    }]
  })

  mock.onGet('/attendance/monthly').reply(200, { data: [], success: true })
  mock.onGet(/\/attendance\/employee\/[^/]+/).reply(200, { data: [], success: true })
  mock.onGet(/\/attendance\/department\/[^/]+/).reply(200, { data: [], success: true })
  mock.onGet('/attendance/summary').reply(200, { data: [], success: true })

  // Endpoint dédié biométrique : pointe uniquement les records source=biometric
  mock.onGet('/attendance/biometric').reply((config) => {
    const date = (config.params?.date as string) || new Date().toISOString().split('T')[0]
    const records = buildDailyRecords(date)
    const bioRecords = records.filter(r => r.source === 'biometric')
    const stats = buildDailyStats(bioRecords)

    return [200, {
      data: {
        ...stats,
        totalEmployees: bioRecords.length,
        date,
        records: bioRecords,
      },
      success: true,
    }]
  })
}
