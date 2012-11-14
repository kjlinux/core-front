import { saveAs } from 'file-saver'

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
