import { db } from '../storage/db'
import { getSetting } from '../storage/db'
import { USDC_ADDRESS } from '../chain'

export interface PolygonscanTransfer {
  blockNumber: string
  timeStamp: string
  hash: string
  from: string
  to: string
  value: string
  tokenName: string
  tokenSymbol: string
  tokenDecimal: string
  gas: string
  gasPrice: string
  gasUsed: string
  confirmations: string
}

export interface PolygonscanResponse {
  status: string
  message: string
  result: PolygonscanTransfer[] | string
}

const POLYGONSCAN_API_BASE = 'https://api.polygonscan.com/api'
const RATE_LIMIT_DELAY = 250 // 4 calls per second to stay safe

let lastCallTime = 0

async function rateLimitedFetch(url: string): Promise<Response> {
  const now = Date.now()
  const timeSinceLastCall = now - lastCallTime
  
  if (timeSinceLastCall < RATE_LIMIT_DELAY) {
    await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY - timeSinceLastCall))
  }
  
  lastCallTime = Date.now()
  return fetch(url)
}

export async function fetchUSDCTransfers(
  address: string,
  startBlock: number = 0,
  endBlock: number = 99999999,
  page: number = 1,
  offset: number = 100
): Promise<{ transfers: PolygonscanTransfer[]; error?: string }> {
  const apiKey = await getSetting('polygonscan_api_key')
  
  if (!apiKey) {
    return { transfers: [], error: 'Polygonscan API key not configured. Add it in Settings.' }
  }

  const params = new URLSearchParams({
    module: 'account',
    action: 'tokentx',
    contractaddress: USDC_ADDRESS,
    address: address,
    startblock: startBlock.toString(),
    endblock: endBlock.toString(),
    page: page.toString(),
    offset: offset.toString(),
    sort: 'desc',
    apikey: apiKey,
  })

  try {
    const response = await rateLimitedFetch(`${POLYGONSCAN_API_BASE}?${params}`)
    const data: PolygonscanResponse = await response.json()

    if (data.status !== '1') {
      if (data.message === 'No transactions found') {
        return { transfers: [] }
      }
      return { transfers: [], error: data.message || 'Unknown error' }
    }

    if (typeof data.result === 'string') {
      return { transfers: [], error: data.result }
    }

    return { transfers: data.result }
  } catch (error) {
    return { transfers: [], error: error instanceof Error ? error.message : 'Network error' }
  }
}

export async function fetchAndCacheTransfers(
  address: string,
  startBlock?: number
): Promise<{ count: number; error?: string }> {
  // Get the latest cached block for this address
  const latestCached = await db.cachedTransfers
    .where('from').equals(address.toLowerCase())
    .or('to').equals(address.toLowerCase())
    .reverse()
    .sortBy('blockNumber')
  
  const fromBlock = startBlock ?? (latestCached[0]?.blockNumber ?? 0)
  
  const { transfers, error } = await fetchUSDCTransfers(address, fromBlock)
  
  if (error) {
    return { count: 0, error }
  }

  const now = Date.now()
  let addedCount = 0

  for (const transfer of transfers) {
    // Check if already cached
    const existing = await db.cachedTransfers
      .where('txHash')
      .equals(transfer.hash)
      .first()
    
    if (!existing) {
      await db.cachedTransfers.add({
        hash: transfer.hash,
        txHash: transfer.hash,
        blockNumber: parseInt(transfer.blockNumber),
        timestamp: parseInt(transfer.timeStamp),
        from: transfer.from.toLowerCase(),
        to: transfer.to.toLowerCase(),
        value: transfer.value,
        tokenSymbol: transfer.tokenSymbol,
        tokenDecimal: parseInt(transfer.tokenDecimal),
        gasUsed: transfer.gasUsed,
        gasPrice: transfer.gasPrice,
        cachedAt: now,
      })
      addedCount++
    }
  }

  return { count: addedCount }
}

export async function getTransactionDetails(txHash: string): Promise<{
  tx: PolygonscanTransfer | null
  error?: string
}> {
  const apiKey = await getSetting('polygonscan_api_key')
  
  if (!apiKey) {
    return { tx: null, error: 'Polygonscan API key not configured' }
  }

  const params = new URLSearchParams({
    module: 'proxy',
    action: 'eth_getTransactionByHash',
    txhash: txHash,
    apikey: apiKey,
  })

  try {
    const response = await rateLimitedFetch(`${POLYGONSCAN_API_BASE}?${params}`)
    const data = await response.json()

    if (data.error) {
      return { tx: null, error: data.error.message }
    }

    return { tx: data.result }
  } catch (error) {
    return { tx: null, error: error instanceof Error ? error.message : 'Network error' }
  }
}
