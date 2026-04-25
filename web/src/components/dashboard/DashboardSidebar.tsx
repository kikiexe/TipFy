import type { LucideIcon } from 'lucide-react'
import { QrCode, ExternalLink, Wallet, X, Download } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { useAuthStore } from '#/store/auth'
import { useBalance } from 'wagmi'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'

interface NavItem {
  id: string
  label: string
  icon: LucideIcon
  color: string
}

interface DashboardSidebarProps {
  items: NavItem[]
  activeTab: string
  setActiveTab: (id: string) => void
}

// Separate QR Modal Component with Portal
const QRPortal = ({ isOpen, onClose, profileUrl, username }: { isOpen: boolean, onClose: () => void, profileUrl: string, username?: string }) => {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const downloadQR = () => {
    const svg = document.getElementById('qr-code-modal-svg')
    if (!svg) return
    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    img.onload = () => {
      canvas.width = 600
      canvas.height = 600
      ctx!.fillStyle = 'white'
      ctx!.fillRect(0, 0, 600, 600)
      ctx?.drawImage(img, 50, 50, 500, 500)
      const pngFile = canvas.toDataURL('image/png')
      const downloadLink = document.createElement('a')
      downloadLink.download = `${username}-tip-qr.png`
      downloadLink.href = pngFile
      downloadLink.click()
    }
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData)
  }

  if (!mounted) return null

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/95 backdrop-blur-xl"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-md bg-neutral-900 border-2 border-neon-cyan/50 shadow-[0_0_100px_rgba(0,243,255,0.2)] overflow-hidden"
          >
            {/* Cyber Header Decor */}
            <div className="h-1 bg-gradient-to-r from-neon-pink via-neon-cyan to-neon-purple" />
            
            <div className="p-8 space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-black text-white tracking-tighter uppercase italic">
                    Creator_<span className="text-neon-cyan">Bridge</span>
                  </h3>
                  <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em] mt-1">
                    Direct Donation Access /u/{username}
                  </p>
                </div>
                <button 
                  onClick={onClose}
                  className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-neon-pink hover:text-black transition-all group"
                >
                  <X size={20} />
                </button>
              </div>

              {/* The "Solid" QR Area */}
              <div className="bg-white p-10 flex justify-center shadow-[0_0_30px_rgba(255,255,255,0.1)] rounded-sm">
                <QRCodeSVG 
                  id="qr-code-modal-svg"
                  value={profileUrl}
                  size={260}
                  level="H"
                  includeMargin={false}
                  bgColor="#ffffff"
                  fgColor="#000000"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={downloadQR}
                  className="flex items-center justify-center gap-3 py-4 bg-neutral-800 hover:bg-neutral-700 text-white text-[10px] font-black uppercase tracking-widest transition-all border border-white/10"
                >
                  <Download size={14} className="text-neon-cyan" />
                  Save_Asset
                </button>
                <a 
                  href={profileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-3 py-4 bg-neon-cyan hover:bg-white text-black text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  <ExternalLink size={14} />
                  Open_Link
                </a>
              </div>

              <div className="text-center">
                <p className="text-[9px] text-neutral-500 font-bold uppercase tracking-[0.3em]">
                  Scannable by all major crypto wallets
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  )
}

export const DashboardSidebar = ({
  items,
  activeTab,
  setActiveTab,
}: DashboardSidebarProps) => {
  const { user } = useAuthStore()
  const [showQRModal, setShowQRModal] = useState(false)
  const { data: balance } = useBalance({
    address: user?.address as `0x${string}`,
  })

  const profileUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/u/${user?.slug}`
    : `https://tipfy.io/u/${user?.slug}`

  const truncatedAddress = user?.address 
    ? `${user.address.slice(0, 6)}...${user.address.slice(-4)}`
    : '0x000...0000'

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r border-white/5 py-12 px-6 sticky top-20 h-[calc(100vh-80px)]">
      <div className="space-y-2">
        <p className="text-[9px] font-black text-neutral-600 uppercase tracking-[0.4em] mb-6">
          CREATOR_CONTROL
        </p>
        {items.map((item: NavItem) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-4 p-4 transition-all group skew-x--5 ${
              activeTab === item.id
                ? 'bg-white/5 border border-white/10'
                : 'hover:bg-white/2 border border-transparent'
            }`}
          >
            <div
              className={`skew-x-5 flex items-center gap-4 ${
                activeTab === item.id
                  ? item.color
                  : 'text-neutral-500 group-hover:text-white'
              }`}
            >
              <item.icon size={18} />
              <span
                className={`text-[10px] font-black uppercase tracking-[0.2em] ${
                  activeTab === item.id
                    ? 'text-white'
                    : 'text-neutral-500 group-hover:text-neutral-300'
                }`}
              >
                {item.label}
              </span>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-auto space-y-4 pt-6 border-t border-white/5">
        {/* Wallet Info */}
        <div className="p-4 bg-white/2 border border-white/5 skew-x--5">
          <div className="skew-x-5 space-y-3">
            <div>
              <p className="text-[8px] font-black text-neutral-500 uppercase tracking-widest mb-1">
                Connected_Wallet
              </p>
              <p className="text-[10px] font-mono text-white flex items-center gap-2">
                <Wallet size={10} className="text-neon-pink" />
                {truncatedAddress}
              </p>
            </div>
            <div>
              <p className="text-[8px] font-black text-neutral-500 uppercase tracking-widest mb-1">
                Wallet_Balance
              </p>
              <p className="text-[12px] font-black text-neon-cyan italic">
                {balance?.formatted ? Number(balance.formatted).toFixed(4) : '0.0000'}
                <span className="ml-1 text-[8px] font-mono opacity-70">{balance?.symbol || 'MON'}</span>
              </p>
            </div>
          </div>
        </div>

        {/* QR Code Section */}
        {user?.slug && (
          <div 
            onClick={() => setShowQRModal(true)}
            className="p-4 bg-white/5 border border-white/10 skew-x--5 group relative overflow-hidden cursor-pointer hover:border-neon-cyan/50 transition-all"
          >
             <div className="absolute top-0 right-0 w-16 h-16 bg-neon-cyan/5 -mr-8 -mt-8 rotate-45 group-hover:bg-neon-cyan/10 transition-colors" />
            <div className="skew-x-5 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-[8px] font-black text-neon-cyan uppercase tracking-widest">
                  Share_Profile
                </p>
                <QrCode size={12} className="text-neon-cyan animate-pulse" />
              </div>
              
              <div className="p-2 flex justify-center group-hover:scale-105 transition-transform">
                <QRCodeSVG 
                  value={profileUrl}
                  size={120}
                  level="H"
                  includeMargin={false}
                  bgColor="transparent"
                  fgColor="#00f3ff"
                />
              </div>

              <div className="flex items-center justify-between text-[8px] font-black text-neutral-400 uppercase tracking-widest group-hover:text-neon-cyan transition-colors">
                <span className="truncate mr-2">/u/{user.slug}</span>
                <ExternalLink size={10} />
              </div>
            </div>
          </div>
        )}

        <QRPortal 
          isOpen={showQRModal} 
          onClose={() => setShowQRModal(false)} 
          profileUrl={profileUrl}
          username={user?.slug}
        />

        {/* Node Status */}
        <div className="p-4 bg-neon-cyan/5 border border-neon-cyan/10 skew-x--5">
          <div className="skew-x-5">
            <p className="text-[8px] font-black text-neon-cyan uppercase tracking-widest mb-1">
              Node_Status
            </p>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-mono text-white italic">
                CONNECTED
              </span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
