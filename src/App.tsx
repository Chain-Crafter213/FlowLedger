import { Suspense, lazy } from 'react'
import { Routes, Route } from 'react-router-dom'
import { Web3Provider } from './app/providers'
import { Toaster } from './components/ui/toaster'
import { NetworkGuard } from './components/NetworkGuard'
import { PageLoader } from './components/PageLoader'
import { EventProvider } from './lib/events'

// Lazy load pages for code splitting
const Landing = lazy(() => import('./pages/Landing'))
const Search = lazy(() => import('./pages/Search'))
const TxDetails = lazy(() => import('./pages/TxDetails'))
const Payslip = lazy(() => import('./pages/Payslip'))

// Employer pages
const Dashboard = lazy(() => import('./pages/app/Dashboard'))
const Workers = lazy(() => import('./pages/app/Workers'))
const NewPayroll = lazy(() => import('./pages/app/NewPayroll'))
const PayrollRun = lazy(() => import('./pages/app/PayrollRun'))
const NewRequest = lazy(() => import('./pages/app/NewRequest'))
const Export = lazy(() => import('./pages/app/Export'))
const Settings = lazy(() => import('./pages/app/Settings'))
const Requests = lazy(() => import('./pages/app/Requests'))
const Disputes = lazy(() => import('./pages/app/Disputes'))
const History = lazy(() => import('./pages/app/History'))
const Identity = lazy(() => import('./pages/app/Identity'))
const Streaming = lazy(() => import('./pages/app/Streaming'))
const Bounties = lazy(() => import('./pages/app/Bounties'))
const Multisig = lazy(() => import('./pages/app/Multisig'))
const Analytics = lazy(() => import('./pages/app/Analytics'))

// Worker pages
const WorkerDashboard = lazy(() => import('./pages/worker/WorkerDashboard'))
const ClaimPayment = lazy(() => import('./pages/worker/ClaimPayment'))
const WorkerHistory = lazy(() => import('./pages/worker/WorkerHistory'))
const WorkerSettings = lazy(() => import('./pages/worker/WorkerSettings'))
const WorkerStreams = lazy(() => import('./pages/worker/Streams'))
const WorkerBounties = lazy(() => import('./pages/worker/Bounties'))

function App() {
  return (
    <Web3Provider>
      <NetworkGuard>
        <EventProvider>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Landing />} />
              <Route path="/search" element={<Search />} />
              <Route path="/tx/:hash" element={<TxDetails />} />
              <Route path="/payslip/:referenceType/:referenceId" element={<Payslip />} />

              {/* Employer routes */}
              <Route path="/app" element={<Dashboard />} />
              <Route path="/app/workers" element={<Workers />} />
              <Route path="/app/payroll/new" element={<NewPayroll />} />
              <Route path="/app/payroll/:runId" element={<PayrollRun />} />
              <Route path="/app/requests/new" element={<NewRequest />} />
              <Route path="/app/requests" element={<Requests />} />
              <Route path="/app/disputes" element={<Disputes />} />
              <Route path="/app/history" element={<History />} />
              <Route path="/app/identity" element={<Identity />} />
              <Route path="/app/streaming" element={<Streaming />} />
              <Route path="/app/bounties" element={<Bounties />} />
              <Route path="/app/multisig" element={<Multisig />} />
              <Route path="/app/analytics" element={<Analytics />} />
              <Route path="/app/export" element={<Export />} />
              <Route path="/app/settings" element={<Settings />} />

              {/* Worker routes */}
              <Route path="/worker" element={<WorkerDashboard />} />
              <Route path="/worker/claim/:paymentId" element={<ClaimPayment />} />
              <Route path="/worker/history" element={<WorkerHistory />} />
              <Route path="/worker/streams" element={<WorkerStreams />} />
              <Route path="/worker/bounties" element={<WorkerBounties />} />
              <Route path="/worker/settings" element={<WorkerSettings />} />
            </Routes>
          </Suspense>
        </EventProvider>
      </NetworkGuard>
      <Toaster />
    </Web3Provider>
  )
}

export default App
