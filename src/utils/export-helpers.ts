import { saveAs } from 'file-saver'
import dayjs from 'dayjs'

// Brand colors from main.css @theme
const BRAND = {
  primary: '1e293b',
  primaryRgb: [30, 41, 59] as [number, number, number],
  primaryLight: 'f8fafc',
  primaryMid: '64748b',
  gray100: 'f1f5f9',
  gray600: '475569',
  white: 'ffffff',
  companyName: 'TANGA GROUP',
} as const

// ─── CSV Export (existing) ───────────────────────────────────────────────────

/**
 * Exports an array of objects to a CSV file and triggers a browser download.
 * @param data - Array of flat objects to export
 * @param filename - Name of the downloaded file (without extension)
 */
export function exportToCsv(data: Record<string, unknown>[], filename: string): void {
  if (data.length === 0) return

  const headers = Object.keys(data[0] ?? {})

  const csvRows: string[] = []

  // Header row
  csvRows.push(headers.map(escapeCell).join(';'))

  // Data rows
  for (const row of data) {
    const values = headers.map((header) => {
      const value = row[header]
      return escapeCell(value === null || value === undefined ? '' : String(value))
    })
    csvRows.push(values.join(';'))
  }

  const csvString = csvRows.join('\n')
  const BOM = '\uFEFF'
  const blob = new Blob([BOM + csvString], { type: 'text/csv;charset=utf-8' })

  saveAs(blob, `${filename}.csv`)
}

function escapeCell(value: string): string {
  if (value.includes('"') || value.includes(';') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

// ─── Excel Export ────────────────────────────────────────────────────────────

export interface ExcelExportOptions {
  filename: string
  title: string
  subtitle?: string
  summaryRows?: { label: string; value: string | number }[]
  columns: { header: string; key: string; width?: number }[]
  data: Record<string, unknown>[]
  sheetName?: string
}

export async function exportToExcel(options: ExcelExportOptions): Promise<void> {
  const { filename, title, subtitle, summaryRows, columns, data, sheetName = 'Rapport' } = options

  const ExcelJS = await import('exceljs')
  const workbook = new ExcelJS.Workbook()
  workbook.creator = BRAND.companyName
  workbook.created = new Date()

  const sheet = workbook.addWorksheet(sheetName)
  const colCount = columns.length

  // --- Row 1: Company name ---
  const companyRow = sheet.addRow([BRAND.companyName])
  sheet.mergeCells(companyRow.number, 1, companyRow.number, colCount)
  const companyCell = companyRow.getCell(1)
  companyCell.font = { bold: true, size: 16, color: { argb: BRAND.white } }
  companyCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND.primary } }
  companyCell.alignment = { horizontal: 'center', vertical: 'middle' }
  companyRow.height = 30

  // --- Row 2: Report title ---
  const titleRow = sheet.addRow([title])
  sheet.mergeCells(titleRow.number, 1, titleRow.number, colCount)
  const titleCell = titleRow.getCell(1)
  titleCell.font = { bold: true, size: 12, color: { argb: BRAND.white } }
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND.primaryMid } }
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
  titleRow.height = 24

  // --- Row 3: Subtitle (optional) ---
  if (subtitle) {
    const subtitleRow = sheet.addRow([subtitle])
    sheet.mergeCells(subtitleRow.number, 1, subtitleRow.number, colCount)
    const subtitleCell = subtitleRow.getCell(1)
    subtitleCell.font = { italic: true, size: 10, color: { argb: BRAND.gray600 } }
    subtitleCell.alignment = { horizontal: 'center' }
  }

  // --- Spacer ---
  sheet.addRow([])

  // --- Summary rows (optional) ---
  if (summaryRows && summaryRows.length > 0) {
    for (const { label, value } of summaryRows) {
      const row = sheet.addRow([label, value])
      row.getCell(1).font = { bold: true, size: 10 }
      row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND.gray100 } }
      row.getCell(2).font = { bold: true, size: 10 }
      row.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND.gray100 } }
    }
    sheet.addRow([])
  }

  // --- Header row ---
  const headerValues = columns.map((c) => c.header)
  const headerRow = sheet.addRow(headerValues)
  const thinBorder = { style: 'thin' as const, color: { argb: BRAND.primaryMid } }
  const borders = { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder }

  headerRow.eachCell((cell) => {
    cell.font = { bold: true, size: 10, color: { argb: BRAND.white } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND.primary } }
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
    cell.border = borders
  })
  headerRow.height = 22

  // --- Data rows ---
  data.forEach((record, index) => {
    const values = columns.map((c) => {
      const v = record[c.key]
      return v === null || v === undefined ? '' : v
    })
    const row = sheet.addRow(values)

    const isAlternate = index % 2 === 1
    row.eachCell((cell) => {
      if (isAlternate) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND.primaryLight } }
      }
      cell.border = borders
      cell.font = { size: 10 }
    })
  })

  // --- Column widths ---
  columns.forEach((col, i) => {
    sheet.getColumn(i + 1).width = col.width ?? 18
  })

  // --- Footer ---
  sheet.addRow([])
  const footerRow = sheet.addRow([`Genere le ${dayjs().format('DD/MM/YYYY')} a ${dayjs().format('HH:mm')}`])
  footerRow.getCell(1).font = { italic: true, size: 8, color: { argb: BRAND.primaryMid } }

  // --- Generate and download ---
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  saveAs(blob, `${filename}.xlsx`)
}

// ─── PDF Export ──────────────────────────────────────────────────────────────

export interface PdfExportOptions {
  filename: string
  title: string
  subtitle?: string
  summaryRows?: { label: string; value: string | number }[]
  columns: { header: string; key: string }[]
  data: Record<string, unknown>[]
  orientation?: 'portrait' | 'landscape'
}

export async function exportToPdf(options: PdfExportOptions): Promise<void> {
  const { filename, title, subtitle, summaryRows, columns, data, orientation = 'landscape' } = options

  const { jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')
  const doc = new jsPDF({ orientation, unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()

  // --- Header band ---
  doc.setFillColor(...BRAND.primaryRgb)
  doc.rect(0, 0, pageWidth, 16, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(BRAND.companyName, pageWidth / 2, 10, { align: 'center' })

  // --- Title ---
  doc.setTextColor(30, 41, 59)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text(title, pageWidth / 2, 24, { align: 'center' })

  let currentY = 30

  // --- Subtitle ---
  if (subtitle) {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(100, 116, 139)
    doc.text(subtitle, pageWidth / 2, currentY, { align: 'center' })
    currentY += 8
  }

  // --- Summary section ---
  if (summaryRows && summaryRows.length > 0) {
    currentY += 2
    doc.setFillColor(241, 245, 249)
    const summaryHeight = summaryRows.length * 7 + 4
    doc.rect(14, currentY - 2, pageWidth - 28, summaryHeight, 'F')

    doc.setFontSize(9)
    doc.setTextColor(30, 41, 59)

    for (const { label, value } of summaryRows) {
      doc.setFont('helvetica', 'bold')
      doc.text(`${label} :`, 18, currentY + 4)
      doc.setFont('helvetica', 'normal')
      doc.text(String(value), 80, currentY + 4)
      currentY += 7
    }
    currentY += 6
  }

  // --- Table ---
  const head = [columns.map((c) => c.header)]
  const body = data.map((record) =>
    columns.map((c) => {
      const v = record[c.key]
      return v === null || v === undefined ? '' : String(v)
    }),
  )

  autoTable(doc, {
    head,
    body,
    startY: currentY,
    headStyles: {
      fillColor: BRAND.primaryRgb,
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'center',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    styles: {
      fontSize: 8,
      cellPadding: 3,
      lineColor: [203, 213, 225],
      lineWidth: 0.1,
    },
    margin: { left: 14, right: 14 },
    didDrawPage: (hookData) => {
      // Footer on each page
      const pageHeight = doc.internal.pageSize.getHeight()
      const pageCount = (doc as unknown as { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages()
      const currentPage = hookData.pageNumber
      doc.setFontSize(7)
      doc.setTextColor(100, 116, 139)
      doc.setFont('helvetica', 'italic')
      doc.text(
        `Page ${currentPage}/${pageCount} - Genere le ${dayjs().format('DD/MM/YYYY')} a ${dayjs().format('HH:mm')}`,
        pageWidth - 14,
        pageHeight - 8,
        { align: 'right' },
      )
    },
  })

  doc.save(`${filename}.pdf`)
}
