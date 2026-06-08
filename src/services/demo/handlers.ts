/**
 * Routage des requêtes du mode démo vers la base en mémoire.
 *
 * Stratégie :
 *  1. Routes spécifiques (auth, tableaux de bord, rapports, paie, abonnement...).
 *  2. CRUD générique pour toutes les collections REST connues.
 *  3. Repli tolérant : aucune requête ne doit jamais provoquer d'erreur côté UI.
 */
import { getDb, saveDb } from './db'
import { DEMO_COMPANY_ID, DEMO_COMPANY_NAME } from './seed'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Dict = Record<string, any>

export interface DemoRequest {
  method: string
  path: string
  params: Dict
  body: Dict
}

export const NOT_FOUND = Symbol('demo-not-found')

let idCounter = 0
function genId(prefix: string): string {
  idCounter += 1
  return `${prefix}-${Date.now().toString(36)}-${idCounter}`
}

function snakeToCamel(str: string): string {
  return str.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase())
}

export function keysToCamel(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(keysToCamel)
  if (obj !== null && typeof obj === 'object') {
    const out: Dict = {}
    for (const [k, v] of Object.entries(obj as Dict)) {
      out[snakeToCamel(k)] = keysToCamel(v)
    }
    return out
  }
  return obj
}

function toBool(v: unknown): boolean | undefined {
  if (v === undefined || v === null || v === '') return undefined
  if (typeof v === 'boolean') return v
  return v === 'true' || v === '1' || v === 1
}

function num(v: unknown, def: number): number {
  const n = Number(v)
  return Number.isFinite(n) && n > 0 ? n : def
}

function paginate(list: Dict[], params: Dict) {
  const page = num(params.page, 1)
  const perPage = num(params.perPage ?? params.per_page, 15)
  const total = list.length
  const start = (page - 1) * perPage
  return {
    data: list.slice(start, start + perPage),
    meta: {
      currentPage: page,
      perPage,
      total,
      totalPages: Math.max(1, Math.ceil(total / perPage)),
    },
  }
}

const FILTER_KEYS = [
  'companyId', 'siteId', 'departmentId', 'employeeId', 'status', 'type',
  'deviceKind', 'level', 'deviceId', 'category', 'paymentStatus', 'period',
]
const BOOL_FILTER_KEYS = ['isActive', 'isRead', 'isPublished', 'gpsVerified']

function filterList(list: Dict[], params: Dict): Dict[] {
  let out = list
  for (const key of FILTER_KEYS) {
    const val = params[key]
    if (val !== undefined && val !== '' && val !== null) {
      out = out.filter((r) => r[key] === undefined || String(r[key]) === String(val))
    }
  }
  for (const key of BOOL_FILTER_KEYS) {
    const val = toBool(params[key])
    if (val !== undefined) {
      out = out.filter((r) => r[key] === undefined || r[key] === val)
    }
  }
  const search = (params.search ?? '').toString().trim().toLowerCase()
  if (search) {
    out = out.filter((r) =>
      Object.values(r).some((v) => typeof v === 'string' && v.toLowerCase().includes(search)),
    )
  }
  return out
}

// --- Helpers métier ---

function fullName(emp: Dict): string {
  return `${emp.firstName} ${emp.lastName}`
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function timeStr(h: number, m: number): string {
  return `${String(h).padStart(2, '0')}:${String(Math.max(0, Math.min(59, m))).padStart(2, '0')}`
}

/** Statut de présence déterministe pour un employé un jour donné. */
function attendanceFor(emp: Dict, date: string, index: number): Dict {
  const seed = (emp.id.length + index + date.length) % 10
  let status: string
  let entryTime: string | undefined
  let exitTime: string | undefined
  let lateMinutes = 0
  if (seed === 0) {
    status = 'absent'
  } else if (seed <= 2) {
    status = 'late'
    lateMinutes = 8 + seed * 6
    entryTime = timeStr(7, 30 + lateMinutes)
    exitTime = timeStr(17, 30 + seed)
  } else {
    status = 'present'
    entryTime = timeStr(7, 24 + seed)
    exitTime = timeStr(17, 28 + seed)
  }
  return {
    id: `att-${emp.id}-${date}`,
    employeeId: emp.id,
    employeeName: fullName(emp),
    date,
    entryTime,
    exitTime,
    status,
    lateMinutes,
    earlyDepartureMinutes: 0,
    source: emp.biometricEnrolled ? 'biometric' : 'rfid',
    isDoubleBadge: false,
    notes: undefined,
    isOnLeave: false,
  }
}

function activeEmployees(db: ReturnType<typeof getDb>, params: Dict): Dict[] {
  let emps = db.employees.filter((e) => e.isActive)
  if (params.siteId) emps = emps.filter((e) => e.siteId === params.siteId)
  if (params.departmentId) emps = emps.filter((e) => e.departmentId === params.departmentId)
  return emps
}

// --- Routage principal ---

export function handleRequest(req: DemoRequest): unknown {
  const custom = handleCustom(req)
  if (custom !== NOT_FOUND) return custom

  const generic = handleGeneric(req)
  if (generic !== NOT_FOUND) return generic

  return fallback(req)
}

// Mapping chemin REST -> collection de la base
const RESOURCE_MAP: Record<string, keyof ReturnType<typeof getDb>> = {
  employees: 'employees',
  companies: 'companies',
  sites: 'sites',
  departments: 'departments',
  schedules: 'schedules',
  holidays: 'holidays',
  'absence-requests': 'absenceRequests',
  cards: 'cards',
  'rfid/devices': 'rfidDevices',
  'biometric/devices': 'biometricDevices',
  'biometric/enrollments': 'enrollments',
  'qr-codes': 'qrCodes',
  'qr-attendance': 'qrAttendance',
  'feelback/devices': 'feelbackDevices',
  'feelback/entries': 'feelbackEntries',
  'feelback/alerts': 'feelbackAlerts',
  'firmware/versions': 'firmwareVersions',
  'firmware/logs': 'otaLogs',
  'marketplace/products': 'products',
  orders: 'orders',
  'admin/orders': 'orders',
  users: 'users',
  followups: 'followups',
  'support/devices': 'supportDevices',
  'support/alerts': 'supportAlerts',
  'support/companies': 'companies',
  'subscriptions/history': 'subscriptionPayments',
  'subscriptions/events': 'subscriptionEvents',
  'admin/subscriptions': 'subscriptionPayments',
}

function matchResource(path: string): { key: keyof ReturnType<typeof getDb>; rest: string } | null {
  // Cherche le plus long préfixe connu
  const entries = Object.keys(RESOURCE_MAP).sort((a, b) => b.length - a.length)
  for (const base of entries) {
    if (path === base) return { key: RESOURCE_MAP[base]!, rest: '' }
    if (path.startsWith(base + '/')) return { key: RESOURCE_MAP[base]!, rest: path.slice(base.length + 1) }
  }
  return null
}

function enrichOnCreate(key: string, record: Dict, db: ReturnType<typeof getDb>): void {
  if (record.employeeId && !record.employeeName) {
    const emp = db.employees.find((e) => e.id === record.employeeId)
    if (emp) record.employeeName = fullName(emp)
  }
  if (key === 'employees') {
    record.companyId = record.companyId ?? DEMO_COMPANY_ID
    record.isActive = record.isActive ?? true
    record.biometricEnrolled = record.biometricEnrolled ?? false
    if (!record.employeeNumber) record.employeeNumber = `DEMO-${(db.employees.length + 1).toString().padStart(3, '0')}`
  }
  if (key === 'companies') {
    record.companyId = record.id
    record.isActive = record.isActive ?? true
    record.sites = record.sites ?? []
    record.employeeCount = record.employeeCount ?? 0
    record.subscription = record.subscription ?? 'freemium'
  }
  if (key === 'absenceRequests') {
    record.status = record.status ?? 'pending'
    record.companyId = record.companyId ?? DEMO_COMPANY_ID
    record.reviewedBy = null
    record.reviewedAt = null
    record.reviewNote = null
    record.justificatifUrl = record.justificatifUrl ?? null
    record.employeeAvatar = null
  }
  if (key === 'cards') {
    record.status = record.status ?? 'inactive'
    record.companyId = record.companyId ?? DEMO_COMPANY_ID
  }
}

function handleGeneric(req: DemoRequest): unknown {
  const { method, path, params, body } = req
  const m = matchResource(path)
  if (!m) return NOT_FOUND
  const db = getDb()
  const collectionKey = m.key as keyof typeof db
  const collection = db[collectionKey] as unknown as Dict[]
  if (!Array.isArray(collection)) return NOT_FOUND

  const restSegs = m.rest ? m.rest.split('/') : []
  const id = restSegs[0]
  const action = restSegs[1]

  // GET /resource  ou  GET /resource/:id
  if (method === 'get') {
    if (!id) {
      const filtered = filterList(collection, params)
      return paginate(filtered, params)
    }
    if (action === 'history' && collectionKey === 'cards') {
      return db.cardHistory.filter((h) => h.cardId === id)
    }
    const found = collection.find((r) => String(r.id) === String(id))
    return found ?? NOT_FOUND
  }

  // POST /resource (création) ou POST /resource/:id/:action
  if (method === 'post') {
    if (!id) {
      const record: Dict = { ...body }
      if (!record.id) record.id = genId(String(collectionKey).slice(0, 4))
      record.createdAt = record.createdAt ?? new Date().toISOString()
      enrichOnCreate(String(collectionKey), record, db)
      collection.unshift(record)
      saveDb()
      return record
    }
    // actions POST sur un item (ex: companies/:id/warranty)
    return handleItemAction(collectionKey, id, action, body, db) ?? NOT_FOUND
  }

  // PUT / PATCH /resource/:id (mise à jour) ou actions PATCH
  if (method === 'put' || method === 'patch') {
    if (!id) return NOT_FOUND
    const item = collection.find((r) => String(r.id) === String(id))
    if (action) {
      const res = handleItemAction(collectionKey, id, action, body, db)
      if (res !== undefined) return res
    }
    if (!item) return NOT_FOUND
    Object.assign(item, body)
    item.updatedAt = new Date().toISOString()
    saveDb()
    return item
  }

  // DELETE /resource/:id  ou  DELETE /resource/:id/:action
  if (method === 'delete') {
    if (action) {
      // Action sur un item (ex: /companies/:id/warranty, /employees/:id/device) :
      // ne JAMAIS supprimer l'enregistrement parent.
      const item = collection.find((r) => String(r.id) === String(id))
      if (item) {
        if (action === 'warranty') {
          item.isWarrantyActive = false
          item.warrantyEndsAt = null
        } else if (action === 'device') {
          item.deviceFingerprint = undefined
          item.deviceInfo = undefined
          item.deviceEnrolledAt = undefined
        }
        saveDb()
      }
      return item ?? { success: true }
    }
    const idx = collection.findIndex((r) => String(r.id) === String(id))
    if (idx >= 0) {
      collection.splice(idx, 1)
      saveDb()
    }
    return { success: true }
  }

  return NOT_FOUND
}

function handleItemAction(
  key: string,
  id: string,
  action: string | undefined,
  body: Dict,
  db: ReturnType<typeof getDb>,
): Dict | undefined {
  const collection = (db as unknown as Dict)[key] as Dict[]
  const item = Array.isArray(collection) ? collection.find((r) => String(r.id) === String(id)) : undefined
  if (!item) return undefined
  switch (action) {
    case 'toggle-active':
      item.isActive = !item.isActive
      saveDb()
      return item
    case 'assign': {
      const emp = db.employees.find((e) => e.id === (body.employeeId ?? body.employee_id))
      item.employeeId = emp?.id
      item.employeeName = emp ? fullName(emp) : undefined
      item.status = 'active'
      item.assignedAt = new Date().toISOString()
      saveDb()
      return item
    }
    case 'unassign':
      item.employeeId = undefined
      item.employeeName = undefined
      item.status = 'inactive'
      saveDb()
      return item
    case 'block':
      item.status = 'blocked'
      item.blockedAt = new Date().toISOString()
      item.blockReason = body.reason ?? body.blockReason ?? 'Bloquee'
      saveDb()
      return item
    case 'unblock':
      item.status = 'active'
      item.blockedAt = undefined
      item.blockReason = undefined
      saveDb()
      return item
    case 'review':
      item.status = body.status ?? 'approved'
      item.reviewNote = body.reviewNote ?? null
      item.reviewedBy = 'Awa Directrice'
      item.reviewedAt = new Date().toISOString()
      if (body.dateStart) item.dateStart = body.dateStart
      if (body.dateEnd) item.dateEnd = body.dateEnd
      if (body.reason) item.reason = body.reason
      saveDb()
      return item
    case 'validate':
      item.status = 'validated'
      saveDb()
      return item
    case 'cancel':
      item.status = 'cancelled'
      saveDb()
      return item
    case 'warranty':
      item.isWarrantyActive = true
      item.warrantyStartsAt = new Date().toISOString()
      saveDb()
      return item
    default:
      // Action inconnue (sync, set-online, ping, command, escalate, acknowledge,
      // resolve...) : on applique le body et on renvoie l'item, en no-op gracieux.
      Object.assign(item, body)
      saveDb()
      return item
  }
}

// --- Routes spécifiques ---

function handleCustom(req: DemoRequest): unknown {
  const { method, path, params, body } = req
  const db = getDb()
  const p = path

  // ---- Auth ----
  if (p === 'auth/me' && method === 'get') return currentUser()
  if (p === 'auth/login' && method === 'post') {
    const user = db.users.find((u) => u.email === body.email) ?? db.users[0]
    return { accessToken: 'demo-token', refreshToken: 'demo-refresh', user: JSON.parse(JSON.stringify(user)) }
  }
  if (p === 'auth/logout' && method === 'post') return { success: true }
  if (p === 'auth/refresh' && method === 'post') {
    return { accessToken: 'demo-token', refreshToken: 'demo-refresh', user: currentUser() }
  }
  if (p === 'auth/profile' && method === 'put') {
    const user = currentUser()
    const updated = { ...user, firstName: body.firstName ?? user.firstName, lastName: body.lastName ?? user.lastName, phone: body.phone ?? user.phone }
    try { localStorage.setItem('auth_user', JSON.stringify(updated)) } catch { /* ignore */ }
    return updated
  }
  if (p === 'auth/password' && method === 'put') return { success: true }
  if ((p === 'auth/forgot-password' || p === 'auth/reset-password') && method === 'post') return { success: true }
  if (p === 'auth/select-company' && method === 'post') {
    return { company_id: body.companyId ?? DEMO_COMPANY_ID, company_name: DEMO_COMPANY_NAME }
  }

  // ---- Dashboard ----
  if (p === 'dashboard/stats' && method === 'get') return dashboardStats(db)
  if (p === 'dashboard/charts' && method === 'get') return dashboardCharts(db)
  if (p === 'dashboard/trends' && method === 'get') return dashboardTrends(db)

  // ---- Attendance ----
  if (p === 'attendance/daily' && method === 'get') return dailyReport(db, params)
  if (p === 'attendance/biometric' && method === 'get') return dailyReport(db, { ...params, source: 'biometric' })
  if (p === 'attendance/monthly' && method === 'get') return attendanceSummaries(db, params)
  if (p === 'attendance/summary' && method === 'get') return attendanceSummaries(db, params)
  if (p === 'attendance/reports' && method === 'get') return attendanceReport(db, params)
  if (p.startsWith('attendance/employee/') && method === 'get') {
    const empId = p.split('/')[2]
    const emp = db.employees.find((e) => e.id === empId)
    return emp ? rangeRecords(emp, params) : []
  }
  if (p.startsWith('attendance/department/') && method === 'get') {
    const depId = p.split('/')[2]
    const emps = db.employees.filter((e) => e.departmentId === depId && e.isActive)
    return emps.flatMap((e) => rangeRecords(e, params))
  }

  // ---- Companies (nested) ----
  if (/^companies\/[^/]+\/sites$/.test(p) && method === 'get') {
    const cId = p.split('/')[1]
    const company = db.companies.find((c) => c.id === cId)
    return company?.sites ?? db.sites
  }
  if (/^sites\/[^/]+\/departments$/.test(p) && method === 'get') {
    const sId = p.split('/')[1]
    return db.departments.filter((d) => d.siteId === sId)
  }

  // ---- QR ----
  if (p === 'qr-codes/stats' && method === 'get') return qrStats(db)
  if (p === 'qr-codes/generate' && method === 'post') {
    const site = db.sites.find((s) => s.id === body.siteId)
    const qr: Dict = {
      id: genId('qr'), companyId: DEMO_COMPANY_ID, siteId: body.siteId, siteName: site?.name,
      label: body.label ?? `QR ${site?.name ?? ''}`, token: genId('qrtok'), isActive: true,
      generatedAt: new Date().toISOString(), createdAt: new Date().toISOString(),
    }
    db.qrCodes = db.qrCodes.filter((q) => q.siteId !== body.siteId)
    db.qrCodes.unshift(qr)
    saveDb()
    return qr
  }
  if (p === 'employees/device/identify' && method === 'post') {
    return { enrolled: false }
  }
  if (p === 'employees/device/enroll' && method === 'post') return { success: true }

  // ---- Feelback agrégats ----
  if (p === 'feelback/stats' && method === 'get') return satisfactionStats(db, params.siteId)
  if (p === 'feelback/comparison' && method === 'get') {
    return db.sites.map((s) => satisfactionStats(db, s.id))
  }
  if (/^feelback\/stats\/agency\/[^/]+$/.test(p) && method === 'get') {
    return satisfactionStats(db, p.split('/')[3])
  }
  if (p === 'feelback/alerts/settings' && method === 'put') return { success: true }

  // ---- Paie ----
  if (/^payroll\/config\/[^/]+\/lateness-rules$/.test(p) && (method === 'put' || method === 'post')) {
    const rules = (body.rules ?? []).map((r: Dict, i: number) => ({
      id: `lr-${i + 1}`, companyId: DEMO_COMPANY_ID, ...r,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    }))
    db.payrollConfig.latenessRules = rules
    saveDb()
    return rules
  }
  if (/^payroll\/config\/[^/]+$/.test(p)) {
    if (method === 'get') return db.payrollConfig
    if (method === 'put' || method === 'post') {
      Object.assign(db.payrollConfig, body)
      db.payrollConfig.updatedAt = new Date().toISOString()
      saveDb()
      return db.payrollConfig
    }
  }
  if (p === 'payroll/generate' && method === 'post') return generatePayslips(db, body)
  if (p === 'payroll/payslips' && method === 'get') {
    let list = db.payslips
    if (params.employeeId) list = list.filter((s) => s.employeeId === params.employeeId)
    if (params.period) list = list.filter((s) => s.period === params.period)
    if (params.status) list = list.filter((s) => s.status === params.status)
    if (params.departmentId) list = list.filter((s) => s.departmentId === params.departmentId)
    if (params.siteId) list = list.filter((s) => s.siteId === params.siteId)
    return list
  }
  if (/^payroll\/payslips\/[^/]+\/validate$/.test(p) && method === 'patch') {
    const slip = db.payslips.find((s) => s.id === p.split('/')[2])
    if (slip) { slip.status = 'validated'; saveDb() }
    return slip ?? NOT_FOUND
  }
  if (/^payroll\/payslips\/[^/]+$/.test(p) && method === 'get') {
    return db.payslips.find((s) => s.id === p.split('/')[2]) ?? NOT_FOUND
  }
  if (/^payroll\/employees\/[^/]+\/payslips$/.test(p) && method === 'get') {
    const empId = p.split('/')[2]
    return db.payslips.filter((s) => s.employeeId === empId)
  }

  // ---- Absences ----
  if (p === 'absence-requests/my' && method === 'get') {
    const empId = params.employeeId
    return db.absenceRequests.filter((a) => !empId || a.employeeId === empId)
  }

  // ---- Abonnement ----
  if (p === 'subscriptions/me' && method === 'get') return db.subscriptionState
  if (p === 'subscriptions/plans' && method === 'get') return db.subscriptionPlans
  if (p === 'subscriptions/quote' && method === 'get') {
    return { amount_xof: 45000, days_remaining: 18, is_prorata: true }
  }
  if ((p === 'subscriptions/subscribe' || p === 'subscriptions/upgrade' || p === 'subscriptions/pay-next-period') && method === 'post') {
    return { payment_url: null, token: null, payment_id: null, scheduled_at: null }
  }
  if (p === 'admin/subscriptions/analytics' && method === 'get') {
    return { totalCompanies: 1, byPlan: { freemium: 0, garantie: 0, premium: 1 }, mrr_xof: 45000, activeWarranties: 1 }
  }

  // ---- Menu badges ----
  if (p === 'menu-badges' && method === 'get') return {}
  if (p === 'menu-badges/seen' && method === 'post') return { success: true }

  // ---- Support / santé ----
  if (p === 'support/health' && method === 'get') return systemHealth(db)
  if (p === 'support/devices/overview' && method === 'get') return devicesOverview(db)
  if (p === 'followups/dashboard' && method === 'get') {
    return { open: db.followups.filter((f) => f.status === 'open').length, escalated: 0, resolved: 0, total: db.followups.length }
  }

  // ---- Analytics ----
  if (p === 'analytics/advanced' && method === 'get') {
    return { attendanceTrend: dashboardCharts(db).attendanceTrend, satisfactionTrend: dashboardCharts(db).satisfactionTrend, topLate: [], topAbsent: [] }
  }

  // ---- Firmware progression ----
  if (p === 'firmware/devices/status' && method === 'get') {
    return db.supportDevices
      .filter((d) => d.kind === 'rfid' || d.kind === 'biometric')
      .map((d) => ({
        deviceId: d.id, deviceName: d.name, deviceKind: d.kind,
        currentVersion: d.firmwareVersion, targetVersion: null, updateStatus: 'success',
        lastCheckedAt: new Date().toISOString(),
      }))
  }
  if (p === 'firmware/company-update-progress' && method === 'get') {
    return { total: 0, pending: 0, inProgress: 0, success: 0, failed: 0, devices: [] }
  }

  return NOT_FOUND
}

// --- Constructeurs de réponses spécifiques ---

function currentUser(): Dict {
  try {
    const raw = localStorage.getItem('auth_user')
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return getDb().users[0]!
}

function dashboardStats(db: ReturnType<typeof getDb>): Dict {
  const emps = db.employees.filter((e) => e.isActive)
  const records = emps.map((e, i) => attendanceFor(e, today(), i))
  const present = records.filter((r) => r.status === 'present').length
  const late = records.filter((r) => r.status === 'late').length
  const absent = records.filter((r) => r.status === 'absent').length
  const sat = satisfactionStats(db)
  return {
    activeCompanies: db.companies.filter((c) => c.isActive).length,
    rfidCardsSold: db.cards.length,
    marketplaceRevenue: db.orders.reduce((s, o) => s + (o.total ?? 0), 0),
    connectedDevices: db.supportDevices.filter((d) => d.isOnline).length,
    totalEmployees: emps.length,
    globalSatisfactionRate: sat.satisfactionRate,
    technicalAlerts: db.supportAlerts.filter((a) => a.status === 'open').length,
    presentToday: present + late,
    absentToday: absent,
    lateToday: late,
    attendanceRate: emps.length ? Math.round(((present + late) / emps.length) * 100) : 0,
    pendingOrders: db.orders.filter((o) => o.status === 'pending' || o.status === 'processing').length,
    totalOrders: db.orders.length,
    biometricEnrolled: db.enrollments.length,
    activeCards: db.cards.filter((c) => c.status === 'active').length,
  }
}

function dashboardCharts(db: ReturnType<typeof getDb>) {
  const months = ['Jan', 'Fev', 'Mar', 'Avr', 'Mai', 'Jui']
  const attendanceTrend = months.map((label, i) => ({ label, value: 88 + ((i * 3) % 9) }))
  const satisfactionTrend = months.map((label, i) => ({ label, value: 72 + ((i * 5) % 15) }))
  const attendanceByDepartment = db.departments.slice(0, 6).map((d) => ({
    label: d.name, value: 80 + (d.name.length % 18),
  }))
  const revenueMonthly = months.map((label, i) => ({ label, value: 50000 + i * 22000 }))
  const companiesByModule = [
    { label: 'RFID', value: db.rfidDevices.length },
    { label: 'Biometrie', value: db.biometricDevices.length },
    { label: 'QR Code', value: db.qrCodes.length },
    { label: 'Feelback', value: db.feelbackDevices.length },
  ]
  return { attendanceTrend, satisfactionTrend, attendanceByDepartment, companiesByModule, revenueMonthly }
}

function dashboardTrends(db: ReturnType<typeof getDb>) {
  const stats = dashboardStats(db)
  return [
    { label: 'Presents', value: stats.presentToday, previousValue: stats.presentToday - 2, changePercent: 4.2 },
    { label: 'Retards', value: stats.lateToday, previousValue: stats.lateToday + 1, changePercent: -8.1 },
    { label: 'Satisfaction', value: stats.globalSatisfactionRate, previousValue: stats.globalSatisfactionRate - 3, changePercent: 3.5 },
    { label: 'Commandes', value: stats.totalOrders, previousValue: stats.totalOrders, changePercent: 0 },
  ]
}

function dailyReport(db: ReturnType<typeof getDb>, params: Dict): Dict {
  const date = params.date ?? today()
  const emps = activeEmployees(db, params)
  const records = emps.map((e, i) => attendanceFor(e, date, i))
  return {
    date,
    departmentId: params.departmentId ?? '',
    departmentName: 'Tous les departements',
    totalEmployees: emps.length,
    present: records.filter((r) => r.status === 'present').length,
    absent: records.filter((r) => r.status === 'absent').length,
    late: records.filter((r) => r.status === 'late').length,
    records,
  }
}

function rangeRecords(emp: Dict, params: Dict): Dict[] {
  const end = params.endDate ?? params.end_date ?? today()
  const start = params.startDate ?? params.start_date ?? end
  const startD = new Date(start)
  const endD = new Date(end)
  const out: Dict[] = []
  let i = 0
  for (let d = new Date(startD); d <= endD; d.setDate(d.getDate() + 1)) {
    const wd = d.getDay()
    if (wd === 0 || wd === 6) continue
    out.push(attendanceFor(emp, d.toISOString().slice(0, 10), i++))
  }
  return out
}

function attendanceSummaries(db: ReturnType<typeof getDb>, params: Dict): Dict[] {
  const emps = activeEmployees(db, params)
  const period = params.month ?? new Date().toISOString().slice(0, 7)
  return emps.map((e, i) => {
    const total = 22
    const absent = (i % 5 === 0) ? 2 : (i % 3 === 0 ? 1 : 0)
    const late = i % 4
    const present = total - absent
    return {
      employeeId: e.id,
      employeeName: fullName(e),
      period,
      totalDays: total,
      presentDays: present,
      absentDays: absent,
      lateDays: late,
      totalLateMinutes: late * 14,
      averageEntryTime: timeStr(7, 32 + (i % 8)),
      averageExitTime: timeStr(17, 30 + (i % 6)),
    }
  })
}

function attendanceReport(db: ReturnType<typeof getDb>, params: Dict): Dict {
  const emps = activeEmployees(db, params)
  const expected = 22
  const rows = emps.map((e, i) => {
    const dep = db.departments.find((d) => d.id === e.departmentId)
    const site = db.sites.find((s) => s.id === e.siteId)
    const absent = (i % 5 === 0) ? 2 : (i % 3 === 0 ? 1 : 0)
    const late = i % 4
    const leave = i % 7 === 0 ? 1 : 0
    const present = expected - absent - leave
    const overtime = i % 6 === 0 ? 3 : 0
    const rate = Math.round(((present + late) / expected) * 100)
    return {
      employeeId: e.id, employee: fullName(e), department: dep?.name ?? '', site: site?.name ?? '',
      present, absent, late, overtime, rate, leave, expected,
    }
  })
  const totalPresent = rows.reduce((s, r) => s + r.present, 0)
  const totalAbsent = rows.reduce((s, r) => s + r.absent, 0)
  const totalLate = rows.reduce((s, r) => s + r.late, 0)
  const totalLeave = rows.reduce((s, r) => s + r.leave, 0)
  const globalRate = rows.length ? Math.round(rows.reduce((s, r) => s + r.rate, 0) / rows.length) : 0
  return { totalEmployees: emps.length, totalPresent, totalAbsent, totalLate, totalLeave, globalRate, rows }
}

function qrStats(db: ReturnType<typeof getDb>): Dict {
  return {
    totalQrCodes: db.qrCodes.length,
    activeQrCodes: db.qrCodes.filter((q) => q.isActive).length,
    enrolledDevices: db.employees.filter((e) => e.deviceFingerprint).length,
    totalEmployees: db.employees.filter((e) => e.isActive).length,
    scansToday: db.qrAttendance.filter((a) => a.date === today()).length,
    attendanceRate: 92,
  }
}

function satisfactionStats(db: ReturnType<typeof getDb>, siteId?: string): Dict {
  let entries = db.feelbackEntries
  if (siteId) entries = entries.filter((e) => e.siteId === siteId)
  const bon = entries.filter((e) => e.level === 'bon').length
  const neutre = entries.filter((e) => e.level === 'neutre').length
  const mauvais = entries.filter((e) => e.level === 'mauvais').length
  const total = entries.length
  const site = siteId ? db.sites.find((s) => s.id === siteId) : undefined
  return {
    period: new Date().toISOString().slice(0, 7),
    siteId,
    siteName: site?.name,
    totalResponses: total,
    bon,
    neutre,
    mauvais,
    satisfactionRate: total ? Math.round((bon / total) * 100) : 0,
  }
}

function generatePayslips(db: ReturnType<typeof getDb>, body: Dict): Dict[] {
  const period = (body.periodStart ?? `${new Date().toISOString().slice(0, 7)}-01`).slice(0, 7)
  let emps = db.employees.filter((e) => e.isActive)
  if (body.siteId) emps = emps.filter((e) => e.siteId === body.siteId)
  if (body.departmentId) emps = emps.filter((e) => e.departmentId === body.departmentId)
  const created = emps.map((e, i) => {
    const dep = db.departments.find((d) => d.id === e.departmentId)
    const site = db.sites.find((s) => s.id === e.siteId)
    const base = e.baseSalary ?? 120000
    const monthly = e.paymentMode === 'monthly' ? base : e.paymentMode === 'daily' ? base * 22 : base * 8 * 22
    const workedDays = 20 + (i % 3)
    const gross = monthly
    return {
      id: genId('slip'),
      employeeId: e.id, employeeNumber: e.employeeNumber,
      employeeFirstName: e.firstName, employeeLastName: e.lastName, employeePosition: e.position,
      companyId: DEMO_COMPANY_ID, companyName: DEMO_COMPANY_NAME,
      siteId: e.siteId, siteName: site?.name, departmentId: e.departmentId, departmentName: dep?.name,
      period, periodStart: body.periodStart, periodEnd: body.periodEnd,
      paymentMode: e.paymentMode ?? 'monthly', baseSalary: base,
      workedDays, workedHours: workedDays * 8, absentDays: 0, totalLatenessMinutes: 0,
      overtimeHours: 0, overtimeAmount: 0, latenessDeduction: 0, absenceDeduction: 0,
      lines: [{ label: 'Salaire de base', type: 'earning', amount: monthly }],
      grossAmount: gross, netAmount: gross, status: 'draft', generatedAt: new Date().toISOString(),
    }
  })
  // Remplace les fiches existantes de la même période
  db.payslips = db.payslips.filter((s) => s.period !== period).concat(created)
  saveDb()
  return created
}

function devicesOverview(db: ReturnType<typeof getDb>): Dict {
  const count = (kind: string) => {
    const list = db.supportDevices.filter((d) => d.kind === kind)
    return { total: list.length, online: list.filter((d) => d.isOnline).length }
  }
  return {
    rfid: count('rfid'),
    biometric: count('biometric'),
    feelback: count('feelback'),
    alerts: { open: db.supportAlerts.filter((a) => a.status === 'open').length, critical: db.supportAlerts.filter((a) => a.severity === 'critical').length },
  }
}

function systemHealth(db: ReturnType<typeof getDb>): Dict {
  const ok = (extra: Dict = {}) => ({ status: 'ok', ...extra })
  const count = (kind: string) => {
    const list = db.supportDevices.filter((d) => d.kind === kind)
    return { total: list.length, online: list.filter((d) => d.isOnline).length }
  }
  return {
    status: 'healthy',
    components: {
      db: ok({ latencyMs: 4, driver: 'pgsql' }),
      cache: ok({ driver: 'redis', latencyMs: 1 }),
      queue: ok({ size: 0 }),
      mqtt: ok({ latencyMs: 12 }),
      reverb: ok(),
      listeners: { rfid: ok(), biometric: ok(), feelback: ok() },
    },
    devices: { rfid: count('rfid'), biometric: count('biometric'), feelback: count('feelback') },
    timestamp: new Date().toISOString(),
  }
}

// --- Repli tolérant ---

function fallback(req: DemoRequest): unknown {
  const { method, params, body } = req
  if (method === 'get') {
    // Heuristique : si la requête ressemble à une liste paginée, renvoyer une page vide.
    if (params.page !== undefined || params.perPage !== undefined || params.per_page !== undefined) {
      return paginate([], params)
    }
    return {}
  }
  if (method === 'delete') return { success: true }
  // POST / PUT / PATCH : renvoyer l'objet envoyé avec un id pour ne pas casser l'UI.
  return { id: genId('demo'), ...body, createdAt: new Date().toISOString() }
}
