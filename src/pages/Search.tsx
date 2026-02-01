import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAccount } from 'wagmi'
import { useLiveQuery } from 'dexie-react-hooks'
import { motion } from 'framer-motion'
import { Search as SearchIcon, ArrowRight, Loader2, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { AddressDisplay, TxHashDisplay } from '@/components/AddressDisplay'
import { db, type CachedTransfer } from '@/lib/storage'
import { parseSearchQuery, searchTransfers } from '@/lib/search'
import { formatUSDC } from '@/lib/usdc'
import { formatDate, isValidTxHash } from '@/lib/utils'

export default function Search() {
  const { address, isConnected } = useAccount()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [results, setResults] = useState<CachedTransfer[]>([])

  // Get recent transfers for connected user
  const recentTransfers = useLiveQuery(async () => {
    if (!address) return []
    return db.cachedTransfers
      .orderBy('timestamp')
      .reverse()
      .filter(t => 
        t.from.toLowerCase() === address.toLowerCase() ||
        t.to.toLowerCase() === address.toLowerCase()
      )
      .limit(10)
      .toArray()
  }, [address])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!query.trim()) return

    // Direct navigation for tx hash
    if (isValidTxHash(query.trim())) {
      navigate(`/tx/${query.trim()}`)
      return
    }

    setIsSearching(true)
    
    try {
      const { filters } = parseSearchQuery(query)
      
      if (address) {
        const transferResults = await searchTransfers(address, filters)
        setResults(transferResults)
      }
    } finally {
      setIsSearching(false)
    }
  }

  const displayedTransfers = results.length > 0 ? results : (recentTransfers || [])

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Wallet className="h-6 w-6 text-primary" />
            <span className="font-display font-semibold">FlowLedger</span>
          </Link>
          {isConnected && (
            <Link to="/app">
              <Button variant="outline" size="sm">
                Dashboard
              </Button>
            </Link>
          )}
        </div>
      </header>

      <main className="container py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto max-w-3xl"
        >
          <h1 className="font-display text-3xl font-bold">Search</h1>
          <p className="mt-2 text-muted-foreground">
            Search transactions by address, hash, or filter by tags and amounts.
          </p>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="mt-8">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Address, tx hash, tag:invoice-1042, amount>100, since:2026-01-01"
                  className="pl-10"
                />
              </div>
              <Button type="submit" disabled={isSearching}>
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Search'
                )}
              </Button>
            </div>
          </form>

          {/* Search Tips */}
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge variant="secondary" className="cursor-pointer" onClick={() => setQuery('amount>100')}>
              amount&gt;100
            </Badge>
            <Badge variant="secondary" className="cursor-pointer" onClick={() => setQuery('since:2026-01-01')}>
              since:2026-01-01
            </Badge>
            <Badge variant="secondary" className="cursor-pointer" onClick={() => setQuery('direction:in')}>
              direction:in
            </Badge>
            <Badge variant="secondary" className="cursor-pointer" onClick={() => setQuery('direction:out')}>
              direction:out
            </Badge>
          </div>

          {/* Results */}
          <div className="mt-8">
            <h2 className="text-lg font-semibold">
              {results.length > 0 ? 'Search Results' : 'Recent Transactions'}
            </h2>

            {!isConnected ? (
              <Card className="mt-4">
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">
                    Connect your wallet to see your transactions
                  </p>
                </CardContent>
              </Card>
            ) : recentTransfers === undefined ? (
              <div className="mt-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : displayedTransfers.length === 0 ? (
              <Card className="mt-4">
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">
                    {results.length > 0 ? 'No results found' : 'No transactions yet. Import your history in Settings.'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="mt-4 space-y-3">
                {displayedTransfers.map((transfer) => {
                  const isIncoming = transfer.to.toLowerCase() === address?.toLowerCase()
                  return (
                    <motion.div
                      key={transfer.txHash}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <Link to={`/tx/${transfer.txHash}`}>
                        <Card className="transition-colors hover:bg-accent">
                          <CardContent className="flex items-center justify-between p-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Badge variant={isIncoming ? 'success' : 'secondary'}>
                                  {isIncoming ? 'Received' : 'Sent'}
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                  {formatDate(transfer.timestamp)}
                                </span>
                              </div>
                              <TxHashDisplay hash={transfer.txHash} showExplorer={false} showCopy={false} />
                              <div className="text-sm text-muted-foreground">
                                {isIncoming ? 'From: ' : 'To: '}
                                <AddressDisplay 
                                  address={isIncoming ? transfer.from : transfer.to}
                                  showExplorer={false}
                                  showCopy={false}
                                />
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={`text-lg font-semibold ${isIncoming ? 'text-success' : ''}`}>
                                {isIncoming ? '+' : '-'}{formatUSDC(BigInt(transfer.value))}
                              </p>
                              <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </div>
        </motion.div>
      </main>
    </div>
  )
}
