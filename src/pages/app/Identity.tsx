import { useState, useEffect } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { motion } from 'framer-motion'
import {
  UserCheck,
  UserPlus,
  Link2,
  Unlink,
  Loader2,
  Shield,
  Edit,
} from 'lucide-react'
import { AppLayout } from '@/components/AppLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { AddressDisplay } from '@/components/AddressDisplay'
import { useToast } from '@/components/ui/use-toast'
import { CONTRACT_ADDRESSES } from '@/lib/chain'
import { FlowWageIdentityRegistryABI } from '@/abi/FlowWageIdentityRegistry'

export default function Identity() {
  const { address } = useAccount()
  const { toast } = useToast()
  const [name, setName] = useState('')
  const [role, setRole] = useState<number>(0) // 0=Employer, 1=Worker
  const [workerAddress, setWorkerAddress] = useState('')
  const [editMode, setEditMode] = useState(false)

  // Read identity
  const { data: identity, isLoading: identityLoading, refetch: refetchIdentity } = useReadContract({
    address: CONTRACT_ADDRESSES.identityRegistry,
    abi: FlowWageIdentityRegistryABI,
    functionName: 'getIdentity',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!CONTRACT_ADDRESSES.identityRegistry },
  })

  // Read linked workers
  const { data: linkedWorkers, refetch: refetchWorkers } = useReadContract({
    address: CONTRACT_ADDRESSES.identityRegistry,
    abi: FlowWageIdentityRegistryABI,
    functionName: 'getLinkedWorkers',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!CONTRACT_ADDRESSES.identityRegistry },
  })

  // Register identity
  const { writeContract: registerIdentity, data: registerHash, isPending: isRegistering } = useWriteContract()
  const { isSuccess: isRegistered } = useWaitForTransactionReceipt({ hash: registerHash })

  // Update name
  const { writeContract: updateName, data: updateHash, isPending: isUpdating } = useWriteContract()
  const { isSuccess: isUpdated } = useWaitForTransactionReceipt({ hash: updateHash })

  // Link worker
  const { writeContract: linkWorker, data: linkHash, isPending: isLinking } = useWriteContract()
  const { isSuccess: isLinked } = useWaitForTransactionReceipt({ hash: linkHash })

  // Unlink worker
  const { writeContract: unlinkWorker, data: unlinkHash, isPending: isUnlinking } = useWriteContract()
  const { isSuccess: isUnlinked } = useWaitForTransactionReceipt({ hash: unlinkHash })

  useEffect(() => {
    if (isRegistered) {
      toast({ title: 'Identity Registered', description: 'Your on-chain identity has been created.' })
      refetchIdentity()
    }
  }, [isRegistered])

  useEffect(() => {
    if (isUpdated) {
      toast({ title: 'Name Updated', description: 'Your on-chain name has been updated.' })
      setEditMode(false)
      refetchIdentity()
    }
  }, [isUpdated])

  useEffect(() => {
    if (isLinked) {
      toast({ title: 'Worker Linked', description: 'Worker has been linked to your identity.' })
      setWorkerAddress('')
      refetchWorkers()
    }
  }, [isLinked])

  useEffect(() => {
    if (isUnlinked) {
      toast({ title: 'Worker Unlinked', description: 'Worker has been removed.' })
      refetchWorkers()
    }
  }, [isUnlinked])

  const handleRegister = () => {
    if (!CONTRACT_ADDRESSES.identityRegistry || !name.trim()) return
    registerIdentity({
      address: CONTRACT_ADDRESSES.identityRegistry,
      abi: FlowWageIdentityRegistryABI,
      functionName: 'registerIdentity',
      args: [name.trim(), role],
    })
  }

  const handleUpdateName = () => {
    if (!CONTRACT_ADDRESSES.identityRegistry || !name.trim()) return
    updateName({
      address: CONTRACT_ADDRESSES.identityRegistry,
      abi: FlowWageIdentityRegistryABI,
      functionName: 'updateName',
      args: [name.trim()],
    })
  }

  const handleLinkWorker = () => {
    if (!CONTRACT_ADDRESSES.identityRegistry || !workerAddress.trim()) return
    linkWorker({
      address: CONTRACT_ADDRESSES.identityRegistry,
      abi: FlowWageIdentityRegistryABI,
      functionName: 'linkWorker',
      args: [workerAddress.trim() as `0x${string}`],
    })
  }

  const handleUnlinkWorker = (worker: string) => {
    if (!CONTRACT_ADDRESSES.identityRegistry) return
    unlinkWorker({
      address: CONTRACT_ADDRESSES.identityRegistry,
      abi: FlowWageIdentityRegistryABI,
      functionName: 'unlinkWorker',
      args: [worker as `0x${string}`],
    })
  }

  const identityData = identity as any
  const hasIdentity = identityData?.exists ?? identityData?.[3] ?? false
  const idName = identityData?.name ?? identityData?.[0] ?? ''
  const idRole = Number(identityData?.role ?? identityData?.[1] ?? 0)
  const idRegisteredAt = Number(identityData?.registeredAt ?? identityData?.[2] ?? 0)
  const workers = (linkedWorkers as string[]) ?? []

  return (
    <AppLayout>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl font-extrabold tracking-tight flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
              <Shield className="h-5 w-5 text-blue-500" />
            </div>
            On-Chain Identity
          </h1>
          <p className="mt-1 text-muted-foreground">
            Register and manage your on-chain identity via the IdentityRegistry contract
          </p>
        </motion.div>

        {identityLoading ? (
          <Skeleton className="h-48 w-full rounded-xl" />
        ) : !hasIdentity ? (
          /* Registration form */
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Register Your Identity
                </CardTitle>
                <CardDescription>
                  Create your on-chain identity on the IdentityRegistry contract. This is stored permanently on Polygon.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Display Name</Label>
                  <Input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Your name or organization"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Role</Label>
                  <div className="mt-1 flex gap-2">
                    <Button
                      variant={role === 0 ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setRole(0)}
                    >
                      Employer
                    </Button>
                    <Button
                      variant={role === 1 ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setRole(1)}
                    >
                      Worker
                    </Button>
                  </div>
                </div>
                <Button onClick={handleRegister} disabled={isRegistering || !name.trim()}>
                  {isRegistering && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Register On-Chain
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          /* Identity card */
          <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-blue-500 to-cyan-500" />
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <UserCheck className="h-5 w-5 text-emerald-500" />
                        <span className="text-xs font-semibold text-emerald-500">Verified On-Chain</span>
                      </div>
                      {editMode ? (
                        <div className="mt-2 flex items-center gap-2">
                          <Input
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-64"
                          />
                          <Button size="sm" onClick={handleUpdateName} disabled={isUpdating}>
                            {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditMode(false)}>Cancel</Button>
                        </div>
                      ) : (
                        <h2 className="mt-1 text-2xl font-bold">{idName}</h2>
                      )}
                      <p className="mt-1 text-sm text-muted-foreground">
                        Role: {idRole === 0 ? 'Employer' : 'Worker'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Registered: {new Date(idRegisteredAt * 1000).toLocaleDateString()}
                      </p>
                    </div>
                    {!editMode && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => { setEditMode(true); setName(idName) }}
                      >
                        <Edit className="mr-1 h-3 w-3" />
                        Edit
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Linked Workers */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Link2 className="h-4 w-4" />
                    Linked Workers ({workers.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Link new worker */}
                  <div className="flex gap-2">
                    <Input
                      value={workerAddress}
                      onChange={e => setWorkerAddress(e.target.value)}
                      placeholder="0x... Worker wallet address"
                      className="flex-1"
                    />
                    <Button onClick={handleLinkWorker} disabled={isLinking || !workerAddress.trim()} size="sm">
                      {isLinking ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Link2 className="mr-1 h-3 w-3" />}
                      Link
                    </Button>
                  </div>

                  {/* Worker list */}
                  {workers.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No workers linked yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {workers.map(worker => (
                        <div key={worker} className="flex items-center justify-between rounded-lg border p-3">
                          <AddressDisplay address={worker} showCopy showExplorer />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleUnlinkWorker(worker)}
                            disabled={isUnlinking}
                          >
                            <Unlink className="mr-1 h-3 w-3" />
                            Unlink
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
