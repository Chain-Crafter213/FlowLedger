import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { useLiveQuery } from 'dexie-react-hooks'
import { motion } from 'framer-motion'
import {
  Plus,
  Loader2,
  AlertTriangle,
  Users,
  CreditCard,
  Check,
} from 'lucide-react'
import { AppLayout } from '@/components/AppLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
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
import { RiskWarning } from '@/components/RiskWarning'
import { AddressDisplay } from '@/components/AddressDisplay'
import { useToast } from '@/components/ui/use-toast'
import { db, type Worker } from '@/lib/storage'
import { formatUSDC, parseUSDC, USDC_ADDRESS, USDC_ABI } from '@/lib/usdc'
import { CONTRACT_ADDRESSES } from '@/lib/chain'

interface PaymentEntry {
  worker: Worker
  amount: string
}

export default function NewPayroll() {
  const navigate = useNavigate()
  const { address } = useAccount()
  const { toast } = useToast()
  
  const [payPeriod, setPayPeriod] = useState('')
  const [payments, setPayments] = useState<PaymentEntry[]>([])
  const [showConfirm, setShowConfirm] = useState(false)
  const [step, setStep] = useState<'select' | 'amounts' | 'review'>('select')

  // Get workers
  const workers = useLiveQuery(() => db.workers.toArray(), [])

  // Contract write for approval
  const { writeContract: approveUsdc, data: approveHash, isPending: isApproving } = useWriteContract()
  const { isLoading: isApproveConfirming } = useWaitForTransactionReceipt({
    hash: approveHash,
  })

  // Contract write for payroll
  const { data: payrollHash, isPending: isCreatingPayroll } = useWriteContract()
  const { isLoading: isPayrollConfirming, isSuccess: isPayrollConfirmed } = useWaitForTransactionReceipt({
    hash: payrollHash,
  })

  const totalAmount = payments.reduce((sum, p) => {
    const amount = parseFloat(p.amount) || 0
    return sum + amount
  }, 0)

  const toggleWorker = (worker: Worker) => {
    const existing = payments.find((p) => p.worker.id === worker.id)
    if (existing) {
      setPayments(payments.filter((p) => p.worker.id !== worker.id))
    } else {
      setPayments([...payments, { worker, amount: '' }])
    }
  }

  const updateAmount = (workerId: number, amount: string) => {
    setPayments(
      payments.map((p) =>
        p.worker.id === workerId ? { ...p, amount } : p
      )
    )
  }

  const handleConfirmPayroll = async () => {
    if (!address || !CONTRACT_ADDRESSES.payrollEscrow) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Payroll contract not configured.',
      })
      return
    }

    const amounts = payments.map((p) => parseUSDC(p.amount))
    const totalBigInt = amounts.reduce((sum, a) => sum + a, BigInt(0))

    try {
      // First approve USDC
      approveUsdc({
        address: USDC_ADDRESS,
        abi: USDC_ABI,
        functionName: 'approve',
        args: [CONTRACT_ADDRESSES.payrollEscrow, totalBigInt],
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to initiate approval.',
      })
    }
  }

  // Save payroll run locally on success
  const savePayrollRun = async () => {
    if (!address || !payrollHash) return

    const runId = payrollHash
    const now = Date.now()

    await db.payrollRuns.add({
      runId,
      employer: address.toLowerCase(),
      payments: payments.map((p) => ({
        worker: p.worker.address,
        workerName: p.worker.name,
        amount: p.amount,
        status: 'pending',
        txHash: payrollHash,
      })),
      payPeriod,
      totalAmount: totalAmount.toString(),
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    })

    toast({
      title: 'Success',
      description: 'Payroll created successfully!',
    })

    navigate(`/app/payroll/${runId}`)
  }

  // Watch for confirmation
  if (isPayrollConfirmed && payrollHash) {
    savePayrollRun()
  }

  const isLoading = isApproving || isApproveConfirming || isCreatingPayroll || isPayrollConfirming

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="font-display text-3xl font-bold">New Payroll</h1>
          <p className="mt-1 text-muted-foreground">
            Create a batch payment to multiple workers
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center gap-2">
          {['Select Workers', 'Set Amounts', 'Review & Pay'].map((label, i) => {
            const stepNum = i + 1
            const currentStep = step === 'select' ? 1 : step === 'amounts' ? 2 : 3
            const isActive = stepNum === currentStep
            const isCompleted = stepNum < currentStep
            
            return (
              <div key={label} className="flex items-center gap-2">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                    isCompleted
                      ? 'bg-success text-success-foreground'
                      : isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {isCompleted ? <Check className="h-4 w-4" /> : stepNum}
                </div>
                <span
                  className={`text-sm ${
                    isActive ? 'font-medium' : 'text-muted-foreground'
                  }`}
                >
                  {label}
                </span>
                {i < 2 && <Separator className="w-8" />}
              </div>
            )
          })}
        </div>

        {/* Step 1: Select Workers */}
        {step === 'select' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Select Workers
                </CardTitle>
                <CardDescription>
                  Choose which workers to include in this payroll run
                </CardDescription>
              </CardHeader>
              <CardContent>
                {workers === undefined ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : workers.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-muted-foreground">
                      No workers added yet. Add workers first.
                    </p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => navigate('/app/workers')}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Workers
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {workers.map((worker) => {
                      const isSelected = payments.some(
                        (p) => p.worker.id === worker.id
                      )
                      return (
                        <div
                          key={worker.id}
                          onClick={() => toggleWorker(worker)}
                          className={`flex cursor-pointer items-center justify-between rounded-lg border p-4 transition-colors ${
                            isSelected
                              ? 'border-primary bg-primary/5'
                              : 'hover:bg-accent'
                          }`}
                        >
                          <div>
                            <p className="font-medium">{worker.name}</p>
                            <AddressDisplay
                              address={worker.address}
                              showCopy={false}
                              showExplorer={false}
                            />
                          </div>
                          <div
                            className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                              isSelected
                                ? 'border-primary bg-primary text-primary-foreground'
                                : 'border-muted-foreground'
                            }`}
                          >
                            {isSelected && <Check className="h-4 w-4" />}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                <div className="mt-6 flex justify-between">
                  <p className="text-sm text-muted-foreground">
                    {payments.length} worker{payments.length !== 1 ? 's' : ''} selected
                  </p>
                  <Button
                    onClick={() => setStep('amounts')}
                    disabled={payments.length === 0}
                  >
                    Continue
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 2: Set Amounts */}
        {step === 'amounts' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Set Payment Amounts
                </CardTitle>
                <CardDescription>
                  Enter the amount to pay each worker
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="payPeriod">Pay Period Label</Label>
                  <Input
                    id="payPeriod"
                    value={payPeriod}
                    onChange={(e) => setPayPeriod(e.target.value)}
                    placeholder="e.g., January 2026, Week 5"
                    className="mt-1"
                  />
                </div>

                <Separator />

                <div className="space-y-3">
                  {payments.map((payment) => (
                    <div
                      key={payment.worker.id}
                      className="flex items-center gap-4 rounded-lg border p-4"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{payment.worker.name}</p>
                        <AddressDisplay
                          address={payment.worker.address}
                          showCopy={false}
                          showExplorer={false}
                        />
                      </div>
                      <div className="w-40">
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            $
                          </span>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={payment.amount}
                            onChange={(e) =>
                              updateAmount(payment.worker.id!, e.target.value)
                            }
                            placeholder="0.00"
                            className="pl-7"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <p className="text-lg font-semibold">Total</p>
                  <p className="text-2xl font-bold">
                    {formatUSDC(parseUSDC(totalAmount.toFixed(2)))}
                  </p>
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep('select')}>
                    Back
                  </Button>
                  <Button
                    onClick={() => setStep('review')}
                    disabled={
                      !payPeriod ||
                      payments.some((p) => !p.amount || parseFloat(p.amount) <= 0)
                    }
                  >
                    Review
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 3: Review */}
        {step === 'review' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <RiskWarning variant="critical" />

            <Card>
              <CardHeader>
                <CardTitle>Review Payroll</CardTitle>
                <CardDescription>
                  Please review the details before confirming
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-muted-foreground">Pay Period</Label>
                  <p className="font-medium">{payPeriod}</p>
                </div>

                <Separator />

                <div className="space-y-2">
                  {payments.map((payment) => (
                    <div
                      key={payment.worker.id}
                      className="flex items-center justify-between py-2"
                    >
                      <div>
                        <p className="font-medium">{payment.worker.name}</p>
                        <AddressDisplay
                          address={payment.worker.address}
                          showCopy={false}
                          showExplorer={false}
                        />
                      </div>
                      <p className="font-semibold">
                        {formatUSDC(parseUSDC(payment.amount))}
                      </p>
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="flex items-center justify-between text-lg">
                  <p className="font-semibold">Total</p>
                  <p className="text-2xl font-bold">
                    {formatUSDC(parseUSDC(totalAmount.toFixed(2)))}
                  </p>
                </div>

                <div className="flex justify-between pt-4">
                  <Button variant="outline" onClick={() => setStep('amounts')}>
                    Back
                  </Button>
                  <Button onClick={() => setShowConfirm(true)}>
                    Confirm & Pay
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Confirm Payment
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                You are about to send{' '}
                <strong>{formatUSDC(parseUSDC(totalAmount.toFixed(2)))}</strong> to{' '}
                {payments.length} worker{payments.length !== 1 ? 's' : ''}.
              </p>
              <p className="text-destructive">
                This transaction uses real USDC on Polygon mainnet and cannot be
                reversed.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmPayroll}
              disabled={isLoading}
              className="bg-primary"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Yes, Send Payment'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  )
}
