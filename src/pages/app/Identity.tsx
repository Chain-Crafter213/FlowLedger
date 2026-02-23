import { useState, useEffect } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { keccak256, toHex } from 'viem'
import { motion } from 'framer-motion'
import {
  UserCheck,
  UserPlus,
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
import { useToast } from '@/components/ui/use-toast'
import { CONTRACT_ADDRESSES } from '@/lib/chain'
import { FlowWageIdentityRegistryABI } from '@/abi/FlowWageIdentityRegistry'

// Hash user profile data into bytes32 for on-chain storage
function hashProfileData(name: string, role: string): `0x${string}` {
  const data = JSON.stringify({ name, role, v: 1 })
  return keccak256(toHex(data))
}

export default function Identity() {
  const { address } = useAccount()
  const { toast } = useToast()
  const [name, setName] = useState('')
  const [role, setRole] = useState('employer')
  const [editMode, setEditMode] = useState(false)

  // Read identity hash from contract — identities(address) returns (bytes32 dataHash, uint256 registeredAt, uint256 updatedAt, bool exists, address owner)
  const { data: identity, isLoading: identityLoading, refetch: refetchIdentity } = useReadContract({
    address: CONTRACT_ADDRESSES.identityRegistry,
    abi: FlowWageIdentityRegistryABI,
    functionName: 'identities',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!CONTRACT_ADDRESSES.identityRegistry },
  })

  // Check if verified
  const { data: isVerified } = useReadContract({
    address: CONTRACT_ADDRESSES.identityRegistry,
    abi: FlowWageIdentityRegistryABI,
    functionName: 'isVerified',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!CONTRACT_ADDRESSES.identityRegistry },
  })

  // Register identity
  const { writeContract: register, data: registerHash, isPending: isRegistering } = useWriteContract()
  const { isSuccess: isRegistered } = useWaitForTransactionReceipt({ hash: registerHash })

  // Update identity
  const { writeContract: update, data: updateHash, isPending: isUpdating } = useWriteContract()
  const { isSuccess: isUpdated } = useWaitForTransactionReceipt({ hash: updateHash })

  useEffect(() => {
    if (isRegistered) {
      toast({ title: 'Identity Registered', description: 'Your on-chain identity hash has been stored.' })
      refetchIdentity()
    }
  }, [isRegistered])

  useEffect(() => {
    if (isUpdated) {
      toast({ title: 'Identity Updated', description: 'Your on-chain identity hash has been updated.' })
      setEditMode(false)
      refetchIdentity()
    }
  }, [isUpdated])

  const handleRegister = () => {
    if (!CONTRACT_ADDRESSES.identityRegistry || !name.trim()) return
    const dataHash = hashProfileData(name.trim(), role)
    register({
      address: CONTRACT_ADDRESSES.identityRegistry,
      abi: FlowWageIdentityRegistryABI,
      functionName: 'registerIdentity',
      args: [dataHash],
      gas: BigInt(200_000),
    })
    // Save locally so we can display the name
    localStorage.setItem(`identity_${address}`, JSON.stringify({ name: name.trim(), role }))
  }

  const handleUpdate = () => {
    if (!CONTRACT_ADDRESSES.identityRegistry || !name.trim()) return
    const dataHash = hashProfileData(name.trim(), role)
    update({
      address: CONTRACT_ADDRESSES.identityRegistry,
      abi: FlowWageIdentityRegistryABI,
      functionName: 'updateIdentity',
      args: [dataHash],
      gas: BigInt(200_000),
    })
    localStorage.setItem(`identity_${address}`, JSON.stringify({ name: name.trim(), role }))
  }

  // Parse on-chain identity tuple
  const identityData = identity as any
  const hasIdentity = identityData?.[3] ?? identityData?.exists ?? false
  const dataHash = identityData?.[0] ?? identityData?.dataHash ?? '0x'
  const registeredAt = Number(identityData?.[1] ?? identityData?.registeredAt ?? 0)

  // Load locally-stored profile info
  const savedProfile = address ? JSON.parse(localStorage.getItem(`identity_${address}`) || '{}') : {}
  const displayName = savedProfile.name || `Hash: ${String(dataHash).slice(0, 10)}...`
  const displayRole = savedProfile.role || 'unknown'

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
                  Create your on-chain identity. A hash of your profile data is stored permanently on Polygon.
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
                      variant={role === 'employer' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setRole('employer')}
                    >
                      Employer
                    </Button>
                    <Button
                      variant={role === 'worker' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setRole('worker')}
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
                        <span className="text-xs font-semibold text-emerald-500">
                          {isVerified ? 'Verified On-Chain' : 'Registered On-Chain'}
                        </span>
                      </div>
                      {editMode ? (
                        <div className="mt-2 space-y-2">
                          <Input
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-64"
                            placeholder="New display name"
                          />
                          <div className="flex gap-2">
                            <Button
                              variant={role === 'employer' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setRole('employer')}
                            >
                              Employer
                            </Button>
                            <Button
                              variant={role === 'worker' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setRole('worker')}
                            >
                              Worker
                            </Button>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button size="sm" onClick={handleUpdate} disabled={isUpdating}>
                              {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditMode(false)}>Cancel</Button>
                          </div>
                        </div>
                      ) : (
                        <h2 className="mt-1 text-2xl font-bold">{displayName}</h2>
                      )}
                      <p className="mt-1 text-sm text-muted-foreground capitalize">
                        Role: {displayRole}
                      </p>
                      {registeredAt > 0 && (
                        <p className="text-xs text-muted-foreground">
                          Registered: {new Date(registeredAt * 1000).toLocaleDateString()}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-muted-foreground font-mono">
                        Data Hash: {String(dataHash).slice(0, 10)}...{String(dataHash).slice(-8)}
                      </p>
                    </div>
                    {!editMode && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => { setEditMode(true); setName(savedProfile.name || ''); setRole(savedProfile.role || 'employer') }}
                      >
                        <Edit className="mr-1 h-3 w-3" />
                        Edit
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
