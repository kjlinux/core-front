import { ref } from 'vue'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { useAuthStore } from '@/stores/auth.store'
import { useCompanyStore } from '@/stores/company.store'
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
  const companyStore = useCompanyStore()
  const siteStore = useSiteStore()
  const departmentStore = useDepartmentStore()
  const employeeStore = useEmployeeStore()
  const cardStore = useCardStore()
  const rfidStore = useRfidDeviceStore()
  const biometricStore = useBiometricStore()
  const qrcodeStore = useQrcodeStore()
  const firmwareStore = useFirmwareStore()

  async function collectData(): Promise<ReportData> {
    // Charger toutes les données en parallèle
    await Promise.all([
      companyStore.fetchCompanies(),
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

    // --- Entreprise ---
    const activeCompanies = companyStore.companies.filter((c) => c.isActive)
    const inactiveCompanies = companyStore.companies.filter((c) => !c.isActive)
    sections.push({
      title: 'Entreprises',
      status: companyStore.companies.length > 0 ? 'ok' : 'error',
      total: companyStore.companies.length,
      done: activeCompanies.length,
      issues: inactiveCompanies.map((c) => `Entreprise inactive : ${c.name}`),
    })

    // --- Sites ---
    const sitesWithDepts = siteStore.sites.filter((s) => s.departments && s.departments.length > 0)
    const sitesWithoutDepts = siteStore.sites.filter((s) => !s.departments || s.departments.length === 0)
    sections.push({
      title: 'Sites',
      status: siteStore.sites.length === 0 ? 'error' : sitesWithoutDepts.length > 0 ? 'warning' : 'ok',
      total: siteStore.sites.length,
      done: sitesWithDepts.length,
      issues: sitesWithoutDepts.map((s) => `Site sans departement : ${s.name}`),
    })

    // --- Départements ---
    const deptsWithManager = departmentStore.departments.filter((d) => d.managerId)
    const deptsWithoutManager = departmentStore.departments.filter((d) => !d.managerId)
    sections.push({
      title: 'Departements',
      status: departmentStore.departments.length === 0 ? 'error' : deptsWithoutManager.length > 0 ? 'warning' : 'ok',
      total: departmentStore.departments.length,
      done: deptsWithManager.length,
      issues: deptsWithoutManager.map((d) => `Departement sans responsable : ${d.name}`),
    })

    // --- Employés ---
    const activeEmployees = employeeStore.employees.filter((e) => e.isActive)
    const inactiveEmployees = employeeStore.employees.filter((e) => !e.isActive)
    sections.push({
      title: 'Employes',
      status: employeeStore.employees.length === 0 ? 'error' : 'ok',
      total: employeeStore.employees.length,
      done: activeEmployees.length,
      issues: inactiveEmployees.map((e) => `Employe inactif : ${e.firstName} ${e.lastName} (${e.employeeNumber})`),
    })

    // --- Cartes RFID ---
    const assignedCards = cardStore.cards.filter((c) => c.employeeId && c.status === 'active')
    const unassignedCards = cardStore.cards.filter((c) => !c.employeeId)
    const blockedCards = cardStore.cards.filter((c) => c.status === 'blocked')
    const employeesWithoutCard = employeeStore.employees.filter((e) => e.isActive && !e.rfidCardId)
    const cardIssues: string[] = [
      ...unassignedCards.map((c) => `Carte non assignee : ${c.uid}`),
      ...blockedCards.map((c) => `Carte bloquee : ${c.uid}${c.blockReason ? ` (${c.blockReason})` : ''}`),
      ...employeesWithoutCard.map((e) => `Employe sans carte RFID : ${e.firstName} ${e.lastName}`),
    ]
    sections.push({
      title: 'Cartes RFID',
      status: cardStore.cards.length === 0 ? 'error' : cardIssues.length > 0 ? 'warning' : 'ok',
      total: employeeStore.employees.filter((e) => e.isActive).length,
      done: assignedCards.length,
      issues: cardIssues,
    })

    // --- Terminaux RFID ---
    const rfidOnline = rfidStore.devices.filter((d) => d.isOnline)
    const rfidOffline = rfidStore.devices.filter((d) => !d.isOnline)
    sections.push({
      title: 'Terminaux RFID',
      status: rfidStore.devices.length === 0 ? 'error' : rfidOffline.length > 0 ? 'warning' : 'ok',
      total: rfidStore.devices.length,
      done: rfidOnline.length,
      issues: rfidOffline.map((d) => `Terminal RFID hors ligne : ${d.name} (${d.serialNumber})`),
    })

    // --- Terminaux biométriques ---
    const bioOnline = biometricStore.devices.filter((d) => d.isOnline)
    const bioOffline = biometricStore.devices.filter((d) => !d.isOnline)
    sections.push({
      title: 'Terminaux biometriques',
      status: biometricStore.devices.length === 0 ? 'warning' : bioOffline.length > 0 ? 'warning' : 'ok',
      total: biometricStore.devices.length,
      done: bioOnline.length,
      issues: bioOffline.map((d) => `Terminal biometrique hors ligne : ${d.name} (${d.serialNumber})`),
    })

    // --- Enrollements biométriques ---
    const enrolledOk = biometricStore.enrollments.filter((e) => e.status === 'enrolled')
    const enrolledFailed = biometricStore.enrollments.filter((e) => e.status === 'failed')
    const enrolledPending = biometricStore.enrollments.filter((e) => e.status === 'pending')
    const employeesNotEnrolled = employeeStore.employees.filter((e) => e.isActive && !e.biometricEnrolled)
    const enrollmentIssues: string[] = [
      ...enrolledFailed.map((e) => `Enrolement echoue : ${e.employeeName}`),
      ...enrolledPending.map((e) => `Enrolement en attente : ${e.employeeName}`),
      ...employeesNotEnrolled.map((e) => `Employe non enrole : ${e.firstName} ${e.lastName}`),
    ]
    sections.push({
      title: 'Enrolements biometriques',
      status: enrolledFailed.length > 0 ? 'error' : enrolledPending.length > 0 || employeesNotEnrolled.length > 0 ? 'warning' : 'ok',
      total: employeeStore.employees.filter((e) => e.isActive).length,
      done: enrolledOk.length,
      issues: enrollmentIssues,
    })

    // --- QR Codes ---
    const activeQr = qrcodeStore.qrCodes.filter((q) => q.isActive)
    const inactiveQr = qrcodeStore.qrCodes.filter((q) => !q.isActive)
    const employeesWithoutQr = employeeStore.employees.filter(
      (e) => e.isActive && !qrcodeStore.qrCodes.some((q) => q.employeeId === e.id && q.isActive),
    )
    const qrIssues: string[] = [
      ...inactiveQr.map((q) => `QR code revoque : ${q.employeeName}`),
      ...employeesWithoutQr.map((e) => `Employe sans QR code actif : ${e.firstName} ${e.lastName}`),
    ]
    sections.push({
      title: 'QR Codes pointage',
      status: qrIssues.length === 0 ? 'ok' : employeesWithoutQr.length > 0 ? 'warning' : 'ok',
      total: employeeStore.employees.filter((e) => e.isActive).length,
      done: activeQr.length,
      issues: qrIssues,
    })

    // --- Firmware ---
    const devicesOutdated = firmwareStore.deviceStatuses.filter(
      (d) => d.targetVersion && d.currentVersion !== d.targetVersion && d.updateStatus !== 'success',
    )
    const devicesFailed = firmwareStore.deviceStatuses.filter((d) => d.updateStatus === 'failed')
    const firmwareIssues: string[] = [
      ...devicesFailed.map((d) => `Mise a jour echouee : ${d.deviceName}`),
      ...devicesOutdated
        .filter((d) => d.updateStatus !== 'failed')
        .map((d) => `Firmware non a jour : ${d.deviceName} (actuel: ${d.currentVersion || '?'}, cible: ${d.targetVersion})`),
    ]
    sections.push({
      title: 'Mises a jour firmware',
      status: devicesFailed.length > 0 ? 'error' : devicesOutdated.length > 0 ? 'warning' : 'ok',
      total: firmwareStore.deviceStatuses.length,
      done: firmwareStore.deviceStatuses.filter((d) => d.updateStatus === 'success' || (!d.targetVersion)).length,
      issues: firmwareIssues,
    })

    // Score global (% de sections OK)
    const okSections = sections.filter((s) => s.status === 'ok').length
    const globalScore = sections.length > 0 ? Math.round((okSections / sections.length) * 100) : 0

    const companyName = auth.user?.companyName || companyStore.companies[0]?.name || 'Entreprise'

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
    let y = 20

    // ---- En-tête ----
    doc.setFillColor(30, 64, 175) // bleu
    doc.rect(0, 0, pageWidth, 38, 'F')

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text('Rapport de mise en service', marginX, 16)

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Technicien : ${data.technicienName}`, marginX, 24)
    doc.text(`Entreprise : ${data.companyName}`, marginX, 30)
    doc.text(`Genere le : ${data.generatedAt}`, marginX, 36)

    y = 48

    // ---- Score global ----
    const scoreColor: [number, number, number] =
      data.globalScore >= 80 ? [22, 163, 74] : data.globalScore >= 50 ? [234, 179, 8] : [220, 38, 38]
    doc.setDrawColor(...scoreColor)
    doc.setFillColor(...scoreColor)
    doc.roundedRect(marginX, y, pageWidth - marginX * 2, 18, 3, 3, 'FD')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text(`Score global de mise en service : ${data.globalScore}%`, marginX + 5, y + 11)

    y += 26

    // ---- Résumé par section ----
    doc.setTextColor(30, 41, 59)
    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.text('Recapitulatif', marginX, y)
    y += 6

    const summaryRows = data.sections.map((s) => [
      s.title,
      `${s.done} / ${s.total}`,
      s.status === 'ok' ? 'OK' : s.status === 'warning' ? 'Incomplet' : 'Probleme',
      s.issues.length === 0 ? '-' : `${s.issues.length} point(s)`,
    ])

    autoTable(doc, {
      startY: y,
      head: [['Section', 'Realise', 'Statut', 'Points d\'attention']],
      body: summaryRows,
      theme: 'grid',
      headStyles: { fillColor: [30, 64, 175], textColor: 255, fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 55 },
        1: { cellWidth: 30, halign: 'center' },
        2: { cellWidth: 30, halign: 'center' },
        3: { cellWidth: 'auto' },
      },
      didParseCell(hookData) {
        if (hookData.section === 'body' && hookData.column.index === 2) {
          const val = hookData.cell.raw as string
          if (val === 'OK') hookData.cell.styles.textColor = [22, 163, 74]
          else if (val === 'Incomplet') hookData.cell.styles.textColor = [161, 98, 7]
          else hookData.cell.styles.textColor = [220, 38, 38]
          hookData.cell.styles.fontStyle = 'bold'
        }
      },
      margin: { left: marginX, right: marginX },
    })

    y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10

    // ---- Détail par section ----
    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(30, 41, 59)
    doc.text('Detail par section', marginX, y)
    y += 6

    for (const section of data.sections) {
      // Vérification saut de page
      if (y > 255) {
        doc.addPage()
        y = 20
      }

      // Titre de section avec couleur statut
      const bgColor: [number, number, number] =
        section.status === 'ok' ? [240, 253, 244] : section.status === 'warning' ? [254, 252, 232] : [254, 242, 242]
      const borderColor: [number, number, number] =
        section.status === 'ok' ? [22, 163, 74] : section.status === 'warning' ? [234, 179, 8] : [220, 38, 38]
      const statusLabel = section.status === 'ok' ? 'OK' : section.status === 'warning' ? 'INCOMPLET' : 'PROBLEME'

      doc.setFillColor(...bgColor)
      doc.setDrawColor(...borderColor)
      doc.roundedRect(marginX, y, pageWidth - marginX * 2, 10, 2, 2, 'FD')

      doc.setTextColor(30, 41, 59)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text(section.title, marginX + 3, y + 7)

      doc.setTextColor(...borderColor)
      doc.setFont('helvetica', 'bold')
      doc.text(statusLabel, pageWidth - marginX - 5, y + 7, { align: 'right' })

      doc.setTextColor(75, 85, 99)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      const progress = section.total > 0 ? `${section.done}/${section.total} realise(s)` : 'Aucun element'
      doc.text(progress, pageWidth - marginX - 40, y + 7, { align: 'right' })

      y += 14

      if (section.issues.length === 0) {
        doc.setTextColor(22, 163, 74)
        doc.setFontSize(9)
        doc.setFont('helvetica', 'italic')
        doc.text('Aucun point d\'attention — configuration complete.', marginX + 4, y)
        y += 7
      } else {
        for (const issue of section.issues) {
          if (y > 270) {
            doc.addPage()
            y = 20
          }
          doc.setTextColor(127, 29, 29)
          doc.setFont('helvetica', 'normal')
          doc.setFontSize(8.5)
          const lines = doc.splitTextToSize(`• ${issue}`, pageWidth - marginX * 2 - 8)
          doc.text(lines, marginX + 4, y)
          y += lines.length * 5
        }
        y += 2
      }
    }

    // ---- Pied de page ----
    const pageCount = doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.setTextColor(148, 163, 184)
      doc.setFont('helvetica', 'normal')
      doc.text(
        `Page ${i} / ${pageCount} — Rapport genere automatiquement par le systeme`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 8,
        { align: 'center' },
      )
    }

    // Nom du fichier
    const dateStr = new Date().toISOString().slice(0, 10)
    doc.save(`rapport-technicien-${dateStr}.pdf`)
  }

  return { isLoading, reportData, buildReport, generatePdf }
}
