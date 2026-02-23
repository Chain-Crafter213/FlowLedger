import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { useAccount } from 'wagmi'
import { createPublicClient, http, type Log } from 'viem'
import { polygon } from 'viem/chains'
import { useToast } from '@/components/ui/use-toast'
import { CONTRACT_ADDRESSES } from '@/lib/chain'
import { db } from '@/lib/storage'

// Use public RPC for event polling — Alchemy free tier limits eth_getLogs to 10 blocks
const logsClient = createPublicClient({
  chain: polygon,
  transport: http('https://polygon-rpc.com'),
})

interface EventContextValue {
  events: EventItem[]
  isPolling: boolean
}

interface EventItem {
  id: string
  contractName: string
  eventName: string
  blockNumber: bigint
  transactionHash: string
  timestamp: number
  args: Record<string, unknown>
}

const EventContext = createContext<EventContextValue>({
  events: [],
  isPolling: false,
})

export function useEvents() {
  return useContext(EventContext)
}

// Map of contract addresses to names
function getContractName(addr: string): string {
  const lower = addr.toLowerCase()
  for (const [name, address] of Object.entries(CONTRACT_ADDRESSES)) {
    if (address && address.toLowerCase() === lower) return name
  }
  return 'unknown'
}

// Extract event name from log topics using known signatures
const EVENT_SIGNATURES: Record<string, string> = {
  // PayrollEscrow
  '0x5c30f178d0c2e02e1a5e8162ab34d2a0b77e33e28e56c3b36dc35b8fcf55a7c8': 'PayrollCreated',
  // PayRequests
  '0x2f8788117e7eff1d82e926ec794901d17c78024a50270940304540a733656f0d': 'RequestCreated',
  // Streaming
  '0x79c59ed47c07bbe80d0232ac6b10349a8b5b78c33a4f8c2bd8d3028ca6fcee0c': 'StreamCreated',
  '0x7084f5476618d8e60b11ef0d7d3f06914655adb8793e28ff7f018d4c76d505d5': 'Withdrawn',
  // Bounties
  '0xe1fffcc4923d04b559f4d29a8bfc6cda04eb5b0d3c460751c2402c5c5cc9109c': 'BountyCreated',
  // Multisig
  '0x0781faa626a8f1e06e16f7e57896d0e8c79e0da10e4398b60ef36fa8c15a0506': 'ProposalCreated',
  // Identity
  '0x3cd95ceda7cfb46ff7ffed1e832dbd21f1d8e82f37e6f3f04c82d76aa5a3b374': 'IdentityRegistered',
  // Attestations
  '0x90c0c95b2b0b5c2f42c764f6e9afd8c4e8cc0ceb5ff3bb66e9f0da5c9fd1e5d6': 'AttestationCreated',
}

const POLL_INTERVAL = 30000 // 30 seconds

export function EventProvider({ children }: { children: ReactNode }) {
  const { address } = useAccount()
  const { toast } = useToast()
  const [events, setEvents] = useState<EventItem[]>([])
  const [isPolling, setIsPolling] = useState(false)
  const lastBlockRef = useRef<bigint>(0n)

  useEffect(() => {
    if (!address) return

    let intervalId: ReturnType<typeof setInterval>
    let mounted = true

    const poll = async () => {
      try {
        const currentBlock = await logsClient.getBlockNumber()

        // First run: look back 5 blocks only
        if (lastBlockRef.current === 0n) {
          lastBlockRef.current = currentBlock > 5n ? currentBlock - 5n : 0n
        }

        if (currentBlock <= lastBlockRef.current) return

        // Collect all contract addresses to watch
        const addresses = Object.values(CONTRACT_ADDRESSES).filter(Boolean) as `0x${string}`[]
        if (addresses.length === 0) return

        const logs = await logsClient.getLogs({
          address: addresses,
          fromBlock: lastBlockRef.current + 1n,
          toBlock: currentBlock,
        })

        if (!mounted) return

        const newEvents: EventItem[] = logs.map((log: Log) => {
          const topic0 = log.topics[0] ?? ''
          return {
            id: `${log.transactionHash}-${log.logIndex}`,
            contractName: getContractName(log.address),
            eventName: EVENT_SIGNATURES[topic0] ?? 'Unknown',
            blockNumber: log.blockNumber ?? 0n,
            transactionHash: log.transactionHash ?? '',
            timestamp: Date.now(),
            args: {},
          }
        })

        if (newEvents.length > 0) {
          setEvents(prev => [...newEvents, ...prev].slice(0, 200))

          // Save to Dexie
          for (const ev of newEvents) {
            await db.events.add({
              eventType: ev.eventName,
              contractAddress: ev.contractName,
              txHash: ev.transactionHash,
              blockNumber: Number(ev.blockNumber),
              data: JSON.stringify(ev.args),
              read: false,
              createdAt: ev.timestamp,
            })
          }

          // Toast for latest
          const latest = newEvents[0]
          if (latest) {
            toast({
              title: `${latest.contractName}: ${latest.eventName}`,
              description: `Block #${latest.blockNumber.toString()}`,
            })
          }
        }

        lastBlockRef.current = currentBlock
        setIsPolling(true)
      } catch {
        // Silently handle errors — will retry next interval
      }
    }

    // Initial poll
    poll()
    intervalId = setInterval(poll, POLL_INTERVAL)

    return () => {
      mounted = false
      clearInterval(intervalId)
    }
  }, [address])

  return (
    <EventContext.Provider value={{ events, isPolling }}>
      {children}
    </EventContext.Provider>
  )
}
