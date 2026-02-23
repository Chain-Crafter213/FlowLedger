export const FlowLedgerPayRequestsABI = [
  {
    inputs: [
      { name: '_usdc', type: 'address' },
      { name: '_owner', type: 'address' },
    ],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'requestId', type: 'uint256' },
      { indexed: true, name: 'worker', type: 'address' },
      { indexed: true, name: 'employer', type: 'address' },
      { indexed: false, name: 'amount', type: 'uint256' },
      { indexed: false, name: 'description', type: 'string' },
    ],
    name: 'RequestCreated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'requestId', type: 'uint256' },
      { indexed: true, name: 'employer', type: 'address' },
    ],
    name: 'RequestApproved',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'requestId', type: 'uint256' },
      { indexed: true, name: 'employer', type: 'address' },
      { indexed: false, name: 'reason', type: 'string' },
    ],
    name: 'RequestRejected',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'requestId', type: 'uint256' },
      { indexed: true, name: 'employer', type: 'address' },
      { indexed: true, name: 'worker', type: 'address' },
      { indexed: false, name: 'amount', type: 'uint256' },
    ],
    name: 'RequestPaid',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'requestId', type: 'uint256' },
      { indexed: true, name: 'worker', type: 'address' },
    ],
    name: 'RequestCancelled',
    type: 'event',
  },
  // Functions
  {
    inputs: [
      { name: 'employer', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'description', type: 'string' },
      { name: 'dueDate', type: 'uint256' },
    ],
    name: 'createRequest',
    outputs: [{ name: 'requestId', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'requestId', type: 'uint256' }],
    name: 'approveRequest',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'requestId', type: 'uint256' },
      { name: 'reason', type: 'string' },
    ],
    name: 'rejectRequest',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'requestId', type: 'uint256' }],
    name: 'payRequest',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'requestId', type: 'uint256' }],
    name: 'cancelRequest',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'worker', type: 'address' }],
    name: 'getRequestsByWorker',
    outputs: [{ name: '', type: 'uint256[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'employer', type: 'address' }],
    name: 'getRequestsByEmployer',
    outputs: [{ name: '', type: 'uint256[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'requestId', type: 'uint256' }],
    name: 'getRequest',
    outputs: [
      {
        components: [
          { name: 'id', type: 'uint256' },
          { name: 'worker', type: 'address' },
          { name: 'employer', type: 'address' },
          { name: 'amount', type: 'uint256' },
          { name: 'description', type: 'string' },
          { name: 'createdAt', type: 'uint256' },
          { name: 'dueDate', type: 'uint256' },
          { name: 'status', type: 'uint8' },
          { name: 'rejectionReason', type: 'string' },
        ],
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'requestCount',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'usdc',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

export const FLOW_LEDGER_PAY_REQUESTS_ABI = FlowLedgerPayRequestsABI
