import { db } from '../storage/db'
import { USDC_ADDRESS } from '../chain'

// Use Polygonscan API for fetching USDC transfers — no RPC block range issues
const POLYGONSCAN_API = 'https://api.polygonscan.com/api'

interface PolygonscanTransfer {
  blockNumber: string
  timeStamp: string
  hash: string
  from: string
  to: string
  value: string
  tokenSymbol: string
  tokenDecimal: string
  gasUsed: string
  gasPrice: string
}

export async function fetchTransfersViaRPC(
  address: string,
  days: number = 7
): Promise<{ count: number; error?: string }> {
  try {
    // Calculate start block roughly: current timestamp - days * 86400
    // Use Polygonscan's startblock=0 and let it filter by timestamp via page/offset
    const startTimestamp = Math.floor(Date.now() / 1000) - days * 86400

    // Fetch incoming transfers
    const inUrl = `${POLYGONSCAN_API}?module=account&action=tokentx&contractaddress=${USDC_ADDRESS}&address=${address}&startblock=0&endblock=99999999&page=1&offset=500&sort=desc`
    const inRes = await fetch(inUrl)
    const inData = await inRes.json()

    const transfers: PolygonscanTransfer[] = []

    if (inData.status === '1' && Array.isArray(inData.result)) {
      for (const tx of inData.result as PolygonscanTransfer[]) {
        if (Number(tx.timeStamp) >= startTimestamp) {
          transfers.push(tx)
        }
      }
    }

    // Deduplicate by hash
    const seenHashes = new Set<string>()
    const uniqueTransfers: PolygonscanTransfer[] = []
    for (const tx of transfers) {
      if (!seenHashes.has(tx.hash)) {
        seenHashes.add(tx.hash)
        uniqueTransfers.push(tx)
      }
    }

    const now = Date.now()
    let addedCount = 0

    for (const tx of uniqueTransfers) {
      const existing = await db.cachedTransfers
        .where('hash')
        .equals(tx.hash)
        .first()

      if (!existing) {
        await db.cachedTransfers.add({
          hash: tx.hash,
          txHash: tx.hash,
          blockNumber: Number(tx.blockNumber),
          timestamp: Number(tx.timeStamp),
          from: tx.from.toLowerCase(),
          to: tx.to.toLowerCase(),
          value: tx.value,
          tokenSymbol: tx.tokenSymbol || 'USDC',
          tokenDecimal: Number(tx.tokenDecimal) || 6,
          gasUsed: tx.gasUsed || '0',
          gasPrice: tx.gasPrice || '0',
          cachedAt: now,
        })
        addedCount++
      }
    }

    return { count: addedCount }
  } catch (error) {
    console.error('Polygonscan fetch error:', error)
    return { count: 0, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
