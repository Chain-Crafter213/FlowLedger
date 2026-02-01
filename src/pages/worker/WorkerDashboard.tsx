import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAccount } from 'wagmi'
import { motion } from 'framer-motion'
import {
  Wallet,
  Clock,
  CheckCircle,
  ArrowRight,
  TrendingUp,
  Download,
} from 'lucide-react'
import { AppLayout } from '@/components/AppLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { AddressDisplay } from '@/components/AddressDisplay'
import { db } from '@/lib/storage'
import { formatUSDC } from '@/lib/utils'

interface PendingPayment {
  id: string
  payrollRunId?: string
  from: string
  amount: bigint
  description?: string
  dueDate?: string
  status: 'pending' | 'claimable' | 'disputed'
}

interface Transfer {
  hash: string
  from: string
  to: string
  value: string
  timestamp: number
}

export default function WorkerDashboard() {
  const { address } = useAccount()
  const [isLoading, setIsLoading] = useState(true)
  const [pendingPayments, setPendingPayments] = useState<PendingPayment[]>([])
  const [recentTransfers, setRecentTransfers] = useState<Transfer[]>([])
  const [totalReceived, setTotalReceived] = useState<bigint>(BigInt(0))
  const [totalPending, setTotalPending] = useState<bigint>(BigInt(0))

  useEffect(() => {
    if (!address) return
    loadDashboardData()
  }, [address])

  const loadDashboardData = async () => {
    if (!address) return
    setIsLoading(true)

    try {
      // Load cached transfers for this worker
      const transfers = await db.cachedTransfers
        .where('to')
        .equalsIgnoreCase(address)
        .reverse()
        .sortBy('timestamp')

      setRecentTransfers(transfers.slice(0, 5))

      // Calculate total received
      const total = transfers.reduce(
        (sum, t) => sum + BigInt(t.value),
        BigInt(0)
      )
      setTotalReceived(total)

      // Load pay requests where this address is the recipient
      const payRequests = await db.payRequests
        .where('workerAddress')
        .equalsIgnoreCase(address)
        .filter((r) => r.status === 'pending' || r.status === 'approved')
        .toArray()

      // Convert pay requests to pending payments
      const pending: PendingPayment[] = payRequests.map((r) => ({
        id: r.id,
        from: r.employerAddress,
        amount: BigInt(r.amount),
        description: r.description,
        dueDate: r.dueDate,
        status: r.status === 'approved' ? 'claimable' : 'pending',
      }))

      setPendingPayments(pending)

      // Calculate total pending
      const pendingTotal = pending.reduce((sum, p) => sum + p.amount, BigInt(0))
      setTotalPending(pendingTotal)
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'claimable':
        return <Badge className="bg-success text-success-foreground">Claimable</Badge>
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>
      case 'disputed':
        return <Badge variant="destructive">Disputed</Badge>
      default:
        return null
    }
  }

  return (
    <AppLayout variant="worker">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="font-display text-3xl font-bold">Dashboard</h1>
          <p className="mt-1 text-muted-foreground">
            View your pending payments and history
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Received
                </CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-32" />
                ) : (
                  <div className="text-2xl font-bold">
                    {formatUSDC(totalReceived)}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Lifetime USDC received
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Pending Payments
                </CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-32" />
                ) : (
                  <div className="text-2xl font-bold">
                    {formatUSDC(totalPending)}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  {pendingPayments.length} payment{pendingPayments.length !== 1 ? 's' : ''} pending
                </p>
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
                <CardTitle className="text-sm font-medium">
                  Claimable Now
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-success" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-32" />
                ) : (
                  <div className="text-2xl font-bold text-success">
                    {formatUSDC(
                      pendingPayments
                        .filter((p) => p.status === 'claimable')
                        .reduce((sum, p) => sum + p.amount, BigInt(0))
                    )}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Ready to claim
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Pending Payments */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Pending Payments</CardTitle>
                  <CardDescription>
                    Payments awaiting claim or approval
                  </CardDescription>
                </div>
                <Link to="/worker/history">
                  <Button variant="ghost" size="sm">
                    View All
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : pendingPayments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <CheckCircle className="mb-2 h-8 w-8 text-muted-foreground" />
                  <p className="text-muted-foreground">No pending payments</p>
                  <p className="text-sm text-muted-foreground">
                    All caught up!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingPayments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {formatUSDC(payment.amount)}
                          </span>
                          {getStatusBadge(payment.status)}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>From:</span>
                          <AddressDisplay address={payment.from} />
                        </div>
                        {payment.description && (
                          <p className="text-sm text-muted-foreground">
                            {payment.description}
                          </p>
                        )}
                      </div>
                      {payment.status === 'claimable' && (
                        <Link to={`/worker/claim/${payment.id}`}>
                          <Button size="sm">
                            Claim
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Payments</CardTitle>
                  <CardDescription>Your recent USDC transfers</CardDescription>
                </div>
                <Link to="/worker/history">
                  <Button variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : recentTransfers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <TrendingUp className="mb-2 h-8 w-8 text-muted-foreground" />
                  <p className="text-muted-foreground">No payment history yet</p>
                  <p className="text-sm text-muted-foreground">
                    Received payments will appear here
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentTransfers.map((transfer) => (
                    <Link
                      key={transfer.hash}
                      to={`/tx/${transfer.hash}`}
                      className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success/10">
                          <TrendingUp className="h-4 w-4 text-success" />
                        </div>
                        <div>
                          <p className="font-medium">
                            +{formatUSDC(BigInt(transfer.value))}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            From: <AddressDisplay address={transfer.from} />
                          </p>
                        </div>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {new Date(transfer.timestamp * 1000).toLocaleDateString()}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid gap-4 sm:grid-cols-2"
        >
          <Link to="/worker/history">
            <Card className="cursor-pointer transition-colors hover:bg-muted/50">
              <CardContent className="flex items-center gap-4 pt-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Payment History</p>
                  <p className="text-sm text-muted-foreground">
                    View and export all payments
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/worker/settings">
            <Card className="cursor-pointer transition-colors hover:bg-muted/50">
              <CardContent className="flex items-center gap-4 pt-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Wallet className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Settings</p>
                  <p className="text-sm text-muted-foreground">
                    Manage your account
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </motion.div>
      </div>
    </AppLayout>
  )
}
