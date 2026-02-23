import { createPublicClient, http, parseAbiItem, type Log } from 'viem'
import { polygon } from 'viem/chains'
import { db } from '../storage/db'
import { USDC_ADDRESS } from '../chain'

// Use public RPC for log fetching — Alchemy free tier limits eth_getLogs to 10 blocks
const PUBLIC_RPC = 'https://polygon-rpc.com'

const publicClient = createPublicClient({
  chain: polygon,
  transport: http(PUBLIC_RPC),
})

const TRANSFER_EVENT = parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)')

// Max blocks per getLogs call (public RPCs typically allow ~3500)
const MAX_BLOCK_RANGE = 3000n

// Get recent blocks (approximately N days worth)
function getBlocksForDays(days: number): bigint {
  // Polygon produces ~2 second blocks
  const blocksPerDay = (24 * 60 * 60) / 2
  return BigInt(Math.floor(days * blocksPerDay))
}

// Fetch logs in chunks to handle RPC block range limits
async function getLogsInChunks(
  args: {
    address: `0x${string}`
    event: typeof TRANSFER_EVENT
    args: Record<string, any>
    fromBlock: bigint
    toBlock: bigint
  }
): Promise<Log[]> {
  const allLogs: Log[] = []
  let from = args.fromBlock

  while (from <= args.toBlock) {
    const to = from + MAX_BLOCK_RANGE > args.toBlock ? args.toBlock : from + MAX_BLOCK_RANGE
    try {
      const logs = await publicClient.getLogs({
        address: args.address,
        event: args.event,
        args: args.args,
        fromBlock: from,
        toBlock: to,
      })
      allLogs.push(...logs)
    } catch (e) {
      console.warn(`getLogs chunk failed for blocks ${from}-${to}:`, e)
      // If chunk fails, try smaller chunks
      if (to - from > 500n) {
        const mid = from + (to - from) / 2n
        try {
          const logs1 = await publicClient.getLogs({
            address: args.address, event: args.event, args: args.args,
            fromBlock: from, toBlock: mid,
          })
          allLogs.push(...logs1)
        } catch { /* skip */ }
        try {
          const logs2 = await publicClient.getLogs({
            address: args.address, event: args.event, args: args.args,
            fromBlock: mid + 1n, toBlock: to,
          })
          allLogs.push(...logs2)
        } catch { /* skip */ }
      }
    }
    from = to + 1n
  }

  return allLogs
}

export async function fetchTransfersViaRPC(
  address: string,
  days: number = 30
): Promise<{ count: number; error?: string }> {
  try {
    const currentBlock = await publicClient.getBlockNumber()
    const blocksToScan = getBlocksForDays(days)
    const fromBlock = currentBlock - blocksToScan

    // Fetch transfers FROM this address (in chunks)
    const logsFrom = await getLogsInChunks({
      address: USDC_ADDRESS,
      event: TRANSFER_EVENT,
      args: { from: address as `0x${string}` },
      fromBlock,
      toBlock: currentBlock,
    })

    // Fetch transfers TO this address (in chunks)
    const logsTo = await getLogsInChunks({
      address: USDC_ADDRESS,
      event: TRANSFER_EVENT,
      args: { to: address as `0x${string}` },
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
