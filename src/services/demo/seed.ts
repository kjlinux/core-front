// @ts-nocheck -- Fichier de données factices : construction statique, indices toujours valides.
/**
 * Données factices du mode démo.
 *
 * Tout est généré ici, en mémoire, côté frontend. Aucune donnée n'est envoyée
 * ni persistée en base : le mode démo sert à laisser un prospect manipuler
 * l'application (ajout / modification / suppression) avec un jeu de données
 * réaliste qui se réinitialise à volonté.
 */

export const DEMO_COMPANY_ID = 'demo-co-1'
export const DEMO_COMPANY_NAME = 'Société Démo TangaFlow'

/** PRNG déterministe (mulberry32) pour un jeu de données stable entre deux seeds. */
function mulberry32(seed: number) {
  let a = seed
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const FIRST_NAMES = [
  'Awa', 'Issa', 'Fatou', 'Moussa', 'Aicha', 'Ibrahim', 'Mariam', 'Boureima',
  'Salimata', 'Adama', 'Rasmane', 'Bintou', 'Yacouba', 'Safiatou', 'Oumarou',
  'Korotimi', 'Hamidou', 'Nafissatou', 'Souleymane', 'Djeneba', 'Karim',
  'Habibou', 'Seydou', 'Ramata', 'Alassane', 'Aminata', 'Drissa', 'Kadiatou',
]
const LAST_NAMES = [
  'Ouedraogo', 'Sawadogo', 'Traore', 'Compaore', 'Kabore', 'Zongo', 'Nikiema',
  'Sankara', 'Konate', 'Bamogo', 'Ouattara', 'Diallo', 'Sory', 'Tapsoba',
  'Yameogo', 'Coulibaly', 'Bationo', 'Kafando', 'Ilboudo', 'Dabre', 'Nana',
  'Belem', 'Gnoumou', 'Sebgo',
]
const POSITIONS = [
  'Agent de production', 'Superviseur', 'Comptable', 'Technicien',
  'Agent de securite', 'Responsable RH', 'Magasinier', 'Charge clientele',
  'Chauffeur', 'Assistant administratif', 'Commercial', 'Agent de maintenance',
]

function pad(n: number, len = 3): string {
  return String(n).padStart(len, '0')
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function daysAgo(n: number): Date {
  const d = new Date()
  d.setHours(12, 0, 0, 0)
  d.setDate(d.getDate() - n)
  return d
}

function timeStr(h: number, m: number): string {
  return `${pad(h, 2)}:${pad(m, 2)}`
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Dict = Record<string, any>

export interface DemoDb {
  companies: Dict[]
  sites: Dict[]
  departments: Dict[]
  employees: Dict[]
  users: Dict[]
  schedules: Dict[]
  holidays: Dict[]
  absenceRequests: Dict[]
  cards: Dict[]
  cardHistory: Dict[]
  rfidDevices: Dict[]
  biometricDevices: Dict[]
  enrollments: Dict[]
  qrCodes: Dict[]
  qrAttendance: Dict[]
  feelbackDevices: Dict[]
  feelbackEntries: Dict[]
  feelbackAlerts: Dict[]
  firmwareVersions: Dict[]
  otaLogs: Dict[]
  products: Dict[]
  orders: Dict[]
  payslips: Dict[]
  payrollConfig: Dict
  followups: Dict[]
  supportDevices: Dict[]
  supportAlerts: Dict[]
  subscriptionState: Dict
  subscriptionPlans: Dict[]
  subscriptionPayments: Dict[]
  subscriptionEvents: Dict[]
  menuBadgesSeen: Record<string, boolean>
}

export function buildSeedDb(): DemoDb {
  const rng = mulberry32(20240607)
  const pick = <T>(arr: T[]): T => arr[Math.floor(rng() * arr.length)]
  const cid = DEMO_COMPANY_ID
  const cname = DEMO_COMPANY_NAME

  // --- Sites & départements ---
  const siteDefs = [
    { id: 'site-1', name: 'Siege Ouagadougou', address: 'Avenue Kwame Nkrumah, Ouagadougou', lat: 12.3686, lng: -1.5275 },
    { id: 'site-2', name: 'Agence Bobo-Dioulasso', address: 'Rue de la Liberte, Bobo-Dioulasso', lat: 11.1771, lng: -4.2979 },
    { id: 'site-3', name: 'Entrepot Koudougou', address: 'Zone industrielle, Koudougou', lat: 12.2526, lng: -2.3623 },
  ]
  const deptNames = ['Production', 'Administration', 'Logistique', 'Securite', 'Commercial', 'Maintenance']

  const departments: Dict[] = []
  const sites: Dict[] = siteDefs.map((s, si) => {
    const siteDepts = (si === 0 ? deptNames : deptNames.slice(0, 3)).map((dn, di) => {
      const dep: Dict = {
        id: `dep-${si + 1}-${di + 1}`,
        siteId: s.id,
        companyId: cid,
        name: dn,
        managerId: undefined,
        employeeCount: 0,
      }
      departments.push(dep)
      return dep
    })
    return {
      id: s.id,
      companyId: cid,
      name: s.name,
      address: s.address,
      latitude: s.lat,
      longitude: s.lng,
      geofenceRadius: 150,
      departments: siteDepts,
    }
  })

  // --- Horaires ---
  const dayMorning = (lateTol: number) => ({
    kind: 'morning',
    startTime: '07:30',
    endTime: '12:30',
    expectedPunches: [
      { time: '07:30', label: 'Arrivee' },
      { time: '12:30', label: 'Pause' },
    ],
    lateTolerance: lateTol,
  })
  const dayEvening = (lateTol: number) => ({
    kind: 'evening',
    startTime: '14:00',
    endTime: '17:30',
    expectedPunches: [
      { time: '14:00', label: 'Reprise' },
      { time: '17:30', label: 'Depart' },
    ],
    lateTolerance: lateTol,
  })
  const buildDays = (worked: number[], lateTol: number) =>
    Array.from({ length: 7 }, (_, i) => {
      const weekday = i + 1
      const isWorked = worked.includes(weekday)
      return {
        weekday,
        worked: isWorked,
        segments: isWorked ? [dayMorning(lateTol), dayEvening(lateTol)] : [],
      }
    })

  const schedules: Dict[] = [
    {
      id: 'sched-1',
      companyId: cid,
      name: 'Horaire Jour',
      type: 'day',
      defaultLateTolerance: 10,
      days: buildDays([1, 2, 3, 4, 5], 10),
      assignedDepartments: ['dep-1-1', 'dep-1-2'],
      createdAt: daysAgo(200).toISOString(),
    },
    {
      id: 'sched-2',
      companyId: cid,
      name: 'Horaire Nuit',
      type: 'night',
      defaultLateTolerance: 15,
      days: buildDays([1, 2, 3, 4, 5, 6], 15),
      assignedDepartments: ['dep-1-4'],
      createdAt: daysAgo(180).toISOString(),
    },
  ]

  // --- Employés ---
  const PAYMENT_MODES = ['monthly', 'daily', 'hourly'] as const
  const employees: Dict[] = []
  const allDeptIds = departments.map((d) => d.id)
  const TOTAL_EMP = 24
  for (let i = 0; i < TOTAL_EMP; i++) {
    const firstName = FIRST_NAMES[i % FIRST_NAMES.length]
    const lastName = LAST_NAMES[i % LAST_NAMES.length]
    const dep = departments[i % departments.length]
    const paymentMode = PAYMENT_MODES[i % PAYMENT_MODES.length]
    const baseSalary =
      paymentMode === 'monthly' ? 120000 + (i % 6) * 25000 : paymentMode === 'daily' ? 6000 + (i % 4) * 1000 : 1200 + (i % 3) * 200
    employees.push({
      id: `emp-${i + 1}`,
      companyId: cid,
      siteId: dep.siteId,
      departmentId: dep.id,
      firstName,
      lastName,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i + 1}@demo-tangaflow.bf`,
      phone: `+226 70 ${pad(10 + i, 2)} ${pad(20 + i, 2)} ${pad(30 + i, 2)}`,
      position: pick(POSITIONS),
      employeeNumber: `DEMO-${pad(i + 1)}`,
      avatar: undefined,
      isActive: i % 11 !== 0,
      hireDate: isoDate(daysAgo(120 + i * 17)),
      rfidCardId: i < 18 ? `card-${i + 1}` : undefined,
      biometricEnrolled: i % 3 === 0,
      createdAt: daysAgo(120 + i * 17).toISOString(),
      scheduleId: i % 5 === 0 ? 'sched-2' : 'sched-1',
      paymentMode,
      baseSalary,
    })
    dep.employeeCount++
  }

  // --- Utilisateurs (comptables des 3 rôles démo + correspondance employés) ---
  const users: Dict[] = [
    {
      id: 'user-admin',
      email: 'admin@demo-tangaflow.bf',
      firstName: 'Awa',
      lastName: 'Directrice',
      phone: '+226 70 00 00 01',
      role: 'admin_enterprise',
      companyId: cid,
      companyName: cname,
      employeeId: null,
      isActive: true,
      createdAt: daysAgo(300).toISOString(),
    },
    {
      id: 'user-manager',
      email: 'manager@demo-tangaflow.bf',
      firstName: 'Issa',
      lastName: 'Manager',
      phone: '+226 70 00 00 02',
      role: 'manager',
      companyId: cid,
      companyName: cname,
      employeeId: null,
      isActive: true,
      createdAt: daysAgo(250).toISOString(),
    },
    {
      id: 'user-employe',
      email: 'employe@demo-tangaflow.bf',
      firstName: employees[0].firstName,
      lastName: employees[0].lastName,
      phone: employees[0].phone,
      role: 'employe',
      companyId: cid,
      companyName: cname,
      employeeId: 'emp-1',
      isActive: true,
      createdAt: employees[0].createdAt,
    },
  ]

  // --- Compagnie ---
  const companies: Dict[] = [
    {
      id: cid,
      name: cname,
      logo: undefined,
      email: 'contact@demo-tangaflow.bf',
      phone: '+226 25 00 00 00',
      address: 'Avenue Kwame Nkrumah, Ouagadougou, Burkina Faso',
      matriculePrefix: 'DEMO',
      isActive: true,
      subscription: 'premium',
      subscriptionStartsAt: daysAgo(60).toISOString(),
      subscriptionExpiresAt: daysAgo(-300).toISOString(),
      subscriptionNextPeriodPaid: true,
      subscriptionNextExpiresAt: daysAgo(-665).toISOString(),
      warrantyStartsAt: daysAgo(60).toISOString(),
      warrantyEndsAt: daysAgo(-305).toISOString(),
      warrantyAutoRenew: true,
      isWarrantyActive: true,
      sites,
      admin: { id: 'user-admin', name: 'Awa Directrice', email: 'admin@demo-tangaflow.bf', phone: '+226 70 00 00 01' },
      employeeCount: employees.length,
      createdAt: daysAgo(300).toISOString(),
      updatedAt: daysAgo(2).toISOString(),
    },
  ]

  // --- Jours fériés ---
  const year = new Date().getFullYear()
  const holidays: Dict[] = [
    { id: 'hol-1', companyId: cid, name: 'Jour de l An', date: `${year}-01-01`, isRecurring: true },
    { id: 'hol-2', companyId: cid, name: 'Fete du Travail', date: `${year}-05-01`, isRecurring: true },
    { id: 'hol-3', companyId: cid, name: 'Independance', date: `${year}-12-11`, isRecurring: true },
    { id: 'hol-4', companyId: cid, name: 'Noel', date: `${year}-12-25`, isRecurring: true },
  ]

  // --- Demandes d'absence ---
  const absReasons = ['Conge annuel', 'Maladie', 'Evenement familial', 'Rendez-vous medical', 'Conge sans solde']
  const absStatuses = ['pending', 'approved', 'rejected']
  const absenceRequests: Dict[] = Array.from({ length: 9 }, (_, i) => {
    const emp = employees[i + 1]
    const status = absStatuses[i % 3]
    const start = daysAgo(20 - i * 2)
    const end = daysAgo(20 - i * 2 - 1)
    return {
      id: `abs-${i + 1}`,
      employeeId: emp.id,
      employeeName: `${emp.firstName} ${emp.lastName}`,
      employeeAvatar: null,
      companyId: cid,
      dateStart: isoDate(start),
      dateEnd: isoDate(end),
      reason: pick(absReasons),
      justificatifUrl: i % 2 === 0 ? 'https://example.com/justificatif.pdf' : null,
      status,
      reviewedBy: status === 'pending' ? null : 'Awa Directrice',
      reviewedAt: status === 'pending' ? null : daysAgo(20 - i * 2 + 1).toISOString(),
      reviewNote: status === 'rejected' ? 'Periode non couverte' : null,
      createdAt: daysAgo(22 - i * 2).toISOString(),
    }
  })

  // --- Cartes RFID ---
  const cards: Dict[] = employees.slice(0, 18).map((emp, i) => ({
    id: `card-${i + 1}`,
    uid: `04${pad(i + 1, 2)}A${pad(i * 7 + 3, 2)}BF${pad(i * 3 + 1, 2)}`,
    employeeId: emp.id,
    employeeName: `${emp.firstName} ${emp.lastName}`,
    companyId: cid,
    status: i % 9 === 0 ? 'blocked' : 'active',
    assignedAt: daysAgo(100 - i).toISOString(),
    blockedAt: i % 9 === 0 ? daysAgo(5).toISOString() : undefined,
    blockReason: i % 9 === 0 ? 'Carte perdue declaree' : undefined,
    createdAt: daysAgo(110 - i).toISOString(),
  }))
  // Quelques cartes en stock non assignées
  for (let i = 0; i < 4; i++) {
    cards.push({
      id: `card-free-${i + 1}`,
      uid: `04FF${pad(i + 50, 2)}BF${pad(i * 5 + 9, 2)}AA`,
      employeeId: undefined,
      employeeName: undefined,
      companyId: cid,
      status: 'inactive',
      createdAt: daysAgo(30 - i).toISOString(),
    })
  }

  const cardHistory: Dict[] = cards.slice(0, 6).map((c, i) => ({
    id: `ch-${i + 1}`,
    cardId: c.id,
    action: 'assigned',
    performedBy: 'Awa Directrice',
    timestamp: c.assignedAt ?? daysAgo(50).toISOString(),
    details: `Assignee a ${c.employeeName ?? '-'}`,
  }))

  // --- Appareils RFID / Biométrie / Feelback ---
  const siteName = (sid: string) => sites.find((s) => s.id === sid)?.name ?? ''
  const rfidDevices: Dict[] = sites.map((s, i) => ({
    id: `rfid-dev-${i + 1}`,
    serialNumber: `RFID-${pad(i + 1)}-BF`,
    name: `Lecteur RFID ${s.name}`,
    companyId: cid,
    siteId: s.id,
    siteName: s.name,
    isOnline: i !== 2,
    lastPingAt: daysAgo(0).toISOString(),
    mqttTopic: `tangaflow/${cid}/rfid/${i + 1}/event`,
  }))
  const biometricDevices: Dict[] = sites.slice(0, 2).map((s, i) => ({
    id: `bio-dev-${i + 1}`,
    serialNumber: `AS608-${pad(i + 1)}`,
    companyId: cid,
    siteId: s.id,
    name: `Borne biometrique ${s.name}`,
    isOnline: true,
    lastSyncAt: daysAgo(0).toISOString(),
    firmwareVersion: '2.3.1',
    enrolledCount: 6 + i * 2,
    mqttTopic: `tangaflow/${cid}/bio/${i + 1}/event`,
  }))
  const enrollments: Dict[] = employees
    .filter((e) => e.biometricEnrolled)
    .map((e, i) => ({
      id: `enr-${i + 1}`,
      employeeId: e.id,
      employeeName: `${e.firstName} ${e.lastName}`,
      deviceId: 'bio-dev-1',
      status: 'enrolled',
      enrolledAt: daysAgo(40 - i).toISOString(),
      templateHash: `tpl_${pad(i * 13 + 7, 6)}`,
    }))
  const feelbackDevices: Dict[] = sites.map((s, i) => ({
    id: `feel-dev-${i + 1}`,
    serialNumber: `FEEL-${pad(i + 1)}`,
    companyId: cid,
    siteId: s.id,
    siteName: s.name,
    isOnline: i !== 2,
    lastPingAt: daysAgo(0).toISOString(),
    mqttTopic: `tangaflow/${cid}/feel/${i + 1}/event`,
  }))
  const feelbackEntries: Dict[] = Array.from({ length: 60 }, (_, i) => {
    const dev = feelbackDevices[i % feelbackDevices.length]
    const r = rng()
    const level = r > 0.45 ? 'bon' : r > 0.2 ? 'neutre' : 'mauvais'
    return {
      id: `feel-entry-${i + 1}`,
      deviceId: dev.id,
      deviceSerialNumber: dev.serialNumber,
      level,
      timestamp: daysAgo(Math.floor(i / 2)).toISOString(),
      siteId: dev.siteId,
      siteName: dev.siteName,
    }
  })
  const feelbackAlerts: Dict[] = [
    {
      id: 'feel-alert-1',
      deviceId: 'feel-dev-3',
      siteId: 'site-3',
      siteName: siteName('site-3'),
      type: 'device_offline',
      message: 'Borne Feelback hors ligne depuis 2 heures',
      isRead: false,
      createdAt: daysAgo(0).toISOString(),
    },
    {
      id: 'feel-alert-2',
      deviceId: 'feel-dev-2',
      siteId: 'site-2',
      siteName: siteName('site-2'),
      type: 'threshold_exceeded',
      message: 'Taux de satisfaction sous le seuil (62%)',
      threshold: 70,
      currentValue: 62,
      isRead: false,
      createdAt: daysAgo(1).toISOString(),
    },
  ]

  // --- Firmware ---
  const firmwareVersions: Dict[] = [
    {
      id: 'fw-1', version: '2.3.1', deviceKind: 'rfid', description: 'Stabilite MQTT + heartbeat',
      fileUrl: undefined, fileSize: 524288, isAutoUpdate: true, isPublished: true,
      publishedAt: daysAgo(20).toISOString(), uploadedAt: daysAgo(22).toISOString(), uploadedBy: 'Equipe technique',
    },
    {
      id: 'fw-2', version: '2.2.0', deviceKind: 'rfid', description: 'Support double badge',
      fileUrl: undefined, fileSize: 510000, isAutoUpdate: false, isPublished: true,
      publishedAt: daysAgo(70).toISOString(), uploadedAt: daysAgo(72).toISOString(), uploadedBy: 'Equipe technique',
    },
    {
      id: 'fw-3', version: '1.5.0', deviceKind: 'biometric', description: 'Gestion slots AS608',
      fileUrl: undefined, fileSize: 720000, isAutoUpdate: true, isPublished: true,
      publishedAt: daysAgo(15).toISOString(), uploadedAt: daysAgo(16).toISOString(), uploadedBy: 'Equipe technique',
    },
  ]
  const OTA = ['success', 'success', 'in_progress', 'failed', 'pending'] as const
  const otaLogs: Dict[] = rfidDevices.concat(biometricDevices).map((d, i) => ({
    id: `ota-${i + 1}`,
    deviceId: d.id,
    deviceName: d.name,
    deviceKind: d.id.startsWith('bio') ? 'biometric' : 'rfid',
    firmwareVersionId: d.id.startsWith('bio') ? 'fw-3' : 'fw-1',
    firmwareVersion: d.id.startsWith('bio') ? '1.5.0' : '2.3.1',
    status: OTA[i % OTA.length],
    startedAt: daysAgo(3).toISOString(),
    completedAt: OTA[i % OTA.length] === 'success' ? daysAgo(3).toISOString() : undefined,
    errorMessage: OTA[i % OTA.length] === 'failed' ? 'Timeout de connexion' : undefined,
    triggeredBy: i % 2 === 0 ? 'auto' : 'manual',
  }))

  // --- QR codes & pointages QR ---
  const qrCodes: Dict[] = sites.map((s, i) => ({
    id: `qr-${i + 1}`,
    companyId: cid,
    siteId: s.id,
    siteName: s.name,
    label: `QR ${s.name}`,
    token: `qrtok_${pad(i * 97 + 11, 6)}`,
    isActive: true,
    generatedAt: daysAgo(30 - i).toISOString(),
    expiresAt: undefined,
    createdAt: daysAgo(30 - i).toISOString(),
  }))
  const qrAttendance: Dict[] = Array.from({ length: 20 }, (_, i) => {
    const emp = employees[i % employees.length]
    const qr = qrCodes[i % qrCodes.length]
    return {
      id: `qratt-${i + 1}`,
      employeeId: emp.id,
      employeeName: `${emp.firstName} ${emp.lastName}`,
      qrCodeId: qr.id,
      companyId: cid,
      date: isoDate(daysAgo(Math.floor(i / 4))),
      entryTime: timeStr(7, 30 + (i % 20)),
      exitTime: timeStr(17, 30 + (i % 10)),
      status: i % 5 === 0 ? 'late' : 'present',
      scannedAt: daysAgo(Math.floor(i / 4)).toISOString(),
      gpsVerified: i % 4 !== 0,
      distanceMeters: 20 + (i % 5) * 15,
      createdAt: daysAgo(Math.floor(i / 4)).toISOString(),
    }
  })

  // --- Paie ---
  const payrollConfig: Dict = {
    id: 'paycfg-1',
    companyId: cid,
    defaultPaymentMode: 'monthly',
    standardDailyHours: 8,
    workingDaysPerMonth: 22,
    workingDaysPerWeek: 5,
    paymentDay: 28,
    latenessDeductionEnabled: true,
    overtimeEnabled: true,
    overtimeRate: 1.25,
    latenessRules: [
      {
        id: 'lr-1', companyId: cid, toleranceMinutes: 10, minutesThreshold: 30,
        penaltyValue: 2000, penaltyType: 'fixed', applyPer: 'occurrence',
        createdAt: daysAgo(60).toISOString(), updatedAt: daysAgo(60).toISOString(),
      },
    ],
    createdAt: daysAgo(120).toISOString(),
    updatedAt: daysAgo(5).toISOString(),
  }
  const period = new Date().toISOString().slice(0, 7)
  const periodStart = `${period}-01`
  const periodEnd = `${period}-28`
  const payslips: Dict[] = employees.slice(0, 12).map((e, i) => {
    const dep = departments.find((d) => d.id === e.departmentId)
    const base = e.baseSalary ?? 120000
    const monthly = e.paymentMode === 'monthly' ? base : e.paymentMode === 'daily' ? base * 22 : base * 8 * 22
    const workedDays = 20 + (i % 3)
    const absentDays = i % 4 === 0 ? 1 : 0
    const lateMin = (i % 5) * 12
    const latenessDeduction = lateMin > 30 ? 2000 : 0
    const absenceDeduction = absentDays * Math.round(monthly / 22)
    const overtimeHours = i % 3 === 0 ? 4 : 0
    const overtimeAmount = Math.round(overtimeHours * (monthly / 176) * 1.25)
    const gross = monthly + overtimeAmount
    const net = gross - latenessDeduction - absenceDeduction
    return {
      id: `slip-${i + 1}`,
      employeeId: e.id,
      employeeNumber: e.employeeNumber,
      employeeFirstName: e.firstName,
      employeeLastName: e.lastName,
      employeePosition: e.position,
      companyId: cid,
      companyName: cname,
      siteId: e.siteId,
      siteName: siteName(e.siteId),
      departmentId: e.departmentId,
      departmentName: dep?.name,
      period,
      periodStart,
      periodEnd,
      paymentMode: e.paymentMode ?? 'monthly',
      baseSalary: base,
      workedDays,
      workedHours: workedDays * 8,
      absentDays,
      totalLatenessMinutes: lateMin,
      overtimeHours,
      overtimeAmount,
      latenessDeduction,
      absenceDeduction,
      lines: [
        { label: 'Salaire de base', type: 'earning', amount: monthly },
        ...(overtimeAmount ? [{ label: 'Heures supplementaires', type: 'earning', amount: overtimeAmount }] : []),
        ...(latenessDeduction ? [{ label: 'Penalite retard', type: 'deduction', amount: latenessDeduction }] : []),
        ...(absenceDeduction ? [{ label: 'Deduction absence', type: 'deduction', amount: absenceDeduction }] : []),
      ],
      grossAmount: gross,
      netAmount: net,
      status: i % 3 === 0 ? 'validated' : 'draft',
      generatedAt: daysAgo(3).toISOString(),
    }
  })

  // --- Marketplace ---
  const products: Dict[] = [
    {
      id: 'prod-1', name: 'Carte RFID standard', description: 'Carte de pointage RFID 125 kHz, lot economique.',
      category: 'standard_card', price: 1500, currency: 'XOF', stockQuantity: 480,
      images: [], customizable: false, minQuantity: 10, isActive: true,
    },
    {
      id: 'prod-2', name: 'Carte RFID personnalisee', description: 'Carte imprimee au logo de votre entreprise.',
      category: 'custom_card', price: 2500, currency: 'XOF', stockQuantity: 150,
      images: [], customizable: true, minQuantity: 25, isActive: true,
    },
    {
      id: 'prod-3', name: 'Pack entreprise (lecteur + 100 cartes)', description: 'Kit de demarrage complet pour un site.',
      category: 'enterprise_pack', price: 185000, currency: 'XOF', stockQuantity: 12,
      images: [], customizable: false, minQuantity: 1, isActive: true,
    },
  ]
  const orders: Dict[] = [
    {
      id: 'order-1', orderNumber: 'CMD-2024-0001', companyId: cid, companyName: cname,
      items: [{ productId: 'prod-1', productName: 'Carte RFID standard', quantity: 50, unitPrice: 1500, totalPrice: 75000 }],
      subtotal: 75000, deliveryFee: 2000, total: 77000, currency: 'XOF',
      status: 'delivered', paymentMethod: 'intouch_mobile_money', paymentStatus: 'paid',
      deliveryAddress: { fullName: 'Awa Directrice', phone: '+226 70 00 00 01', street: 'Avenue Kwame Nkrumah', city: 'Ouagadougou', country: 'Burkina Faso' },
      createdAt: daysAgo(40).toISOString(), updatedAt: daysAgo(35).toISOString(),
    },
    {
      id: 'order-2', orderNumber: 'CMD-2024-0002', companyId: cid, companyName: cname,
      items: [{ productId: 'prod-3', productName: 'Pack entreprise (lecteur + 100 cartes)', quantity: 1, unitPrice: 185000, totalPrice: 185000 }],
      subtotal: 185000, deliveryFee: 0, total: 185000, currency: 'XOF',
      status: 'processing', paymentMethod: 'ligdicash', paymentStatus: 'paid',
      deliveryAddress: { fullName: 'Awa Directrice', phone: '+226 70 00 00 01', street: 'Avenue Kwame Nkrumah', city: 'Ouagadougou', country: 'Burkina Faso' },
      createdAt: daysAgo(6).toISOString(), updatedAt: daysAgo(5).toISOString(),
    },
  ]

  // --- CRM followups ---
  const followups: Dict[] = [
    {
      id: 'fup-1', companyId: cid, companyName: cname, type: 'onboarding', status: 'open',
      priority: 'medium', title: 'Suivi installation site Bobo', notes: 'Verifier la connexion du lecteur',
      createdAt: daysAgo(10).toISOString(), updatedAt: daysAgo(2).toISOString(),
    },
  ]

  // --- Support (vue technique) ---
  const supportDevices: Dict[] = rfidDevices
    .map((d) => ({
      id: d.id, kind: 'rfid', name: d.name, serialNumber: d.serialNumber,
      companyId: cid, siteId: d.siteId, siteName: d.siteName, isOnline: d.isOnline,
      isWitness: false, lastSeenAt: d.lastPingAt, firmwareVersion: '2.3.1',
    }))
    .concat(
      biometricDevices.map((d) => ({
        id: d.id, kind: 'biometric', name: d.name, serialNumber: d.serialNumber,
        companyId: cid, siteId: d.siteId, siteName: siteName(d.siteId), isOnline: d.isOnline,
        isWitness: false, lastSeenAt: d.lastSyncAt, firmwareVersion: d.firmwareVersion,
      })),
    )
    .concat(
      feelbackDevices.map((d) => ({
        id: d.id, kind: 'feelback', name: `Feelback ${d.siteName}`, serialNumber: d.serialNumber,
        companyId: cid, siteId: d.siteId, siteName: d.siteName, isOnline: d.isOnline,
        isWitness: false, lastSeenAt: d.lastPingAt, firmwareVersion: '1.0.0',
      })),
    )
  const supportAlerts: Dict[] = [
    {
      id: 'sup-alert-1', company_id: cid, site_id: 'site-3', device_id: 'rfid-dev-3',
      device_kind: 'rfid', type: 'offline', severity: 'high', title: 'Lecteur hors ligne',
      message: 'Aucun heartbeat depuis 3 heures', context: null, status: 'open',
      acknowledged_by: null, acknowledged_at: null, resolved_at: null, notified_at: null,
      created_at: daysAgo(0).toISOString(), updated_at: daysAgo(0).toISOString(),
    },
  ]

  // --- Abonnement (snake_case, comme le backend) ---
  const PREMIUM_FEATURES = [
    'dashboard', 'export_raw', 'firmware_updates', 'platform_updates', 'payroll',
    'hr_reports', 'dedicated_support', 'sav_included', 'advanced_analytics', 'field_visits',
  ]
  const subscriptionState: Dict = {
    company_id: cid,
    subscription: 'premium',
    starts_at: daysAgo(60).toISOString(),
    expires_at: daysAgo(-300).toISOString(),
    next_period_paid: true,
    next_expires_at: daysAgo(-665).toISOString(),
    is_active: true,
    warranty_ends_at: daysAgo(-305).toISOString(),
    is_warranty_active: true,
    features: PREMIUM_FEATURES,
  }
  const subscriptionPlans: Dict[] = [
    { id: 1, code: 'freemium', name: 'Freemium', monthly_price_xof: 0, features: ['dashboard', 'export_raw'], requires_warranty: false, is_active: true, sort_order: 1 },
    { id: 2, code: 'garantie', name: 'Garantie', monthly_price_xof: 25000, features: PREMIUM_FEATURES.slice(0, 8), requires_warranty: true, is_active: true, sort_order: 2 },
    { id: 3, code: 'premium', name: 'Premium', monthly_price_xof: 45000, features: PREMIUM_FEATURES, requires_warranty: true, is_active: true, sort_order: 3 },
  ]
  const subscriptionPayments: Dict[] = [
    {
      id: 'pay-1', company_id: cid, from_plan: 'garantie', to_plan: 'premium', amount_xof: 45000,
      is_prorata: false, period_start: daysAgo(60).toISOString(), period_end: daysAgo(-300).toISOString(),
      payment_method: 'ligdicash', payment_status: 'paid', gateway_token: 'tok_demo_1',
      triggered_by_superadmin: false, created_at: daysAgo(60).toISOString(), updated_at: daysAgo(60).toISOString(),
    },
  ]
  const subscriptionEvents: Dict[] = [
    { id: 1, company_id: cid, event: 'upgraded', from_plan: 'garantie', to_plan: 'premium', actor_user_id: 1, payment_id: 'pay-1', notes: null, created_at: daysAgo(60).toISOString() },
    { id: 2, company_id: cid, event: 'subscribed', from_plan: null, to_plan: 'garantie', actor_user_id: 1, payment_id: null, notes: null, created_at: daysAgo(120).toISOString() },
  ]

  return {
    companies,
    sites,
    departments,
    employees,
    users,
    schedules,
    holidays,
    absenceRequests,
    cards,
    cardHistory,
    rfidDevices,
    biometricDevices,
    enrollments,
    qrCodes,
    qrAttendance,
    feelbackDevices,
    feelbackEntries,
    feelbackAlerts,
    firmwareVersions,
    otaLogs,
    products,
    orders,
    payslips,
    payrollConfig,
    followups,
    supportDevices,
    supportAlerts,
    subscriptionState,
    subscriptionPlans,
    subscriptionPayments,
    subscriptionEvents,
    menuBadgesSeen: {},
  }
}
