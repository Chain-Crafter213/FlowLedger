import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAccount } from 'wagmi'
import { motion } from 'framer-motion'
import {
  Clock,
  Download,
  Search,
  Filter,
  TrendingUp,
  ExternalLink,
  Calendar,
  Loader2,
} from 'lucide-react'
import { AppLayout } from '@/components/AppLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { AddressDisplay } from '@/components/AddressDisplay'
import { useToast } from '@/components/ui/use-toast'
import { db } from '@/lib/storage'
import { generateCSV, type CSVRow } from '@/lib/csv'
import { formatUSDC } from '@/lib/usdc'
import { downloadFile } from '@/lib/utils'
import { POLYGON_EXPLORER } from '@/lib/chain'

interface Transfer {
  hash: string
  from: string
  to: string
  value: string
  timestamp: number
}

interface LocalAnnotation {
  referenceId: string
  memoText?: string
  tags?: string[]
}

export default function WorkerHistory() {
  const { address } = useAccount()
  const { toast } = useToast()

  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [transfers, setTransfers] = useState<Transfer[]>([])
  const [annotations, setAnnotations] = useState<Map<string, LocalAnnotation>>(new Map())
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  useEffect(() => {
    if (address) loadHistory()
  }, [address])

  const loadHistory = async () => {
    if (!address) return
    setIsLoading(true)

    try {
      // Load all transfers where this address is the recipient
      const txs = await db.cachedTransfers
        .where('to')
        .equalsIgnoreCase(address)
        .reverse()
        .sortBy('timestamp')

      setTransfers(txs)

      // Load annotations
      const annots = await db.annotations.toArray()
      const annotMap = new Map<string, LocalAnnotation>()
      annots.forEach((a) => annotMap.set(a.referenceId, { referenceId: a.referenceId, memoText: a.memoText, tags: a.tags }))
      setAnnotations(annotMap)
    } catch (error) {
      console.error('Failed to load history:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load payment history.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const filteredTransfers = useMemo(() => {
    let filtered = transfers

    // Filter by date range
    if (dateFrom) {
      const fromDate = new Date(dateFrom).getTime() / 1000
      filtered = filtered.filter((t) => t.timestamp >= fromDate)
    }
    if (dateTo) {
      const toDate = new Date(dateTo).getTime() / 1000 + 86400 // End of day
      filtered = filtered.filter((t) => t.timestamp <= toDate)
    }

    // Filter by search query (address or annotation)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((t) => {
        if (t.from.toLowerCase().includes(query)) return true
        if (t.hash.toLowerCase().includes(query)) return true
        const annot = annotations.get(t.hash)
        if (annot?.memoText?.toLowerCase().includes(query)) return true
        if (annot?.tags?.some((tag) => tag.toLowerCase().includes(query)))
          return true
        return false
      })
    }

    return filtered
  }, [transfers, searchQuery, dateFrom, dateTo, annotations])

  const totalReceived = useMemo(() => {
    return filteredTransfers.reduce(
      (sum, t) => sum + BigInt(t.value),
      BigInt(0)
    )
  }, [filteredTransfers])

  const handleExport = async () => {
    setIsExporting(true)

    try {
      const rows: CSVRow[] = filteredTransfers.map((t) => {
        const annot = annotations.get(t.hash)
        return {
          date: new Date(t.timestamp * 1000).toISOString(),
          txHash: t.hash,
          from: t.from,
          to: address || '',
          amountUSDC: formatUSDC(BigInt(t.value)),
          memo: annot?.memoText || '',
          tags: annot?.tags?.join('; ') || '',
          polygonscanLink: `${POLYGON_EXPLORER}/tx/${t.hash}`,
        }
      })

      const csv = generateCSV(rows)
      const filename = `flowledger-payments-${new Date().toISOString().split('T')[0]}.csv`
      downloadFile(csv, filename, 'text/csv')

      toast({
        title: 'Export Complete',
        description: `Exported ${filteredTransfers.length} payments.`,
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Export Failed',
        description: 'Failed to export payment history.',
      })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <AppLayout variant="worker">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold">Payment History</h1>
            <p className="mt-1 text-muted-foreground">
              View and export your received payments
            </p>
          </div>
          <Button onClick={handleExport} disabled={isExporting || isLoading}>
            {isExporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Export CSV
          </Button>
        </div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Filter className="h-5 w-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="sm:col-span-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by address, memo, tag..."
                      className="pl-9"
                    />
                  </div>
                </div>
                <div>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="pl-9"
                      placeholder="From date"
                    />
                  </div>
                </div>
                <div>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="pl-9"
                      placeholder="To date"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid gap-4 sm:grid-cols-2"
        >
          <Card>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
                <TrendingUp className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Total (Filtered)
                </p>
                <p className="text-2xl font-bold">{formatUSDC(totalReceived)}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Payments</p>
                <p className="text-2xl font-bold">{filteredTransfers.length}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Transactions List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Payments</CardTitle>
              <CardDescription>
                {filteredTransfers.length} payment
                {filteredTransfers.length !== 1 ? 's' : ''} found
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : filteredTransfers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Clock className="mb-4 h-12 w-12 text-muted-foreground" />
                  <p className="text-lg font-medium">No payments found</p>
                  <p className="text-muted-foreground">
                    {transfers.length === 0
                      ? 'Your received payments will appear here'
                      : 'Try adjusting your filters'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredTransfers.map((transfer, index) => {
                    const annot = annotations.get(transfer.hash)
                    return (
                      <Link
                        key={transfer.hash}
                        to={`/tx/${transfer.hash}`}
                        className="block"
                      >
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
                        >
                          <div className="flex items-center gap-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10">
                              <TrendingUp className="h-5 w-5 text-success" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">
                                  +{formatUSDC(BigInt(transfer.value))}
                                </span>
                                {annot?.tags?.map((tag) => (
                                  <Badge
                                    key={tag}
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                              <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                                <span>From:</span>
                                <AddressDisplay address={transfer.from} />
                              </div>
                              {annot?.memoText && (
                                <p className="mt-1 text-sm text-muted-foreground">
                                  {annot.memoText}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">
                              {new Date(
                                transfer.timestamp * 1000
                              ).toLocaleDateString()}
                            </p>
                            <a
                              href={`${POLYGON_EXPLORER}/tx/${transfer.hash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="mt-1 flex items-center justify-end gap-1 text-xs text-muted-foreground hover:text-primary"
                            >
                              View on Explorer
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        </motion.div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AppLayout>
  )
}
