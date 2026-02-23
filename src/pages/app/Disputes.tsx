import { useEffect } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi'
import { useLiveQuery } from 'dexie-react-hooks'
import { motion } from 'framer-motion'
import { ShieldAlert, AlertTriangle } from 'lucide-react'
import { AppLayout } from '@/components/AppLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/use-toast'
import { formatUSDC } from '@/lib/usdc'
import { db } from '@/lib/storage'
import { CONTRACT_ADDRESSES } from '@/lib/chain'
import { FlowWagePayrollEscrowABI } from '@/abi/FlowWagePayrollEscrow'

export default function Disputes() {
  const { address } = useAccount()
  const { toast } = useToast()

  // Load local payroll runs to find their on-chain IDs
  const localRuns = useLiveQuery(async () => {
    if (!address) return []
    return db.payrollRuns
      .where('employer').equalsIgnoreCase(address)
      .toArray()
  }, [address])

  // Read total payroll count from contract
  const { data: payrollCount } = useReadContract({
    address: CONTRACT_ADDRESSES.payrollEscrow,
    abi: FlowWagePayrollEscrowABI,
    functionName: 'payrollCount',
    query: { enabled: !!CONTRACT_ADDRESSES.payrollEscrow },
  })

  const { writeContract: revokePayroll, data: revokeHash, isPending: isRevoking } = useWriteContract()
  const { isSuccess: isRevoked } = useWaitForTransactionReceipt({ hash: revokeHash })

  useEffect(() => {
    if (isRevoked) {
      toast({ title: 'Payroll Revoked', description: 'Unclaimed funds have been refunded.' })
      window.location.reload()
    }
  }, [isRevoked])

  const handleRevoke = (payrollId: bigint) => {
    if (!CONTRACT_ADDRESSES.payrollEscrow) return
    revokePayroll({
      address: CONTRACT_ADDRESSES.payrollEscrow,
      abi: FlowWagePayrollEscrowABI,
      functionName: 'revokePayroll',
      args: [payrollId],
      gas: BigInt(200_000),
    })
  }

  const count = Number(payrollCount ?? 0)

  return (
    <AppLayout>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl font-extrabold tracking-tight flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10">
              <ShieldAlert className="h-5 w-5 text-red-500" />
            </div>
            Disputes &amp; Revocations
          </h1>
          <p className="mt-1 text-muted-foreground">
            Review payroll runs on-chain. Revoke unclaimed payments to get refunds.
          </p>
        </motion.div>

        {localRuns === undefined ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
          </div>
        ) : count === 0 && (!localRuns || localRuns.length === 0) ? (
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
              {count} payroll run(s) on-chain. {localRuns?.length ?? 0} saved locally.
            </p>
            {/* Show on-chain payroll IDs from 1 to count */}
            {Array.from({ length: Math.min(count, 20) }, (_, i) => i + 1).map((payrollId, idx) => (
              <PayrollRunCard
                key={payrollId}
                payrollId={BigInt(payrollId)}
                onRevoke={handleRevoke}
                isRevoking={isRevoking}
                delay={idx * 0.08}
              />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}

function PayrollRunCard({
  payrollId,
  onRevoke,
  isRevoking,
  delay,
}: {
  payrollId: bigint
  onRevoke: (payrollId: bigint) => void
  isRevoking: boolean
  delay: number
}) {
  const { address } = useAccount()

  const { data: runData } = useReadContract({
    address: CONTRACT_ADDRESSES.payrollEscrow,
    abi: FlowWagePayrollEscrowABI,
    functionName: 'payrollRuns',
    args: [payrollId],
    query: { enabled: !!CONTRACT_ADDRESSES.payrollEscrow },
  })

  if (!runData) return <Skeleton className="h-20 w-full rounded-xl" />

  const run = runData as any
  const employer = (run.employer ?? run[1] ?? '') as string
  const totalAmount = run.totalAmount ?? run[2] ?? BigInt(0)
  const claimedAmount = run.claimedAmount ?? run[3] ?? BigInt(0)
  const memo = run.memo ?? run[7] ?? 'Payroll Run'
  const revoked = run.revoked ?? run[6] ?? false
  const isMyRun = employer.toLowerCase() === (address ?? '').toLowerCase()

  if (!isMyRun) return null

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between">
            <span>{memo || `Payroll #${payrollId.toString()}`}</span>
            <span className="text-xs text-muted-foreground font-mono">
              {revoked ? '🔴 Revoked' : '🟢 Active'}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 text-sm">
            <span>Total: {formatUSDC(BigInt(totalAmount))}</span>
            <span>Claimed: {formatUSDC(BigInt(claimedAmount))}</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Payroll ID: {payrollId.toString()}
          </p>
          {!revoked && (
            <div className="mt-3 flex gap-2">
              <Button
                size="sm"
                variant="destructive"
                disabled={isRevoking}
                onClick={() => onRevoke(payrollId)}
                className="text-xs"
              >
                <AlertTriangle className="mr-1 h-3 w-3" />
                Revoke &amp; Refund Unclaimed
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
