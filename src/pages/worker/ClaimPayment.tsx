import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Wallet,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Clock,
  FileText,
  Shield,
} from 'lucide-react'
import { AppLayout } from '@/components/AppLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { AddressDisplay } from '@/components/AddressDisplay'
import { useToast } from '@/components/ui/use-toast'
import { db } from '@/lib/storage'
import { formatUSDC } from '@/lib/usdc'
import { FlowWagePayrollEscrowABI } from '@/abi'
import { CONTRACT_ADDRESSES } from '@/lib/chain'

// Use deployed escrow contract address (has claimPayment and disputePayment)
const ESCROW_ADDRESS = CONTRACT_ADDRESSES.payrollEscrow || '0x0000000000000000000000000000000000000000' as `0x${string}`

interface PaymentDetails {
  id: string
  from: string
  amount: bigint
  description?: string
  dueDate?: string
  createdAt: string
  status: 'pending' | 'claimable' | 'disputed' | 'claimed'
  payrollRunId?: string
  attestationId?: string
}

export default function ClaimPayment() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { address, isConnected } = useAccount()
  const { toast } = useToast()

  const [isLoading, setIsLoading] = useState(true)
  const [payment, setPayment] = useState<PaymentDetails | null>(null)
  const [showDisputeDialog, setShowDisputeDialog] = useState(false)
  const [disputeReason, setDisputeReason] = useState('')

  // Claim transaction
  const {
    data: claimHash,
    writeContract: writeClaim,
    isPending: isClaimPending,
  } = useWriteContract()

  const { isLoading: isClaimConfirming, isSuccess: isClaimSuccess } =
    useWaitForTransactionReceipt({
      hash: claimHash,
    })

  // Dispute transaction
  const {
    data: disputeHash,
    writeContract: writeDispute,
    isPending: isDisputePending,
  } = useWriteContract()

  const { isLoading: isDisputeConfirming, isSuccess: isDisputeSuccess } =
    useWaitForTransactionReceipt({
      hash: disputeHash,
    })

  useEffect(() => {
    if (id) loadPaymentDetails()
  }, [id])

  useEffect(() => {
    if (isClaimSuccess) {
      toast({
        title: 'Payment Claimed!',
        description: 'USDC has been transferred to your wallet.',
      })
      // Update local status
      if (payment) {
        setPayment({ ...payment, status: 'claimed' })
        db.payRequests.update(payment.id, { status: 'claimed' })
      }
    }
  }, [isClaimSuccess])

  useEffect(() => {
    if (isDisputeSuccess) {
      toast({
        title: 'Dispute Submitted',
        description: 'Your dispute has been recorded on-chain.',
      })
      setShowDisputeDialog(false)
      if (payment) {
        setPayment({ ...payment, status: 'disputed' })
        db.payRequests.update(payment.id, { status: 'disputed' })
      }
    }
  }, [isDisputeSuccess])

  const loadPaymentDetails = async () => {
    if (!id) return
    setIsLoading(true)

    try {
      const request = await db.payRequests.get(id)
      if (request) {
        setPayment({
          id: request.id,
          from: request.employerAddress,
          amount: BigInt(request.amount),
          description: request.description,
          dueDate: request.dueDate,
          createdAt: request.createdAt,
          status: request.status as PaymentDetails['status'],
          payrollRunId: request.payrollRunId,
        })
      }
    } catch (error) {
      console.error('Failed to load payment:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load payment details.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleClaim = async () => {
    if (!payment || !address) return

    try {
      writeClaim({
        address: ESCROW_ADDRESS as `0x${string}`,
        abi: FlowWagePayrollEscrowABI,
        functionName: 'claimPayment',
        args: [payment.id as `0x${string}`],
      })
    } catch (error) {
      console.error('Claim error:', error)
      toast({
        variant: 'destructive',
        title: 'Transaction Failed',
        description: 'Failed to claim payment.',
      })
    }
  }

  const handleDispute = async () => {
    if (!payment || !address || !disputeReason.trim()) return

    try {
      writeDispute({
        address: ESCROW_ADDRESS as `0x${string}`,
        abi: FlowWagePayrollEscrowABI,
        functionName: 'disputePayment',
        args: [payment.id as `0x${string}`, disputeReason],
      })
    } catch (error) {
      console.error('Dispute error:', error)
      toast({
        variant: 'destructive',
        title: 'Transaction Failed',
        description: 'Failed to submit dispute.',
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'claimable':
        return <Badge className="bg-success text-success-foreground">Claimable</Badge>
      case 'pending':
        return <Badge variant="secondary">Pending Approval</Badge>
      case 'disputed':
        return <Badge variant="destructive">Disputed</Badge>
      case 'claimed':
        return <Badge className="bg-primary text-primary-foreground">Claimed</Badge>
      default:
        return null
    }
  }

  const isClaiming = isClaimPending || isClaimConfirming
  const isDisputing = isDisputePending || isDisputeConfirming

  return (
    <AppLayout variant="worker">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="font-display text-3xl font-bold">Claim Payment</h1>
            <p className="mt-1 text-muted-foreground">
              Review and claim your payment
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : !payment ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertTriangle className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-lg font-medium">Payment not found</p>
              <p className="text-muted-foreground">
                This payment may have been claimed or doesn&apos;t exist.
              </p>
              <Button className="mt-4" onClick={() => navigate('/worker')}>
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Payment Amount Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="border-2 border-primary/20 bg-primary/5">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center justify-center space-y-4 py-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                      <Wallet className="h-8 w-8 text-primary" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">
                        Payment Amount
                      </p>
                      <p className="text-4xl font-bold">
                        {formatUSDC(payment.amount)}
                      </p>
                    </div>
                    <div>{getStatusBadge(payment.status)}</div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Payment Details */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Payment Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-sm text-muted-foreground">From</p>
                      <AddressDisplay address={payment.from} />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Created</p>
                      <p className="font-medium">
                        {new Date(payment.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    {payment.dueDate && (
                      <div>
                        <p className="text-sm text-muted-foreground">Due Date</p>
                        <p className="font-medium">{payment.dueDate}</p>
                      </div>
                    )}
                    {payment.payrollRunId && (
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Payroll Run ID
                        </p>
                        <p className="font-mono text-sm">{payment.payrollRunId}</p>
                      </div>
                    )}
                  </div>

                  {payment.description && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Description
                        </p>
                        <p className="mt-1">{payment.description}</p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Actions */}
            {payment.status === 'claimable' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Actions
                    </CardTitle>
                    <CardDescription>
                      Claim your payment or raise a dispute
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button
                      className="w-full"
                      size="lg"
                      onClick={handleClaim}
                      disabled={isClaiming || !isConnected}
                    >
                      {isClaiming ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {isClaimConfirming ? 'Confirming...' : 'Claiming...'}
                        </>
                      ) : (
                        <>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Claim {formatUSDC(payment.amount)}
                        </>
                      )}
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setShowDisputeDialog(true)}
                      disabled={isClaiming || isDisputing}
                    >
                      <AlertTriangle className="mr-2 h-4 w-4" />
                      Raise Dispute
                    </Button>

                    <p className="text-center text-xs text-muted-foreground">
                      If the payment amount is incorrect or you have other
                      concerns, you can raise a dispute before claiming.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {payment.status === 'claimed' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="border-success bg-success/5">
                  <CardContent className="flex items-center gap-4 pt-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
                      <CheckCircle className="h-6 w-6 text-success" />
                    </div>
                    <div>
                      <p className="font-medium">Payment Claimed</p>
                      <p className="text-sm text-muted-foreground">
                        This payment has been transferred to your wallet.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {payment.status === 'disputed' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="border-destructive bg-destructive/5">
                  <CardContent className="flex items-center gap-4 pt-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                      <AlertTriangle className="h-6 w-6 text-destructive" />
                    </div>
                    <div>
                      <p className="font-medium">Dispute in Progress</p>
                      <p className="text-sm text-muted-foreground">
                        This payment is under dispute. Please contact the
                        employer to resolve.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {payment.status === 'pending' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="border-warning bg-warning/5">
                  <CardContent className="flex items-center gap-4 pt-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-warning/10">
                      <Clock className="h-6 w-6 text-warning" />
                    </div>
                    <div>
                      <p className="font-medium">Awaiting Approval</p>
                      <p className="text-sm text-muted-foreground">
                        This payment is pending employer approval. You&apos;ll
                        be able to claim once approved.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </>
        )}
      </div>

      {/* Dispute Dialog */}
      <AlertDialog open={showDisputeDialog} onOpenChange={setShowDisputeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Raise a Dispute
            </AlertDialogTitle>
            <AlertDialogDescription>
              Please provide a reason for disputing this payment. This will be
              recorded on-chain and the employer will be notified.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Dispute Reason</Label>
              <Input
                id="reason"
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                placeholder="e.g., Incorrect amount, missing bonus..."
              />
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDisputing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDispute}
              disabled={isDisputing || !disputeReason.trim()}
              className="bg-warning text-warning-foreground hover:bg-warning/90"
            >
              {isDisputing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Dispute'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  )
}
