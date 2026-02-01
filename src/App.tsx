import { Suspense, lazy } from 'react'
import { Routes, Route } from 'react-router-dom'
import { Web3Provider } from './app/providers'
import { Toaster } from './components/ui/toaster'
import { NetworkGuard } from './components/NetworkGuard'
import { PageLoader } from './components/PageLoader'

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

// Worker pages
const WorkerDashboard = lazy(() => import('./pages/worker/WorkerDashboard'))
const ClaimPayment = lazy(() => import('./pages/worker/ClaimPayment'))
const WorkerHistory = lazy(() => import('./pages/worker/WorkerHistory'))
const WorkerSettings = lazy(() => import('./pages/worker/WorkerSettings'))

function App() {
  return (
    <Web3Provider>
      <NetworkGuard>
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
            <Route path="/app/export" element={<Export />} />
            <Route path="/app/settings" element={<Settings />} />

            {/* Worker routes */}
            <Route path="/worker" element={<WorkerDashboard />} />
            <Route path="/worker/claim/:paymentId" element={<ClaimPayment />} />
            <Route path="/worker/history" element={<WorkerHistory />} />
            <Route path="/worker/settings" element={<WorkerSettings />} />
          </Routes>
        </Suspense>
      </NetworkGuard>
      <Toaster />
    </Web3Provider>
  )
}

export default App
