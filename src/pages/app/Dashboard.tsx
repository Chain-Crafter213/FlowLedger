import { Link } from 'react-router-dom'
import { useAccount, useBalance } from 'wagmi'
import { useLiveQuery } from 'dexie-react-hooks'
import { useDynamicContext } from '@dynamic-labs/sdk-react-core'
import { motion } from 'framer-motion'
import {
  Users,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  FileText,
  Clock,
} from 'lucide-react'
import { AppLayout } from '@/components/AppLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { db } from '@/lib/storage'
import { USDC_ADDRESS, formatUSDC } from '@/lib/usdc'
import { formatDateShort } from '@/lib/utils'

export default function Dashboard() {
  const { user } = useDynamicContext()
  const { address, isConnected } = useAccount()
  
  // Get USDC balance
  const { data: usdcBalance, isLoading: balanceLoading } = useBalance({
    address,
    token: USDC_ADDRESS,
  })

  // Get workers count
  const workersCount = useLiveQuery(() => db.workers.count(), [])

  // Get recent transfers
  const recentTransfers = useLiveQuery(async () => {
    if (!address) return []
    return db.cachedTransfers
      .orderBy('timestamp')
      .reverse()
      .filter(t => 
        t.from.toLowerCase() === address.toLowerCase() ||
        t.to.toLowerCase() === address.toLowerCase()
      )
      .limit(5)
      .toArray()
  }, [address])

  // Calculate totals from cached transfers
  const stats = useLiveQuery(async () => {
    if (!address) return { sent: BigInt(0), received: BigInt(0) }
    
    const transfers = await db.cachedTransfers.toArray()
    let sent = BigInt(0)
    let received = BigInt(0)
    
    for (const t of transfers) {
      if (t.from.toLowerCase() === address.toLowerCase()) {
        sent += BigInt(t.value)
      }
      if (t.to.toLowerCase() === address.toLowerCase()) {
        received += BigInt(t.value)
      }
    }
    
    return { sent, received }
  }, [address])

  if (!isConnected) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-20">
          <h2 className="text-xl font-semibold">Connect Your Wallet</h2>
          <p className="mt-2 text-muted-foreground">
            Please connect your wallet to access the dashboard.
          </p>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold">Dashboard</h1>
            <p className="mt-1 text-muted-foreground">
              Welcome back{user?.email ? `, ${user.email}` : ''}
            </p>
          </div>
          <div className="flex gap-3">
            <Link to="/app/payroll/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Payroll
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  USDC Balance
                </CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {balanceLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <p className="text-2xl font-bold">
                    {usdcBalance ? formatUSDC(usdcBalance.value) : '$0.00'}
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Workers
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {workersCount === undefined ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  <p className="text-2xl font-bold">{workersCount}</p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Sent
                </CardTitle>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {stats === undefined ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <p className="text-2xl font-bold">{formatUSDC(stats.sent)}</p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Received
                </CardTitle>
                <ArrowDownRight className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {stats === undefined ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <p className="text-2xl font-bold text-success">
                    {formatUSDC(stats.received)}
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Link to="/app/workers">
            <Card className="cursor-pointer transition-colors hover:bg-accent">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Manage Workers</p>
                  <p className="text-sm text-muted-foreground">
                    Add or edit contractors
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/app/payroll/new">
            <Card className="cursor-pointer transition-colors hover:bg-accent">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success/10">
                  <CreditCard className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="font-medium">Run Payroll</p>
                  <p className="text-sm text-muted-foreground">
                    Pay your team
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/app/export">
            <Card className="cursor-pointer transition-colors hover:bg-accent">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-warning/10">
                  <FileText className="h-6 w-6 text-warning" />
                </div>
                <div>
                  <p className="font-medium">Export Data</p>
                  <p className="text-sm text-muted-foreground">
                    Download CSV or JSON
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentTransfers === undefined ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : recentTransfers.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-muted-foreground">
                  No transactions yet. Import your history in Settings.
                </p>
                <Link to="/app/settings" className="mt-4 inline-block">
                  <Button variant="outline" size="sm">
                    Go to Settings
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentTransfers.map((transfer) => {
                  const isOutgoing = transfer.from.toLowerCase() === address?.toLowerCase()
                  return (
                    <Link
                      key={transfer.txHash}
                      to={`/tx/${transfer.txHash}`}
                      className="block"
                    >
                      <div className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-accent">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                            isOutgoing ? 'bg-muted' : 'bg-success/10'
                          }`}>
                            {isOutgoing ? (
                              <ArrowUpRight className="h-5 w-5 text-muted-foreground" />
                            ) : (
                              <ArrowDownRight className="h-5 w-5 text-success" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">
                              {isOutgoing ? 'Sent' : 'Received'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {formatDateShort(transfer.timestamp)}
                            </p>
                          </div>
                        </div>
                        <p className={`font-semibold ${!isOutgoing ? 'text-success' : ''}`}>
                          {isOutgoing ? '-' : '+'}{formatUSDC(BigInt(transfer.value))}
                        </p>
                      </div>
                    </Link>
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
