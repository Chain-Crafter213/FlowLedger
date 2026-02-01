import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { motion } from 'framer-motion'
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Copy,
  Check,
  Users,
  Loader2,
} from 'lucide-react'
import { AppLayout } from '@/components/AppLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
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
import { db, type Worker } from '@/lib/storage'
import { isValidAddress } from '@/lib/utils'

export default function Workers() {
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null)
  const [deletingWorker, setDeletingWorker] = useState<Worker | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Form state
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [email, setEmail] = useState('')
  const [notes, setNotes] = useState('')

  // Get workers
  const workers = useLiveQuery(async () => {
    const all = await db.workers.orderBy('name').toArray()
    if (!search) return all
    const searchLower = search.toLowerCase()
    return all.filter(
      (w) =>
        w.name.toLowerCase().includes(searchLower) ||
        w.address.toLowerCase().includes(searchLower)
    )
  }, [search])

  const resetForm = () => {
    setName('')
    setAddress('')
    setEmail('')
    setNotes('')
  }

  const openEditDialog = (worker: Worker) => {
    setEditingWorker(worker)
    setName(worker.name)
    setAddress(worker.address)
    setEmail(worker.email || '')
    setNotes(worker.notes || '')
    setIsAddDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Name is required.',
      })
      return
    }

    if (!isValidAddress(address)) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Invalid wallet address.',
      })
      return
    }

    setIsLoading(true)
    const now = Date.now()

    try {
      if (editingWorker) {
        await db.workers.update(editingWorker.id!, {
          name: name.trim(),
          address: address.toLowerCase(),
          email: email.trim() || undefined,
          notes: notes.trim() || undefined,
          updatedAt: now,
        })
        toast({
          title: 'Updated',
          description: 'Worker updated successfully.',
        })
      } else {
        // Check for duplicate address
        const existing = await db.workers
          .where('address')
          .equals(address.toLowerCase())
          .first()
        if (existing) {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'A worker with this address already exists.',
          })
          setIsLoading(false)
          return
        }

        await db.workers.add({
          name: name.trim(),
          address: address.toLowerCase(),
          email: email.trim() || undefined,
          notes: notes.trim() || undefined,
          createdAt: now,
          updatedAt: now,
        })
        toast({
          title: 'Added',
          description: 'Worker added successfully.',
        })
      }

      setIsAddDialogOpen(false)
      setEditingWorker(null)
      resetForm()
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save worker.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingWorker) return

    try {
      await db.workers.delete(deletingWorker.id!)
      toast({
        title: 'Deleted',
        description: 'Worker removed successfully.',
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete worker.',
      })
    } finally {
      setDeletingWorker(null)
    }
  }

  const generateInviteLink = (worker: Worker) => {
    const baseUrl = window.location.origin
    return `${baseUrl}/worker?ref=${worker.address}`
  }

  const [copiedAddress, setCopiedAddress] = useState<string | null>(null)
  
  const copyInviteLink = async (worker: Worker) => {
    const link = generateInviteLink(worker)
    await navigator.clipboard.writeText(link)
    setCopiedAddress(worker.address)
    setTimeout(() => setCopiedAddress(null), 2000)
    toast({
      title: 'Copied',
      description: 'Invite link copied to clipboard.',
    })
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold">Workers</h1>
            <p className="mt-1 text-muted-foreground">
              Manage your contractors and their wallet addresses
            </p>
          </div>
          <Button onClick={() => {
            resetForm()
            setEditingWorker(null)
            setIsAddDialogOpen(true)
          }}>
            <Plus className="mr-2 h-4 w-4" />
            Add Worker
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or address..."
            className="pl-10"
          />
        </div>

        {/* Workers List */}
        {workers === undefined ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : workers.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center py-12">
              <Users className="h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No workers yet</h3>
              <p className="mt-2 text-center text-muted-foreground">
                Add contractors to start running payroll.
              </p>
              <Button
                className="mt-6"
                onClick={() => {
                  resetForm()
                  setEditingWorker(null)
                  setIsAddDialogOpen(true)
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Worker
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {workers.map((worker, i) => (
              <motion.div
                key={worker.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="space-y-1">
                      <p className="font-medium">{worker.name}</p>
                      <AddressDisplay address={worker.address} />
                      {worker.email && (
                        <p className="text-sm text-muted-foreground">
                          {worker.email}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyInviteLink(worker)}
                        title="Copy invite link"
                      >
                        {copiedAddress === worker.address ? (
                          <Check className="h-4 w-4 text-success" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(worker)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeletingWorker(worker)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
        setIsAddDialogOpen(open)
        if (!open) {
          setEditingWorker(null)
          resetForm()
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingWorker ? 'Edit Worker' : 'Add Worker'}
            </DialogTitle>
            <DialogDescription>
              {editingWorker
                ? 'Update the worker details below.'
                : 'Add a new contractor to your team.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="address">Wallet Address *</Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="0x..."
                className="mt-1 font-mono"
              />
            </div>

            <div>
              <Label htmlFor="email">Email (optional)</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="notes">Notes (optional)</Label>
              <Input
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes..."
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingWorker ? 'Update' : 'Add Worker'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deletingWorker}
        onOpenChange={(open) => !open && setDeletingWorker(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Worker</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {deletingWorker?.name}? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  )
}
