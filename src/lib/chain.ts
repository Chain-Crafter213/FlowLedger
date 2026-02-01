import { polygon } from 'wagmi/chains'

export const POLYGON_CHAIN_ID = 137

export const USDC_ADDRESS = (import.meta.env.VITE_USDC_ADDRESS || '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359') as `0x${string}`
export const USDC_DECIMALS = 6

export const CONTRACT_ADDRESSES = {
  attestations: import.meta.env.VITE_ATTESTATIONS_ADDRESS as `0x${string}` | undefined,
  payrollEscrow: import.meta.env.VITE_PAYROLL_ESCROW_ADDRESS as `0x${string}` | undefined,
  payRequests: import.meta.env.VITE_PAY_REQUESTS_ADDRESS as `0x${string}` | undefined,
  feeManager: import.meta.env.VITE_FEE_MANAGER_ADDRESS as `0x${string}` | undefined,
  identityRegistry: import.meta.env.VITE_IDENTITY_REGISTRY_ADDRESS as `0x${string}` | undefined,
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
