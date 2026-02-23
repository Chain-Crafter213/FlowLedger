import { createConfig, http } from 'wagmi'
import { polygon } from 'wagmi/chains'

const rpcUrl = import.meta.env.VITE_POLYGON_RPC_URL || 'https://polygon-mainnet.g.alchemy.com/v2/jYtq4mLJ0kFeTg0uLUJ4M'

export const wagmiConfig = createConfig({
  chains: [polygon],
  multiInjectedProviderDiscovery: false, // Dynamic handles this
  transports: {
    [polygon.id]: http(rpcUrl),
  },
})

export const POLYGON_CHAIN_ID = 137

export const polygonChain = polygon
