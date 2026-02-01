import { useEffect, useState, type ReactNode } from 'react'
import { useAccount, useSwitchChain } from 'wagmi'
import { polygon } from 'wagmi/chains'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, ArrowRight } from 'lucide-react'
import { Button } from './ui/button'
import { POLYGON_CHAIN_ID } from '@/lib/chain'

interface NetworkGuardProps {
  children: ReactNode
}

export function NetworkGuard({ children }: NetworkGuardProps) {
  const { isConnected, chainId } = useAccount()
  const { switchChain, isPending } = useSwitchChain()
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    if (isConnected && chainId && chainId !== POLYGON_CHAIN_ID) {
      setShowModal(true)
    } else {
      setShowModal(false)
    }
  }, [isConnected, chainId])

  const handleSwitchNetwork = () => {
    switchChain?.({ chainId: polygon.id })
  }

  return (
    <>
      {children}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md rounded-lg border bg-background p-6 shadow-xl"
            >
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-warning/10">
                  <AlertTriangle className="h-8 w-8 text-warning" />
                </div>
                <h2 className="font-display text-xl font-semibold">
                  Wrong Network
                </h2>
                <p className="text-muted-foreground">
                  FlowLedger operates on Polygon network only. Please switch to
                  Polygon to continue using the app.
                </p>
                <div className="flex items-center gap-2 rounded-lg bg-muted px-4 py-2 text-sm">
                  <span className="text-muted-foreground">Current:</span>
                  <span className="font-medium">Chain {chainId}</span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-primary">Polygon (137)</span>
                </div>
                <Button
                  onClick={handleSwitchNetwork}
                  disabled={isPending}
                  className="w-full"
                  size="lg"
                >
                  {isPending ? 'Switching...' : 'Switch to Polygon'}
                </Button>
                <p className="text-xs text-muted-foreground">
                  This action will prompt your wallet to switch networks
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
