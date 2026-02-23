import { Link, useLocation } from 'react-router-dom'
import { DynamicWidget } from '@dynamic-labs/sdk-react-core'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Download, 
  Settings, 
  Search,
  Menu,
  X,
  CreditCard,
  Inbox,
  ShieldAlert,
  Clock,
  UserCheck,
  Waves,
  Trophy,
  Users2,
  BarChart3,
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from './ui/button'

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
}

const employerNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/app', icon: LayoutDashboard },
  { label: 'Workers', href: '/app/workers', icon: Users },
  { label: 'New Payroll', href: '/app/payroll/new', icon: CreditCard },
  { label: 'Request Payment', href: '/app/requests/new', icon: FileText },
  { label: 'Requests Inbox', href: '/app/requests', icon: Inbox },
  { label: 'Disputes', href: '/app/disputes', icon: ShieldAlert },
  { label: 'History', href: '/app/history', icon: Clock },
  { label: 'Identity', href: '/app/identity', icon: UserCheck },
  { label: 'Streams', href: '/app/streaming', icon: Waves },
  { label: 'Bounties', href: '/app/bounties', icon: Trophy },
  { label: 'Multisig', href: '/app/multisig', icon: Users2 },
  { label: 'Analytics', href: '/app/analytics', icon: BarChart3 },
  { label: 'Export', href: '/app/export', icon: Download },
  { label: 'Settings', href: '/app/settings', icon: Settings },
]

const workerNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/worker', icon: LayoutDashboard },
  { label: 'My Streams', href: '/worker/streams', icon: Waves },
  { label: 'Bounties', href: '/worker/bounties', icon: Trophy },
  { label: 'History', href: '/worker/history', icon: FileText },
  { label: 'Settings', href: '/worker/settings', icon: Settings },
]

interface AppLayoutProps {
  children: React.ReactNode
  variant?: 'employer' | 'worker'
}

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2">
      <img src="/logofl.jpg" alt="FlowLedger" className="h-8 w-8 rounded-lg object-cover" />
      <span className="font-display text-base font-bold">FlowLedger</span>
    </Link>
  )
}

export function AppLayout({ children, variant = 'employer' }: AppLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()
  const navItems = variant === 'employer' ? employerNavItems : workerNavItems

  return (
    <div className="min-h-screen bg-background">

      {/* ── Mobile Header ──────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur-xl lg:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          <Logo />
          <div className="flex items-center gap-1">
            <Link to="/search">
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Search className="h-4 w-4" />
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <AnimatePresence mode="wait" initial={false}>
                {mobileMenuOpen ? (
                  <motion.span key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                    <X className="h-4 w-4" />
                  </motion.span>
                ) : (
                  <motion.span key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                    <Menu className="h-4 w-4" />
                  </motion.span>
                )}
              </AnimatePresence>
            </Button>
          </div>
        </div>
        
        {/* Mobile nav panel */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.nav
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="overflow-hidden border-t"
            >
              <div className="flex flex-col gap-1 p-3">
                {[...navItems, { label: 'Search', href: '/search', icon: Search }].map((item, i) => {
                  const isActive = location.pathname === item.href
                  return (
                    <motion.div
                      key={item.href}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                    >
                      <Link
                        to={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                          'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                          isActive
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        )}
                      >
                        <item.icon className="h-4 w-4" />
                        {item.label}
                      </Link>
                    </motion.div>
                  )
                })}
                <div className="mt-3 border-t pt-3">
                  <DynamicWidget />
                </div>
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </header>

      <div className="lg:flex">

        {/* ── Desktop Sidebar ────────────────────────────────── */}
        <aside className="hidden w-60 shrink-0 border-r lg:block">
          <div className="sticky top-0 flex h-screen flex-col bg-background/95 backdrop-blur">

            {/* Logo area */}
            <div className="flex h-14 items-center border-b px-5">
              <Logo />
            </div>

            {/* Nav items */}
            <nav className="flex-1 space-y-0.5 overflow-y-auto p-3 pt-4">
              {[...navItems, { label: 'Search', href: '/search', icon: Search }].map((item, i) => {
                const isActive = location.pathname === item.href
                return (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.3 }}
                  >
                    <Link
                      to={item.href}
                      className={cn(
                        'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                        isActive
                          ? 'bg-primary/10 text-primary nav-active'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}
                    >
                      {/* Active indicator bar */}
                      {isActive && (
                        <motion.div
                          layoutId="nav-active-bar"
                          className="absolute left-0 top-1/2 h-[55%] w-[3px] -translate-y-1/2 rounded-r-full bg-primary"
                          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        />
                      )}

                      {/* Icon */}
                      <div className={cn(
                        'flex h-7 w-7 items-center justify-center rounded-lg transition-colors',
                        isActive ? 'bg-primary text-white' : 'group-hover:bg-muted-foreground/10'
                      )}>
                        <item.icon className="h-4 w-4" />
                      </div>

                      <span>{item.label}</span>

                      {/* Active dot */}
                      {isActive && (
                        <motion.span
                          layoutId="nav-dot"
                          className="ml-auto h-1.5 w-1.5 rounded-full bg-primary"
                        />
                      )}
                    </Link>
                  </motion.div>
                )
              })}
            </nav>

            {/* Bottom wallet */}
            <div className="border-t p-4">
              <DynamicWidget />
            </div>
          </div>
        </aside>

        {/* ── Main Content ────────────────────────────────────── */}
        <main className="min-w-0 flex-1">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="mx-auto w-full max-w-6xl px-6 py-6 lg:px-10 lg:py-8"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  )
}
