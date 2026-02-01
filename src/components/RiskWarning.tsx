import { AlertTriangle, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RiskWarningProps {
  variant?: 'default' | 'critical'
  className?: string
}

export function RiskWarning({ variant = 'default', className }: RiskWarningProps) {
  if (variant === 'critical') {
    return (
      <div
        className={cn(
          'flex items-start gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4',
          className
        )}
      >
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
        <div className="space-y-1">
          <p className="text-sm font-medium text-destructive">
            Risk and Safety Warning
          </p>
          <p className="text-sm text-muted-foreground">
            This action will move real money on Polygon mainnet. USDC transfers
            are irreversible. Please verify all addresses and amounts before
            confirming.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-lg border border-warning/50 bg-warning/10 p-4',
        className
      )}
    >
      <Shield className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
      <div className="space-y-1">
        <p className="text-sm font-medium">Security Notice</p>
        <p className="text-sm text-muted-foreground">
          Always verify transaction details in your wallet before signing.
          FlowLedger never asks for your private keys or seed phrase.
        </p>
      </div>
    </div>
  )
}
