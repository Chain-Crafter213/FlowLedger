import { useState } from 'react'
import { useAccount } from 'wagmi'
import { motion } from 'framer-motion'
import {
  Settings as SettingsIcon,
  Database,
  Download,
  Upload,
  Trash2,
  RefreshCw,
  Loader2,
  AlertTriangle,
} from 'lucide-react'
import { AppLayout } from '@/components/AppLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { AddressDisplay } from '@/components/AddressDisplay'
import { useToast } from '@/components/ui/use-toast'
import {
  exportAllData,
  importData,
  clearAllData,
  getSetting,
  setSetting,
} from '@/lib/storage'
import { fetchTransfersViaRPC } from '@/lib/api'
import { downloadFile } from '@/lib/utils'

export default function Settings() {
  const { address } = useAccount()
  const { toast } = useToast()

  const [polygonscanKey, setPolygonscanKey] = useState('')
  const [isSyncing, setIsSyncing] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [isClearing, setIsClearing] = useState(false)

  // Load settings on mount
  useState(() => {
    getSetting('polygonscan_api_key').then((key) => {
      if (key) setPolygonscanKey(key)
    })
  })

  const handleSaveApiKey = async () => {
    await setSetting('polygonscan_api_key', polygonscanKey)
    toast({
      title: 'Saved',
      description: 'API key saved to local storage.',
    })
  }

  const handleSyncHistory = async () => {
    if (!address) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please connect your wallet first.',
      })
      return
    }

    setIsSyncing(true)
    try {
      const result = await fetchTransfersViaRPC(address, 90) // Last 90 days
      
      if (result.error) {
        toast({
          variant: 'destructive',
          title: 'Sync Failed',
          description: result.error,
        })
      } else {
        toast({
          title: 'Sync Complete',
          description: `Imported ${result.count} new transactions.`,
        })
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Sync Failed',
        description: 'Failed to fetch transaction history.',
      })
    } finally {
      setIsSyncing(false)
    }
  }

  const handleExportData = async () => {
    setIsExporting(true)
    try {
      const data = await exportAllData()
      const filename = `flowledger-backup-${new Date().toISOString().split('T')[0]}.json`
      downloadFile(data, filename, 'application/json')
      toast({
        title: 'Export Complete',
        description: 'Your data has been exported.',
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Export Failed',
        description: 'Failed to export data.',
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleImportData = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    try {
      const text = await file.text()
      const result = await importData(text)
      
      if (result.success) {
        toast({
          title: 'Import Complete',
          description: 'Your data has been imported.',
        })
      } else {
        toast({
          variant: 'destructive',
          title: 'Import Failed',
          description: result.error || 'Invalid data format.',
        })
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Import Failed',
        description: 'Failed to import data.',
      })
    } finally {
      setIsImporting(false)
      e.target.value = '' // Reset input
    }
  }

  const handleClearData = async () => {
    setIsClearing(true)
    try {
      await clearAllData()
      toast({
        title: 'Data Cleared',
        description: 'All local data has been deleted.',
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to clear data.',
      })
    } finally {
      setIsClearing(false)
      setShowClearConfirm(false)
    }
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="font-display text-3xl font-bold">Settings</h1>
          <p className="mt-1 text-muted-foreground">
            Manage your account and data
          </p>
        </div>

        {/* Wallet Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Connected Wallet</CardTitle>
            </CardHeader>
            <CardContent>
              {address ? (
                <AddressDisplay address={address} truncate={false} />
              ) : (
                <p className="text-muted-foreground">Not connected</p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Data Sync */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Transaction History
              </CardTitle>
              <CardDescription>
                Import your USDC transaction history from the blockchain
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="apiKey">Polygonscan API Key (Optional)</Label>
                <p className="mb-2 text-sm text-muted-foreground">
                  For faster syncs, add your free API key from polygonscan.com
                </p>
                <div className="flex gap-2">
                  <Input
                    id="apiKey"
                    type="password"
                    value={polygonscanKey}
                    onChange={(e) => setPolygonscanKey(e.target.value)}
                    placeholder="Your API key..."
                  />
                  <Button variant="outline" onClick={handleSaveApiKey}>
                    Save
                  </Button>
                </div>
              </div>

              <Separator />

              <Button
                onClick={handleSyncHistory}
                disabled={isSyncing || !address}
                className="w-full"
              >
                {isSyncing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Sync Last 90 Days
              </Button>
              <p className="text-xs text-muted-foreground">
                This fetches USDC transfers via RPC and stores them locally.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Data Management */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon className="h-5 w-5" />
                Data Management
              </CardTitle>
              <CardDescription>
                Export, import, or clear your local data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Button
                  variant="outline"
                  onClick={handleExportData}
                  disabled={isExporting}
                >
                  {isExporting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  Export All Data
                </Button>

                <div className="relative">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportData}
                    className="absolute inset-0 cursor-pointer opacity-0"
                    disabled={isImporting}
                  />
                  <Button
                    variant="outline"
                    className="w-full"
                    disabled={isImporting}
                  >
                    {isImporting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="mr-2 h-4 w-4" />
                    )}
                    Import Data
                  </Button>
                </div>
              </div>

              <Separator />

              <Button
                variant="destructive"
                onClick={() => setShowClearConfirm(true)}
                className="w-full"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Clear All Local Data
              </Button>
              <p className="text-xs text-muted-foreground">
                This will delete all cached transactions, workers, annotations,
                and settings from this browser.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 text-warning" />
                <div className="space-y-1">
                  <p className="font-medium">Data Storage Notice</p>
                  <p className="text-sm text-muted-foreground">
                    FlowLedger stores all data locally in your browser using
                    IndexedDB. Your data never leaves your device unless you
                    explicitly export it. If you clear your browser data, you
                    will lose your local annotations and cached transactions.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Clear Data Confirmation */}
      <AlertDialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Clear All Data
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all local data including:
              <ul className="mt-2 list-inside list-disc space-y-1">
                <li>Cached transactions</li>
                <li>Workers list</li>
                <li>Annotations and tags</li>
                <li>Payroll runs</li>
                <li>Settings</li>
              </ul>
              <p className="mt-2 font-medium">This action cannot be undone.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isClearing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearData}
              disabled={isClearing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isClearing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Yes, Delete Everything
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  )
}
