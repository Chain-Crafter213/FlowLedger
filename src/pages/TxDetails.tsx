import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAccount } from 'wagmi'
import { useLiveQuery } from 'dexie-react-hooks'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  ExternalLink,
  Plus,
  Save,
  Loader2,
  Wallet,
  Tag,
  FileText,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { AddressDisplay } from '@/components/AddressDisplay'
import { useToast } from '@/components/ui/use-toast'
import { db } from '@/lib/storage'
import { getAnnotationForReference, saveAnnotation } from '@/lib/search'
import { formatUSDC } from '@/lib/usdc'
import { formatDate } from '@/lib/utils'
import { getExplorerTxUrl } from '@/lib/chain'

export default function TxDetails() {
  const { hash } = useParams<{ hash: string }>()
  const { address } = useAccount()
  const { toast } = useToast()
  const [memo, setMemo] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)

  // Get cached transfer data
  const transfer = useLiveQuery(async () => {
    if (!hash) return null
    return db.cachedTransfers.where('txHash').equals(hash.toLowerCase()).first()
  }, [hash])

  // Get existing annotation
  const annotation = useLiveQuery(async () => {
    if (!hash) return null
    return getAnnotationForReference('TX_HASH', hash)
  }, [hash])

  // Load existing annotation data
  useEffect(() => {
    if (annotation) {
      setMemo(annotation.memoText)
      setTags(annotation.tags)
    }
  }, [annotation])

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()])
      setTagInput('')
    }
  }

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag))
  }

  const handleSave = async () => {
    if (!hash) return

    setIsSaving(true)
    try {
      await saveAnnotation({
        referenceType: 'TX_HASH',
        referenceId: hash,
        memoText: memo,
        tags,
      })
      toast({
        title: 'Saved',
        description: 'Annotation saved successfully.',
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save annotation.',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const isIncoming = transfer && address
    ? transfer.to.toLowerCase() === address.toLowerCase()
    : false

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Wallet className="h-6 w-6 text-primary" />
            <span className="font-display font-semibold">FlowLedger</span>
          </Link>
          <Link to="/search">
            <Button variant="outline" size="sm">
              Back to Search
            </Button>
          </Link>
        </div>
      </header>

      <main className="container py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto max-w-3xl"
        >
          <Link
            to="/search"
            className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to search
          </Link>

          <h1 className="font-display text-2xl font-bold">Transaction Details</h1>

          {/* Transaction Info */}
          <Card className="mt-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Transaction</CardTitle>
                <a
                  href={getExplorerTxUrl(hash || '')}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" size="sm">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View on Polygonscan
                  </Button>
                </a>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {transfer === undefined ? (
                <div className="space-y-3">
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-6 w-1/2" />
                </div>
              ) : transfer === null ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    Transaction not found in local cache.
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Import your transaction history in Settings to see details.
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label className="text-muted-foreground">Transaction Hash</Label>
                      <p className="mt-1 break-all font-mono text-sm">{hash}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Status</Label>
                      <div className="mt-1">
                        <Badge variant={isIncoming ? 'success' : 'secondary'}>
                          {isIncoming ? 'Received' : 'Sent'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label className="text-muted-foreground">From</Label>
                      <div className="mt-1">
                        <AddressDisplay address={transfer.from} />
                      </div>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">To</Label>
                      <div className="mt-1">
                        <AddressDisplay address={transfer.to} />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label className="text-muted-foreground">Amount</Label>
                      <p className="mt-1 text-2xl font-bold">
                        {formatUSDC(BigInt(transfer.value))}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Date</Label>
                      <p className="mt-1">{formatDate(transfer.timestamp)}</p>
                    </div>
                  </div>

                  <div>
                    <Label className="text-muted-foreground">Block Number</Label>
                    <p className="mt-1">{transfer.blockNumber}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Annotation Form */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Add Notes and Tags
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="memo">Memo</Label>
                <Input
                  id="memo"
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  placeholder="Add a note about this transaction..."
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="tags">Tags</Label>
                <div className="mt-1 flex gap-2">
                  <Input
                    id="tags"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Add a tag..."
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  />
                  <Button type="button" variant="outline" onClick={handleAddTag}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="cursor-pointer"
                        onClick={() => handleRemoveTag(tag)}
                      >
                        <Tag className="mr-1 h-3 w-3" />
                        {tag}
                        <span className="ml-1 text-muted-foreground">×</span>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <Button onClick={handleSave} disabled={isSaving} className="w-full">
                {isSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save Annotation
              </Button>
            </CardContent>
          </Card>

          {/* Share Link */}
          <Card className="mt-6">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Shareable Payslip Link</p>
                  <p className="text-sm text-muted-foreground">
                    Share this transaction as a payslip proof
                  </p>
                </div>
                <Link to={`/payslip/TX_HASH/${hash}`}>
                  <Button variant="outline" size="sm">
                    View Payslip
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  )
}
