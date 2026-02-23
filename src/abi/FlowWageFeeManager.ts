export const FlowWageFeeManagerABI = [
  {
    inputs: [
      { name: '_usdc', type: 'address' },
      { name: '_treasury', type: 'address' },
      { name: '_owner', type: 'address' },
    ],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'from', type: 'address' },
      { indexed: false, name: 'amount', type: 'uint256' },
      { indexed: false, name: 'feeAmount', type: 'uint256' },
    ],
    name: 'FeeCollected',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, name: 'oldFee', type: 'uint256' },
      { indexed: false, name: 'newFee', type: 'uint256' },
    ],
    name: 'FeeUpdated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, name: 'oldTreasury', type: 'address' },
      { indexed: false, name: 'newTreasury', type: 'address' },
    ],
    name: 'TreasuryUpdated',
    type: 'event',
  },
  {
    inputs: [
      { name: 'amount', type: 'uint256' },
      { name: 'payer', type: 'address' },
    ],
    name: 'calculateFee',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'from', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'collectFee',
    outputs: [{ name: 'feeAmount', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'payrollFeeBps',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'treasury',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'owner',
    outputs: [{ name: '', type: 'address' }],
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
