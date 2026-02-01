import { Link } from 'react-router-dom'
import { DynamicWidget } from '@dynamic-labs/sdk-react-core'
import { useDynamicContext } from '@dynamic-labs/sdk-react-core'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  Search,
  FileText,
  Download,
  Shield,
  Zap,
  Globe,
  Wallet,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

const features = [
  {
    icon: Zap,
    title: 'Instant Payments',
    description: 'Pay contractors worldwide in seconds with USDC on Polygon.',
  },
  {
    icon: Search,
    title: 'Searchable History',
    description: 'Find any transaction instantly with powerful search and filters.',
  },
  {
    icon: FileText,
    title: 'Audit-Ready',
    description: 'Add memos, tags, and annotations to every payment for compliance.',
  },
  {
    icon: Download,
    title: 'Bank-Statement Export',
    description: 'Export your payment history as CSV, just like your bank.',
  },
  {
    icon: Shield,
    title: 'Self-Custodial',
    description: 'Your keys, your funds. No intermediaries holding your money.',
  },
  {
    icon: Globe,
    title: 'No Borders',
    description: 'Pay anyone, anywhere. No SWIFT fees, no delays, no limits.',
  },
]

const steps = [
  { step: 1, title: 'Sign In', description: 'Use email or connect your wallet' },
  { step: 2, title: 'Add Workers', description: 'Enter names and wallet addresses' },
  { step: 3, title: 'Send Payment', description: 'Pay one or many in a single batch' },
  { step: 4, title: 'Export Records', description: 'Download CSV for your accountant' },
]

export default function Landing() {
  const { user } = useDynamicContext()

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Wallet className="h-7 w-7 text-primary" />
            <span className="font-display text-xl font-bold">FlowLedger</span>
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            <Link
              to="/search"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Search
            </Link>
            <a
              href="#features"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              How It Works
            </a>
          </nav>
          <div className="flex items-center gap-4">
            <DynamicWidget />
            {user && (
              <Link to="/app">
                <Button>
                  Open App
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container py-20 md:py-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-3xl text-center"
        >
          <h1 className="font-display text-4xl font-bold tracking-tight md:text-6xl">
            Instant cross-border payroll
          </h1>
          <p className="mt-4 text-xl text-muted-foreground md:text-2xl">
            Searchable, auditable, and exportable like a bank statement.
          </p>
          <p className="mt-6 text-lg text-muted-foreground">
            Pay your global team in USDC on Polygon. No crypto knowledge required.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            {user ? (
              <>
                <Link to="/app">
                  <Button size="lg" className="w-full sm:w-auto">
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/worker">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto">
                    Worker Portal
                  </Button>
                </Link>
              </>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <DynamicWidget />
                <p className="text-sm text-muted-foreground">
                  Sign in with email or connect your wallet
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section id="features" className="border-t bg-muted/50 py-20">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mx-auto max-w-2xl text-center"
          >
            <h2 className="font-display text-3xl font-bold">
              Everything you need for global payroll
            </h2>
            <p className="mt-4 text-muted-foreground">
              Built for small businesses that work with contractors worldwide.
            </p>
          </motion.div>

          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="h-full">
                  <CardContent className="pt-6">
                    <feature.icon className="h-10 w-10 text-primary" />
                    <h3 className="mt-4 font-display text-lg font-semibold">
                      {feature.title}
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mx-auto max-w-2xl text-center"
          >
            <h2 className="font-display text-3xl font-bold">
              Simple as using a bank
            </h2>
            <p className="mt-4 text-muted-foreground">
              No crypto jargon. No complicated setup. Just payroll.
            </p>
          </motion.div>

          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, i) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                    {step.step}
                  </div>
                  <h3 className="mt-4 font-display text-lg font-semibold">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {step.description}
                  </p>
                </div>
                {i < steps.length - 1 && (
                  <div className="absolute left-1/2 top-6 hidden h-0.5 w-full bg-border lg:block" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Notice */}
      <section className="border-t bg-muted/50 py-16">
        <div className="container">
          <div className="mx-auto max-w-2xl rounded-lg border border-warning/50 bg-warning/10 p-6">
            <div className="flex items-start gap-4">
              <Shield className="mt-1 h-6 w-6 shrink-0 text-warning" />
              <div>
                <h3 className="font-display font-semibold">
                  Mainnet Security Notice
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  FlowLedger operates on Polygon mainnet with real USDC. All
                  transactions involve real money and are irreversible. Always
                  verify addresses and amounts before confirming. Never share
                  your private keys or seed phrase.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              <span className="font-display font-semibold">FlowLedger</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link to="/search" className="hover:text-foreground">
                Search
              </Link>
              <a
                href="https://polygonscan.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground"
              >
                Polygonscan
              </a>
            </div>
            <p className="text-sm text-muted-foreground">
              Built on Polygon. Powered by USDC.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
