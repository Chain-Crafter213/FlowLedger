/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DYNAMIC_ENV_ID: string
  readonly VITE_POLYGON_RPC_URL: string
  readonly VITE_USDC_ADDRESS: string
  readonly VITE_POLYGONSCAN_API_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
