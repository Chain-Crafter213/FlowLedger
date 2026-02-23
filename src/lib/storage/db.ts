import Dexie, { type EntityTable } from 'dexie'

// Types
export interface Worker {
  id?: number
  address: string
  name: string
  email?: string
  notes?: string
  createdAt: number
  updatedAt: number
}

export interface Annotation {
  id?: number
  referenceType: 'TX_HASH' | 'PAYROLL_PAYMENT' | 'REQUEST'
  referenceId: string
  memoText: string
  tags: string[]
  metadata?: {
    invoiceId?: string
    payPeriod?: string
    category?: string
    [key: string]: string | undefined
  }
  metadataCID?: string
  createdAt: number
  updatedAt: number
}

export interface CachedTransfer {
  id?: number
  hash: string
  txHash: string
  blockNumber: number
  timestamp: number
  from: string
  to: string
  value: string
  tokenSymbol?: string
  tokenDecimal?: number
  gasUsed?: string
  gasPrice?: string
  cachedAt?: number
}

export interface PayrollRun {
  id?: number
  runId: string
  employer: string
  payments: {
    worker: string
    workerName: string
    amount: string
    status: 'pending' | 'paid' | 'claimed' | 'disputed'
    txHash?: string
  }[]
  payPeriod: string
  totalAmount: string
  status: 'draft' | 'pending' | 'completed' | 'cancelled'
  createdAt: number
  updatedAt: number
}

export interface PayRequest {
  id: string
  workerAddress: string
  employerAddress: string
  amount: string
  description?: string
  dueDate?: string
  status: 'pending' | 'approved' | 'rejected' | 'paid' | 'cancelled' | 'expired' | 'claimable' | 'claimed' | 'disputed'
  payrollRunId?: string
  txHash?: string
  createdAt: string
  expiresAt?: string
}

export interface UserSettings {
  id?: number
  key: string
  value: string
}

export interface StreamRecord {
  id?: number
  streamId: string
  employer: string
  worker: string
  totalAmount: string
  startTime: number
  endTime: number
  withdrawn: string
  status: 'active' | 'completed' | 'cancelled'
  txHash: string
  createdAt: number
}

export interface BountyRecord {
  id?: number
  bountyId: string
  employer: string
  amount: string
  descriptionHash: string
  description: string
  deadline: number
  status: 'open' | 'submitted' | 'approved' | 'cancelled'
  txHash: string
  createdAt: number
}

export interface ProposalRecord {
  id?: number
  proposalId: string
  teamId: string
  workers: string[]
  amounts: string[]
  label: string
  approvals: number
  required: number
  status: 'pending' | 'executed' | 'cancelled'
  txHash: string
  createdAt: number
}

export interface EventRecord {
  id?: number
  eventType: string
  contractAddress: string
  txHash: string
  blockNumber: number
  data: string
  read: boolean
  createdAt: number
}

export interface IdentityRecord {
  id?: number
  address: string
  name: string
  role: number
  registeredAt: number
  cachedAt: number
}

// Database class
class FlowLedgerDB extends Dexie {
  workers!: EntityTable<Worker, 'id'>
  annotations!: EntityTable<Annotation, 'id'>
  cachedTransfers!: EntityTable<CachedTransfer, 'id'>
  payrollRuns!: EntityTable<PayrollRun, 'id'>
  payRequests!: EntityTable<PayRequest, 'id'>
  settings!: EntityTable<UserSettings, 'id'>
  streams!: EntityTable<StreamRecord, 'id'>
  bounties!: EntityTable<BountyRecord, 'id'>
  proposals!: EntityTable<ProposalRecord, 'id'>
  events!: EntityTable<EventRecord, 'id'>
  identities!: EntityTable<IdentityRecord, 'id'>

  constructor() {
    super('FlowLedgerDB')
    
    this.version(1).stores({
      workers: '++id, address, name, createdAt',
      annotations: '++id, referenceType, referenceId, [referenceType+referenceId], createdAt',
      cachedTransfers: '++id, &hash, txHash, blockNumber, timestamp, from, to, cachedAt',
      payrollRuns: '++id, runId, employer, status, createdAt',
      payRequests: 'id, workerAddress, employerAddress, status, createdAt',
      settings: '++id, &key',
    })

    this.version(2).stores({
      workers: '++id, address, name, createdAt',
      annotations: '++id, referenceType, referenceId, [referenceType+referenceId], createdAt',
      cachedTransfers: '++id, &hash, txHash, blockNumber, timestamp, from, to, cachedAt',
      payrollRuns: '++id, runId, employer, status, createdAt',
      payRequests: 'id, workerAddress, employerAddress, status, createdAt',
      settings: '++id, &key',
      streams: '++id, streamId, employer, worker, status, createdAt',
      bounties: '++id, bountyId, employer, status, createdAt',
      proposals: '++id, proposalId, teamId, status, createdAt',
      events: '++id, eventType, txHash, blockNumber, read, createdAt',
      identities: '++id, &address, name, role, cachedAt',
    })
  }
}

export const db = new FlowLedgerDB()

// Settings helpers
export async function getSetting(key: string): Promise<string | undefined> {
  const setting = await db.settings.where('key').equals(key).first()
  return setting?.value
}

export async function setSetting(key: string, value: string): Promise<void> {
  const existing = await db.settings.where('key').equals(key).first()
  if (existing) {
    await db.settings.update(existing.id!, { value })
  } else {
    await db.settings.add({ key, value })
  }
}

export async function deleteSetting(key: string): Promise<void> {
  await db.settings.where('key').equals(key).delete()
}

// Export/Import helpers
export async function exportAllData(): Promise<string> {
  const data = {
    version: 2,
    exportedAt: Date.now(),
    workers: await db.workers.toArray(),
    annotations: await db.annotations.toArray(),
    cachedTransfers: await db.cachedTransfers.toArray(),
    payrollRuns: await db.payrollRuns.toArray(),
    payRequests: await db.payRequests.toArray(),
    settings: await db.settings.toArray(),
    streams: await db.streams.toArray(),
    bounties: await db.bounties.toArray(),
    proposals: await db.proposals.toArray(),
    events: await db.events.toArray(),
    identities: await db.identities.toArray(),
  }
  return JSON.stringify(data, null, 2)
}

export interface ImportData {
  version: number
  exportedAt: number
  workers?: Worker[]
  annotations?: Annotation[]
  cachedTransfers?: CachedTransfer[]
  payrollRuns?: PayrollRun[]
  payRequests?: PayRequest[]
  settings?: UserSettings[]
}

export async function importData(jsonString: string): Promise<{ success: boolean; error?: string }> {
  try {
    const data = JSON.parse(jsonString) as ImportData
    
    if (!data.version || typeof data.version !== 'number') {
      return { success: false, error: 'Invalid data format: missing version' }
    }

    await db.transaction('rw', [db.workers, db.annotations, db.cachedTransfers, db.payrollRuns, db.payRequests, db.settings], async () => {
      if (data.workers?.length) {
        // Remove id to let Dexie auto-generate
        const workersWithoutId = data.workers.map(({ id, ...rest }) => rest)
        await db.workers.bulkAdd(workersWithoutId as Worker[])
      }
      if (data.annotations?.length) {
        const annotationsWithoutId = data.annotations.map(({ id, ...rest }) => rest)
        await db.annotations.bulkAdd(annotationsWithoutId as Annotation[])
      }
      if (data.cachedTransfers?.length) {
        const transfersWithoutId = data.cachedTransfers.map(({ id, ...rest }) => rest)
        await db.cachedTransfers.bulkAdd(transfersWithoutId as CachedTransfer[])
      }
      if (data.payrollRuns?.length) {
        const runsWithoutId = data.payrollRuns.map(({ id, ...rest }) => rest)
        await db.payrollRuns.bulkAdd(runsWithoutId as PayrollRun[])
      }
      if (data.payRequests?.length) {
        const requestsWithoutId = data.payRequests.map(({ id, ...rest }) => rest)
        await db.payRequests.bulkAdd(requestsWithoutId as PayRequest[])
      }
      if (data.settings?.length) {
        for (const setting of data.settings) {
          await setSetting(setting.key, setting.value)
        }
      }
    })

    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function clearAllData(): Promise<void> {
  await db.transaction('rw', [db.workers, db.annotations, db.cachedTransfers, db.payrollRuns, db.payRequests, db.settings, db.streams, db.bounties, db.proposals, db.events, db.identities], async () => {
    await db.workers.clear()
    await db.annotations.clear()
    await db.cachedTransfers.clear()
    await db.payrollRuns.clear()
    await db.payRequests.clear()
    await db.settings.clear()
    await db.streams.clear()
    await db.bounties.clear()
    await db.proposals.clear()
    await db.events.clear()
    await db.identities.clear()
  })
}
