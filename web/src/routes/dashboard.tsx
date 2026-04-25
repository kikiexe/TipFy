import { defer, createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { Navbar } from '../components/layout/Navbar'
import { Footer } from '../components/layout/Footer'
import { checkProfileServerFn } from '../lib/auth-utils'
import { AnimatePresence } from 'framer-motion'
import { useAuthStore } from '../store/auth'
import { useEffect, useState } from 'react'
import { z } from 'zod'
import { 
  LayoutDashboard, 
  ArrowRightLeft, 
  Layers, 
  Wallet
} from 'lucide-react'

import { DashboardSidebar } from '../components/dashboard/DashboardSidebar'
import { DashboardMobileNav } from '../components/dashboard/DashboardMobileNav'
import { CommandCenter } from '../components/dashboard/CommandCenter'
import { TransmissionLog } from '../components/dashboard/TransmissionLog'
import { SystemBridge } from '../components/dashboard/system-bridge'
import { PayoutView as WalletSettingsView } from '../components/dashboard/PayoutView'
import { getPayoutSettingsServerFn } from '../lib/payout-utils'
import { getDashboardStatsServerFn, getDonationsServerFn } from '../lib/overlay-utils'

const dashboardSearchSchema = z.object({
  tab: z.enum(['OVERVIEW', 'TRANSACTIONS', 'OVERLAYS', 'SETTINGS']).catch('OVERVIEW'),
  widget: z.string().optional(),
})

export const Route = createFileRoute('/dashboard')({
  validateSearch: (search) => dashboardSearchSchema.parse(search),
  beforeLoad: async () => {
    const { isAuthenticated, hasProfile } = await checkProfileServerFn()
    if (!isAuthenticated) throw redirect({ to: '/' })
    if (!hasProfile) throw redirect({ to: '/setup' })
  },
  loader: async () => {
    // Wallet settings are critical for the initial shell
    const wallet = await getPayoutSettingsServerFn()
    
    // Stats and donations can be streamed
    const statsPromise = getDashboardStatsServerFn()
    const donationsPromise = getDonationsServerFn()
    
    return { 
      wallet, 
      deferredStats: defer(statsPromise),
      deferredDonations: defer(donationsPromise)
    }
  },
  component: DashboardPage,
})

const NAV_ITEMS = [
  { id: 'OVERVIEW', label: 'Overview', icon: LayoutDashboard, color: 'text-neon-cyan' },
  { id: 'TRANSACTIONS', label: 'Transactions', icon: ArrowRightLeft, color: 'text-neon-pink' },
  { id: 'OVERLAYS', label: 'Overlays', icon: Layers, color: 'text-white' },
  { id: 'SETTINGS', label: 'Settings', icon: Wallet, color: 'text-neon-cyan' },
]

function DashboardPage() {
  const { user } = useAuthStore()
  const { wallet, deferredStats, deferredDonations } = Route.useLoaderData()
  const { tab: activeTab } = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  const [walletIsActive, setWalletIsActive] = useState(wallet.isActive)

  useEffect(() => {
    setWalletIsActive(wallet.isActive)
  }, [wallet.isActive])

  const setActiveTab = (id: string) => {
    navigate({ search: (prev: any) => ({ ...prev, tab: id, widget: undefined }) })
  }

  return (
    <div className="min-h-screen bg-cyber-dark text-white flex flex-col font-sans">
      <Navbar />
      
      <div className="flex-1 flex flex-col lg:flex-row max-w-7xl mx-auto w-full relative">
        <DashboardSidebar 
          items={NAV_ITEMS} 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
        />

        <main className="flex-1 p-6 md:p-12 pb-32 lg:pb-12 space-y-12 overflow-hidden">
          {!walletIsActive && (
            <section className="bg-neon-pink/10 border border-neon-pink/30 p-4 skew-x--5 mb-8">
              <div className="skew-x-5 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-neon-pink animate-pulse" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-white">
                    Protocol Incomplete. Masukkan wallet tujuan untuk mengaktifkan fitur donasi on-chain.
                  </p>
                </div>
                <button 
                  onClick={() => setActiveTab('SETTINGS')}
                  className="px-4 py-1.5 bg-neon-pink text-black text-[10px] font-black uppercase tracking-widest hover:bg-white transition-colors"
                >
                  Set Wallet
                </button>
              </div>
            </section>
          )}

          <AnimatePresence mode="wait">
            {activeTab === 'OVERVIEW' && (
              <CommandCenter 
                user={user} 
                deferredStats={deferredStats} 
                deferredDonations={deferredDonations} 
                isStakingEnabled={(wallet).isStakingEnabled}
                key="overview" 
              />
            )}
            {activeTab === 'TRANSACTIONS' && <TransmissionLog key="txs" />}
            {activeTab === 'OVERLAYS' && <SystemBridge user={user} key="overlays" />}
            {activeTab === 'SETTINGS' && (
              <WalletSettingsView 
                key="settings" 
                initialAddress={wallet.payoutAddress} 
                initialStaking={(wallet).isStakingEnabled} 
              />
            )}
          </AnimatePresence>
        </main>

        <DashboardMobileNav 
          items={NAV_ITEMS} 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
        />
      </div>

      <Footer />
    </div>
  )
}
