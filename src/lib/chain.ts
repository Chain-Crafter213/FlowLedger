import { polygon } from 'wagmi/chains'

export const POLYGON_CHAIN_ID = 137

export const USDC_ADDRESS = (import.meta.env.VITE_USDC_ADDRESS || '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359') as `0x${string}`
export const USDC_DECIMALS = 6

export const CONTRACT_ADDRESSES = {
  attestations: (import.meta.env.VITE_ATTESTATIONS_ADDRESS || '0xB5fFeB1a0558377a7c99559Cdc5eB2A8A7F8fc2a') as `0x${string}`,
  payrollEscrow: (import.meta.env.VITE_PAYROLL_ESCROW_ADDRESS || '0xa0B6E018C036f8C7F2aBe3095CADe7954EAa4f81') as `0x${string}`,
  payRequests: (import.meta.env.VITE_PAY_REQUESTS_ADDRESS || '0xe7ed29937EA32BC8e3F910409bcf9680E27B9f9E') as `0x${string}`,
  feeManager: (import.meta.env.VITE_FEE_MANAGER_ADDRESS || '0x0D85592De2c91F39E13712965144029da7a60b3b') as `0x${string}`,
  identityRegistry: (import.meta.env.VITE_IDENTITY_REGISTRY_ADDRESS || '0x1cA44D55950922C64a81334cEDE9aa81C240a4e6') as `0x${string}`,
  streaming: (import.meta.env.VITE_STREAMING_ADDRESS || '0x847169EC1463c493F663cF76Bd1cC283B185be0B') as `0x${string}`,
  bounties: (import.meta.env.VITE_BOUNTIES_ADDRESS || '0x7c8B4B5eC17e0B641909ca686cA6E4F7e5967cA9') as `0x${string}`,
  multisig: (import.meta.env.VITE_MULTISIG_ADDRESS || '0x99dfa41b6614e170A46D1DEbB12fB7C6f9779b6f') as `0x${string}`,
}

export const RPC_URL = import.meta.env.VITE_POLYGON_RPC_URL || 'https://polygon-rpc.com'

export const POLYGON_EXPLORER = 'https://polygonscan.com'
export const BLOCK_EXPLORER_URL = POLYGON_EXPLORER

export function getExplorerTxUrl(txHash: string): string {
  return `${BLOCK_EXPLORER_URL}/tx/${txHash}`
}

export function getExplorerAddressUrl(address: string): string {
  return `${BLOCK_EXPLORER_URL}/address/${address}`
}

export { polygon as polygonChain }
export const POLYGON_CHAIN = polygon
