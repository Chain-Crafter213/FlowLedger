import { useState, useEffect } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseUnits } from 'viem'
import { motion } from 'framer-motion'
import {
  Trophy,
  Plus,
  Loader2,
  CheckCircle,
  XCircle,
  Eye,
} from 'lucide-react'
import { AppLayout } from '@/components/AppLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { AddressDisplay } from '@/components/AddressDisplay'
import { useToast } from '@/components/ui/use-toast'
import { CONTRACT_ADDRESSES } from '@/lib/chain'
import { formatUSDC } from '@/lib/usdc'
import { FlowLedgerBountiesABI } from '@/abi'

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

const STATUS_MAP: Record<number, { label: string; color: string }> = {
  0: { label: 'Open', color: 'default' },
  1: { label: 'Completed', color: 'success' },
  2: { label: 'Cancelled', color: 'secondary' },
}

function BountyCard({ bountyId, contractAddr, onRefresh }: { bountyId: `0x${string}`; contractAddr: `0x${string}`; onRefresh: () => void }) {
  const { toast } = useToast()
  const [showSubmitters, setShowSubmitters] = useState(false)

  const { data: bounty, refetch } = useReadContract({
    address: contractAddr,
    abi: FlowLedgerBountiesABI,
    functionName: 'getBounty',
    args: [bountyId],
  })

  const { data: submitters } = useReadContract({
    address: contractAddr,
    abi: FlowLedgerBountiesABI,
    functionName: 'getBountySubmitters',
    args: [bountyId],
    query: { enabled: showSubmitters },
  })

  // Approve bounty (pay winner)
  const { writeContract: approveBounty, data: approveHash, isPending: isApproving } = useWriteContract()
  const { isSuccess: isApproved } = useWaitForTransactionReceipt({ hash: approveHash })

  // Reject submission
  const { writeContract: rejectSub, data: rejectHash, isPending: isRejecting } = useWriteContract()
  const { isSuccess: isRejected } = useWaitForTransactionReceipt({ hash: rejectHash })

  // Cancel bounty
  const { writeContract: cancelBounty, data: cancelHash, isPending: isCancelling } = useWriteContract()
  const { isSuccess: isCancelled } = useWaitForTransactionReceipt({ hash: cancelHash })

  useEffect(() => {
    if (isApproved) { toast({ title: 'Bounty Approved', description: 'Payment released to worker.' }); refetch(); onRefresh() }
  }, [isApproved])
  useEffect(() => {
    if (isRejected) { toast({ title: 'Submission Rejected' }); refetch() }
  }, [isRejected])
  useEffect(() => {
    if (isCancelled) { toast({ title: 'Bounty Cancelled', description: 'Funds returned.' }); refetch(); onRefresh() }
  }, [isCancelled])

  const b = bounty as any
  if (!b) return <Skeleton className="h-40 w-full rounded-xl" />

  const descriptionHash = b.descriptionHash ?? b[2]
  const reward = b.amount ?? b[1]
  const status = Number(b.status ?? b[4])
  const createdAt = Number(b.createdAt ?? b[6])
  const statusInfo = STATUS_MAP[status] ?? STATUS_MAP[0]
  const subs = (submitters as unknown as string[]) ?? []

  return (
    <Card>
      <CardContent className="pt-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono text-muted-foreground">Bounty #{bountyId.toString()}</span>
          <Badge variant={statusInfo.color as any}>{statusInfo.label}</Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold">{formatUSDC(BigInt(reward))}</span>
          <span className="text-xs text-muted-foreground">{new Date(createdAt * 1000).toLocaleDateString()}</span>
        </div>
        <p className="text-xs font-mono text-muted-foreground break-all">Hash: {descriptionHash}</p>

        {status === 0 && (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setShowSubmitters(!showSubmitters)}>
              <Eye className="mr-1 h-3 w-3" />
              {showSubmitters ? 'Hide' : 'View'} Submissions ({subs.length})
            </Button>
            <Button size="sm" variant="destructive" onClick={() => cancelBounty({
              address: contractAddr,
              abi: FlowLedgerBountiesABI,
              functionName: 'cancelBounty',
              args: [bountyId],
            })} disabled={isCancelling}>
              {isCancelling ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="mr-1 h-3 w-3" />}
              Cancel
            </Button>
          </div>
        )}

        {showSubmitters && subs.length > 0 && (
          <div className="space-y-2 border-t pt-3">
            {subs.map((sub: string) => (
              <SubmissionRow
                key={sub}
                bountyId={bountyId}
                worker={sub}
                contractAddr={contractAddr}
                isOpen={status === 0}
                onApprove={() => approveBounty({
                  address: contractAddr,
                  abi: FlowLedgerBountiesABI,
                  functionName: 'approveBounty',
                  args: [bountyId, sub as `0x${string}`],
                })}
                onReject={() => rejectSub({
                  address: contractAddr,
                  abi: FlowLedgerBountiesABI,
                  functionName: 'rejectSubmission',
                  args: [bountyId, sub as `0x${string}`, '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`],
                })}
                isApproving={isApproving}
                isRejecting={isRejecting}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function SubmissionRow({
  bountyId, worker, contractAddr, isOpen, onApprove, onReject, isApproving, isRejecting
}: {
  bountyId: `0x${string}`; worker: string; contractAddr: `0x${string}`; isOpen: boolean
  onApprove: () => void; onReject: () => void; isApproving: boolean; isRejecting: boolean
}) {
  const { data: submission } = useReadContract({
    address: contractAddr,
    abi: FlowLedgerBountiesABI,
    functionName: 'getSubmission',
    args: [bountyId, worker as `0x${string}`],
  })

  const s = submission as any
  const subStatus = Number(s?.status ?? s?.[2] ?? 0)
  const statusLabels = ['Pending', 'Approved', 'Rejected']

  return (
    <div className="flex items-center justify-between rounded-lg border p-2 text-sm">
      <div className="flex items-center gap-2">
        <AddressDisplay address={worker} />
        <Badge variant="outline" className="text-xs">{statusLabels[subStatus]}</Badge>
      </div>
      {isOpen && subStatus === 0 && (
        <div className="flex gap-1">
          <Button size="sm" variant="default" onClick={onApprove} disabled={isApproving}>
            {isApproving ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />}
          </Button>
          <Button size="sm" variant="ghost" onClick={onReject} disabled={isRejecting}>
            {isRejecting ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3 w-3" />}
          </Button>
        </div>
      )}
    </div>
  )
}

export default function Bounties() {
  const { address } = useAccount()
  const { toast } = useToast()
  const [showForm, setShowForm] = useState(false)
  const [reward, setReward] = useState('')
  const [description, setDescription] = useState('')

  const contractAddr = CONTRACT_ADDRESSES.bounties

  const { data: bountyIds, refetch: refetchBounties } = useReadContract({
    address: contractAddr,
    abi: FlowLedgerBountiesABI,
    functionName: 'getEmployerBounties',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!contractAddr },
  })

  // Approve USDC
  const { writeContract: approveUSDC, data: approveHash, isPending: isApprovingUSDC } = useWriteContract()
  const { isSuccess: isUSDCApproved } = useWaitForTransactionReceipt({ hash: approveHash })

  // Create bounty
  const { writeContract: createBounty, data: createHash, isPending: isCreating } = useWriteContract()
  const { isSuccess: isCreated } = useWaitForTransactionReceipt({ hash: createHash })

  useEffect(() => {
    if (isUSDCApproved && contractAddr) {
      const rewardBigInt = parseUnits(reward, 6)
      // Hash the description for on-chain storage
      const encoder = new TextEncoder()
      const descBytes = encoder.encode(description)
      let hashHex = '0x'
      for (const byte of descBytes.slice(0, 32)) hashHex += byte.toString(16).padStart(2, '0')
      while (hashHex.length < 66) hashHex += '0'
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 30 * 86400) // 30 days default
      createBounty({
        address: contractAddr,
        abi: FlowLedgerBountiesABI,
        functionName: 'createBounty',
        args: [rewardBigInt, hashHex as `0x${string}`, deadline],
      })
    }
  }, [isUSDCApproved])

  useEffect(() => {
    if (isCreated) {
      toast({ title: 'Bounty Created', description: 'Your bounty is now open for submissions.' })
      setShowForm(false)
      setReward('')
      setDescription('')
      refetchBounties()
    }
  }, [isCreated])

  const handleCreate = () => {
    if (!contractAddr || !reward || !description) return
    const rewardBigInt = parseUnits(reward, 6)
    approveUSDC({
      address: USDC_ADDRESS,
      abi: USDC_ABI,
      functionName: 'approve',
      args: [contractAddr, rewardBigInt],
    })
  }

  const bounties = (bountyIds as unknown as `0x${string}`[]) ?? []

  return (
    <AppLayout>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-extrabold tracking-tight flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
                <Trophy className="h-5 w-5 text-amber-500" />
              </div>
              Bounty Board
            </h1>
            <p className="mt-1 text-muted-foreground">
              Post bounties and manage submissions from workers
            </p>
          </div>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="mr-2 h-4 w-4" />
            New Bounty
          </Button>
        </motion.div>

        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
            <Card>
              <CardHeader>
                <CardTitle>Create Bounty</CardTitle>
                <CardDescription>Post a bounty with a USDC reward. Workers can submit their work for your review.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Description</Label>
                  <Textarea value={description} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)} placeholder="Describe the task..." className="mt-1" rows={3} />
                </div>
                <div>
                  <Label>Reward (USDC)</Label>
                  <Input value={reward} onChange={e => setReward(e.target.value)} placeholder="100" type="number" className="mt-1" />
                </div>
                <Button onClick={handleCreate} disabled={isApprovingUSDC || isCreating || !reward || !description}>
                  {(isApprovingUSDC || isCreating) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isApprovingUSDC ? 'Approving USDC...' : isCreating ? 'Creating Bounty...' : 'Create Bounty'}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {!contractAddr ? (
          <Card><CardContent className="py-8 text-center text-muted-foreground">Bounties contract not configured.</CardContent></Card>
        ) : bounties.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Trophy className="mx-auto h-12 w-12 text-muted-foreground/30" />
              <p className="mt-4 text-muted-foreground">No bounties posted yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {bounties.map(id => (
              <BountyCard key={id.toString()} bountyId={id} contractAddr={contractAddr!} onRefresh={refetchBounties} />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
