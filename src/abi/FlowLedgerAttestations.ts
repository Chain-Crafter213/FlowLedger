export const FlowLedgerAttestationsABI = [
  {
    inputs: [{ name: '_owner', type: 'address' }],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'attestationId', type: 'bytes32' },
      { indexed: true, name: 'attester', type: 'address' },
      { indexed: false, name: 'contentHash', type: 'bytes32' },
      { indexed: false, name: 'attestationType', type: 'string' },
    ],
    name: 'AttestationCreated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'attestationId', type: 'bytes32' },
      { indexed: true, name: 'revoker', type: 'address' },
    ],
    name: 'AttestationRevoked',
    type: 'event',
  },
  {
    inputs: [
      { name: 'contentHash', type: 'bytes32' },
      { name: 'attestationType', type: 'string' },
      { name: 'relatedTxHash', type: 'bytes32' },
    ],
    name: 'createAttestation',
    outputs: [{ name: 'attestationId', type: 'bytes32' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'attestationId', type: 'bytes32' }],
    name: 'revokeAttestation',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'addr', type: 'address' }],
    name: 'getAttestationsByAddress',
    outputs: [{ name: '', type: 'bytes32[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'txHash', type: 'bytes32' }],
    name: 'getAttestationsByTx',
    outputs: [{ name: '', type: 'bytes32[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'attestationId', type: 'bytes32' },
      { name: 'expectedHash', type: 'bytes32' },
    ],
    name: 'verifyAttestation',
    outputs: [
      { name: 'valid', type: 'bool' },
      { name: 'attester', type: 'address' },
      { name: 'timestamp', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: '', type: 'bytes32' }],
    name: 'attestations',
    outputs: [
      { name: 'contentHash', type: 'bytes32' },
      { name: 'attester', type: 'address' },
      { name: 'timestamp', type: 'uint256' },
      { name: 'attestationType', type: 'string' },
      { name: 'revoked', type: 'bool' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'attestationCount',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const
