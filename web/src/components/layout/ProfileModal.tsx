import { motion, AnimatePresence } from 'framer-motion'
import { X, Copy, Wallet, TrendingUp, Share2, Settings, User, LogOut } from 'lucide-react'
import { useAccount, useBalance } from 'wagmi'
import { useState } from 'react'
import { formatUnits } from 'viem'
import { GlitchText } from '../ui/GlitchText'
import { useUIStore } from '../../store/ui'
import { Link } from '@tanstack/react-router'
import { useAuthStore } from '../../store/auth'

export const ProfileModal = () => {
  const { showProfile, setShowProfile } = useUIStore()
  const { address } = useAccount()
  const { data: balance } = useBalance({ address })
  const { user, logout } = useAuthStore()
  const [copied, setCopied] = useState(false)

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleLogout = async () => {
    await logout()
    setShowProfile(false)
    window.location.href = '/'
  }

  const formattedBalance = balance
    ? parseFloat(formatUnits(balance.value, balance.decimals)).toFixed(4)
    : '0.0000'

  return (
    <AnimatePresence>
      {showProfile && (
        <div className="fixed inset-0 z-9999 flex justify-end">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowProfile(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative w-full max-w-87.5 h-full bg-[#080808] border-l border-white/10 shadow-2xl flex flex-col"
          >
            <div className="p-6 border-b border-white/5 bg-white/2 flex items-center justify-between">
              <div>
                <GlitchText text="TERMINAL_v1.0" className="text-neon-cyan text-[10px] font-black tracking-[0.4em] uppercase" />
                <h2 className="text-lg font-black text-white italic truncate max-w-50">
                  {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'GUEST_USER'}
                </h2>
              </div>
              <button onClick={() => setShowProfile(false)} className="p-2 text-neutral-500 hover:text-neon-pink transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              <div className="p-4 bg-white/2 border border-white/5 space-y-1 relative group overflow-hidden skew-x--5 ml-2">
                <div className="skew-x-5">
                  <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest flex items-center gap-2">
                    <Wallet size={12} className="text-neon-cyan" /> Wallet_Balance
                  </p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-black text-white">{formattedBalance}</span>
                    <span className="text-[10px] font-bold text-neon-cyan uppercase tracking-tighter">{balance?.symbol || 'MON'}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <p className="px-2 text-[9px] font-black text-neutral-600 uppercase tracking-[0.4em] mb-4">Nav_Interface</p>
                
                {user?.slug && (
                  <MenuLink 
                    to={`/u/${user.slug}`} 
                    icon={<User size={18} />} 
                    label="My Public Profile" 
                    color="cyan"
                    onClick={() => setShowProfile(false)}
                  />
                )}
                
                <MenuLink 
                  to="/dashboard" 
                  icon={<TrendingUp size={18} />} 
                  label="Creator Dashboard" 
                  color="white"
                  onClick={() => setShowProfile(false)}
                />

                <MenuItem icon={<Share2 size={18} />} label="Copy Tip Link" color="white" />
                <MenuItem icon={<Settings size={18} />} label="Account Settings" color="white" />
                
                <div className="pt-4 border-t border-white/5 mt-4">
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-4 p-4 text-neutral-500 hover:text-neon-pink hover:bg-neon-pink/5 transition-all group skew-x--5"
                  >
                    <div className="skew-x-5 flex items-center gap-4">
                      <LogOut size={18} className="group-hover:animate-pulse" />
                      <span className="text-[11px] font-black uppercase tracking-[0.2em]">Sign Out</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6 bg-[#0c0c0c] border-t border-white/10 z-10">
              <button 
                onClick={copyAddress}
                className="w-full py-3 bg-black border border-white/5 hover:border-neon-cyan/50 text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 text-neutral-500 overflow-hidden"
              >
                {copied ? (
                  <span className="text-neon-cyan italic text-[8px] animate-pulse">Buffer_Updated_Successfully</span>
                ) : (
                  <div className="flex items-center gap-2 truncate px-2">
                    <Copy size={12} className="shrink-0" /> 
                    <span className="truncate">{address}</span>
                  </div>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

function MenuItem({ icon, label, color }: { icon: React.ReactNode, label: string, color: string }) {
  const colorClass = color === 'cyan' ? 'text-neon-cyan' : color === 'pink' ? 'text-neon-pink' : 'text-neutral-400'
  return (
    <button className={`w-full flex items-center gap-4 p-4 hover:bg-white/3 transition-all group skew-x--5 ${colorClass}`}>
      <div className="skew-x-5 flex items-center gap-4">
        <div className="group-hover:scale-110 transition-transform">{icon}</div>
        <span className="text-[11px] font-black uppercase tracking-[0.2em] text-neutral-400 group-hover:text-white transition-colors">{label}</span>
      </div>
    </button>
  )
}

function MenuLink({ to, icon, label, color, onClick }: { to: string, icon: React.ReactNode, label: string, color: string, onClick?: () => void }) {
  const colorClass = color === 'cyan' ? 'text-neon-cyan' : color === 'pink' ? 'text-neon-pink' : 'text-neutral-400'
  return (
    <Link 
      to={to} 
      onClick={onClick}
      className={`w-full flex items-center gap-4 p-4 hover:bg-white/3 transition-all group skew-x--5 ${colorClass}`}
    >
      <div className="skew-x-5 flex items-center gap-4">
        <div className="group-hover:scale-110 transition-transform">{icon}</div>
        <span className="text-[11px] font-black uppercase tracking-[0.2em] text-neutral-400 group-hover:text-white transition-colors">{label}</span>
      </div>
    </Link>
  )
}
