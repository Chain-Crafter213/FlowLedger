import { type CachedTransfer } from '../storage/db'
import { formatUnits } from 'viem'
import { BLOCK_EXPLORER_URL } from '../chain'

export interface CSVRow {
  date: string
  txHash: string
  from: string
  to: string
  amountUSDC: string
  memo: string
  tags: string
  polygonscanLink: string
}

export function transferToCSVRow(
  transfer: CachedTransfer,
  memo: string = '',
  tags: string[] = []
): CSVRow {
  const date = new Date(transfer.timestamp * 1000).toISOString()
  const amount = formatUnits(BigInt(transfer.value), 6)
  
  return {
    date,
    txHash: transfer.txHash,
    from: transfer.from,
    to: transfer.to,
    amountUSDC: amount,
    memo,
    tags: tags.join('; '),
    polygonscanLink: `${BLOCK_EXPLORER_URL}/tx/${transfer.txHash}`,
  }
}

export function generateCSV(rows: CSVRow[]): string {
  const headers = ['Date', 'Transaction Hash', 'From', 'To', 'Amount (USDC)', 'Memo', 'Tags', 'Polygonscan Link']
  
  const csvLines = [
    headers.join(','),
    ...rows.map(row => [
      `"${row.date}"`,
      `"${row.txHash}"`,
      `"${row.from}"`,
      `"${row.to}"`,
      row.amountUSDC,
      `"${row.memo.replace(/"/g, '""')}"`,
      `"${row.tags.replace(/"/g, '""')}"`,
      `"${row.polygonscanLink}"`,
    ].join(','))
  ]
  
  return csvLines.join('\n')
}

export function downloadCSV(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
