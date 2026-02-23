import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { DynamicWidget } from '@dynamic-labs/sdk-react-core'
import { useDynamicContext } from '@dynamic-labs/sdk-react-core'
import { motion, useScroll, useTransform } from 'framer-motion'
import {
  ArrowRight,
  Search,
  FileText,
  Download,
  Shield,
  Zap,
  Globe,
  Wallet,
  Users,
  ChevronDown,
  CheckCircle2,
  BarChart3,
  Lock,
  TrendingUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

/* ─── Static data ────────────────────────────────────────────── */
const features = [
  {
    icon: Zap,
    title: 'Instant Payments',
    description: 'Pay contractors worldwide in seconds with USDC on Polygon. 2-3s finality.',
    color: 'from-blue-500/20 to-cyan-500/20',
    border: 'border-blue-500/20',
    iconColor: 'text-blue-500',
  },
  {
    icon: Search,
    title: 'Searchable History',
    description: 'Find any transaction instantly with powerful full-text search and date filters.',
    color: 'from-sky-500/20 to-blue-500/20',
    border: 'border-sky-500/20',
    iconColor: 'text-sky-500',
  },
  {
    icon: FileText,
    title: 'Audit-Ready',
    description: 'Add memos, tags, and annotations to every payment for compliance.',
    color: 'from-indigo-500/20 to-blue-500/20',
    border: 'border-indigo-500/20',
    iconColor: 'text-indigo-500',
  },
  {
    icon: Download,
    title: 'Bank-Statement Export',
    description: 'Export your payment history as CSV, just like your bank.',
    color: 'from-teal-500/20 to-cyan-500/20',
    border: 'border-teal-500/20',
    iconColor: 'text-teal-500',
  },
  {
    icon: Shield,
    title: 'Self-Custodial',
    description: 'Your keys, your funds. No intermediaries holding your money.',
    color: 'from-blue-600/20 to-indigo-500/20',
    border: 'border-blue-600/20',
    iconColor: 'text-blue-600',
  },
  {
    icon: Globe,
    title: 'No Borders',
    description: 'Pay anyone, anywhere. No SWIFT fees, no delays, no limits.',
    color: 'from-cyan-500/20 to-sky-500/20',
    border: 'border-cyan-500/20',
    iconColor: 'text-cyan-500',
  },
]

const steps = [
  { step: 1, icon: Wallet, title: 'Sign In', description: 'Use email or connect your wallet' },
  { step: 2, icon: Users, title: 'Add Workers', description: 'Enter names and wallet addresses' },
  { step: 3, icon: Zap, title: 'Send Payment', description: 'Pay one or many in a single batch' },
  { step: 4, icon: Download, title: 'Export Records', description: 'Download CSV for your accountant' },
]

const stats = [
  { label: 'Transaction Fee', value: '~$0.01', sub: 'vs $5-50 on Ethereum' },
  { label: 'Finality Time', value: '2-3s', sub: 'instant settlement' },
  { label: 'Gas Savings', value: '99.9%', sub: 'vs. Ethereum mainnet' },
  { label: 'USDC Native', value: '100%', sub: 'no bridge risks' },
]

/* ─── Floating SVG orbs (decorative, no purple) ─────────────── */
function FloatingOrb({ className }: { className: string }) {
  return (
    <motion.div
      className={`pointer-events-none absolute rounded-full blur-3xl opacity-30 ${className}`}
      animate={{ scale: [1, 1.15, 1], opacity: [0.25, 0.4, 0.25] }}
      transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
    />
  )
}

/* ─── Animated grid SVG background ──────────────────────────── */
function GridPattern() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full stroke-foreground/[0.06]"
      aria-hidden
    >
      <defs>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
    </svg>
  )
}

/* ─── Animated flow line SVG ────────────────────────────────── */
function FlowLines() {
  return (
    <svg
      viewBox="0 0 800 200"
      className="pointer-events-none absolute bottom-0 left-0 w-full opacity-20"
      preserveAspectRatio="none"
      aria-hidden
    >
      {[0, 1, 2, 3].map((i) => (
        <motion.path
          key={i}
          d={`M0,${60 + i * 25} Q200,${30 + i * 20} 400,${70 + i * 22} T800,${55 + i * 24}`}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="1.2"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.6 }}
          transition={{ duration: 2.5 + i * 0.4, delay: i * 0.3, ease: 'easeInOut' }}
        />
      ))}
    </svg>
  )
}

/* ─── Contract badge ────────────────────────────────────────── */
function ContractBadge({ name, addr }: { name: string; addr: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      whileHover={{ scale: 1.02 }}
      className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 backdrop-blur"
    >
      <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
      <div className="min-w-0">
        <p className="text-sm font-semibold">{name}</p>
        <p className="truncate font-mono text-xs text-muted-foreground">{addr}</p>
      </div>
    </motion.div>
  )
}

/* ─── Main component ─────────────────────────────────────────── */
export default function Landing() {
  const { user } = useDynamicContext()
  const heroRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const videoOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0])
  const videoScale = useTransform(scrollYProgress, [0, 1], [1, 1.08])
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '30%'])

  return (
    <div className="min-h-screen bg-background">

      {/* ── Sticky Header ──────────────────────────────────────── */}
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 z-50 w-full border-b border-border/40 bg-background/70 backdrop-blur-xl"
      >
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            {/* Animated logo icon */}
            <div className="relative">
              <motion.div
                className="absolute inset-0 rounded-lg bg-primary/30 blur-md"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 2.5, repeat: Infinity }}
              />
              <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-white" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
            </div>
            <span className="font-display text-xl font-bold">FlowLedger</span>
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            {['#features', '#contracts', '#how-it-works'].map((href) => (
              <a
                key={href}
                href={href}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {href.replace('#', '').replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <DynamicWidget />
            {user && (
              <Link to="/app">
                <Button size="sm">
                  Open App <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </motion.header>

      {/* ── Hero with video background ─────────────────────────── */}
      <section ref={heroRef} className="relative flex min-h-screen items-center justify-center overflow-hidden pt-16">
        {/* Video */}
        <motion.div style={{ opacity: videoOpacity, scale: videoScale }} className="absolute inset-0 z-0">
          <video
            autoPlay muted loop playsInline
            className="h-full w-full object-cover"
            src="/background.mp4"
          />
          {/* Dark overlay so text is readable */}
          <div className="absolute inset-0 bg-background/65" />
        </motion.div>

        {/* Floating orbs */}
        <FloatingOrb className="h-96 w-96 bg-primary/40 top-20 -left-32" />
        <FloatingOrb className="h-72 w-72 bg-cyan-400/30 bottom-20 -right-20" />

        {/* Grid pattern */}
        <div className="absolute inset-0 z-[1]">
          <GridPattern />
        </div>

        {/* Flow lines at bottom */}
        <div className="absolute bottom-0 left-0 right-0 z-[1] h-48">
          <FlowLines />
        </div>

        {/* Hero content */}
        <motion.div
          style={{ y: heroY }}
          className="container relative z-10 mx-auto max-w-4xl px-4 text-center"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary backdrop-blur"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            Live on Polygon Mainnet · Native USDC
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.7 }}
            className="font-display text-5xl font-bold tracking-tight md:text-7xl"
          >
            Instant{' '}
            <span className="relative">
              <span className="relative z-10 text-primary">cross-border</span>
              <motion.span
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.9, duration: 0.6 }}
                className="absolute -bottom-1 left-0 right-0 h-1 origin-left rounded-full bg-primary/40"
              />
            </span>{' '}
            payroll
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.6 }}
            className="mt-6 text-xl text-muted-foreground md:text-2xl"
          >
            Searchable, auditable, and exportable like a bank statement.
            <br className="hidden md:block" />
            Pay your global team in <strong className="text-foreground">USDC on Polygon</strong>.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            {user ? (
              <>
                <Link to="/app">
                  <Button size="lg" className="group h-12 px-8 text-base shadow-lg shadow-primary/25">
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <Link to="/worker">
                  <Button size="lg" variant="outline" className="h-12 px-8 text-base backdrop-blur">
                    Worker Portal
                  </Button>
                </Link>
              </>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <DynamicWidget />
                <p className="text-sm text-muted-foreground">Sign in with email or connect your wallet</p>
              </div>
            )}
          </motion.div>

          {/* Scroll cue */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="mt-16 flex justify-center"
          >
            <motion.a
              href="#stats"
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.8, repeat: Infinity }}
              className="flex flex-col items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <span>Scroll to explore</span>
              <ChevronDown className="h-4 w-4" />
            </motion.a>
          </motion.div>
        </motion.div>
      </section>

      {/* ── Stats bar ─────────────────────────────────────────── */}
      <section id="stats" className="border-y bg-muted/40 py-12">
        <div className="container">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex flex-col items-center text-center"
              >
                <span className="font-display text-3xl font-bold text-primary">{s.value}</span>
                <span className="mt-1 text-sm font-semibold">{s.label}</span>
                <span className="text-xs text-muted-foreground">{s.sub}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────── */}
      <section id="features" className="relative overflow-hidden py-24">
        <FloatingOrb className="h-[28rem] w-[28rem] bg-blue-400/10 top-10 right-[-10rem]" />
        <div className="container relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mx-auto max-w-2xl text-center"
          >
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">Features</p>
            <h2 className="font-display text-4xl font-bold">
              Everything you need for global payroll
            </h2>
            <p className="mt-4 text-muted-foreground">
              Built for businesses that work with contractors worldwide — no crypto knowledge required.
            </p>
          </motion.div>

          <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                className={`group relative overflow-hidden rounded-2xl border ${f.border} bg-gradient-to-br ${f.color} p-6 backdrop-blur`}
              >
                {/* Hover glow */}
                <div className="absolute inset-0 rounded-2xl bg-primary/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                {/* Icon */}
                <div className={`relative mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-background/60 ${f.iconColor}`}>
                  <f.icon className="h-6 w-6" />
                </div>

                <h3 className="relative font-display text-lg font-semibold">{f.title}</h3>
                <p className="relative mt-2 text-sm text-muted-foreground">{f.description}</p>

                {/* Corner accent */}
                <div className="absolute right-4 top-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <f.icon className="h-16 w-16 text-primary" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Deployed Contracts ───────────────────────────────── */}
      <section id="contracts" className="border-y bg-muted/30 py-24">
        <div className="container">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            {/* Left copy */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">On-Chain</p>
              <h2 className="font-display text-4xl font-bold">
                5 contracts deployed on{' '}
                <span className="text-primary">Polygon Mainnet</span>
              </h2>
              <p className="mt-4 text-muted-foreground">
                Every payment, request, and attestation is verifiable on-chain. No intermediaries.
                No trust required.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                {[
                  { icon: BarChart3, label: 'Batch Payroll' },
                  { icon: FileText, label: 'Pay Requests' },
                  { icon: Lock, label: 'Attestations' },
                  { icon: TrendingUp, label: 'Fee Manager' },
                ].map((b) => (
                  <span
                    key={b.label}
                    className="flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                  >
                    <b.icon className="h-3.5 w-3.5" />
                    {b.label}
                  </span>
                ))}
              </div>
            </motion.div>

            {/* Right contracts list */}
            <div className="space-y-3">
              {[
                { name: 'FlowLedgerPayRequests', addr: '0xe7ed29937EA32BC8e3F910409bcf9680E27B9f9E' },
                { name: 'FlowWagePayrollEscrow', addr: '0xa0B6E018C036f8C7F2aBe3095CADe7954EAa4f81' },
                { name: 'FlowWageIdentityRegistry', addr: '0x1cA44D55950922C64a81334cEDE9aa81C240a4e6' },
                { name: 'FlowWageFeeManager', addr: '0x0D85592De2c91F39E13712965144029da7a60b3b' },
                { name: 'FlowLedgerAttestations', addr: '0xB5fFeB1a0558377a7c99559Cdc5eB2A8A7F8fc2a' },
              ].map((c, i) => (
                <motion.div
                  key={c.name}
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                >
                  <ContractBadge name={c.name} addr={c.addr} />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────── */}
      <section id="how-it-works" className="relative overflow-hidden py-24">
        <FloatingOrb className="h-96 w-96 bg-cyan-400/10 bottom-0 -left-32" />
        <div className="container relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mx-auto max-w-2xl text-center"
          >
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">Process</p>
            <h2 className="font-display text-4xl font-bold">Simple as using a bank</h2>
            <p className="mt-4 text-muted-foreground">No crypto jargon. No complicated setup. Just payroll.</p>
          </motion.div>

          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, i) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                className="relative flex flex-col items-center text-center"
              >
                {/* Connector line */}
                {i < steps.length - 1 && (
                  <motion.div
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.12 + 0.4, duration: 0.6 }}
                    className="absolute left-[calc(50%+2.5rem)] top-6 hidden h-0.5 w-[calc(100%-5rem)] origin-left bg-gradient-to-r from-primary/50 to-primary/10 lg:block"
                  />
                )}

                {/* Step circle */}
                <div className="relative mb-5">
                  <motion.div
                    className="absolute inset-0 rounded-full bg-primary/30 blur-md"
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.5 }}
                  />
                  <div className="relative flex h-14 w-14 items-center justify-center rounded-full border border-primary/30 bg-primary/10">
                    <step.icon className="h-6 w-6 text-primary" />
                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                      {step.step}
                    </span>
                  </div>
                </div>

                <h3 className="font-display text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ───────────────────────────────────────── */}
      <section className="border-t bg-muted/40 py-20">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative mx-auto max-w-3xl overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 to-cyan-500/5 p-10 text-center"
          >
            {/* Sparkles */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute h-1 w-1 rounded-full bg-primary"
                style={{ top: `${15 + i * 12}%`, left: `${8 + i * 14}%` }}
                animate={{ opacity: [0, 1, 0], scale: [0.5, 1.5, 0.5] }}
                transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.4 }}
              />
            ))}
            <h2 className="relative font-display text-3xl font-bold md:text-4xl">
              Start paying your team today
            </h2>
            <p className="relative mt-4 text-muted-foreground">
              Sign in with email — no wallet required to get started.
            </p>
            <div className="relative mt-8 flex justify-center">
              {user ? (
                <Link to="/app">
                  <Button size="lg" className="group h-12 px-10 text-base shadow-lg shadow-primary/25">
                    Open Dashboard
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              ) : (
                <DynamicWidget />
              )}
            </div>
          </motion.div>

          {/* Security notice */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mx-auto mt-10 max-w-2xl rounded-xl border border-warning/30 bg-warning/8 p-5"
          >
            <div className="flex items-start gap-3">
              <Shield className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">Mainnet Notice: </strong>
                FlowLedger operates with real USDC on Polygon mainnet. All transactions are
                irreversible. Always verify addresses and amounts before confirming.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="border-t py-12">
        <div className="container">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
                <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-white" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
              <span className="font-display font-bold">FlowLedger</span>
            </Link>

            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link to="/search" className="transition-colors hover:text-foreground">Search</Link>
              <a href="#features" className="transition-colors hover:text-foreground">Features</a>
              <a href="https://polygonscan.com" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-foreground">PolygonScan</a>
              <a href="https://github.com/Chain-Crafter213/FlowLedger" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-foreground">GitHub</a>
            </div>

            <p className="text-sm text-muted-foreground">Built on Polygon · Powered by USDC</p>
          </div>
        </div>
      </footer>

    </div>
  )
}
