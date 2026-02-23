export const FlowWageIdentityRegistryABI = [
  {
    inputs: [{ name: '_owner', type: 'address' }],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'account', type: 'address' },
      { indexed: false, name: 'dataHash', type: 'bytes32' },
    ],
    name: 'IdentityRegistered',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'account', type: 'address' },
      { indexed: false, name: 'oldHash', type: 'bytes32' },
      { indexed: false, name: 'newHash', type: 'bytes32' },
    ],
    name: 'IdentityUpdated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'account', type: 'address' },
      { indexed: true, name: 'verifier', type: 'address' },
    ],
    name: 'IdentityVerified',
    type: 'event',
  },
  {
    inputs: [{ name: 'dataHash', type: 'bytes32' }],
    name: 'registerIdentity',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'newDataHash', type: 'bytes32' }],
    name: 'updateIdentity',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'isVerified',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'getIdentityHash',
    outputs: [{ name: '', type: 'bytes32' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: '', type: 'address' }],
    name: 'identities',
    outputs: [
      { name: 'dataHash', type: 'bytes32' },
      { name: 'registeredAt', type: 'uint256' },
      { name: 'updatedAt', type: 'uint256' },
      { name: 'verified', type: 'bool' },
      { name: 'verifier', type: 'address' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const
