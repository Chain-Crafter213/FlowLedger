import { useState, useEffect } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseUnits } from 'viem'
import { motion } from 'framer-motion'
import {
  Users,
  Plus,
  Loader2,
  CheckCircle,
  XCircle,
  Vote,
  Shield,
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
import { FlowLedgerMultisigABI } from '@/abi'

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

const PROPOSAL_STATUS = ['Pending', 'Executed', 'Cancelled']

function ProposalCard({ proposalId, contractAddr }: { proposalId: `0x${string}`; contractAddr: `0x${string}` }) {
  const { toast } = useToast()

  const { data: proposal, refetch } = useReadContract({
    address: contractAddr,
    abi: FlowLedgerMultisigABI,
    functionName: 'getProposal',
    args: [proposalId],
  })

  const { writeContract: approveProposal, data: approveHash, isPending: isApproving } = useWriteContract()
  const { isSuccess: isApproved } = useWaitForTransactionReceipt({ hash: approveHash })

  const { writeContract: cancelProposal, data: cancelHash, isPending: isCancelling } = useWriteContract()
  const { isSuccess: isCancelled } = useWaitForTransactionReceipt({ hash: cancelHash })

  useEffect(() => {
    if (isApproved) { toast({ title: 'Voted', description: 'Your approval has been recorded.' }); refetch() }
  }, [isApproved])
  useEffect(() => {
    if (isCancelled) { toast({ title: 'Proposal Cancelled' }); refetch() }
  }, [isCancelled])

  const p = proposal as any
  if (!p) return <Skeleton className="h-32 w-full rounded-xl" />

  const proposer = p.proposer ?? p[1]
  const totalAmount = p.totalAmount ?? p[5]
  const approvalCount = Number(p.approvalCount ?? p[6])
  const status = Number(p.status ?? p[7])
  const createdAt = Number(p.createdAt ?? p[8])
  const workers = (p.workers ?? p[2]) as string[]
  const label = p.label ?? p[4] ?? ''

  return (
    <Card>
      <CardContent className="pt-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono text-muted-foreground">Proposal #{proposalId.toString()}</span>
          <Badge variant={status === 0 ? 'default' : status === 1 ? 'success' : 'secondary' as any}>
            {PROPOSAL_STATUS[status]}
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">{label || 'Payment'}</span>
          <span className="text-xs text-muted-foreground">({workers?.length ?? 0} workers)</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xl font-bold">{formatUSDC(BigInt(totalAmount))}</span>
          <div className="flex items-center gap-1 text-sm">
            <Vote className="h-3 w-3" />
            <span>{approvalCount} approvals</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>By: </span>
          <AddressDisplay address={proposer} />
          <span className="ml-auto">{new Date(createdAt * 1000).toLocaleDateString()}</span>
        </div>

        {status === 0 && (
          <div className="flex gap-2">
            <Button className="flex-1" size="sm" onClick={() => approveProposal({
              address: contractAddr,
              abi: FlowLedgerMultisigABI,
              functionName: 'approveProposal',
              args: [proposalId],
              gas: BigInt(200_000),
            })} disabled={isApproving}>
              {isApproving ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <CheckCircle className="mr-1 h-3 w-3" />}
              Approve
            </Button>
            <Button variant="destructive" size="sm" onClick={() => cancelProposal({
              address: contractAddr,
              abi: FlowLedgerMultisigABI,
              functionName: 'cancelProposal',
              args: [proposalId],
              gas: BigInt(200_000),
            })} disabled={isCancelling}>
              {isCancelling ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="mr-1 h-3 w-3" />}
              Cancel
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function TeamCard({ teamId, contractAddr }: { teamId: `0x${string}`; contractAddr: `0x${string}` }) {
  const [showProposals, setShowProposals] = useState(false)

  const { data: team } = useReadContract({
    address: contractAddr,
    abi: FlowLedgerMultisigABI,
    functionName: 'getTeam',
    args: [teamId],
  })

  const { data: proposalIds } = useReadContract({
    address: contractAddr,
    abi: FlowLedgerMultisigABI,
    functionName: 'getTeamProposals',
    args: [teamId],
    query: { enabled: showProposals },
  })

  const t = team as any
  if (!t) return <Skeleton className="h-24 w-full rounded-xl" />

  const members = (t.signers ?? t[1]) as string[]
  const threshold = Number(t.requiredApprovals ?? t[2])
  const proposals = (proposalIds as unknown as `0x${string}`[]) ?? []

  return (
    <Card>
      <CardContent className="pt-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-purple-500" />
            <span className="font-semibold">Team #{teamId.toString()}</span>
          </div>
          <Badge variant="outline">{threshold}-of-{members.length}</Badge>
        </div>
        <div className="space-y-1">
          {members.map((m: string, i: number) => (
            <div key={i} className="text-sm">
              <AddressDisplay address={m} showCopy />
            </div>
          ))}
        </div>
        <Button variant="outline" size="sm" className="w-full" onClick={() => setShowProposals(!showProposals)}>
          {showProposals ? 'Hide' : 'View'} Proposals
        </Button>
        {showProposals && proposals.length > 0 && (
          <div className="space-y-3 border-t pt-3">
            {proposals.map(pid => (
              <ProposalCard key={pid.toString()} proposalId={pid} contractAddr={contractAddr} />
            ))}
          </div>
        )}
        {showProposals && proposals.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-2">No proposals yet.</p>
        )}
      </CardContent>
    </Card>
  )
}

export default function Multisig() {
  const { address } = useAccount()
  const { toast } = useToast()
  const [showCreateTeam, setShowCreateTeam] = useState(false)
  const [showCreateProposal, setShowCreateProposal] = useState(false)
  const [members, setMembers] = useState('')
  const [threshold, setThreshold] = useState('')
  const [proposalTeamId, setProposalTeamId] = useState('')
  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('')

  const contractAddr = CONTRACT_ADDRESSES.multisig

  const { data: teamIds, refetch: refetchTeams } = useReadContract({
    address: contractAddr,
    abi: FlowLedgerMultisigABI,
    functionName: 'getUserTeams',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!contractAddr },
  })

  // Create team
  const { writeContract: createTeam, data: createTeamHash, isPending: isCreatingTeam } = useWriteContract()
  const { isSuccess: isTeamCreated } = useWaitForTransactionReceipt({ hash: createTeamHash })

  // Approve for proposal
  const { writeContract: approveUSDC, data: approveUSDCHash, isPending: isApprovingUSDC } = useWriteContract()
  const { isSuccess: isUSDCApproved } = useWaitForTransactionReceipt({ hash: approveUSDCHash })

  // Create proposal
  const { writeContract: createProposal, data: createPropHash, isPending: isCreatingProp } = useWriteContract()
  const { isSuccess: isPropCreated } = useWaitForTransactionReceipt({ hash: createPropHash })

  useEffect(() => {
    if (isTeamCreated) {
      toast({ title: 'Team Created', description: 'Multisig team is ready.' })
      setShowCreateTeam(false)
      setMembers('')
      setThreshold('')
      refetchTeams()
    }
  }, [isTeamCreated])

  useEffect(() => {
    if (isUSDCApproved && contractAddr) {
      const amountBigInt = parseUnits(amount, 6)
      createProposal({
        address: contractAddr,
        abi: FlowLedgerMultisigABI,
        functionName: 'createProposal',
        args: [proposalTeamId as `0x${string}`, [recipient as `0x${string}`], [amountBigInt], 'Payment'],
        gas: BigInt(500_000),
      })
    }
  }, [isUSDCApproved])

  useEffect(() => {
    if (isPropCreated) {
      toast({ title: 'Proposal Created', description: 'Team members can now vote.' })
      setShowCreateProposal(false)
      setProposalTeamId('')
      setRecipient('')
      setAmount('')
      refetchTeams()
    }
  }, [isPropCreated])

  const handleCreateTeam = () => {
    if (!contractAddr || !members || !threshold) return
    const memberList = members.split(',').map(m => m.trim()) as `0x${string}`[]
    createTeam({
      address: contractAddr,
      abi: FlowLedgerMultisigABI,
      functionName: 'createTeam',
      args: [memberList, BigInt(threshold)],
      gas: BigInt(300_000),
    })
  }

  const handleCreateProposal = () => {
    if (!contractAddr || !proposalTeamId || !recipient || !amount) return
    const amountBigInt = parseUnits(amount, 6)
    approveUSDC({
      address: USDC_ADDRESS,
      abi: USDC_ABI,
      functionName: 'approve',
      args: [contractAddr, amountBigInt],
      gas: BigInt(100_000),
    })
  }

  const teams = (teamIds as unknown as `0x${string}`[]) ?? []

  return (
    <AppLayout>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-extrabold tracking-tight flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10">
                <Users className="h-5 w-5 text-purple-500" />
              </div>
              Multisig Teams
            </h1>
            <p className="mt-1 text-muted-foreground">
              Multi-signature team payroll — require N-of-M approvals for payments
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowCreateProposal(!showCreateProposal)}>
              <Vote className="mr-2 h-4 w-4" />
              New Proposal
            </Button>
            <Button onClick={() => setShowCreateTeam(!showCreateTeam)}>
              <Plus className="mr-2 h-4 w-4" />
              New Team
            </Button>
          </div>
        </motion.div>

        {/* Create Team Form */}
        {showCreateTeam && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
            <Card>
              <CardHeader>
                <CardTitle>Create Team</CardTitle>
                <CardDescription>Set up a multisig team with members and an approval threshold.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Members (comma-separated addresses)</Label>
                  <Textarea value={members} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMembers(e.target.value)} placeholder="0xabc..., 0xdef..., 0x123..." className="mt-1" rows={3} />
                </div>
                <div>
                  <Label>Approval Threshold</Label>
                  <Input value={threshold} onChange={e => setThreshold(e.target.value)} placeholder="2" type="number" className="mt-1" />
                </div>
                <Button onClick={handleCreateTeam} disabled={isCreatingTeam || !members || !threshold}>
                  {isCreatingTeam && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Team
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Create Proposal Form */}
        {showCreateProposal && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
            <Card>
              <CardHeader>
                <CardTitle>Create Proposal</CardTitle>
                <CardDescription>Propose a USDC payment. Funds are locked until threshold approvals are met.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Team ID</Label>
                  <Input value={proposalTeamId} onChange={e => setProposalTeamId(e.target.value)} placeholder="0" type="number" className="mt-1" />
                </div>
                <div>
                  <Label>Recipient Address</Label>
                  <Input value={recipient} onChange={e => setRecipient(e.target.value)} placeholder="0x..." className="mt-1" />
                </div>
                <div>
                  <Label>Amount (USDC)</Label>
                  <Input value={amount} onChange={e => setAmount(e.target.value)} placeholder="500" type="number" className="mt-1" />
                </div>
                <Button onClick={handleCreateProposal} disabled={isApprovingUSDC || isCreatingProp || !proposalTeamId || !recipient || !amount}>
                  {(isApprovingUSDC || isCreatingProp) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isApprovingUSDC ? 'Approving USDC...' : isCreatingProp ? 'Creating...' : 'Create Proposal'}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Teams grid */}
        {!contractAddr ? (
          <Card><CardContent className="py-8 text-center text-muted-foreground">Multisig contract not configured.</CardContent></Card>
        ) : teams.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="mx-auto h-12 w-12 text-muted-foreground/30" />
              <p className="mt-4 text-muted-foreground">No teams found.</p>
              <p className="text-sm text-muted-foreground">Create a team to get started with multisig payroll.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {teams.map(id => (
              <TeamCard key={id.toString()} teamId={id} contractAddr={contractAddr!} />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
