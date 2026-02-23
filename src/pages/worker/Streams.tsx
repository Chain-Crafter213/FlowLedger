import { useEffect } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { motion } from 'framer-motion'
import {
  Waves,
  Download,
  Loader2,
  Clock,
} from 'lucide-react'
import { AppLayout } from '@/components/AppLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { AddressDisplay } from '@/components/AddressDisplay'
import { useToast } from '@/components/ui/use-toast'
import { CONTRACT_ADDRESSES } from '@/lib/chain'
import { formatUSDC } from '@/lib/usdc'
import { FlowLedgerStreamingABI } from '@/abi'

function WorkerStreamCard({ streamId, contractAddr }: { streamId: `0x${string}`; contractAddr: `0x${string}` }) {
  const { toast } = useToast()

  const { data: stream, refetch } = useReadContract({
    address: contractAddr,
    abi: FlowLedgerStreamingABI,
    functionName: 'getStream',
    args: [streamId],
  })

  const { data: withdrawable, refetch: refetchWithdrawable } = useReadContract({
    address: contractAddr,
    abi: FlowLedgerStreamingABI,
    functionName: 'getWithdrawable',
    args: [streamId],
  })

  const { writeContract: withdraw, data: withdrawHash, isPending: isWithdrawing } = useWriteContract()
  const { isSuccess: isWithdrawn } = useWaitForTransactionReceipt({ hash: withdrawHash })

  useEffect(() => {
    if (isWithdrawn) {
      toast({ title: 'Withdrawn', description: 'Funds withdrawn from stream.' })
      refetch()
      refetchWithdrawable()
    }
  }, [isWithdrawn])

  // Auto-refresh withdrawable every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => refetchWithdrawable(), 30000)
    return () => clearInterval(interval)
  }, [])

  const s = stream as any
  if (!s) return <Skeleton className="h-32 w-full rounded-xl" />

  const employer = s.employer ?? s[0]
  const totalAmount = s.totalAmount ?? s[2]
  const withdrawn = s.withdrawn ?? s[3]
  const startTime = Number(s.startTime ?? s[4])
  const endTime = Number(s.endTime ?? s[5])
  const active = s.active ?? s[6]
  const now = Math.floor(Date.now() / 1000)
  const elapsed = Math.min(now - startTime, endTime - startTime)
  const duration = endTime - startTime
  const pct = duration > 0 ? Math.round((elapsed / duration) * 100) : 0
  const claimable = BigInt(withdrawable as any ?? 0n)

  return (
    <Card className="overflow-hidden">
      <div className={`h-1 ${active ? 'bg-gradient-to-r from-emerald-500 to-cyan-500' : 'bg-muted'}`} />
      <CardContent className="pt-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono text-muted-foreground">Stream #{streamId.toString()}</span>
          <Badge variant={active ? 'default' : 'secondary'}>{active ? 'Active' : 'Ended'}</Badge>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">From:</span>
          <AddressDisplay address={employer} showCopy />
        </div>
        <div className="text-sm">
          <span className="text-muted-foreground">Total: </span>
          <span className="font-semibold">{formatUSDC(BigInt(totalAmount))}</span>
          <span className="mx-2 text-muted-foreground">|</span>
          <span className="text-muted-foreground">Claimed: </span>
          <span>{formatUSDC(BigInt(withdrawn))}</span>
        </div>

        {/* Claimable highlight */}
        <div className="rounded-lg bg-emerald-500/10 p-3 text-center">
          <p className="text-xs text-muted-foreground">Available to Withdraw</p>
          <p className="text-xl font-bold text-emerald-600">{formatUSDC(claimable)}</p>
        </div>

        {/* Progress bar */}
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all" style={{ width: `${Math.min(pct, 100)}%` }} />
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{new Date(startTime * 1000).toLocaleDateString()}</span>
          <span>{pct}% streamed</span>
          <span>{new Date(endTime * 1000).toLocaleDateString()}</span>
        </div>

        {claimable > 0n && (
          <Button
            className="w-full"
            disabled={isWithdrawing}
            onClick={() => withdraw({
              address: contractAddr,
              abi: FlowLedgerStreamingABI,
              functionName: 'withdrawFromStream',
              args: [streamId],
            })}
          >
            {isWithdrawing ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Download className="mr-1 h-4 w-4" />}
            Withdraw {formatUSDC(claimable)}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

export default function WorkerStreams() {
  const { address } = useAccount()
  const contractAddr = CONTRACT_ADDRESSES.streaming

  const { data: streamIds } = useReadContract({
    address: contractAddr,
    abi: FlowLedgerStreamingABI,
    functionName: 'getWorkerStreams',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!contractAddr },
  })

  const streams = (streamIds as unknown as `0x${string}`[]) ?? []

  return (
    <AppLayout>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl font-extrabold tracking-tight flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
              <Waves className="h-5 w-5 text-emerald-500" />
            </div>
            My Streams
          </h1>
          <p className="mt-1 text-muted-foreground">
            View and withdraw from your active payment streams
          </p>
        </motion.div>

        {!contractAddr ? (
          <Card><CardContent className="py-8 text-center text-muted-foreground">Streaming contract not configured.</CardContent></Card>
        ) : streams.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Clock className="mx-auto h-12 w-12 text-muted-foreground/30" />
              <p className="mt-4 text-muted-foreground">No streams found.</p>
              <p className="text-sm text-muted-foreground">You will see streams here when an employer creates one for you.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {streams.map(id => (
              <WorkerStreamCard key={id.toString()} streamId={id} contractAddr={contractAddr!} />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
