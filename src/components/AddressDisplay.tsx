import { ExternalLink, Copy, Check } from 'lucide-react'
import { useState } from 'react'
import { truncateAddress, truncateHash } from '@/lib/utils'
import { getExplorerTxUrl, getExplorerAddressUrl } from '@/lib/chain'
import { Button } from './ui/button'
import { cn } from '@/lib/utils'

interface AddressDisplayProps {
  address: string
  truncate?: boolean
  showCopy?: boolean
  showExplorer?: boolean
  className?: string
}

export function AddressDisplay({
  address,
  truncate = true,
  showCopy = true,
  showExplorer = true,
  className,
}: AddressDisplayProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <span className={cn('inline-flex items-center gap-1', className)}>
      <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm">
        {truncate ? truncateAddress(address) : address}
      </code>
      {showCopy && (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={handleCopy}
        >
          {copied ? (
            <Check className="h-3 w-3 text-success" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
        </Button>
      )}
      {showExplorer && (
        <a
          href={getExplorerAddressUrl(address)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-foreground"
        >
          <ExternalLink className="h-3 w-3" />
        </a>
      )}
    </span>
  )
}

interface TxHashDisplayProps {
  hash: string
  truncate?: boolean
  showCopy?: boolean
  showExplorer?: boolean
  className?: string
}

export function TxHashDisplay({
  hash,
  truncate = true,
  showCopy = true,
  showExplorer = true,
  className,
}: TxHashDisplayProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(hash)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <span className={cn('inline-flex items-center gap-1', className)}>
      <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm">
        {truncate ? truncateHash(hash) : hash}
      </code>
      {showCopy && (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={handleCopy}
        >
          {copied ? (
            <Check className="h-3 w-3 text-success" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
        </Button>
      )}
      {showExplorer && (
        <a
          href={getExplorerTxUrl(hash)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-foreground"
        >
          <ExternalLink className="h-3 w-3" />
        </a>
      )}
    </span>
  )
}
