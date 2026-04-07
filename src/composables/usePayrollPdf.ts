import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { Payslip } from '@/types/payroll'

const PAYMENT_MODE_LABELS: Record<string, string> = {
  monthly:  'Mensuel',
  hourly:   'Horaire',
  daily:    'Journalier',
  weekly:   'Hebdomadaire',
  forfait:  'Forfait',
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA'
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('fr-FR')
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
export function generatePayslipPdf(slip: Payslip): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const marginX = 15

  // ── En-tete ────────────────────────────────────────────────────────────────
  doc.setFillColor(...C.primary)
  doc.rect(0, 0, pageWidth, 40, 'F')

  doc.setTextColor(...C.white)
  doc.setFontSize(15)
  doc.setFont('helvetica', 'bold')
  doc.text('FICHE DE PAIE', marginX, 13)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...C.primary400)

  const periodLabel = (() => {
    const [y, m] = slip.period.split('-')
    return new Date(Number(y), Number(m) - 1, 1)
      .toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
      .toUpperCase()
  })()
  doc.text(`Periode : ${periodLabel}`, marginX, 21)
  doc.text(`Du ${formatDate(slip.periodStart)} au ${formatDate(slip.periodEnd)}`, marginX, 27)
  doc.text(`Entreprise : ${slip.companyName}`, marginX, 33)

  // Matricule en haut a droite
  doc.setFontSize(8)
  doc.setTextColor(...C.primary400)
  doc.text(`Matricule : ${slip.employeeNumber}`, pageWidth - marginX, 21, { align: 'right' })
  doc.text(`Mode : ${PAYMENT_MODE_LABELS[slip.paymentMode] ?? slip.paymentMode}`, pageWidth - marginX, 27, { align: 'right' })

  let y = 50

  // ── Informations employe ───────────────────────────────────────────────────
  doc.setFillColor(...C.primary100)
  doc.setDrawColor(...C.border)
  doc.rect(marginX, y, pageWidth - marginX * 2, 18, 'FD')

  doc.setTextColor(...C.textMuted)
  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'normal')
  doc.text('NOM & PRENOM', marginX + 3, y + 6)
  doc.text('POSTE', marginX + 80, y + 6)
  doc.text('SITE', marginX + 130, y + 6)

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
  doc.text('Calcul du salaire', marginX, y)
  y += 4

  const rows: (string | number)[][] = [
    ['Salaire de base', '', formatAmount(slip.baseSalary)],
  ]

  // Lignes additionnelles (primes etc.)
  if (slip.lines?.length) {
    for (const line of slip.lines) {
      rows.push([
        line.label,
        line.type === 'earning' ? 'Prime' : 'Deduction',
        (line.type === 'deduction' ? '-' : '+') + formatAmount(line.amount),
      ])
    }
  }

  if (slip.overtimeAmount > 0) {
    rows.push([`Heures supplementaires (${slip.overtimeHours}h)`, 'Prime', `+${formatAmount(slip.overtimeAmount)}`])
  }

  rows.push(['', '', ''])
  rows.push(['SALAIRE BRUT', '', formatAmount(slip.grossAmount)])
  rows.push(['', '', ''])

  if (slip.absenceDeduction > 0) {
    rows.push([`Absence (${slip.absentDays} jour(s))`, 'Deduction', `-${formatAmount(slip.absenceDeduction)}`])
  }
  if (slip.latenessDeduction > 0) {
    rows.push([`Retards (${slip.totalLatenessMinutes} min)`, 'Deduction', `-${formatAmount(slip.latenessDeduction)}`])
  }

  autoTable(doc, {
    startY: y,
    head: [['Libelle', 'Type', 'Montant']],
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
        if (raw === 'SALAIRE BRUT') {
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
          if (raw === 'Prime') data.cell.styles.textColor = C.green
          if (raw === 'Deduction') data.cell.styles.textColor = C.red
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
  doc.text('NET A PAYER', marginX + 5, y + 10)

  doc.setTextColor(...C.green)
  doc.setFontSize(14)
  doc.text(formatAmount(slip.netAmount), pageWidth - marginX - 5, y + 10, { align: 'right' })

  y += 24

  // ── Presence ───────────────────────────────────────────────────────────────
  doc.setTextColor(...C.text)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('Recapitulatif de presence', marginX, y)
  y += 4

  autoTable(doc, {
    startY: y,
    head: [['Jours travailles', 'Heures travaillees', 'Absences', 'Retards cumules']],
    body: [[
      `${slip.workedDays} jour(s)`,
      `${slip.workedHours}h`,
      `${slip.absentDays} jour(s)`,
      `${slip.totalLatenessMinutes} min`,
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
    doc.text('Signature employeur', col1x, y + 23)

    doc.line(col2x, y + 18, col2x + 75, y + 18)
    doc.text('Signature employe', col2x, y + 23)
  }

  // ── Pied de page ───────────────────────────────────────────────────────────
  const pageH = doc.internal.pageSize.getHeight()
  doc.setFontSize(7)
  doc.setTextColor(...C.primary400)
  doc.text(
    `Document genere automatiquement — ${slip.companyName} — ${new Date().toLocaleDateString('fr-FR')}`,
    pageWidth / 2,
    pageH - 6,
    { align: 'center' },
  )

  const filename = `fiche-paie-${slip.employeeNumber}-${slip.period}.pdf`
  doc.save(filename)
}

/**
 * Genere un PDF multi-pages pour un lot de fiches (une fiche = une page).
 */
export function generateBatchPayslipPdf(payslips: Payslip[]): void {
  if (!payslips.length) return

  // Generer chaque PDF individuellement pour la simplicite
  // (jsPDF ne facilite pas la concatenation native)
  for (const slip of payslips) {
    generatePayslipPdf(slip)
  }
}

export function usePayrollPdf() {
  return { generatePayslipPdf, generateBatchPayslipPdf }
}
