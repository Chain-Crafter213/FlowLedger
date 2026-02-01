import { createPublicClient, http, parseAbiItem, type Log } from 'viem'
import { polygon } from 'viem/chains'
import { db } from '../storage/db'
import { USDC_ADDRESS, RPC_URL } from '../chain'

const publicClient = createPublicClient({
  chain: polygon,
  transport: http(RPC_URL),
})

const TRANSFER_EVENT = parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)')

// Get recent blocks (approximately N days worth)
function getBlocksForDays(days: number): bigint {
  // Polygon produces ~2 second blocks
  const blocksPerDay = (24 * 60 * 60) / 2
  return BigInt(Math.floor(days * blocksPerDay))
}

export async function fetchTransfersViaRPC(
  address: string,
  days: number = 30
): Promise<{ count: number; error?: string }> {
  try {
    const currentBlock = await publicClient.getBlockNumber()
    const blocksToScan = getBlocksForDays(days)
    const fromBlock = currentBlock - blocksToScan

    // Fetch transfers FROM this address
    const logsFrom = await publicClient.getLogs({
      address: USDC_ADDRESS,
      event: TRANSFER_EVENT,
      args: {
        from: address as `0x${string}`,
      },
      fromBlock,
      toBlock: currentBlock,
    })

    // Fetch transfers TO this address
    const logsTo = await publicClient.getLogs({
      address: USDC_ADDRESS,
      event: TRANSFER_EVENT,
      args: {
        to: address as `0x${string}`,
      },
      fromBlock,
      toBlock: currentBlock,
    })

    // Combine and deduplicate
    const allLogs = [...logsFrom, ...logsTo]
    const seenTxHashes = new Set<string>()
    const uniqueLogs: Log[] = []

    for (const log of allLogs) {
      if (!seenTxHashes.has(log.transactionHash!)) {
        seenTxHashes.add(log.transactionHash!)
        uniqueLogs.push(log)
      }
    }

    const now = Date.now()
    let addedCount = 0

    for (const log of uniqueLogs) {
      const txHash = log.transactionHash!
      // Check if already cached
      const existing = await db.cachedTransfers
        .where('hash')
        .equals(txHash)
        .first()

      if (!existing) {
        // Get block for timestamp
        const block = await publicClient.getBlock({ blockNumber: log.blockNumber! })
        
        const args = (log as any).args as { from: string; to: string; value: bigint }
        
        await db.cachedTransfers.add({
          hash: txHash,
          txHash: txHash,
          blockNumber: Number(log.blockNumber),
          timestamp: Number(block.timestamp),
          from: args.from.toLowerCase(),
          to: args.to.toLowerCase(),
          value: args.value.toString(),
          tokenSymbol: 'USDC',
          tokenDecimal: 6,
          gasUsed: '0',
          gasPrice: '0',
          cachedAt: now,
        })
        addedCount++
      }
    }

    return { count: addedCount }
  } catch (error) {
    console.error('RPC fetch error:', error)
    return { count: 0, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function getLatestBlockNumber(): Promise<bigint> {
  return publicClient.getBlockNumber()
}

export async function getBlockTimestamp(blockNumber: bigint): Promise<number> {
  const block = await publicClient.getBlock({ blockNumber })
  return Number(block.timestamp)
}
