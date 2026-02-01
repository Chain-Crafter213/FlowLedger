import { db, type CachedTransfer, type Annotation } from '../storage/db'

export interface SearchFilters {
  address?: string
  txHash?: string
  tag?: string
  minAmount?: number
  maxAmount?: number
  since?: Date
  until?: Date
  direction?: 'in' | 'out' | 'all'
}

export interface SearchResult {
  type: 'transfer' | 'annotation'
  transfer?: CachedTransfer
  annotation?: Annotation
  relevance: number
}

// Parse search query into filters
// Examples: tag:invoice-1042 amount>100 since:2026-01-01
export function parseSearchQuery(query: string): { filters: SearchFilters; freeText: string } {
  const filters: SearchFilters = {}
  let freeText = query

  // Extract tag:value
  const tagMatch = query.match(/tag:(\S+)/i)
  if (tagMatch) {
    filters.tag = tagMatch[1]
    freeText = freeText.replace(tagMatch[0], '')
  }

  // Extract amount>N or amount<N
  const amountGtMatch = query.match(/amount>(\d+(?:\.\d+)?)/i)
  if (amountGtMatch) {
    filters.minAmount = parseFloat(amountGtMatch[1])
    freeText = freeText.replace(amountGtMatch[0], '')
  }

  const amountLtMatch = query.match(/amount<(\d+(?:\.\d+)?)/i)
  if (amountLtMatch) {
    filters.maxAmount = parseFloat(amountLtMatch[1])
    freeText = freeText.replace(amountLtMatch[0], '')
  }

  // Extract since:YYYY-MM-DD
  const sinceMatch = query.match(/since:(\d{4}-\d{2}-\d{2})/i)
  if (sinceMatch) {
    filters.since = new Date(sinceMatch[1])
    freeText = freeText.replace(sinceMatch[0], '')
  }

  // Extract until:YYYY-MM-DD
  const untilMatch = query.match(/until:(\d{4}-\d{2}-\d{2})/i)
  if (untilMatch) {
    filters.until = new Date(untilMatch[1])
    freeText = freeText.replace(untilMatch[0], '')
  }

  // Extract direction:in or direction:out
  const dirMatch = query.match(/direction:(in|out)/i)
  if (dirMatch) {
    filters.direction = dirMatch[1] as 'in' | 'out'
    freeText = freeText.replace(dirMatch[0], '')
  }

  // Check if freeText is an address or tx hash
  freeText = freeText.trim()
  
  if (/^0x[a-fA-F0-9]{40}$/.test(freeText)) {
    filters.address = freeText.toLowerCase()
    freeText = ''
  } else if (/^0x[a-fA-F0-9]{64}$/.test(freeText)) {
    filters.txHash = freeText.toLowerCase()
    freeText = ''
  }

  return { filters, freeText: freeText.trim() }
}

export async function searchTransfers(
  userAddress: string,
  filters: SearchFilters,
  limit: number = 100
): Promise<CachedTransfer[]> {
  let query = db.cachedTransfers.orderBy('timestamp').reverse()

  let results = await query.toArray()

  // Filter by user involvement (as sender or receiver)
  results = results.filter(t => 
    t.from.toLowerCase() === userAddress.toLowerCase() ||
    t.to.toLowerCase() === userAddress.toLowerCase()
  )

  // Apply filters
  if (filters.address) {
    const addr = filters.address.toLowerCase()
    results = results.filter(t => 
      t.from.toLowerCase() === addr || 
      t.to.toLowerCase() === addr
    )
  }

  if (filters.txHash) {
    results = results.filter(t => 
      t.txHash.toLowerCase() === filters.txHash!.toLowerCase()
    )
  }

  if (filters.minAmount !== undefined) {
    const minInUnits = BigInt(Math.floor(filters.minAmount * 1e6))
    results = results.filter(t => BigInt(t.value) >= minInUnits)
  }

  if (filters.maxAmount !== undefined) {
    const maxInUnits = BigInt(Math.floor(filters.maxAmount * 1e6))
    results = results.filter(t => BigInt(t.value) <= maxInUnits)
  }

  if (filters.since) {
    const sinceTimestamp = Math.floor(filters.since.getTime() / 1000)
    results = results.filter(t => t.timestamp >= sinceTimestamp)
  }

  if (filters.until) {
    const untilTimestamp = Math.floor(filters.until.getTime() / 1000)
    results = results.filter(t => t.timestamp <= untilTimestamp)
  }

  if (filters.direction) {
    const addr = userAddress.toLowerCase()
    if (filters.direction === 'in') {
      results = results.filter(t => t.to.toLowerCase() === addr)
    } else {
      results = results.filter(t => t.from.toLowerCase() === addr)
    }
  }

  return results.slice(0, limit)
}

export async function searchAnnotations(
  filters: SearchFilters,
  freeText: string
): Promise<Annotation[]> {
  let results = await db.annotations.toArray()

  // Filter by tag
  if (filters.tag) {
    results = results.filter(a => 
      a.tags.some(t => t.toLowerCase().includes(filters.tag!.toLowerCase()))
    )
  }

  // Filter by txHash if referenceType is TX_HASH
  if (filters.txHash) {
    results = results.filter(a => 
      a.referenceType === 'TX_HASH' && 
      a.referenceId.toLowerCase() === filters.txHash!.toLowerCase()
    )
  }

  // Free text search in memo
  if (freeText) {
    const searchLower = freeText.toLowerCase()
    results = results.filter(a => 
      a.memoText.toLowerCase().includes(searchLower) ||
      a.tags.some(t => t.toLowerCase().includes(searchLower))
    )
  }

  return results
}

export async function getAnnotationForReference(
  referenceType: 'TX_HASH' | 'PAYROLL_PAYMENT' | 'REQUEST',
  referenceId: string
): Promise<Annotation | undefined> {
  return db.annotations
    .where('[referenceType+referenceId]')
    .equals([referenceType, referenceId.toLowerCase()])
    .first()
}

export async function saveAnnotation(annotation: Omit<Annotation, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
  const now = Date.now()
  
  // Check for existing annotation
  const existing = await getAnnotationForReference(annotation.referenceType, annotation.referenceId)
  
  if (existing && existing.id !== undefined) {
    await db.annotations.update(existing.id, {
      ...annotation,
      updatedAt: now,
    })
    return existing.id
  }
  
  const id = await db.annotations.add({
    ...annotation,
    referenceId: annotation.referenceId.toLowerCase(),
    createdAt: now,
    updatedAt: now,
  })
  return id as number
}
