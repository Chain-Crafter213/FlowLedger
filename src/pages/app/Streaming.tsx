import { useState, useEffect } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseUnits } from 'viem'
import { motion } from 'framer-motion'
import {
  Waves,
  Plus,
  Loader2,
  Clock,
  XCircle,
  ArrowRight,
} from 'lucide-react'
import { AppLayout } from '@/components/AppLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { AddressDisplay } from '@/components/AddressDisplay'
import { useToast } from '@/components/ui/use-toast'
import { CONTRACT_ADDRESSES } from '@/lib/chain'
import { formatUSDC } from '@/lib/usdc'
import { FlowLedgerStreamingABI } from '@/abi'

const USDC_ADDRESS = '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359'
const USDC_ABI = [
  {
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const

function StreamCard({ streamId, contractAddr }: { streamId: `0x${string}`; contractAddr: `0x${string}` }) {
  const { data: stream, refetch } = useReadContract({
    address: contractAddr,
    abi: FlowLedgerStreamingABI,
    functionName: 'getStream',
    args: [streamId],
  })

  const { data: withdrawable } = useReadContract({
    address: contractAddr,
    abi: FlowLedgerStreamingABI,
    functionName: 'getWithdrawable',
    args: [streamId],
  })

  const { writeContract: cancelStream, data: cancelHash, isPending: isCancelling } = useWriteContract()
  const { isSuccess: isCancelled } = useWaitForTransactionReceipt({ hash: cancelHash })

  useEffect(() => { if (isCancelled) refetch() }, [isCancelled])

  const s = stream as any
  if (!s) return <Skeleton className="h-32 w-full rounded-xl" />

  const worker = s.worker ?? s[1]
  const totalAmount = s.totalAmount ?? s[2]
  const withdrawn = s.withdrawn ?? s[3]
  const startTime = Number(s.startTime ?? s[4])
  const endTime = Number(s.endTime ?? s[5])
  const active = s.active ?? s[6]
  const now = Math.floor(Date.now() / 1000)
  const elapsed = Math.min(now - startTime, endTime - startTime)
  const duration = endTime - startTime
  const pct = duration > 0 ? Math.round((elapsed / duration) * 100) : 0

  return (
    <Card className="overflow-hidden">
      <div className={`h-1 ${active ? 'bg-gradient-to-r from-blue-500 to-cyan-500' : 'bg-muted'}`} />
      <CardContent className="pt-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono text-muted-foreground">Stream #{streamId.toString()}</span>
          <Badge variant={active ? 'default' : 'secondary'}>{active ? 'Active' : 'Ended'}</Badge>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <ArrowRight className="h-3 w-3" />
          <AddressDisplay address={worker} showCopy />
        </div>
        <div className="text-sm">
          <span className="text-muted-foreground">Total: </span>
          <span className="font-semibold">{formatUSDC(BigInt(totalAmount))}</span>
          <span className="mx-2 text-muted-foreground">|</span>
          <span className="text-muted-foreground">Withdrawn: </span>
          <span>{formatUSDC(BigInt(withdrawn))}</span>
        </div>
        {withdrawable !== undefined && (
          <div className="text-sm text-emerald-600 font-medium">
            Claimable: {formatUSDC(BigInt(withdrawable as any))}
          </div>
        )}
        {/* Progress bar */}
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all" style={{ width: `${Math.min(pct, 100)}%` }} />
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{new Date(startTime * 1000).toLocaleDateString()}</span>
          <span>{pct}%</span>
          <span>{new Date(endTime * 1000).toLocaleDateString()}</span>
        </div>
        {active && (
          <Button
            size="sm"
            variant="destructive"
            className="w-full"
            disabled={isCancelling}
            onClick={() => cancelStream({
              address: contractAddr,
              abi: FlowLedgerStreamingABI,
              functionName: 'cancelStream',
              args: [streamId],
            })}
          >
            {isCancelling ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <XCircle className="mr-1 h-3 w-3" />}
            Cancel Stream
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

export default function Streaming() {
  const { address } = useAccount()
  const { toast } = useToast()
  const [showForm, setShowForm] = useState(false)
  const [worker, setWorker] = useState('')
  const [amount, setAmount] = useState('')
  const [durationDays, setDurationDays] = useState('')

  const contractAddr = CONTRACT_ADDRESSES.streaming

  // Read employer streams
  const { data: streamIds, refetch: refetchStreams } = useReadContract({
    address: contractAddr,
    abi: FlowLedgerStreamingABI,
    functionName: 'getEmployerStreams',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!contractAddr },
  })

  // Approve USDC
  const { writeContract: approveUSDC, data: approveHash, isPending: isApproving } = useWriteContract()
  const { isSuccess: isApproved } = useWaitForTransactionReceipt({ hash: approveHash })

  // Create stream
  const { writeContract: createStream, data: createHash, isPending: isCreating } = useWriteContract()
  const { isSuccess: isCreated } = useWaitForTransactionReceipt({ hash: createHash })

  useEffect(() => {
    if (isApproved && contractAddr) {
      const amountBigInt = parseUnits(amount, 6)
      const startTime = BigInt(Math.floor(Date.now() / 1000))
      const endTime = startTime + BigInt(Number(durationDays) * 86400)
      createStream({
        address: contractAddr,
        abi: FlowLedgerStreamingABI,
        functionName: 'createStream',
        args: [worker as `0x${string}`, amountBigInt, startTime, endTime],
      })
    }
  }, [isApproved])

  useEffect(() => {
    if (isCreated) {
      toast({ title: 'Stream Created', description: 'Payment stream is now active.' })
      setShowForm(false)
      setWorker('')
      setAmount('')
      setDurationDays('')
      refetchStreams()
    }
  }, [isCreated])

  const handleCreate = () => {
    if (!contractAddr || !worker || !amount || !durationDays) return
    const amountBigInt = parseUnits(amount, 6)
    approveUSDC({
      address: USDC_ADDRESS,
      abi: USDC_ABI,
      functionName: 'approve',
      args: [contractAddr, amountBigInt],
    })
  }

  const streams = (streamIds as unknown as `0x${string}`[]) ?? []

  return (
    <AppLayout>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-extrabold tracking-tight flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10">
                <Waves className="h-5 w-5 text-cyan-500" />
              </div>
              Payment Streams
            </h1>
            <p className="mt-1 text-muted-foreground">
              Create and manage continuous USDC payment streams to your workers
            </p>
          </div>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="mr-2 h-4 w-4" />
            New Stream
          </Button>
        </motion.div>

        {/* Create stream form */}
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
            <Card>
              <CardHeader>
                <CardTitle>Create New Stream</CardTitle>
                <CardDescription>Set up a continuous USDC payment stream. Funds are locked upfront and streamed linearly.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Worker Address</Label>
                  <Input value={worker} onChange={e => setWorker(e.target.value)} placeholder="0x..." className="mt-1" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Total Amount (USDC)</Label>
                    <Input value={amount} onChange={e => setAmount(e.target.value)} placeholder="1000" type="number" className="mt-1" />
                  </div>
                  <div>
                    <Label>Duration (Days)</Label>
                    <Input value={durationDays} onChange={e => setDurationDays(e.target.value)} placeholder="30" type="number" className="mt-1" />
                  </div>
                </div>
                {amount && durationDays && (
                  <p className="text-sm text-muted-foreground">
                    Rate: ~{(Number(amount) / Number(durationDays)).toFixed(2)} USDC/day
                  </p>
                )}
                <Button onClick={handleCreate} disabled={isApproving || isCreating || !worker || !amount || !durationDays}>
                  {(isApproving || isCreating) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isApproving ? 'Approving USDC...' : isCreating ? 'Creating Stream...' : 'Create Stream'}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Streams grid */}
        {!contractAddr ? (
          <Card><CardContent className="py-8 text-center text-muted-foreground">Streaming contract not configured.</CardContent></Card>
        ) : streams.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Clock className="mx-auto h-12 w-12 text-muted-foreground/30" />
              <p className="mt-4 text-muted-foreground">No payment streams yet.</p>
              <p className="text-sm text-muted-foreground">Create your first stream to get started.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {streams.map(id => (
              <StreamCard key={id.toString()} streamId={id} contractAddr={contractAddr!} />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
