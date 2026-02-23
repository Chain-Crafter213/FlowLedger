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
  id: bigint
  worker: string
  employer: string
  amount: bigint
  description: string
  status: number
  createdAt: bigint
  dueDate: bigint
  rejectionReason: string
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
  const statusLabels = ['Pending', 'Approved', 'Rejected', 'Paid', 'Cancelled']
  const statusColors = ['text-yellow-500', 'text-blue-500', 'text-red-500', 'text-emerald-500', 'text-muted-foreground']
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
            <span className={`text-xs font-semibold ${statusColors[status] ?? 'text-muted-foreground'}`}>
              {statusLabels[status] ?? 'Unknown'}
            </span>
            {req.dueDate > BigInt(0) && status === 0 && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                Due {new Date(Number(req.dueDate) * 1000).toLocaleDateString()}
              </span>
            )}
          </div>
          <p className="mt-1 text-2xl font-bold">{formatUSDC(req.amount)}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {type === 'incoming' ? 'From Worker' : 'To Employer'}:
          </p>
          <AddressDisplay
            address={type === 'incoming' ? req.worker : req.employer}
            showCopy
            showExplorer
          />
          {req.description && (
            <p className="mt-2 text-sm text-muted-foreground italic">"{req.description}"</p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            Created: {new Date(Number(req.createdAt) * 1000).toLocaleDateString()}
          </p>
        </div>
        <div className="flex flex-col gap-2">
          {type === 'incoming' && status === 0 && onPay && (
            <Button
              size="sm"
              onClick={() => onPay(req.id.toString(), req.amount)}
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
              onClick={() => onCancel(req.id.toString())}
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

  // Read incoming request IDs (requests where I'm the employer being asked to pay)
  const { data: incomingIds } = useReadContract({
    address: CONTRACT_ADDRESSES.payRequests,
    abi: FlowLedgerPayRequestsABI,
    functionName: 'getRequestsByEmployer',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!CONTRACT_ADDRESSES.payRequests },
  })

  // Read outgoing request IDs (requests I created as a worker)
  const { data: outgoingIds } = useReadContract({
    address: CONTRACT_ADDRESSES.payRequests,
    abi: FlowLedgerPayRequestsABI,
    functionName: 'getRequestsByWorker',
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
        args: [BigInt(payingId)],
        gas: BigInt(200_000),
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
      gas: BigInt(100_000),
    })
  }

  const handleCancel = (id: string) => {
    if (!CONTRACT_ADDRESSES.payRequests) return
    setCancellingId(id)
    cancelRequest({
      address: CONTRACT_ADDRESSES.payRequests,
      abi: FlowLedgerPayRequestsABI,
      functionName: 'cancelRequest',
      args: [BigInt(id)],
      gas: BigInt(200_000),
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
              {incomingIds && (incomingIds as bigint[]).length > 0 && (
                <span className="ml-1 rounded-full bg-primary px-1.5 py-0.5 text-[10px] text-white">
                  {(incomingIds as bigint[]).length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="outgoing" className="gap-2">
              <Send className="h-4 w-4" />
              Outgoing
              {outgoingIds && (outgoingIds as bigint[]).length > 0 && (
                <span className="ml-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px]">
                  {(outgoingIds as bigint[]).length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="incoming" className="mt-4">
            {!incomingIds ? (
              <div className="space-y-3">
                {[1, 2].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
              </div>
            ) : (incomingIds as bigint[]).length === 0 ? (
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
                  {(incomingIds as bigint[]).length} request(s)
                </p>
                {(incomingIds as bigint[]).map((id, idx) => (
                  <RequestIdCard
                    key={id.toString()}
                    requestId={id}
                    type="incoming"
                    onPay={handlePay}
                    onCancel={undefined}
                    isPaying={payingId === id.toString() && (isApproving || isPayingTx)}
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
            ) : (outgoingIds as bigint[]).length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center py-12">
                  <Send className="h-10 w-10 text-muted-foreground/40" />
                  <p className="mt-3 font-medium">No outgoing requests</p>
                  <p className="text-sm text-muted-foreground">Create a payment request to get started.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {(outgoingIds as bigint[]).map((id, idx) => (
                  <RequestIdCard
                    key={id.toString()}
                    requestId={id}
                    type="outgoing"
                    onPay={undefined}
                    onCancel={handleCancel}
                    isPaying={false}
                    isCancelling={cancellingId === id.toString() && isCancellingTx}
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
  requestId: bigint
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
    args: [requestId],
    query: { enabled: !!CONTRACT_ADDRESSES.payRequests },
  })

  if (isLoading || !data) {
    return <Skeleton className="h-32 w-full rounded-xl" />
  }

  const result = data as any
  // Contract struct: id, worker, employer, amount, description, createdAt, dueDate, status, rejectionReason
  const req: RequestData = {
    id: result.id ?? result[0] ?? requestId,
    worker: result.worker ?? result[1] ?? '',
    employer: result.employer ?? result[2] ?? '',
    amount: result.amount ?? result[3] ?? BigInt(0),
    description: result.description ?? result[4] ?? '',
    createdAt: result.createdAt ?? result[5] ?? BigInt(0),
    dueDate: result.dueDate ?? result[6] ?? BigInt(0),
    status: Number(result.status ?? result[7] ?? 0),
    rejectionReason: result.rejectionReason ?? result[8] ?? '',
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
