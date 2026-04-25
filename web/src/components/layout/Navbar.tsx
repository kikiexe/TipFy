import { Link } from '@tanstack/react-router'
import { WalletAuth } from './WalletAuth'
import { ProfileModal } from './ProfileModal'
import { LayoutDashboard, Home, User } from 'lucide-react'
import { useAuthStore } from '../../store/auth'
import { useUIStore } from '../../store/ui'

export const Navbar = () => {
  const { user } = useAuthStore()
  const { setShowProfile } = useUIStore()

  return (
    <>
      <nav className="sticky top-0 z-100 w-full border-b border-white/5 bg-black/60 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="group flex items-center gap-3">
            <div className="w-10 h-10 bg-neon-cyan flex items-center justify-center skew-x--10 glow-cyan transition-transform group-hover:scale-110">
              <span className="text-black font-black text-xl skew-x-10">T</span>
            </div>
            <span className="text-2xl font-black tracking-tighter italic uppercase group-hover:text-neon-cyan transition-colors">
              Tip<span className="text-neon-pink group-hover:text-white">fy</span>
            </span>
          </Link>

          <div className="hidden lg:flex items-center gap-8 ml-12 flex-1">
            <NavLink to="/" icon={<Home size={14} />} label="Explore" />
            {user && (
              <NavLink to="/dashboard" icon={<LayoutDashboard size={14} />} label="Dashboard" />
            )}
          </div>

          <div className="flex items-center gap-4">
            {user && (
              <button 
                onClick={() => setShowProfile(true)}
                className="p-2.5 bg-white/5 border border-white/10 hover:border-neon-cyan/50 hover:bg-neon-cyan/5 transition-all group"
              >
                <User size={20} className="text-neutral-400 group-hover:text-neon-cyan" />
              </button>
            )}
            <WalletAuth />
          </div>
        </div>
      </nav>
      
      <ProfileModal />
    </>
  )
}

function NavLink({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <Link 
      to={to} 
      className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-neutral-500 hover:text-neon-cyan transition-all [&.active]:text-neon-cyan"
    >
      {icon} {label}
    </Link>
  )
}
