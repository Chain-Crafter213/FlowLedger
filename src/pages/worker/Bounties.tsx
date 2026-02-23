import { useState, useEffect } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { motion } from 'framer-motion'
import {
  Trophy,
  Send,
  Loader2,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import { AppLayout } from '@/components/AppLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { AddressDisplay } from '@/components/AddressDisplay'
import { useToast } from '@/components/ui/use-toast'
import { CONTRACT_ADDRESSES } from '@/lib/chain'
import { formatUSDC } from '@/lib/usdc'
import { FlowLedgerBountiesABI } from '@/abi'

const STATUS_LABELS = ['Open', 'Completed', 'Cancelled']
const SUB_STATUS_LABELS = ['Pending', 'Approved', 'Rejected']

function WorkerBountyCard({ bountyId, contractAddr }: { bountyId: `0x${string}`; contractAddr: `0x${string}` }) {
  const { address } = useAccount()
  const { toast } = useToast()
  const [proofHash, setProofHash] = useState('')

  const { data: bounty } = useReadContract({
    address: contractAddr,
    abi: FlowLedgerBountiesABI,
    functionName: 'getBounty',
    args: [bountyId],
  })

  const { data: submission, refetch: refetchSub } = useReadContract({
    address: contractAddr,
    abi: FlowLedgerBountiesABI,
    functionName: 'getSubmission',
    args: address ? [bountyId, address] : undefined,
    query: { enabled: !!address },
  })

  const { writeContract: submitWork, data: submitHash, isPending: isSubmitting } = useWriteContract()
  const { isSuccess: isSubmitted } = useWaitForTransactionReceipt({ hash: submitHash })

  useEffect(() => {
    if (isSubmitted) {
      toast({ title: 'Work Submitted', description: 'Your submission is pending review.' })
      setProofHash('')
      refetchSub()
    }
  }, [isSubmitted])

  const b = bounty as any
  if (!b) return <Skeleton className="h-32 w-full rounded-xl" />

  const employer = b.employer ?? b[0]
  const reward = b.amount ?? b[1]
  const status = Number(b.status ?? b[4])
  const createdAt = Number(b.createdAt ?? b[6])

  const sub = submission as any
  const hasSubmitted = sub?.status !== undefined && sub?.submittedAt !== undefined ? Number(sub.submittedAt ?? sub?.[1] ?? 0) > 0 : false
  const subStatus = Number(sub?.status ?? sub?.[2] ?? 0)

  return (
    <Card>
      <CardContent className="pt-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono text-muted-foreground">Bounty #{bountyId.toString()}</span>
          <Badge variant={status === 0 ? 'default' : 'secondary'}>{STATUS_LABELS[status]}</Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-amber-600">{formatUSDC(BigInt(reward))}</span>
          <span className="text-xs text-muted-foreground">{new Date(createdAt * 1000).toLocaleDateString()}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Posted by:</span>
          <AddressDisplay address={employer} showCopy />
        </div>

        {hasSubmitted ? (
          <div className="rounded-lg border p-3">
            <div className="flex items-center gap-2">
              {subStatus === 1 ? <CheckCircle className="h-4 w-4 text-emerald-500" /> :
               subStatus === 2 ? <XCircle className="h-4 w-4 text-red-500" /> :
               <Clock className="h-4 w-4 text-yellow-500" />}
              <span className="text-sm font-medium">Your Submission: {SUB_STATUS_LABELS[subStatus]}</span>
            </div>
          </div>
        ) : status === 0 ? (
          <div className="flex gap-2">
            <Input
              value={proofHash}
              onChange={e => setProofHash(e.target.value)}
              placeholder="Proof hash or link..."
              className="flex-1"
            />
            <Button
              size="sm"
              onClick={() => {
                if (!proofHash.trim()) return
                const encoder = new TextEncoder()
                const bytes = encoder.encode(proofHash)
                let hex = '0x'
                for (const byte of bytes.slice(0, 32)) hex += byte.toString(16).padStart(2, '0')
                while (hex.length < 66) hex += '0'
                submitWork({
                  address: contractAddr,
                  abi: FlowLedgerBountiesABI,
                  functionName: 'submitWork',
                  args: [bountyId, hex as `0x${string}`],
                })
              }}
              disabled={isSubmitting || !proofHash.trim()}
            >
              {isSubmitting ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Send className="mr-1 h-3 w-3" />}
              Submit
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

export default function WorkerBounties() {
  const contractAddr = CONTRACT_ADDRESSES.bounties

  // For the worker view, we show all employer bounties they can participate in
  // Since there's no global list function, we use getEmployerBounties with the connected address
  // as a fallback — in production you'd have an indexer. Here we also show a search-by-employer feature.
  const [searchEmployer, setSearchEmployer] = useState('')
  const [employerAddr, setEmployerAddr] = useState('')

  const { data: bountyIds } = useReadContract({
    address: contractAddr,
    abi: FlowLedgerBountiesABI,
    functionName: 'getEmployerBounties',
    args: employerAddr ? [employerAddr as `0x${string}`] : undefined,
    query: { enabled: !!employerAddr && !!contractAddr },
  })

  const bounties = (bountyIds as unknown as `0x${string}`[]) ?? []

  return (
    <AppLayout>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl font-extrabold tracking-tight flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
              <Trophy className="h-5 w-5 text-amber-500" />
            </div>
            Browse Bounties
          </h1>
          <p className="mt-1 text-muted-foreground">
            Find bounties and submit your work to earn USDC
          </p>
        </motion.div>

        {/* Search by employer */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex gap-2">
              <Input
                value={searchEmployer}
                onChange={e => setSearchEmployer(e.target.value)}
                placeholder="Enter employer address to browse their bounties..."
                className="flex-1"
              />
              <Button onClick={() => setEmployerAddr(searchEmployer.trim())} disabled={!searchEmployer.trim()}>
                Search
              </Button>
            </div>
          </CardContent>
        </Card>

        {!contractAddr ? (
          <Card><CardContent className="py-8 text-center text-muted-foreground">Bounties contract not configured.</CardContent></Card>
        ) : !employerAddr ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Trophy className="mx-auto h-12 w-12 text-muted-foreground/30" />
              <p className="mt-4 text-muted-foreground">Enter an employer address above to browse their bounties.</p>
            </CardContent>
          </Card>
        ) : bounties.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No bounties found for this employer.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {bounties.map(id => (
              <WorkerBountyCard key={id.toString()} bountyId={id} contractAddr={contractAddr!} />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
