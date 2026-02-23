import { useState, useEffect } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi'
import { motion } from 'framer-motion'
import {
  Inbox,
  Send,
  Loader2,
  Check,
  X,
  Clock,
} from 'lucide-react'
import { AppLayout } from '@/components/AppLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AddressDisplay } from '@/components/AddressDisplay'
import { useToast } from '@/components/ui/use-toast'
import { formatUSDC } from '@/lib/usdc'
import { USDC_ADDRESS, USDC_ABI } from '@/lib/usdc'
import { CONTRACT_ADDRESSES } from '@/lib/chain'
import { FlowLedgerPayRequestsABI } from '@/abi/FlowLedgerPayRequests'

interface RequestData {
  id: string
  from: string
  to: string
  amount: bigint
  memo: string
  status: number
  createdAt: bigint
  expiresAt: bigint
  paidAt: bigint
}

function RequestCard({
  req,
  type,
  onPay,
  onCancel,
  isPaying,
  isCancelling,
}: {
  req: RequestData
  type: 'incoming' | 'outgoing'
  onPay?: (id: string, amount: bigint) => void
  onCancel?: (id: string) => void
  isPaying: boolean
  isCancelling: boolean
}) {
  const statusLabels = ['Pending', 'Paid', 'Cancelled', 'Expired']
  const statusColors = ['text-yellow-500', 'text-emerald-500', 'text-red-500', 'text-muted-foreground']
  const status = Number(req.status)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border/60 bg-card/60 p-5 backdrop-blur-sm"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-semibold ${statusColors[status]}`}>
              {statusLabels[status]}
            </span>
            {req.expiresAt > BigInt(0) && status === 0 && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                Expires {new Date(Number(req.expiresAt) * 1000).toLocaleDateString()}
              </span>
            )}
          </div>
          <p className="mt-1 text-2xl font-bold">{formatUSDC(req.amount)}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {type === 'incoming' ? 'From' : 'To'}:
          </p>
          <AddressDisplay
            address={type === 'incoming' ? req.from : req.to}
            showCopy
            showExplorer
          />
          {req.memo && (
            <p className="mt-2 text-sm text-muted-foreground italic">"{req.memo}"</p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            Created: {new Date(Number(req.createdAt) * 1000).toLocaleDateString()}
          </p>
        </div>
        <div className="flex flex-col gap-2">
          {type === 'incoming' && status === 0 && onPay && (
            <Button
              size="sm"
              onClick={() => onPay(req.id, req.amount)}
              disabled={isPaying}
            >
              {isPaying ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Check className="mr-1 h-3 w-3" />}
              Pay
            </Button>
          )}
          {type === 'outgoing' && status === 0 && onCancel && (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onCancel(req.id)}
              disabled={isCancelling}
            >
              {isCancelling ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <X className="mr-1 h-3 w-3" />}
              Cancel
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default function Requests() {
  const { address } = useAccount()
  const { toast } = useToast()
  const [payingId, setPayingId] = useState<string | null>(null)
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  // Read incoming request IDs
  const { data: incomingIds } = useReadContract({
    address: CONTRACT_ADDRESSES.payRequests,
    abi: FlowLedgerPayRequestsABI,
    functionName: 'getIncomingRequests',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!CONTRACT_ADDRESSES.payRequests },
  })

  // Read outgoing request IDs
  const { data: outgoingIds } = useReadContract({
    address: CONTRACT_ADDRESSES.payRequests,
    abi: FlowLedgerPayRequestsABI,
    functionName: 'getOutgoingRequests',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!CONTRACT_ADDRESSES.payRequests },
  })

  // Approve USDC for paying
  const { writeContract: approveUsdc, data: approveHash, isPending: isApproving } = useWriteContract()
  const { isSuccess: isApproveConfirmed } = useWaitForTransactionReceipt({ hash: approveHash })

  // Pay request
  const { writeContract: payRequest, data: payHash, isPending: isPayingTx } = useWriteContract()
  const { isSuccess: isPayConfirmed } = useWaitForTransactionReceipt({ hash: payHash })

  // Cancel request
  const { writeContract: cancelRequest, data: cancelHash, isPending: isCancellingTx } = useWriteContract()
  const { isSuccess: isCancelConfirmed } = useWaitForTransactionReceipt({ hash: cancelHash })

  // When approve confirms → fire payRequest
  useEffect(() => {
    if (isApproveConfirmed && payingId && !payHash && CONTRACT_ADDRESSES.payRequests) {
      payRequest({
        address: CONTRACT_ADDRESSES.payRequests,
        abi: FlowLedgerPayRequestsABI,
        functionName: 'payRequest',
        args: [payingId as `0x${string}`],
      })
    }
  }, [isApproveConfirmed, payingId, payHash])

  useEffect(() => {
    if (isPayConfirmed) {
      toast({ title: 'Paid!', description: 'Payment request fulfilled on-chain.' })
      setPayingId(null)
      // Refresh by reload — simplest approach
      window.location.reload()
    }
  }, [isPayConfirmed])

  useEffect(() => {
    if (isCancelConfirmed) {
      toast({ title: 'Cancelled', description: 'Payment request cancelled.' })
      setCancellingId(null)
      window.location.reload()
    }
  }, [isCancelConfirmed])

  const handlePay = (id: string, amount: bigint) => {
    if (!CONTRACT_ADDRESSES.payRequests) return
    setPayingId(id)
    approveUsdc({
      address: USDC_ADDRESS,
      abi: USDC_ABI,
      functionName: 'approve',
      args: [CONTRACT_ADDRESSES.payRequests, amount],
    })
  }

  const handleCancel = (id: string) => {
    if (!CONTRACT_ADDRESSES.payRequests) return
    setCancellingId(id)
    cancelRequest({
      address: CONTRACT_ADDRESSES.payRequests,
      abi: FlowLedgerPayRequestsABI,
      functionName: 'cancelRequest',
      args: [id as `0x${string}`],
    })
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">Payment Requests</h1>
          <p className="mt-1 text-muted-foreground">
            Manage incoming and outgoing payment requests on-chain
          </p>
        </motion.div>

        <Tabs defaultValue="incoming">
          <TabsList>
            <TabsTrigger value="incoming" className="gap-2">
              <Inbox className="h-4 w-4" />
              Incoming
              {incomingIds && (incomingIds as string[]).length > 0 && (
                <span className="ml-1 rounded-full bg-primary px-1.5 py-0.5 text-[10px] text-white">
                  {(incomingIds as string[]).length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="outgoing" className="gap-2">
              <Send className="h-4 w-4" />
              Outgoing
              {outgoingIds && (outgoingIds as string[]).length > 0 && (
                <span className="ml-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px]">
                  {(outgoingIds as string[]).length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="incoming" className="mt-4">
            {!incomingIds ? (
              <div className="space-y-3">
                {[1, 2].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
              </div>
            ) : (incomingIds as string[]).length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center py-12">
                  <Inbox className="h-10 w-10 text-muted-foreground/40" />
                  <p className="mt-3 font-medium">No incoming requests</p>
                  <p className="text-sm text-muted-foreground">When someone requests payment from you, it will appear here.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {(incomingIds as string[]).length} request(s) — connect on-chain data loads per request
                </p>
                {(incomingIds as string[]).map((id, idx) => (
                  <RequestIdCard
                    key={id}
                    requestId={id}
                    type="incoming"
                    onPay={handlePay}
                    onCancel={undefined}
                    isPaying={payingId === id && (isApproving || isPayingTx)}
                    isCancelling={false}
                    delay={idx * 0.05}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="outgoing" className="mt-4">
            {!outgoingIds ? (
              <div className="space-y-3">
                {[1, 2].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
              </div>
            ) : (outgoingIds as string[]).length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center py-12">
                  <Send className="h-10 w-10 text-muted-foreground/40" />
                  <p className="mt-3 font-medium">No outgoing requests</p>
                  <p className="text-sm text-muted-foreground">Create a payment request to get started.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {(outgoingIds as string[]).map((id, idx) => (
                  <RequestIdCard
                    key={id}
                    requestId={id}
                    type="outgoing"
                    onPay={undefined}
                    onCancel={handleCancel}
                    isPaying={false}
                    isCancelling={cancellingId === id && isCancellingTx}
                    delay={idx * 0.05}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  )
}

/* Sub-component that reads a single request by ID */
function RequestIdCard({
  requestId,
  type,
  onPay,
  onCancel,
  isPaying,
  isCancelling,
  delay,
}: {
  requestId: string
  type: 'incoming' | 'outgoing'
  onPay?: (id: string, amount: bigint) => void
  onCancel?: (id: string) => void
  isPaying: boolean
  isCancelling: boolean
  delay: number
}) {
  const { data, isLoading } = useReadContract({
    address: CONTRACT_ADDRESSES.payRequests,
    abi: FlowLedgerPayRequestsABI,
    functionName: 'getRequest',
    args: [requestId as `0x${string}`],
    query: { enabled: !!CONTRACT_ADDRESSES.payRequests },
  })

  if (isLoading || !data) {
    return <Skeleton className="h-32 w-full rounded-xl" />
  }

  const result = data as any
  const req: RequestData = {
    id: requestId,
    from: result.from ?? result[0],
    to: result.to ?? result[1],
    amount: result.amount ?? result[2],
    memo: result.memo ?? result[3],
    status: Number(result.status ?? result[4]),
    createdAt: result.createdAt ?? result[5],
    expiresAt: result.expiresAt ?? result[6],
    paidAt: result.paidAt ?? result[7],
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
      <RequestCard
        req={req}
        type={type}
        onPay={onPay}
        onCancel={onCancel}
        isPaying={isPaying}
        isCancelling={isCancelling}
      />
    </motion.div>
  )
}
