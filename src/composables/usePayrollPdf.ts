import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { Payslip } from '@/types/payroll'
import { i18n } from '@/plugins/i18n'

const t = (key: string, params?: Record<string, unknown>) =>
  i18n.global.t(key, params ?? {}) as string

function localeTag(): string {
  return (i18n.global.locale.value as string) === 'en' ? 'en-GB' : 'fr-FR'
}

const PAYMENT_MODE_KEYS: Record<string, string> = {
  monthly: 'payslip.modeMonthly',
  hourly:  'payslip.modeHourly',
  daily:   'payslip.modeDaily',
  weekly:  'payslip.modeWeekly',
  forfait: 'payslip.modeForfait',
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat(localeTag()).format(amount) + ' FCFA'
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString(localeTag())
}

const C = {
  primary:    [30, 41, 59]    as [number, number, number],
  primary400: [148, 163, 184] as [number, number, number],
  primary100: [241, 245, 249] as [number, number, number],
  white:      [255, 255, 255] as [number, number, number],
  text:       [30, 41, 59]    as [number, number, number],
  textMuted:  [100, 116, 139] as [number, number, number],
  green:      [22, 163, 74]   as [number, number, number],
  greenBg:    [240, 253, 244] as [number, number, number],
  red:        [220, 38, 38]   as [number, number, number],
  border:     [226, 232, 240] as [number, number, number],
  amber:      [202, 138, 4]   as [number, number, number],
}

/**
 * Genere le PDF d'une seule fiche de paie et declenche le telechargement.
 */
function renderPayslipPage(doc: jsPDF, slip: Payslip, pageWidth: number, marginX: number): void {
  // ── En-tete ────────────────────────────────────────────────────────────────
  doc.setFillColor(...C.primary)
  doc.rect(0, 0, pageWidth, 40, 'F')

  doc.setTextColor(...C.white)
  doc.setFontSize(15)
  doc.setFont('helvetica', 'bold')
  doc.text(t('payslip.title'), marginX, 13)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...C.primary400)

  const periodLabel = (() => {
    const [y, m] = slip.period.split('-')
    return new Date(Number(y), Number(m) - 1, 1)
      .toLocaleDateString(localeTag(), { month: 'long', year: 'numeric' })
      .toUpperCase()
  })()
  doc.text(`${t('payslip.period')} : ${periodLabel}`, marginX, 21)
  doc.text(t('payslip.rangeFromTo', { start: formatDate(slip.periodStart), end: formatDate(slip.periodEnd) }), marginX, 27)
  doc.text(`${t('payslip.company')} : ${slip.companyName}`, marginX, 33)

  // Matricule en haut a droite
  doc.setFontSize(8)
  doc.setTextColor(...C.primary400)
  doc.text(`${t('payslip.employeeNumber')} : ${slip.employeeNumber}`, pageWidth - marginX, 21, { align: 'right' })
  const modeKey = PAYMENT_MODE_KEYS[slip.paymentMode]
  const modeLabel = modeKey ? t(modeKey) : slip.paymentMode
  doc.text(`${t('payslip.paymentMode')} : ${modeLabel}`, pageWidth - marginX, 27, { align: 'right' })

  let y = 50

  // ── Informations employe ───────────────────────────────────────────────────
  doc.setFillColor(...C.primary100)
  doc.setDrawColor(...C.border)
  doc.rect(marginX, y, pageWidth - marginX * 2, 18, 'FD')

  doc.setTextColor(...C.textMuted)
  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'normal')
  doc.text(t('payslip.nameAndFirstname'), marginX + 3, y + 6)
  doc.text(t('payslip.position'), marginX + 80, y + 6)
  doc.text(t('payslip.site'), marginX + 130, y + 6)

  doc.setTextColor(...C.text)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text(`${slip.employeeFirstName} ${slip.employeeLastName}`, marginX + 3, y + 13)
  doc.setFont('helvetica', 'normal')
  doc.text(slip.employeePosition, marginX + 80, y + 13)
  doc.text(slip.siteName ?? '-', marginX + 130, y + 13)

  y += 26

  // ── Tableau de calcul ──────────────────────────────────────────────────────
  doc.setTextColor(...C.text)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text(t('payslip.calc'), marginX, y)
  y += 4

  const BONUS = t('payslip.bonus')
  const DEDUCTION = t('payslip.deduction')
  const GROSS = t('payslip.grossSalary')

  const rows: (string | number)[][] = [
    [t('payslip.baseSalary'), '', formatAmount(slip.baseSalary)],
  ]

  // Lignes additionnelles (primes etc.)
  if (slip.lines?.length) {
    for (const line of slip.lines) {
      rows.push([
        line.label,
        line.type === 'earning' ? BONUS : DEDUCTION,
        (line.type === 'deduction' ? '-' : '+') + formatAmount(line.amount),
      ])
    }
  }

  if (slip.overtimeAmount > 0) {
    rows.push([t('payslip.overtime', { hours: slip.overtimeHours }), BONUS, `+${formatAmount(slip.overtimeAmount)}`])
  }

  rows.push(['', '', ''])
  rows.push([GROSS, '', formatAmount(slip.grossAmount)])
  rows.push(['', '', ''])

  // Affiche la ligne dès qu'il y a soit une déduction, soit des jours absents (ex: congé payé = jours sans déduction).
  if (slip.absenceDeduction > 0 || slip.absentDays > 0) {
    rows.push([
      t('payslip.absenceLine', { days: slip.absentDays }),
      DEDUCTION,
      slip.absenceDeduction > 0 ? `-${formatAmount(slip.absenceDeduction)}` : formatAmount(0),
    ])
  }
  if (slip.latenessDeduction > 0 || slip.totalLatenessMinutes > 0) {
    rows.push([
      t('payslip.latenessLine', { minutes: slip.totalLatenessMinutes }),
      DEDUCTION,
      slip.latenessDeduction > 0 ? `-${formatAmount(slip.latenessDeduction)}` : formatAmount(0),
    ])
  }

  autoTable(doc, {
    startY: y,
    head: [[t('payslip.colLabel'), t('payslip.colType'), t('payslip.colAmount')]],
    body: rows,
    theme: 'grid',
    headStyles: { fillColor: C.primary, textColor: C.white, fontStyle: 'bold', fontSize: 8.5 },
    bodyStyles: { fontSize: 8.5, textColor: C.text },
    alternateRowStyles: { fillColor: C.primary100 },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 35, halign: 'center' },
      2: { cellWidth: 45, halign: 'right' },
    },
    didParseCell(data) {
      if (data.section === 'body') {
        const raw = String(data.cell.raw ?? '')
        if (raw === GROSS) {
          data.cell.styles.fontStyle = 'bold'
          data.cell.styles.fillColor = C.primary100
        }
        if (raw.startsWith('-')) {
          data.cell.styles.textColor = C.red
        }
        if (raw.startsWith('+')) {
          data.cell.styles.textColor = C.green
        }
        if (data.column.index === 1) {
          if (raw === BONUS) data.cell.styles.textColor = C.green
          if (raw === DEDUCTION) data.cell.styles.textColor = C.red
        }
      }
    },
    margin: { left: marginX, right: marginX },
  })

  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6

  // ── Net a payer (encadre mis en valeur) ────────────────────────────────────
  doc.setFillColor(...C.greenBg)
  doc.setDrawColor(...C.green)
  doc.roundedRect(marginX, y, pageWidth - marginX * 2, 16, 2, 2, 'FD')

  doc.setTextColor(...C.text)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text(t('payslip.netToPay'), marginX + 5, y + 10)

  doc.setTextColor(...C.green)
  doc.setFontSize(14)
  doc.text(formatAmount(slip.netAmount), pageWidth - marginX - 5, y + 10, { align: 'right' })

  y += 24

  // ── Presence ───────────────────────────────────────────────────────────────
  doc.setTextColor(...C.text)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text(t('payslip.presenceRecap'), marginX, y)
  y += 4

  autoTable(doc, {
    startY: y,
    head: [[t('payslip.workedDays'), t('payslip.workedHours'), t('payslip.absences'), t('payslip.latenessTotal')]],
    body: [[
      t('payslip.daysSuffix', { n: slip.workedDays }),
      t('payslip.hoursSuffix', { n: slip.workedHours }),
      t('payslip.daysSuffix', { n: slip.absentDays }),
      t('payslip.minutesSuffix', { n: slip.totalLatenessMinutes }),
    ]],
    theme: 'grid',
    headStyles: { fillColor: C.primary, textColor: C.white, fontStyle: 'bold', fontSize: 8.5 },
    bodyStyles: { fontSize: 9, textColor: C.text, halign: 'center' },
    margin: { left: marginX, right: marginX },
  })

  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10

  // ── Signature ──────────────────────────────────────────────────────────────
  if (y < 240) {
    doc.setDrawColor(...C.border)
    doc.setTextColor(...C.textMuted)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')

    const col1x = marginX
    const col2x = pageWidth / 2 + 5

    doc.line(col1x, y + 18, col1x + 75, y + 18)
    doc.text(t('payslip.signatureEmployer'), col1x, y + 23)

    doc.line(col2x, y + 18, col2x + 75, y + 18)
    doc.text(t('payslip.signatureEmployee'), col2x, y + 23)
  }

  // ── Pied de page ───────────────────────────────────────────────────────────
  const pageH = doc.internal.pageSize.getHeight()
  doc.setFontSize(7)
  doc.setTextColor(...C.primary400)
  doc.text(
    t('payslip.footer', { company: slip.companyName, date: new Date().toLocaleDateString(localeTag()) }),
    pageWidth / 2,
    pageH - 6,
    { align: 'center' },
  )

}

export function generatePayslipPdf(slip: Payslip): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const marginX = 15
  renderPayslipPage(doc, slip, pageWidth, marginX)
  doc.save(`fiche-paie-${slip.employeeNumber}-${slip.period}.pdf`)
}

/**
 * Genere un seul PDF multi-pages pour un lot de fiches (une fiche = une page).
 */
export function generateBatchPayslipPdf(payslips: Payslip[]): void {
  if (!payslips.length) return

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const marginX = 15

  for (let i = 0; i < payslips.length; i++) {
    if (i > 0) doc.addPage()
    renderPayslipPage(doc, payslips[i]!, pageWidth, marginX)
  }

  // Nom de fichier reflète la plage de périodes couvertes par le lot.
  const periods = Array.from(new Set(payslips.map((p) => p.period))).sort()
  const periodLabel =
    periods.length === 1 ? periods[0]! : `${periods[0]!}_a_${periods[periods.length - 1]!}`
  doc.save(`fiches-paie-${periodLabel}-${payslips.length}slips.pdf`)
}

export function usePayrollPdf() {
  return { generatePayslipPdf, generateBatchPayslipPdf }
}
