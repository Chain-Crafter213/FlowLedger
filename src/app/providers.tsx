import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { DynamicContextProvider } from '@dynamic-labs/sdk-react-core'
import { DynamicWagmiConnector } from '@dynamic-labs/wagmi-connector'
import { EthereumWalletConnectors } from '@dynamic-labs/ethereum'
import { WagmiProvider } from 'wagmi'
import { wagmiConfig } from '@/lib/wagmi'
import type { ReactNode } from 'react'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
    },
  },
})

const dynamicEnvId = import.meta.env.VITE_DYNAMIC_ENV_ID || '621c8327-48db-4270-b7e2-b6e6ceb90c73'

interface Web3ProviderProps {
  children: ReactNode
}

export function Web3Provider({ children }: Web3ProviderProps) {
  return (
    <DynamicContextProvider
      settings={{
        environmentId: dynamicEnvId,
        walletConnectors: [EthereumWalletConnectors],
        overrides: {
          evmNetworks: [
            {
              blockExplorerUrls: ['https://polygonscan.com'],
              chainId: 137,
              chainName: 'Polygon Mainnet',
              iconUrls: ['https://app.dynamic.xyz/assets/networks/polygon.svg'],
              name: 'Polygon',
              nativeCurrency: {
                decimals: 18,
                name: 'MATIC',
                symbol: 'MATIC',
              },
              networkId: 137,
              rpcUrls: [import.meta.env.VITE_POLYGON_RPC_URL || 'https://polygon-rpc.com'],
              vanityName: 'Polygon',
            },
          ],
        },
      }}
    >
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <DynamicWagmiConnector>
            {children}
          </DynamicWagmiConnector>
        </QueryClientProvider>
      </WagmiProvider>
    </DynamicContextProvider>
  )
}
