import { useMemo } from 'react'
import { useAccount } from 'wagmi'
import { useLiveQuery } from 'dexie-react-hooks'
import { motion } from 'framer-motion'
import {
  BarChart3,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Users,
  Activity,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
} from 'recharts'
import { AppLayout } from '@/components/AppLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { db } from '@/lib/storage'
import { formatUSDC } from '@/lib/usdc'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

export default function Analytics() {
  const { address } = useAccount()

  const transfers = useLiveQuery(async () => {
    if (!address) return []
    return db.cachedTransfers
      .where('from').equalsIgnoreCase(address)
      .or('to').equalsIgnoreCase(address)
      .toArray()
  }, [address])

  const payrolls = useLiveQuery(async () => {
    if (!address) return []
    return db.payrollRuns.where('employer').equalsIgnoreCase(address).toArray()
  }, [address])

  const isLoading = transfers === undefined || payrolls === undefined

  // Computed data
  const stats = useMemo(() => {
    if (!transfers || !address) return null

    const sent = transfers.filter(t => t.from.toLowerCase() === address.toLowerCase())
    const received = transfers.filter(t => t.to.toLowerCase() === address.toLowerCase())

    const totalSent = sent.reduce((sum, t) => sum + BigInt(t.value), 0n)
    const totalReceived = received.reduce((sum, t) => sum + BigInt(t.value), 0n)

    // Unique counterparties
    const uniqueAddresses = new Set([
      ...sent.map(t => t.to.toLowerCase()),
      ...received.map(t => t.from.toLowerCase()),
    ])

    return {
      totalSent,
      totalReceived,
      txCount: transfers.length,
      sentCount: sent.length,
      receivedCount: received.length,
      uniqueCounterparties: uniqueAddresses.size,
    }
  }, [transfers, address])

  // Monthly volume chart data
  const monthlyData = useMemo(() => {
    if (!transfers || !address) return []

    const months: Record<string, { month: string; sent: number; received: number }> = {}

    for (const t of transfers) {
      const date = new Date(t.timestamp)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      if (!months[key]) months[key] = { month: key, sent: 0, received: 0 }
      const usdcValue = Number(BigInt(t.value)) / 1e6

      if (t.from.toLowerCase() === address.toLowerCase()) {
        months[key].sent += usdcValue
      } else {
        months[key].received += usdcValue
      }
    }

    return Object.values(months).sort((a, b) => a.month.localeCompare(b.month)).slice(-12)
  }, [transfers, address])

  // Top recipients
  const topRecipients = useMemo(() => {
    if (!transfers || !address) return []

    const sent = transfers.filter(t => t.from.toLowerCase() === address.toLowerCase())
    const recipientMap: Record<string, number> = {}

    for (const t of sent) {
      const to = t.to.toLowerCase()
      recipientMap[to] = (recipientMap[to] || 0) + Number(BigInt(t.value)) / 1e6
    }

    return Object.entries(recipientMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([addr, value]) => ({
        name: `${addr.slice(0, 6)}...${addr.slice(-4)}`,
        value: Math.round(value * 100) / 100,
      }))
  }, [transfers, address])

  // Cumulative spend over time
  const cumulativeData = useMemo(() => {
    if (!transfers || !address) return []

    const sent = transfers
      .filter(t => t.from.toLowerCase() === address.toLowerCase())
      .sort((a, b) => a.timestamp - b.timestamp)

    let cumulative = 0
    return sent.map(t => {
      cumulative += Number(BigInt(t.value)) / 1e6
      return {
        date: new Date(t.timestamp).toLocaleDateString(),
        total: Math.round(cumulative * 100) / 100,
      }
    })
  }, [transfers, address])

  return (
    <AppLayout>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl font-extrabold tracking-tight flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10">
              <BarChart3 className="h-5 w-5 text-violet-500" />
            </div>
            Analytics
          </h1>
          <p className="mt-1 text-muted-foreground">
            Payment volume, spending trends, and worker insights from your transaction history
          </p>
        </motion.div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
          </div>
        ) : !stats ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">Connect wallet to view analytics.</CardContent></Card>
        ) : (
          <>
            {/* Stat Cards */}
            <div className="grid gap-4 md:grid-cols-4">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Total Sent</span>
                      <ArrowUpRight className="h-4 w-4 text-red-500" />
                    </div>
                    <p className="mt-1 text-2xl font-bold">{formatUSDC(stats.totalSent)}</p>
                    <p className="text-xs text-muted-foreground">{stats.sentCount} transactions</p>
                  </CardContent>
                </Card>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Total Received</span>
                      <ArrowDownRight className="h-4 w-4 text-emerald-500" />
                    </div>
                    <p className="mt-1 text-2xl font-bold">{formatUSDC(stats.totalReceived)}</p>
                    <p className="text-xs text-muted-foreground">{stats.receivedCount} transactions</p>
                  </CardContent>
                </Card>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Total Transactions</span>
                      <Activity className="h-4 w-4 text-blue-500" />
                    </div>
                    <p className="mt-1 text-2xl font-bold">{stats.txCount}</p>
                    <p className="text-xs text-muted-foreground">on Polygon</p>
                  </CardContent>
                </Card>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Unique Workers</span>
                      <Users className="h-4 w-4 text-purple-500" />
                    </div>
                    <p className="mt-1 text-2xl font-bold">{stats.uniqueCounterparties}</p>
                    <p className="text-xs text-muted-foreground">counterparties</p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Charts */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Monthly Volume */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Monthly Volume (USDC)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {monthlyData.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">No data yet</p>
                    ) : (
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={monthlyData}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                          <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} />
                          <Tooltip />
                          <Bar dataKey="sent" name="Sent" fill="#ef4444" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="received" name="Received" fill="#10b981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Top Recipients Pie */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Top Recipients
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {topRecipients.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">No data yet</p>
                    ) : (
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie
                            data={topRecipients}
                            cx="50%"
                            cy="50%"
                            outerRadius={90}
                            dataKey="value"
                            nameKey="name"
                            label={({ name, value }) => `${name}: $${value}`}
                          >
                            {topRecipients.map((_, i) => (
                              <Cell key={i} fill={COLORS[i % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(v) => `$${v}`} />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Cumulative Spend */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Cumulative Spending Over Time
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {cumulativeData.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">No data yet</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={250}>
                      <AreaChart data={cumulativeData}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                          <Tooltip formatter={(v) => `$${v}`} />
                        <defs>
                          <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <Area type="monotone" dataKey="total" stroke="#3b82f6" fill="url(#colorTotal)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Payroll Summary */}
            {payrolls && payrolls.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Payroll Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Payroll Runs</p>
                        <p className="text-2xl font-bold">{payrolls.length}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Workers Paid</p>
                        <p className="text-2xl font-bold">
                          {payrolls.reduce((sum: number, p: any) => sum + (p.payments?.length ?? 0), 0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Payroll Volume</p>
                        <p className="text-2xl font-bold">
                          {formatUSDC(payrolls.reduce((sum: bigint, p: any) => sum + BigInt(p.totalAmount || '0'), 0n))}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  )
}
