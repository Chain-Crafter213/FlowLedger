import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, usePublicClient } from 'wagmi'
import { motion } from 'framer-motion'
import { keccak256, toBytes } from 'viem'
import {
  Send,
  Loader2,
  AlertTriangle,
  Calendar,
  Copy,
  Check,
  Fuel,
} from 'lucide-react'
import { AppLayout } from '@/components/AppLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
import { useToast } from '@/components/ui/use-toast'
import { db } from '@/lib/storage'
import { formatUSDC, parseUSDC } from '@/lib/usdc'
import { isValidAddress } from '@/lib/utils'
import { CONTRACT_ADDRESSES } from '@/lib/chain'
import { FlowLedgerPayRequestsABI } from '@/abi'

// Gas-optimized: only store short hash reference on-chain
function createMemoHash(memo: string): string {
  if (!memo || memo.length === 0) return ''
  // Create a short 8-char hash for on-chain storage (saves ~90% gas vs full string)
  const hash = keccak256(toBytes(memo))
  return hash.slice(0, 18) // 0x + 16 chars = 8 bytes
}

export default function NewRequest() {
  const navigate = useNavigate()
  const { address } = useAccount()
  const { toast } = useToast()
  const publicClient = usePublicClient()

  const [toAddress, setToAddress] = useState('')
  const [amount, setAmount] = useState('')
  const [memo, setMemo] = useState('')
  const [expiresInDays, setExpiresInDays] = useState('7')
  const [showConfirm, setShowConfirm] = useState(false)
  const [estimatedGas, setEstimatedGas] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [requestSaved, setRequestSaved] = useState(false)

  // Contract write
  const { writeContract, data: txHash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  })

  // Estimate gas when form is filled
  useEffect(() => {
    const estimateGas = async () => {
      if (!address || !toAddress || !amount || !isValidAddress(toAddress) || parseFloat(amount) <= 0) {
        setEstimatedGas(null)
        return
      }

      try {
        const amountBigInt = parseUSDC(amount)
        const expiresInSeconds = parseInt(expiresInDays) * 24 * 60 * 60
        // Use short hash instead of full memo
        const memoHash = createMemoHash(memo)

        const gas = await publicClient?.estimateContractGas({
          address: CONTRACT_ADDRESSES.payRequests as `0x${string}`,
          abi: FlowLedgerPayRequestsABI,
          functionName: 'createRequest',
          args: [toAddress as `0x${string}`, amountBigInt, memoHash, BigInt(expiresInSeconds)],
          account: address,
        })

        const price = await publicClient?.getGasPrice()

        if (gas && price) {
          // Add 10% buffer
          const totalCost = (gas * price * 110n) / 100n
          // Convert to USD (POL ~$0.4)
          const polPrice = 0.4
          const costInPol = Number(totalCost) / 1e18
          const costInUsd = costInPol * polPrice
          setEstimatedGas(`~$${costInUsd.toFixed(4)} (${costInPol.toFixed(6)} POL)`)
        }
      } catch (e) {
        console.error('Gas estimation failed:', e)
        setEstimatedGas(null)
      }
    }

    const timer = setTimeout(estimateGas, 500)
    return () => clearTimeout(timer)
  }, [address, toAddress, amount, memo, expiresInDays, publicClient])

  const handleCreateRequest = async () => {
    if (!address || !CONTRACT_ADDRESSES.payRequests) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Pay requests contract not configured.',
      })
      return
    }

    if (!isValidAddress(toAddress)) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Invalid recipient address.',
      })
      return
    }

    const amountBigInt = parseUSDC(amount)
    const expiresInSeconds = parseInt(expiresInDays) * 24 * 60 * 60
    // Use short hash instead of full memo (saves gas!)
    const memoHash = createMemoHash(memo)

    try {
      // Use lower gas settings
      writeContract({
        address: CONTRACT_ADDRESSES.payRequests,
        abi: FlowLedgerPayRequestsABI,
        functionName: 'createRequest',
        args: [toAddress as `0x${string}`, amountBigInt, memoHash, BigInt(expiresInSeconds)],
        // Let wallet handle gas, but we optimized the data
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create payment request.',
      })
    }
  }

  // Save request locally on success
  const saveRequest = useCallback(async () => {
    if (!isSuccess || !txHash || requestSaved || !address) return
    
    setRequestSaved(true)
    const now = Date.now()
    const expiresAt = now + parseInt(expiresInDays) * 24 * 60 * 60 * 1000

    try {
      await db.payRequests.add({
        id: txHash,
        workerAddress: address.toLowerCase(),
        employerAddress: toAddress.toLowerCase(),
        amount: amount,
        description: memo, // Full memo stored locally (free!)
        status: 'pending',
        txHash,
        createdAt: new Date(now).toISOString(),
        expiresAt: new Date(expiresAt).toISOString(),
      })

      toast({
        title: 'Success',
        description: 'Payment request created! Gas saved by optimizing on-chain data.',
      })

      setTimeout(() => navigate('/app'), 1500)
    } catch (e) {
      console.error('Failed to save request:', e)
    }
  }, [isSuccess, txHash, requestSaved, address, expiresInDays, toAddress, amount, memo, toast, navigate])

  useEffect(() => {
    saveRequest()
  }, [saveRequest])

  const isLoading = isPending || isConfirming

  const copyShareLink = () => {
    if (!txHash) return
    const link = `${window.location.origin}/pay/${txHash}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="font-display text-3xl font-bold">Request Payment</h1>
          <p className="mt-1 text-muted-foreground">
            Create a payment request that someone can pay
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                New Payment Request
              </CardTitle>
              <CardDescription>
                The recipient will receive a link to pay this request
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="to">Request Payment From</Label>
                <Input
                  id="to"
                  value={toAddress}
                  onChange={(e) => setToAddress(e.target.value)}
                  placeholder="0x..."
                  className="mt-1 font-mono"
                />
              </div>

              <div>
                <Label htmlFor="amount">Amount (USDC)</Label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    $
                  </span>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="pl-7"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="memo">Memo / Description</Label>
                <Input
                  id="memo"
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  placeholder="Invoice #1042, Consulting services..."
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="expires">Expires In</Label>
                <div className="relative mt-1">
                  <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="expires"
                    type="number"
                    min="1"
                    max="365"
                    value={expiresInDays}
                    onChange={(e) => setExpiresInDays(e.target.value)}
                    className="pl-10"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    days
                  </span>
                </div>
              </div>

              <RiskWarning />

              {/* Gas Estimate Preview */}
              {estimatedGas && (
                <div className="flex items-center justify-between rounded-lg border border-green-500/20 bg-green-500/10 p-3">
                  <div className="flex items-center gap-2">
                    <Fuel className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">Estimated Gas (Optimized)</span>
                  </div>
                  <span className="text-sm text-green-500">{estimatedGas}</span>
                </div>
              )}

              <Button
                onClick={() => setShowConfirm(true)}
                disabled={!toAddress || !amount || parseFloat(amount) <= 0}
                className="w-full"
              >
                Create Request
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Confirm Request
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  You are creating a payment request for{' '}
                  <strong className="text-foreground">{formatUSDC(parseUSDC(amount || '0'))}</strong>
                </p>
                <p>
                  The recipient can pay this request within <strong>{expiresInDays} days</strong>.
                </p>
                {estimatedGas && (
                  <div className="flex items-center gap-2 rounded-lg bg-muted p-3">
                    <Fuel className="h-4 w-4 text-green-500" />
                    <span className="text-sm">
                      <strong>Estimated Gas:</strong> {estimatedGas}
                    </span>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  💡 Gas optimized: Only essential data stored on-chain. Full memo saved locally.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCreateRequest}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isPending ? 'Confirm in Wallet...' : 'Processing...'}
                </>
              ) : (
                'Create Request'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Success Dialog with Share Link */}
      <AlertDialog open={isSuccess && !!txHash}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-green-500">
              <Check className="h-5 w-5" />
              Request Created!
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>Your payment request has been created successfully.</p>
                <div className="rounded-lg bg-muted p-3">
                  <Label className="text-xs text-muted-foreground">Share this link with the payer:</Label>
                  <div className="mt-1 flex items-center gap-2">
                    <code className="flex-1 truncate text-xs">
                      {`${window.location.origin}/pay/${txHash}`}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={copyShareLink}
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Redirecting to dashboard...
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  )
}
