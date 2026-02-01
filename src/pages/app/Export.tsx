import { useState } from 'react'
import { useAccount } from 'wagmi'
import { useLiveQuery } from 'dexie-react-hooks'
import { motion } from 'framer-motion'
import {
  Download,
  FileText,
  FileJson,
  Calendar,
  Loader2,
} from 'lucide-react'
import { AppLayout } from '@/components/AppLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/use-toast'
import { db, type CachedTransfer } from '@/lib/storage'
import { getAnnotationForReference } from '@/lib/search'
import { generateCSV, downloadCSV, transferToCSVRow } from '@/lib/csv'
import { downloadFile } from '@/lib/utils'

export default function Export() {
  const { address } = useAccount()
  const { toast } = useToast()
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [isExporting, setIsExporting] = useState(false)

  // Get transfers
  const transfers = useLiveQuery(async () => {
    if (!address) return []
    return db.cachedTransfers
      .orderBy('timestamp')
      .reverse()
      .filter(t =>
        t.from.toLowerCase() === address.toLowerCase() ||
        t.to.toLowerCase() === address.toLowerCase()
      )
      .toArray()
  }, [address])

  // Get annotations
  const annotations = useLiveQuery(() => db.annotations.toArray(), [])

  const filterTransfers = (transfers: CachedTransfer[]) => {
    let filtered = transfers

    if (startDate) {
      const startTimestamp = new Date(startDate).getTime() / 1000
      filtered = filtered.filter(t => t.timestamp >= startTimestamp)
    }

    if (endDate) {
      const endTimestamp = new Date(endDate).getTime() / 1000 + 86400 // Include end date
      filtered = filtered.filter(t => t.timestamp <= endTimestamp)
    }

    return filtered
  }

  const handleExportCSV = async () => {
    if (!transfers) return

    setIsExporting(true)
    try {
      const filtered = filterTransfers(transfers)
      
      // Get annotations for each transfer
      const rows = await Promise.all(
        filtered.map(async (transfer) => {
          const annotation = await getAnnotationForReference('TX_HASH', transfer.txHash)
          return transferToCSVRow(
            transfer,
            annotation?.memoText || '',
            annotation?.tags || []
          )
        })
      )

      const csv = generateCSV(rows)
      const filename = `flowledger-export-${new Date().toISOString().split('T')[0]}.csv`
      downloadCSV(csv, filename)

      toast({
        title: 'Export Complete',
        description: `Exported ${rows.length} transactions to CSV.`,
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Export Failed',
        description: 'Failed to export CSV. Please try again.',
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportJSON = async () => {
    if (!transfers || !annotations) return

    setIsExporting(true)
    try {
      const filtered = filterTransfers(transfers)
      
      const data = {
        exportedAt: new Date().toISOString(),
        address: address,
        transfers: filtered,
        annotations: annotations.filter(a =>
          filtered.some(t => t.txHash.toLowerCase() === a.referenceId.toLowerCase())
        ),
      }

      const json = JSON.stringify(data, null, 2)
      const filename = `flowledger-export-${new Date().toISOString().split('T')[0]}.json`
      downloadFile(json, filename, 'application/json')

      toast({
        title: 'Export Complete',
        description: `Exported ${filtered.length} transactions to JSON.`,
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Export Failed',
        description: 'Failed to export JSON. Please try again.',
      })
    } finally {
      setIsExporting(false)
    }
  }

  const transferCount = transfers?.length || 0
  const filteredCount = transfers ? filterTransfers(transfers).length : 0

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="font-display text-3xl font-bold">Export Data</h1>
          <p className="mt-1 text-muted-foreground">
            Download your transaction history as CSV or JSON
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Date Range Filter
              </CardTitle>
              <CardDescription>
                Optionally filter exports by date range
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                {filteredCount} of {transferCount} transactions selected
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <Tabs defaultValue="csv" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="csv">CSV Export</TabsTrigger>
            <TabsTrigger value="json">JSON Export</TabsTrigger>
          </TabsList>

          <TabsContent value="csv">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    CSV Export
                  </CardTitle>
                  <CardDescription>
                    Download a spreadsheet-compatible file for accounting
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      The CSV will include: Date, Transaction Hash, From, To,
                      Amount, Memo, Tags, and Polygonscan link.
                    </p>
                    <Button
                      onClick={handleExportCSV}
                      disabled={isExporting || filteredCount === 0}
                      className="w-full"
                    >
                      {isExporting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="mr-2 h-4 w-4" />
                      )}
                      Export {filteredCount} Transactions to CSV
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="json">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileJson className="h-5 w-5" />
                    JSON Export
                  </CardTitle>
                  <CardDescription>
                    Download a complete backup including all metadata
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      The JSON will include all transaction data plus your
                      annotations (memos, tags, metadata).
                    </p>
                    <Button
                      onClick={handleExportJSON}
                      disabled={isExporting || filteredCount === 0}
                      className="w-full"
                    >
                      {isExporting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="mr-2 h-4 w-4" />
                      )}
                      Export {filteredCount} Transactions to JSON
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  )
}
