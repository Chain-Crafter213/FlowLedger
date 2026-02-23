import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAccount } from 'wagmi'
import { useLiveQuery } from 'dexie-react-hooks'
import { motion } from 'framer-motion'
import {
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  RefreshCw,
  Loader2,
} from 'lucide-react'
import { AppLayout } from '@/components/AppLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/use-toast'
import { db } from '@/lib/storage'
import { fetchTransfersViaRPC } from '@/lib/api'
import { formatUSDC } from '@/lib/usdc'
import { formatDateShort } from '@/lib/utils'

export default function History() {
  const { address } = useAccount()
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [direction, setDirection] = useState<'all' | 'sent' | 'received'>('all')
  const [isSyncing, setIsSyncing] = useState(false)
  const hasSynced = useRef(false)

  // Auto-sync on first load
  useEffect(() => {
    if (!address || hasSynced.current) return
    hasSynced.current = true
    syncHistory()
  }, [address])

  const syncHistory = async () => {
    if (!address || isSyncing) return
    setIsSyncing(true)
    try {
      const result = await fetchTransfersViaRPC(address, 90)
      if (result.error) {
        toast({ variant: 'destructive', title: 'Sync Issue', description: result.error })
      } else if (result.count > 0) {
        toast({ title: 'Synced', description: `Found ${result.count} new transaction(s).` })
      }
    } catch {
      toast({ variant: 'destructive', title: 'Sync Failed', description: 'Could not fetch transactions from Polygon.' })
    } finally {
      setIsSyncing(false)
    }
  }

  const transfers = useLiveQuery(async () => {
    if (!address) return []
    let q = db.cachedTransfers.orderBy('timestamp').reverse()
    return q.filter(t => {
      const addr = address.toLowerCase()
      const matchesDirection =
        direction === 'all' ||
        (direction === 'sent' && t.from.toLowerCase() === addr) ||
        (direction === 'received' && t.to.toLowerCase() === addr)
      
      const matchesUser = t.from.toLowerCase() === addr || t.to.toLowerCase() === addr

      const matchesSearch = !search ||
        t.txHash.toLowerCase().includes(search.toLowerCase()) ||
        t.from.toLowerCase().includes(search.toLowerCase()) ||
        t.to.toLowerCase().includes(search.toLowerCase())

      return matchesUser && matchesDirection && matchesSearch
    }).toArray()
  }, [address, direction, search])

  return (
    <AppLayout>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl font-extrabold tracking-tight flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            Transaction History
          </h1>
          <div className="mt-1 flex items-center justify-between">
            <p className="text-muted-foreground">All your USDC transactions on Polygon</p>
            <Button
              variant="outline"
              size="sm"
              onClick={syncHistory}
              disabled={isSyncing}
            >
              {isSyncing ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <RefreshCw className="mr-2 h-3 w-3" />}
              {isSyncing ? 'Syncing...' : 'Sync'}
            </Button>
          </div>
        </motion.div>

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by address or tx hash..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-1">
            {(['all', 'sent', 'received'] as const).map(d => (
              <Button
                key={d}
                size="sm"
                variant={direction === d ? 'default' : 'outline'}
                onClick={() => setDirection(d)}
                className="capitalize"
              >
                {d}
              </Button>
            ))}
          </div>
        </div>

        {/* Results */}
        <Card className="overflow-hidden border-border/60 bg-card/60 backdrop-blur-sm">
          <CardHeader className="border-b border-border/40 pb-3">
            <CardTitle className="text-base">
              {transfers ? `${transfers.length} transactions` : 'Loading...'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {transfers === undefined ? (
              <div className="divide-y divide-border/40">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="flex items-center gap-4 px-5 py-4">
                    <Skeleton className="h-10 w-10 rounded-xl" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3.5 w-24" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            ) : transfers.length === 0 ? (
              <div className="flex flex-col items-center py-16">
                {isSyncing ? (
                  <>
                    <Loader2 className="h-10 w-10 text-primary animate-spin" />
                    <p className="mt-3 font-medium">Syncing transactions from Polygon...</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Fetching your USDC transfer history (last 90 days)
                    </p>
                  </>
                ) : (
                  <>
                    <Clock className="h-10 w-10 text-muted-foreground/30" />
                    <p className="mt-3 font-medium">No transactions found</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Click Sync to fetch your USDC transaction history from Polygon.
                    </p>
                    <Button variant="outline" size="sm" className="mt-4" onClick={syncHistory}>
                      <RefreshCw className="mr-2 h-3 w-3" />
                      Sync Now
                    </Button>
                  </>
                )}
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                {transfers.map((transfer, idx) => {
                  const isOutgoing = transfer.from.toLowerCase() === address?.toLowerCase()
                  return (
                    <motion.div
                      key={transfer.txHash + transfer.hash}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: Math.min(idx * 0.02, 0.5) }}
                    >
                      <Link
                        to={`/tx/${transfer.txHash}`}
                        className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-muted/40"
                      >
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${isOutgoing ? 'bg-orange-500/10' : 'bg-emerald-500/10'}`}>
                          {isOutgoing
                            ? <ArrowUpRight className="h-5 w-5 text-orange-500" />
                            : <ArrowDownRight className="h-5 w-5 text-emerald-500" />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium leading-none">{isOutgoing ? 'Sent USDC' : 'Received USDC'}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{formatDateShort(transfer.timestamp)}</p>
                          <p className="text-xs text-muted-foreground font-mono truncate">
                            {isOutgoing ? transfer.to : transfer.from}
                          </p>
                        </div>
                        <p className={`font-bold tabular-nums ${isOutgoing ? '' : 'text-emerald-500'}`}>
                          {isOutgoing ? '−' : '+'}{formatUSDC(BigInt(transfer.value))}
                        </p>
                      </Link>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
