import { useEffect } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi'
import { motion } from 'framer-motion'
import { ShieldAlert, AlertTriangle } from 'lucide-react'
import { AppLayout } from '@/components/AppLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/use-toast'
import { CONTRACT_ADDRESSES } from '@/lib/chain'
import { FlowWagePayrollEscrowABI } from '@/abi/FlowWagePayrollEscrow'

export default function Disputes() {
  const { address } = useAccount()
  const { toast } = useToast()

  // Get employer runs
  const { data: runIds } = useReadContract({
    address: CONTRACT_ADDRESSES.payrollEscrow,
    abi: FlowWagePayrollEscrowABI,
    functionName: 'getEmployerRuns',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!CONTRACT_ADDRESSES.payrollEscrow },
  })

  const { writeContract: resolveDispute, data: resolveHash, isPending: isResolving } = useWriteContract()
  const { isSuccess: isResolved } = useWaitForTransactionReceipt({ hash: resolveHash })

  useEffect(() => {
    if (isResolved) {
      toast({ title: 'Dispute Resolved', description: 'The dispute has been resolved on-chain.' })
      window.location.reload()
    }
  }, [isResolved])

  const handleResolve = (paymentId: string, releaseToWorker: boolean) => {
    if (!CONTRACT_ADDRESSES.payrollEscrow) return
    resolveDispute({
      address: CONTRACT_ADDRESSES.payrollEscrow,
      abi: FlowWagePayrollEscrowABI,
      functionName: 'resolveDispute',
      args: [paymentId as `0x${string}`, releaseToWorker],
    })
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl font-extrabold tracking-tight flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10">
              <ShieldAlert className="h-5 w-5 text-red-500" />
            </div>
            Disputes
          </h1>
          <p className="mt-1 text-muted-foreground">
            Review and resolve disputed payments from your payroll runs
          </p>
        </motion.div>

        {!runIds ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
          </div>
        ) : (runIds as string[]).length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center py-16">
              <ShieldAlert className="h-12 w-12 text-muted-foreground/30" />
              <p className="mt-4 font-medium">No payroll runs found</p>
              <p className="text-sm text-muted-foreground">Create a payroll run first to see disputes here.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Showing disputes from {(runIds as string[]).length} payroll run(s)
            </p>
            {(runIds as string[]).map((runId, idx) => (
              <RunDisputeCard
                key={runId}
                runId={runId}
                onResolve={handleResolve}
                isResolving={isResolving}
                delay={idx * 0.08}
              />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}

function RunDisputeCard({
  runId,
  onResolve: _onResolve,
  isResolving,
  delay,
}: {
  runId: string
  onResolve: (paymentId: string, releaseToWorker: boolean) => void
  isResolving: boolean
  delay: number
}) {
  const { data: runData } = useReadContract({
    address: CONTRACT_ADDRESSES.payrollEscrow,
    abi: FlowWagePayrollEscrowABI,
    functionName: 'getPayrollRun',
    args: [runId as `0x${string}`],
    query: { enabled: !!CONTRACT_ADDRESSES.payrollEscrow },
  })

  if (!runData) return <Skeleton className="h-20 w-full rounded-xl" />

  const run = runData as any
  const label = run.payPeriodLabel ?? run[4] ?? 'Payroll Run'
  const workerCount = Number(run.workerCount ?? run[2] ?? 0)

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between">
            <span>{label}</span>
            <span className="text-xs text-muted-foreground font-mono">{workerCount} workers</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mb-2">
            Run ID: {runId.slice(0, 10)}…{runId.slice(-8)}
          </p>
          <p className="text-sm text-muted-foreground">
            If disputed payments exist in this run, use the escrow contract to resolve them.
            Release to worker or reclaim funds.
          </p>
          <div className="mt-3 flex gap-2">
            <Button size="sm" variant="outline" disabled={isResolving} className="text-xs">
              <AlertTriangle className="mr-1 h-3 w-3" />
              Check Payments On-Chain
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
