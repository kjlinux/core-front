import { ref } from 'vue'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { useAuthStore } from '@/stores/auth.store'
import { useActiveCompanyStore } from '@/stores/active-company.store'
import { useSiteStore } from '@/stores/site.store'
import { useDepartmentStore } from '@/stores/department.store'
import { useEmployeeStore } from '@/stores/employee.store'
import { useCardStore } from '@/stores/card.store'
import { useRfidDeviceStore } from '@/stores/rfid-device.store'
import { useBiometricStore } from '@/stores/biometric.store'
import { useQrcodeStore } from '@/stores/qrcode.store'
import { useFirmwareStore } from '@/stores/firmware.store'

export interface ReportSection {
  title: string
  status: 'ok' | 'warning' | 'error'
  total: number
  done: number
  issues: string[]
}

export interface ReportData {
  generatedAt: string
  technicienName: string
  companyName: string
  sections: ReportSection[]
  globalScore: number
}

export function useTechnicienReport() {
  const isLoading = ref(false)
  const reportData = ref<ReportData | null>(null)

  const auth = useAuthStore()
  const activeCompanyStore = useActiveCompanyStore()
  const siteStore = useSiteStore()
  const departmentStore = useDepartmentStore()
  const employeeStore = useEmployeeStore()
  const cardStore = useCardStore()
  const rfidStore = useRfidDeviceStore()
  const biometricStore = useBiometricStore()
  const qrcodeStore = useQrcodeStore()
  const firmwareStore = useFirmwareStore()

  async function collectData(): Promise<ReportData> {
    await Promise.all([
      siteStore.fetchSites({ perPage: 200 }),
      departmentStore.fetchDepartments({ perPage: 200 }),
      employeeStore.fetchEmployees({ perPage: 200 }),
      cardStore.fetchCards({ perPage: 200 }),
      rfidStore.fetchDevices(),
      biometricStore.fetchDevices(),
      biometricStore.fetchEnrollments(),
      qrcodeStore.fetchQrCodes({ perPage: 200 }),
      firmwareStore.fetchVersions({}),
      firmwareStore.fetchDeviceStatuses(),
    ])

    const sections: ReportSection[] = []

    // ─── Entreprise active ───────────────────────────────────────────────────
    sections.push({
      title: 'Entreprise',
      status: activeCompanyStore.hasActiveCompany ? 'ok' : 'error',
      total: 1,
      done: activeCompanyStore.hasActiveCompany ? 1 : 0,
      issues: activeCompanyStore.hasActiveCompany ? [] : ['Aucune entreprise active selectionnee'],
    })

    // ─── Sites ───────────────────────────────────────────────────────────────
    // On utilise les departements charges separement pour verifier la couverture
    const siteIds = siteStore.sites.map((s) => s.id)
    const siteIdsWithDept = new Set(departmentStore.departments.map((d) => d.siteId))
    const sitesWithDepts = siteStore.sites.filter((s) => siteIdsWithDept.has(s.id))
    const sitesWithoutDepts = siteStore.sites.filter((s) => !siteIdsWithDept.has(s.id))

    const siteIssues: string[] = sitesWithoutDepts.map((s) => `Site sans departement : ${s.name}`)
    sections.push({
      title: 'Sites',
      status: siteStore.sites.length === 0
        ? 'error'
        : sitesWithoutDepts.length > 0
          ? 'warning'
          : 'ok',
      total: siteStore.sites.length,
      done: sitesWithDepts.length,
      issues: siteIssues,
    })

    // ─── Départements ────────────────────────────────────────────────────────
    const deptsWithManager = departmentStore.departments.filter((d) => !!d.managerId)
    const deptsWithoutManager = departmentStore.departments.filter((d) => !d.managerId)
    const deptIssues: string[] = deptsWithoutManager.map((d) => `Departement sans responsable : ${d.name}`)
    sections.push({
      title: 'Departements',
      status: departmentStore.departments.length === 0
        ? 'error'
        : deptsWithoutManager.length > 0
          ? 'warning'
          : 'ok',
      total: departmentStore.departments.length,
      done: deptsWithManager.length,
      issues: deptIssues,
    })

    // ─── Employés ────────────────────────────────────────────────────────────
    const activeEmployees = employeeStore.employees.filter((e) => e.isActive)
    const inactiveEmployees = employeeStore.employees.filter((e) => !e.isActive)
    // Statut : error si aucun, warning si des inactifs, ok si tous actifs
    const empStatus =
      employeeStore.employees.length === 0
        ? 'error'
        : inactiveEmployees.length > 0
          ? 'warning'
          : 'ok'
    const empIssues: string[] = inactiveEmployees.map(
      (e) => `Employe inactif : ${e.firstName} ${e.lastName} (${e.employeeNumber})`,
    )
    sections.push({
      title: 'Employes',
      status: empStatus,
      total: employeeStore.employees.length,
      done: activeEmployees.length,
      issues: empIssues,
    })

    // ─── Cartes RFID ─────────────────────────────────────────────────────────
    const assignedCards = cardStore.cards.filter((c) => c.employeeId && c.status === 'active')
    const unassignedCards = cardStore.cards.filter((c) => !c.employeeId)
    const blockedCards = cardStore.cards.filter((c) => c.status === 'blocked')
    // Employes actifs sans carte assignee
    const assignedEmployeeIds = new Set(assignedCards.map((c) => c.employeeId))
    const activeEmployeesWithoutCard = activeEmployees.filter(
      (e) => !assignedEmployeeIds.has(e.id),
    )
    const cardIssues: string[] = [
      ...unassignedCards.map((c) => `Carte non assignee : ${c.uid}`),
      ...blockedCards.map(
        (c) => `Carte bloquee : ${c.uid}${c.blockReason ? ` (${c.blockReason})` : ''}`,
      ),
      ...activeEmployeesWithoutCard.map(
        (e) => `Employe actif sans carte RFID : ${e.firstName} ${e.lastName}`,
      ),
    ]
    const cardStatus =
      cardStore.cards.length === 0
        ? 'error'
        : cardIssues.length > 0
          ? 'warning'
          : 'ok'
    sections.push({
      title: 'Cartes RFID',
      status: cardStatus,
      total: activeEmployees.length,
      done: assignedCards.length,
      issues: cardIssues,
    })

    // ─── Terminaux RFID ──────────────────────────────────────────────────────
    const rfidOnline = rfidStore.devices.filter((d) => d.isOnline)
    const rfidOffline = rfidStore.devices.filter((d) => !d.isOnline)
    const rfidIssues: string[] = rfidOffline.map(
      (d) => `Terminal RFID hors ligne : ${d.name} (${d.serialNumber})`,
    )
    sections.push({
      title: 'Terminaux RFID',
      status: rfidStore.devices.length === 0
        ? 'error'
        : rfidOffline.length > 0
          ? 'warning'
          : 'ok',
      total: rfidStore.devices.length,
      done: rfidOnline.length,
      issues: rfidIssues,
    })

    // ─── Terminaux biométriques ───────────────────────────────────────────────
    const bioOnline = biometricStore.devices.filter((d) => d.isOnline)
    const bioOffline = biometricStore.devices.filter((d) => !d.isOnline)
    const bioDeviceIssues: string[] = [
      ...(biometricStore.devices.length === 0
        ? ['Aucun terminal biometrique configure']
        : []),
      ...bioOffline.map(
        (d) => `Terminal biometrique hors ligne : ${d.name} (${d.serialNumber})`,
      ),
    ]
    sections.push({
      title: 'Terminaux biometriques',
      status: biometricStore.devices.length === 0
        ? 'warning'
        : bioOffline.length > 0
          ? 'warning'
          : 'ok',
      total: biometricStore.devices.length,
      done: bioOnline.length,
      issues: bioDeviceIssues,
    })

    // ─── Enrôlements biométriques ─────────────────────────────────────────────
    const enrolledOk = biometricStore.enrollments.filter((e) => e.status === 'enrolled')
    const enrolledFailed = biometricStore.enrollments.filter((e) => e.status === 'failed')
    const enrolledPending = biometricStore.enrollments.filter((e) => e.status === 'pending')
    // Employes actifs non enroles (biometricEnrolled = false ou absent)
    const employeesNotEnrolled = activeEmployees.filter((e) => !e.biometricEnrolled)

    const enrollmentIssues: string[] = []

    // Cas critique : aucun enrolement du tout
    if (biometricStore.enrollments.length === 0) {
      enrollmentIssues.push('Aucun enrolement biometrique configure')
    } else {
      enrollmentIssues.push(
        ...enrolledFailed.map((e) => `Enrolement echoue : ${e.employeeName}`),
        ...enrolledPending.map((e) => `Enrolement en attente : ${e.employeeName}`),
        ...employeesNotEnrolled.map((e) => `Employe non enrole : ${e.firstName} ${e.lastName}`),
      )
    }

    // Deduplique
    const uniqueEnrollmentIssues = [...new Set(enrollmentIssues)]

    const enrollStatus =
      biometricStore.enrollments.length === 0
        ? 'warning'
        : enrolledFailed.length > 0
          ? 'error'
          : employeesNotEnrolled.length > 0 || enrolledPending.length > 0
            ? 'warning'
            : 'ok'

    sections.push({
      title: 'Enrolements biometriques',
      status: enrollStatus,
      total: activeEmployees.length,
      done: enrolledOk.length,
      issues: uniqueEnrollmentIssues,
    })

    // ─── QR Codes ────────────────────────────────────────────────────────────
    // Un QR code est lié à un site. On verifie que chaque site a au moins 1 QR actif.
    const activeQrSiteIds = new Set(
      qrcodeStore.qrCodes.filter((q) => q.isActive && q.siteId).map((q) => q.siteId!),
    )
    const sitesWithoutActiveQr = siteStore.sites.filter((s) => !activeQrSiteIds.has(s.id))
    const revokedQr = qrcodeStore.qrCodes.filter((q) => !q.isActive)
    const qrIssues: string[] = [
      ...sitesWithoutActiveQr.map((s) => `Site sans QR code actif : ${s.name}`),
      ...revokedQr.map((q) => `QR code revoque : ${q.label ?? q.siteName ?? q.id}`),
    ]
    // Statut : error si aucun QR du tout, warning si des sites non couverts ou QR revoques, ok sinon
    const qrStatus =
      qrcodeStore.qrCodes.length === 0
        ? 'error'
        : sitesWithoutActiveQr.length > 0 || revokedQr.length > 0
          ? 'warning'
          : 'ok'
    sections.push({
      title: 'QR Codes pointage',
      status: qrStatus,
      total: siteStore.sites.length,
      done: activeQrSiteIds.size,
      issues: qrIssues,
    })

    // ─── Firmware ─────────────────────────────────────────────────────────────
    // Un appareil est "a jour" uniquement si son update_status = 'success' ET sa version courante
    // correspond a la version cible, OU s'il n'a pas de version cible assignee.
    const devicesWithTarget = firmwareStore.deviceStatuses.filter((d) => !!d.targetVersion)
    const devicesUpToDate = devicesWithTarget.filter(
      (d) => d.updateStatus === 'success' && d.currentVersion === d.targetVersion,
    )
    const devicesFailed = devicesWithTarget.filter((d) => d.updateStatus === 'failed')
    const devicesOutdated = devicesWithTarget.filter(
      (d) => d.updateStatus !== 'success' || d.currentVersion !== d.targetVersion,
    )
    const firmwareIssues: string[] = [
      ...devicesFailed.map(
        (d) =>
          `Mise a jour echouee : ${d.deviceName} (actuel: ${d.currentVersion || '?'}, cible: ${d.targetVersion})`,
      ),
      ...devicesOutdated
        .filter((d) => d.updateStatus !== 'failed')
        .map(
          (d) =>
            `Firmware non a jour : ${d.deviceName} (actuel: ${d.currentVersion || '?'}, cible: ${d.targetVersion})`,
        ),
    ]
    const firmwareStatus =
      firmwareStore.deviceStatuses.length === 0
        ? 'warning'
        : devicesFailed.length > 0
          ? 'error'
          : devicesOutdated.length > 0
            ? 'warning'
            : 'ok'
    sections.push({
      title: 'Mises a jour firmware',
      status: firmwareStatus,
      total: devicesWithTarget.length,
      done: devicesUpToDate.length,
      issues: firmwareIssues,
    })

    // Score global : % de sections OK (on exclut les sections warning qui sont optionnelles)
    const okSections = sections.filter((s) => s.status === 'ok').length
    const globalScore =
      sections.length > 0 ? Math.round((okSections / sections.length) * 100) : 0

    const companyName =
      activeCompanyStore.activeCompanyName || auth.user?.companyName || 'Entreprise'

    return {
      generatedAt: new Date().toLocaleString('fr-FR'),
      technicienName: auth.fullName || 'Technicien',
      companyName,
      sections,
      globalScore,
    }
  }

  async function buildReport() {
    isLoading.value = true
    try {
      reportData.value = await collectData()
    } finally {
      isLoading.value = false
    }
  }

  function generatePdf(data: ReportData) {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const pageWidth = doc.internal.pageSize.getWidth()
    const marginX = 15

    const C = {
      primary:    [30, 41, 59]    as [number, number, number],
      primary600: [71, 85, 105]   as [number, number, number],
      primary400: [148, 163, 184] as [number, number, number],
      primary100: [241, 245, 249] as [number, number, number],
      white:      [255, 255, 255] as [number, number, number],
      text:       [30, 41, 59]    as [number, number, number],
      textMuted:  [100, 116, 139] as [number, number, number],
      ok:         [22, 163, 74]   as [number, number, number],
      warning:    [202, 138, 4]   as [number, number, number],
      error:      [220, 38, 38]   as [number, number, number],
      okBg:       [240, 253, 244] as [number, number, number],
      warnBg:     [254, 249, 195] as [number, number, number],
      errorBg:    [254, 242, 242] as [number, number, number],
      border:     [226, 232, 240] as [number, number, number],
    }

    let y = 20

    // ── En-tête ──────────────────────────────────────────────────────────────
    doc.setFillColor(...C.primary)
    doc.rect(0, 0, pageWidth, 36, 'F')

    doc.setTextColor(...C.white)
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('Rapport de mise en service', marginX, 14)

    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...C.primary400)
    doc.text(`Technicien : ${data.technicienName}`, marginX, 22)
    doc.text(`Entreprise : ${data.companyName}`, marginX, 28)
    doc.text(`Genere le : ${data.generatedAt}`, marginX, 34)

    y = 46

    // ── Score global ──────────────────────────────────────────────────────────
    const scoreColor: [number, number, number] =
      data.globalScore >= 80 ? C.ok : data.globalScore >= 50 ? C.warning : C.error

    doc.setFillColor(...C.primary100)
    doc.setDrawColor(...C.border)
    doc.roundedRect(marginX, y, pageWidth - marginX * 2, 14, 2, 2, 'FD')

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...C.textMuted)
    doc.text('Score global de mise en service', marginX + 4, y + 9)

    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...scoreColor)
    doc.setFontSize(12)
    doc.text(`${data.globalScore}%`, pageWidth - marginX - 4, y + 9, { align: 'right' })

    y += 22

    // ── Récapitulatif ─────────────────────────────────────────────────────────
    doc.setTextColor(...C.text)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('Recapitulatif', marginX, y)
    y += 5

    const summaryRows = data.sections.map((s) => [
      s.title,
      s.total > 0 ? `${s.done} / ${s.total}` : '-',
      s.status === 'ok' ? 'OK' : s.status === 'warning' ? 'Incomplet' : 'Probleme',
      s.issues.length === 0 ? '-' : `${s.issues.length} point(s)`,
    ])

    autoTable(doc, {
      startY: y,
      head: [['Section', 'Realise', 'Statut', "Points d'attention"]],
      body: summaryRows,
      theme: 'grid',
      headStyles: { fillColor: C.primary, textColor: C.white, fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 9, textColor: C.text },
      alternateRowStyles: { fillColor: C.primary100 },
      columnStyles: {
        0: { cellWidth: 55 },
        1: { cellWidth: 28, halign: 'center' },
        2: { cellWidth: 28, halign: 'center' },
        3: { cellWidth: 'auto' },
      },
      didParseCell(hookData) {
        if (hookData.section === 'body' && hookData.column.index === 2) {
          const val = hookData.cell.raw as string
          if (val === 'OK') hookData.cell.styles.textColor = C.ok
          else if (val === 'Incomplet') hookData.cell.styles.textColor = C.warning
          else hookData.cell.styles.textColor = C.error
          hookData.cell.styles.fontStyle = 'bold'
        }
      },
      margin: { left: marginX, right: marginX },
    })

    y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10

    // ── Détail par section ────────────────────────────────────────────────────
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...C.text)
    doc.text('Detail par section', marginX, y)
    y += 6

    for (const section of data.sections) {
      if (y > 255) {
        doc.addPage()
        y = 20
      }

      const bgColor =
        section.status === 'ok' ? C.okBg : section.status === 'warning' ? C.warnBg : C.errorBg
      const accentColor =
        section.status === 'ok' ? C.ok : section.status === 'warning' ? C.warning : C.error
      const statusLabel =
        section.status === 'ok' ? 'OK' : section.status === 'warning' ? 'Incomplet' : 'Probleme'

      // Bande titre section
      doc.setFillColor(...bgColor)
      doc.setDrawColor(...C.border)
      doc.rect(marginX, y, pageWidth - marginX * 2, 9, 'FD')

      // Trait coloré gauche
      doc.setFillColor(...accentColor)
      doc.rect(marginX, y, 2, 9, 'F')

      doc.setTextColor(...C.text)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.text(section.title, marginX + 5, y + 6)

      doc.setTextColor(...accentColor)
      doc.setFont('helvetica', 'bold')
      doc.text(statusLabel, pageWidth - marginX - 4, y + 6, { align: 'right' })

      doc.setTextColor(...C.textMuted)
      doc.setFont('helvetica', 'normal')
      const progress = section.total > 0 ? `${section.done}/${section.total}` : '-'
      doc.text(progress, pageWidth - marginX - 28, y + 6, { align: 'right' })

      y += 12

      if (section.issues.length === 0) {
        // N'afficher "Configuration complete" QUE si le statut est réellement OK
        if (section.status === 'ok') {
          doc.setTextColor(...C.ok)
          doc.setFontSize(8.5)
          doc.setFont('helvetica', 'italic')
          doc.text("Configuration complete — aucun point d'attention.", marginX + 5, y)
          y += 7
        } else {
          // Statut warning/error sans issues explicites (ex: 0 appareils)
          const fallbackMsg =
            section.status === 'warning'
              ? 'Configuration incomplète — verifiez cette section.'
              : 'Probleme detecte — action requise.'
          doc.setTextColor(...accentColor)
          doc.setFontSize(8.5)
          doc.setFont('helvetica', 'italic')
          doc.text(fallbackMsg, marginX + 5, y)
          y += 7
        }
      } else {
        for (const issue of section.issues) {
          if (y > 272) {
            doc.addPage()
            y = 20
          }
          doc.setTextColor(...C.textMuted)
          doc.setFont('helvetica', 'normal')
          doc.setFontSize(8.5)
          const lines = doc.splitTextToSize(`• ${issue}`, pageWidth - marginX * 2 - 8)
          doc.text(lines, marginX + 5, y)
          y += lines.length * 5
        }
        y += 3
      }
    }

    // ── Pied de page ──────────────────────────────────────────────────────────
    const pageCount = doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(7.5)
      doc.setTextColor(...C.primary400)
      doc.setFont('helvetica', 'normal')
      doc.text(
        `Page ${i} / ${pageCount} — Rapport genere automatiquement par le systeme`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 7,
        { align: 'center' },
      )
    }

    const dateStr = new Date().toISOString().slice(0, 10)
    doc.save(`rapport-technicien-${dateStr}.pdf`)
  }

  return { isLoading, reportData, buildReport, generatePdf }
}
