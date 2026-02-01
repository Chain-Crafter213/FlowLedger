import { Link, useLocation } from 'react-router-dom'
import { DynamicWidget } from '@dynamic-labs/sdk-react-core'
import { motion } from 'framer-motion'
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
  Wallet
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
  { label: 'Export', href: '/app/export', icon: Download },
  { label: 'Settings', href: '/app/settings', icon: Settings },
]

const workerNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/worker', icon: LayoutDashboard },
  { label: 'History', href: '/worker/history', icon: FileText },
  { label: 'Settings', href: '/worker/settings', icon: Settings },
]

interface AppLayoutProps {
  children: React.ReactNode
  variant?: 'employer' | 'worker'
}

export function AppLayout({ children, variant = 'employer' }: AppLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()
  const navItems = variant === 'employer' ? employerNavItems : workerNavItems

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <Wallet className="h-6 w-6 text-primary" />
            <span className="font-display font-semibold">FlowLedger</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/search">
              <Button variant="ghost" size="icon">
                <Search className="h-5 w-5" />
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
        
        {/* Mobile Navigation */}
        <motion.div
          initial={false}
          animate={{ height: mobileMenuOpen ? 'auto' : 0 }}
          className="overflow-hidden border-t"
        >
          <nav className="flex flex-col gap-1 p-4">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              )
            })}
            <div className="mt-4 border-t pt-4">
              <DynamicWidget />
            </div>
          </nav>
        </motion.div>
      </header>

      <div className="lg:flex">
        {/* Desktop Sidebar */}
        <aside className="hidden w-64 shrink-0 border-r bg-card lg:block">
          <div className="sticky top-0 flex h-screen flex-col">
            <div className="flex h-14 items-center gap-2 border-b px-6">
              <Wallet className="h-6 w-6 text-primary" />
              <span className="font-display font-semibold">FlowLedger</span>
            </div>
            
            <nav className="flex-1 space-y-1 p-4">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.href
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                )
              })}
              <Link
                to="/search"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <Search className="h-5 w-5" />
                Search
              </Link>
            </nav>
            
            <div className="border-t p-4">
              <DynamicWidget />
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="container max-w-5xl py-6 lg:py-8"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  )
}
