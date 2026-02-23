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
  Wallet,
  TrendingUp,
  Zap,
  ChevronRight,
} from 'lucide-react'
import { AppLayout } from '@/components/AppLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { db } from '@/lib/storage'
import { USDC_ADDRESS, formatUSDC } from '@/lib/usdc'
import { formatDateShort } from '@/lib/utils'

/* ── Stat card type ── */
interface StatCardProps {
  label: string
  value: string | number
  icon: React.ReactNode
  gradient: string
  iconBg: string
  delay: number
  loading?: boolean
}

function StatCard({ label, value, icon, gradient, iconBg, delay, loading }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: 'spring', stiffness: 260, damping: 24 }}
    >
      <div className={`relative overflow-hidden rounded-2xl border border-white/10 p-5 ${gradient} shadow-lg`}>
        {/* Decorative circle */}
        <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-4 -left-4 h-16 w-16 rounded-full bg-white/5" />

        <div className="relative">
          <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl ${iconBg}`}>
            {icon}
          </div>
          <p className="text-xs font-semibold uppercase tracking-widest text-white/60">{label}</p>
          {loading ? (
            <Skeleton className="mt-1 h-8 w-28 bg-white/20" />
          ) : (
            <p className="mt-0.5 text-2xl font-extrabold text-white">{value}</p>
          )}
        </div>
      </div>
    </motion.div>
  )
}

/* ── Quick action card ── */
interface ActionCardProps {
  to: string
  icon: React.ReactNode
  iconBg: string
  label: string
  description: string
  delay: number
}

function ActionCard({ to, icon, iconBg, label, description, delay }: ActionCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: 'spring', stiffness: 240, damping: 22 }}
      whileHover={{ y: -4, scale: 1.02 }}
    >
      <Link to={to}>
        <Card className="group relative h-full cursor-pointer overflow-hidden border border-border/60 bg-card/60 backdrop-blur-sm transition-shadow hover:shadow-xl">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          <CardContent className="flex items-center gap-4 p-6">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${iconBg} shadow-md`}>
              {icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold">{label}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-1" />
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  )
}

export default function Dashboard() {
  const { user } = useDynamicContext()
  const { address, isConnected } = useAccount()

  const { data: usdcBalance, isLoading: balanceLoading } = useBalance({
    address,
    token: USDC_ADDRESS,
  })

  const workersCount = useLiveQuery(() => db.workers.count(), [])

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

  const stats = useLiveQuery(async () => {
    if (!address) return { sent: BigInt(0), received: BigInt(0) }
    const transfers = await db.cachedTransfers.toArray()
    let sent = BigInt(0)
    let received = BigInt(0)
    for (const t of transfers) {
      if (t.from.toLowerCase() === address.toLowerCase()) sent += BigInt(t.value)
      if (t.to.toLowerCase() === address.toLowerCase()) received += BigInt(t.value)
    }
    return { sent, received }
  }, [address])

  /* Short wallet address */
  const shortAddr = address ? `${address.slice(0, 6)}…${address.slice(-4)}` : ''

  if (!isConnected) {
    return (
      <AppLayout>
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-24"
        >
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <Wallet className="h-8 w-8 text-primary" />
          </div>
          <h2 className="font-display text-2xl font-bold">Connect Your Wallet</h2>
          <p className="mt-2 max-w-xs text-center text-muted-foreground">
            Connect your wallet to access your payroll dashboard and start managing payments.
          </p>
        </motion.div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-8">

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 280, damping: 24 }}
          className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-3xl font-extrabold tracking-tight">Dashboard</h1>
              <span className="hidden sm:inline-flex items-center rounded-full border border-border/60 bg-muted px-2.5 py-0.5 text-xs font-mono text-muted-foreground">
                {shortAddr}
              </span>
            </div>
            <p className="mt-1 text-muted-foreground">
              {user?.email ? `Welcome back, ${user.email}` : 'Welcome back to FlowLedger'}
            </p>
          </div>
          <Link to="/app/payroll/new">
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
              <Button size="lg" className="shadow-lg shadow-primary/30">
                <Plus className="mr-2 h-4 w-4" />
                New Payroll
              </Button>
            </motion.div>
          </Link>
        </motion.div>

        {/* ── Stats Cards ── */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            delay={0.08}
            label="USDC Balance"
            value={usdcBalance ? formatUSDC(usdcBalance.value) : '$0.00'}
            loading={balanceLoading}
            gradient="bg-gradient-to-br from-blue-600 to-blue-800"
            iconBg="bg-white/15"
            icon={<Wallet className="h-5 w-5 text-white" />}
          />
          <StatCard
            delay={0.14}
            label="Workers"
            value={workersCount ?? 0}
            loading={workersCount === undefined}
            gradient="bg-gradient-to-br from-cyan-600 to-cyan-800"
            iconBg="bg-white/15"
            icon={<Users className="h-5 w-5 text-white" />}
          />
          <StatCard
            delay={0.20}
            label="Total Sent"
            value={stats ? formatUSDC(stats.sent) : '$0.00'}
            loading={stats === undefined}
            gradient="bg-gradient-to-br from-orange-500 to-orange-700"
            iconBg="bg-white/15"
            icon={<ArrowUpRight className="h-5 w-5 text-white" />}
          />
          <StatCard
            delay={0.26}
            label="Total Received"
            value={stats ? formatUSDC(stats.received) : '$0.00'}
            loading={stats === undefined}
            gradient="bg-gradient-to-br from-emerald-500 to-emerald-700"
            iconBg="bg-white/15"
            icon={<TrendingUp className="h-5 w-5 text-white" />}
          />
        </div>

        {/* ── Quick Actions ── */}
        <div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground"
          >
            Quick Actions
          </motion.p>
          <div className="grid gap-4 sm:grid-cols-3">
            <ActionCard
              to="/app/workers"
              delay={0.32}
              icon={<Users className="h-6 w-6 text-primary" />}
              iconBg="bg-primary/10"
              label="Manage Workers"
              description="Add or edit contractors"
            />
            <ActionCard
              to="/app/payroll/new"
              delay={0.38}
              icon={<Zap className="h-6 w-6 text-emerald-500" />}
              iconBg="bg-emerald-500/10"
              label="Run Payroll"
              description="Pay your entire team instantly"
            />
            <ActionCard
              to="/app/export"
              delay={0.44}
              icon={<FileText className="h-6 w-6 text-amber-500" />}
              iconBg="bg-amber-500/10"
              label="Export Data"
              description="Download CSV or JSON reports"
            />
          </div>
        </div>

        {/* ── Recent Activity ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.48 }}
        >
          <Card className="overflow-hidden border border-border/60 bg-card/60 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border/40 pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                  <Clock className="h-4 w-4 text-primary" />
                </div>
                Recent Activity
              </CardTitle>
              <Link to="/app/history">
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground">
                  View all <ChevronRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              {recentTransfers === undefined ? (
                <div className="space-y-0 divide-y divide-border/40">
                  {[1, 2, 3].map((i) => (
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
              ) : recentTransfers.length === 0 ? (
                <div className="flex flex-col items-center py-14">
                  <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                    <CreditCard className="h-6 w-6 text-muted-foreground/50" />
                  </div>
                  <p className="font-medium">No transactions yet</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Import your history in Settings to get started.
                  </p>
                  <Link to="/app/settings" className="mt-4">
                    <Button variant="outline" size="sm">Go to Settings</Button>
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-border/40">
                  {recentTransfers.map((transfer, idx) => {
                    const isOutgoing = transfer.from.toLowerCase() === address?.toLowerCase()
                    return (
                      <motion.div
                        key={transfer.txHash}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + idx * 0.06 }}
                      >
                        <Link to={`/tx/${transfer.txHash}`} className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-muted/40">
                          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${isOutgoing ? 'bg-orange-500/10' : 'bg-emerald-500/10'}`}>
                            {isOutgoing
                              ? <ArrowUpRight className="h-5 w-5 text-orange-500" />
                              : <ArrowDownRight className="h-5 w-5 text-emerald-500" />
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium leading-none">{isOutgoing ? 'Sent USDC' : 'Received USDC'}</p>
                            <p className="mt-1 text-xs text-muted-foreground">{formatDateShort(transfer.timestamp)}</p>
                          </div>
                          <div className="text-right">
                            <p className={`font-bold tabular-nums ${isOutgoing ? 'text-foreground' : 'text-emerald-500'}`}>
                              {isOutgoing ? '−' : '+'}{formatUSDC(BigInt(transfer.value))}
                            </p>
                          </div>
                        </Link>
                      </motion.div>
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
