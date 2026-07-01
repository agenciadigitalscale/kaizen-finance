// Gera e baixa um CSV compatível com Excel pt-BR (separador ; e BOM para acentos).
export function downloadCsv(filename: string, rows: (string | number)[][]) {
  const csv = rows
    .map(row => row.map(cell => {
      const s = String(cell ?? '')
      return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
    }).join(';'))
    .join('\r\n')

  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
