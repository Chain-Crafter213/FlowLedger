import { useParams, Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { motion } from 'framer-motion'
import {
  ExternalLink,
  CheckCircle,
  Calendar,
  Wallet,
  Copy,
  Check,
} from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { AddressDisplay } from '@/components/AddressDisplay'
import { db } from '@/lib/storage'
import { getAnnotationForReference } from '@/lib/search'
import { formatUSDC } from '@/lib/usdc'
import { formatDate } from '@/lib/utils'
import { getExplorerTxUrl } from '@/lib/chain'

export default function Payslip() {
  const { referenceType, referenceId } = useParams<{
    referenceType: string
    referenceId: string
  }>()
  const [copied, setCopied] = useState(false)

  // Get transfer data
  const transfer = useLiveQuery(async () => {
    if (referenceType !== 'TX_HASH' || !referenceId) return null
    return db.cachedTransfers.where('txHash').equals(referenceId.toLowerCase()).first()
  }, [referenceType, referenceId])

  // Get annotation
  const annotation = useLiveQuery(async () => {
    if (!referenceType || !referenceId) return null
    return getAnnotationForReference(
      referenceType as 'TX_HASH' | 'PAYROLL_PAYMENT' | 'REQUEST',
      referenceId
    )
  }, [referenceType, referenceId])

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Wallet className="h-6 w-6 text-primary" />
            <span className="font-display font-semibold">FlowLedger</span>
          </Link>
          <Button variant="outline" size="sm" onClick={handleCopyLink}>
            {copied ? (
              <Check className="mr-2 h-4 w-4" />
            ) : (
              <Copy className="mr-2 h-4 w-4" />
            )}
            {copied ? 'Copied!' : 'Copy Link'}
          </Button>
        </div>
      </header>

      <main className="container py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto max-w-2xl"
        >
          {/* Payslip Card */}
          <Card className="overflow-hidden">
            <div className="bg-primary px-6 py-8 text-primary-foreground">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-80">Payment Proof</p>
                  <h1 className="mt-1 font-display text-2xl font-bold">
                    FlowLedger Payslip
                  </h1>
                </div>
                <CheckCircle className="h-12 w-12 opacity-80" />
              </div>
            </div>

            <CardContent className="p-6">
              {transfer === undefined ? (
                <div className="space-y-4">
                  <Skeleton className="h-8 w-1/2" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-3/4" />
                </div>
              ) : transfer === null ? (
                <div className="py-8 text-center">
                  <p className="text-muted-foreground">
                    Transaction data not available.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Amount */}
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Amount Paid</p>
                    <p className="mt-1 font-display text-4xl font-bold">
                      {formatUSDC(BigInt(transfer.value))}
                    </p>
                    <Badge variant="success" className="mt-2">
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Confirmed on Polygon
                    </Badge>
                  </div>

                  <Separator />

                  {/* Details */}
                  <div className="grid gap-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">From</p>
                        <AddressDisplay address={transfer.from} className="mt-1" />
                      </div>
                    </div>

                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">To</p>
                        <AddressDisplay address={transfer.to} className="mt-1" />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {formatDate(transfer.timestamp)}
                      </span>
                    </div>
                  </div>

                  {/* Annotation */}
                  {annotation && (annotation.memoText || annotation.tags.length > 0) && (
                    <>
                      <Separator />
                      <div className="space-y-3">
                        {annotation.memoText && (
                          <div>
                            <p className="text-sm text-muted-foreground">Note</p>
                            <p className="mt-1">{annotation.memoText}</p>
                          </div>
                        )}
                        {annotation.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {annotation.tags.map((tag) => (
                              <Badge key={tag} variant="secondary">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  <Separator />

                  {/* Transaction Hash */}
                  <div>
                    <p className="text-sm text-muted-foreground">Transaction Hash</p>
                    <p className="mt-1 break-all font-mono text-xs text-muted-foreground">
                      {referenceId}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <a
                      href={getExplorerTxUrl(referenceId || '')}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1"
                    >
                      <Button variant="outline" className="w-full">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        View on Polygonscan
                      </Button>
                    </a>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              This payslip was generated by FlowLedger.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Verified on Polygon blockchain at block {transfer?.blockNumber}
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
