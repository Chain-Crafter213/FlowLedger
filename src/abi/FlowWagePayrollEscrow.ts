export const FlowWagePayrollEscrowABI = [
  // Constructor
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
      { indexed: true, name: 'payrollId', type: 'uint256' },
      { indexed: true, name: 'employer', type: 'address' },
      { indexed: false, name: 'totalAmount', type: 'uint256' },
      { indexed: false, name: 'workerCount', type: 'uint256' },
      { indexed: false, name: 'memo', type: 'string' },
    ],
    name: 'PayrollCreated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'payrollId', type: 'uint256' },
      { indexed: true, name: 'worker', type: 'address' },
      { indexed: false, name: 'amount', type: 'uint256' },
    ],
    name: 'PaymentClaimed',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'payrollId', type: 'uint256' },
      { indexed: true, name: 'worker', type: 'address' },
      { indexed: false, name: 'reason', type: 'string' },
    ],
    name: 'PaymentDisputed',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'payrollId', type: 'uint256' },
      { indexed: true, name: 'employer', type: 'address' },
      { indexed: false, name: 'refundedAmount', type: 'uint256' },
    ],
    name: 'PayrollRevoked',
    type: 'event',
  },
  // Functions
  {
    inputs: [
      { name: 'workers', type: 'address[]' },
      { name: 'amounts', type: 'uint256[]' },
      { name: 'memo', type: 'string' },
      { name: 'expiresIn', type: 'uint256' },
    ],
    name: 'createPayroll',
    outputs: [{ name: 'payrollId', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'payrollId', type: 'uint256' }],
    name: 'claimPayment',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'payrollId', type: 'uint256' },
      { name: 'reason', type: 'string' },
    ],
    name: 'disputePayment',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'payrollId', type: 'uint256' }],
    name: 'revokePayroll',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'payrollId', type: 'uint256' }],
    name: 'getPayrollWorkers',
    outputs: [{ name: '', type: 'address[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'payrollId', type: 'uint256' },
      { name: 'worker', type: 'address' },
    ],
    name: 'getPayment',
    outputs: [
      {
        components: [
          { name: 'payrollId', type: 'uint256' },
          { name: 'worker', type: 'address' },
          { name: 'amount', type: 'uint256' },
          { name: 'claimed', type: 'bool' },
          { name: 'disputed', type: 'bool' },
          { name: 'claimedAt', type: 'uint256' },
        ],
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'payrollId', type: 'uint256' },
      { name: 'worker', type: 'address' },
    ],
    name: 'isClaimable',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: '', type: 'uint256' }],
    name: 'payrollRuns',
    outputs: [
      { name: 'id', type: 'uint256' },
      { name: 'employer', type: 'address' },
      { name: 'totalAmount', type: 'uint256' },
      { name: 'claimedAmount', type: 'uint256' },
      { name: 'createdAt', type: 'uint256' },
      { name: 'expiresAt', type: 'uint256' },
      { name: 'revoked', type: 'bool' },
      { name: 'memo', type: 'string' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'payrollCount',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: '_feeManager', type: 'address' }],
    name: 'setFeeManager',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'usdc',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'feeManager',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const
