import { useParams, Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  ExternalLink,
  Clock,
  CheckCircle,
  AlertCircle,
  Users,
} from 'lucide-react'
import { AppLayout } from '@/components/AppLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { AddressDisplay, TxHashDisplay } from '@/components/AddressDisplay'
import { db } from '@/lib/storage'
import { formatUSDC, parseUSDC } from '@/lib/usdc'
import { formatDate } from '@/lib/utils'
import { getExplorerTxUrl } from '@/lib/chain'

export default function PayrollRun() {
  const { runId } = useParams<{ runId: string }>()

  // Get payroll run
  const payrollRun = useLiveQuery(async () => {
    if (!runId) return null
    return db.payrollRuns.where('runId').equals(runId).first()
  }, [runId])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="success">Completed</Badge>
      case 'pending':
        return <Badge variant="warning">Pending</Badge>
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getPaymentStatusIcon = (status: string) => {
    switch (status) {
      case 'claimed':
      case 'paid':
        return <CheckCircle className="h-5 w-5 text-success" />
      case 'disputed':
        return <AlertCircle className="h-5 w-5 text-destructive" />
      default:
        return <Clock className="h-5 w-5 text-warning" />
    }
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <Link
          to="/app"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        {payrollRun === undefined ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-1/2" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : payrollRun === null ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Payroll run not found.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="font-display text-3xl font-bold">
                    Payroll: {payrollRun.payPeriod}
                  </h1>
                  {getStatusBadge(payrollRun.status)}
                </div>
                <p className="mt-1 text-muted-foreground">
                  Created {formatDate(payrollRun.createdAt / 1000)}
                </p>
              </div>
            </div>

            {/* Summary Card */}
            <div className="grid gap-4 sm:grid-cols-3">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="mt-1 text-2xl font-bold">
                    {formatUSDC(parseUSDC(payrollRun.totalAmount))}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Workers</p>
                  <p className="mt-1 text-2xl font-bold">
                    {payrollRun.payments.length}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Status</p>
                  <div className="mt-1">{getStatusBadge(payrollRun.status)}</div>
                </CardContent>
              </Card>
            </div>

            {/* Payments List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Payments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {payrollRun.payments.map((payment, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div className="flex items-center gap-4">
                        {getPaymentStatusIcon(payment.status)}
                        <div>
                          <p className="font-medium">{payment.workerName}</p>
                          <AddressDisplay
                            address={payment.worker}
                            showCopy={false}
                          />
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          {formatUSDC(parseUSDC(payment.amount))}
                        </p>
                        <Badge variant="outline" className="mt-1">
                          {payment.status}
                        </Badge>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Transaction Info */}
            {payrollRun.payments[0]?.txHash && (
              <Card>
                <CardHeader>
                  <CardTitle>Transaction</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <TxHashDisplay hash={payrollRun.payments[0].txHash} />
                    <a
                      href={getExplorerTxUrl(payrollRun.payments[0].txHash)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline" size="sm">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        View on Polygonscan
                      </Button>
                    </a>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </AppLayout>
  )
}
