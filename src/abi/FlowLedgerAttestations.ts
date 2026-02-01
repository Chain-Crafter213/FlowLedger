export const FlowLedgerAttestationsABI = [
  {
    inputs: [],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'referenceType', type: 'bytes32' },
      { indexed: true, name: 'referenceId', type: 'bytes32' },
      { indexed: true, name: 'attester', type: 'address' },
      { indexed: false, name: 'memoHash', type: 'bytes32' },
      { indexed: false, name: 'tagsHash', type: 'bytes32' },
      { indexed: false, name: 'metadataCID', type: 'string' },
      { indexed: false, name: 'timestamp', type: 'uint256' },
    ],
    name: 'AttestationCreated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'referenceType', type: 'bytes32' },
      { indexed: true, name: 'referenceId', type: 'bytes32' },
      { indexed: true, name: 'attester', type: 'address' },
      { indexed: false, name: 'memoHash', type: 'bytes32' },
      { indexed: false, name: 'tagsHash', type: 'bytes32' },
      { indexed: false, name: 'metadataCID', type: 'string' },
      { indexed: false, name: 'timestamp', type: 'uint256' },
    ],
    name: 'AttestationUpdated',
    type: 'event',
  },
  {
    inputs: [
      { name: 'referenceType', type: 'bytes32' },
      { name: 'referenceId', type: 'bytes32' },
      { name: 'memoHash', type: 'bytes32' },
      { name: 'tagsHash', type: 'bytes32' },
      { name: 'metadataCID', type: 'string' },
    ],
    name: 'createAttestation',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'referenceType', type: 'bytes32' },
      { name: 'referenceId', type: 'bytes32' },
      { name: 'memoHash', type: 'bytes32' },
      { name: 'tagsHash', type: 'bytes32' },
      { name: 'metadataCID', type: 'string' },
    ],
    name: 'updateAttestation',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'referenceType', type: 'bytes32' },
      { name: 'referenceId', type: 'bytes32' },
      { name: 'attester', type: 'address' },
    ],
    name: 'getAttestation',
    outputs: [
      {
        components: [
          { name: 'memoHash', type: 'bytes32' },
          { name: 'tagsHash', type: 'bytes32' },
          { name: 'metadataCID', type: 'string' },
          { name: 'timestamp', type: 'uint256' },
          { name: 'exists', type: 'bool' },
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
      { name: 'referenceType', type: 'bytes32' },
      { name: 'referenceId', type: 'bytes32' },
    ],
    name: 'getAttestationCount',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const
