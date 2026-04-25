import { createFileRoute, notFound } from '@tanstack/react-router'
import { getPublicProfileServerFn } from '../lib/auth-utils'
import {
  getActiveVotingServerFn,
  submitVoteServerFn,
} from '../lib/overlay-utils'
import { TipFyVaultABI, TIPFY_VAULT_ADDRESS } from '../lib/TipFyVaultABI'
import { GlitchText } from '../components/ui/GlitchText'
import { Navbar } from '../components/layout/Navbar'
import { Footer } from '../components/layout/Footer'
import { NeonButton } from '../components/ui/NeonButton'
import { 
  Zap, 
  ShieldCheck, 
  ExternalLink,
  MessageSquare,
  Twitter,
  Globe,
  Loader2
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'
import { useSendTransaction, useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi'
import { parseEther } from 'viem'

export const Route = createFileRoute('/u/$username')({
  loader: async ({ params }) => {
    const profile = await getPublicProfileServerFn({
      data: params.username,
    })
    if (!profile) throw notFound()

    const activeVoting = await getActiveVotingServerFn({
      data: { profileId: profile.id },
    })

    return { profile, activeVoting }
  },
  component: PublicProfilePage,
})

function PublicProfilePage() {
  const { profile, activeVoting } = Route.useLoaderData()
  const { isConnected, address: senderAddress } = useAccount()
  const [amount, setAmount] = useState('1')
  const [isCustom, setIsCustom] = useState(false)
  const [message, setMessage] = useState('')
  const [votedIndex, setVotedIndex] = useState<number | null>(null)
  const [isVoting, setIsVoting] = useState(false)
  const hasRecorded = useRef(false)

  const handleVote = async (index: number) => {
    if (!isConnected || !activeVoting || isVoting) return
    setIsVoting(true)
    try {
      await (submitVoteServerFn as any)({
        data: {
          votingId: (activeVoting).id,
          optionIndex: index,
          voterAddress: senderAddress,
        },
      })
      setVotedIndex(index)
      alert('Vote berhasil dikirim!')
    } catch (err: any) {
      alert(err.message === 'Already voted' ? 'Anda sudah memberikan vote pada sesi ini.' : 'Gagal mengirim vote.')
    } finally {
      setIsVoting(false)
    }
  }

  const { data: hash, sendTransaction, isPending: isSendingTx, error: sendError } = useSendTransaction()
  const { data: writeHash, writeContract, isPending: isWritingContract, error: writeError } = useWriteContract()

  const currentHash = hash || writeHash
  const isPending = isSendingTx || isWritingContract
  const error = sendError || writeError

  const { isLoading: isConfirming, isSuccess: isConfirmed } = 
    useWaitForTransactionReceipt({ hash: currentHash })

  useEffect(() => {
    if (isConfirmed && currentHash && !hasRecorded.current) {
      hasRecorded.current = true
      fetch('/api/donation/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: profile.username,
          senderAddress,
          amount,
          txHash: currentHash,
          message
        })
      }).catch(err => console.error('Failed to record donation:', err))
    }
  }, [isConfirmed, currentHash, profile.username, senderAddress, amount, message])

  // TipFyVault Smart Contract Address is now imported from TipFyVaultABI.ts

  const handleTip = async () => {
    if (!isConnected || !profile.walletAddress) return
    hasRecorded.current = false

    if (profile.isStakingEnabled) {
      console.log(`[Tipping] Routing to Vault: ${TIPFY_VAULT_ADDRESS} (Staking: true)`)
      writeContract({
        address: TIPFY_VAULT_ADDRESS,
        abi: TipFyVaultABI,
        functionName: 'donate',
        args: [
          (profile.payoutAddress || profile.walletAddress) as `0x${string}`,
          'Anon', // Placeholder nickname or use state if available
          message || 'Support',
          '', // Media URL
        ],
        value: parseEther(amount),
      })
    } else {
      const targetAddress = (profile.payoutAddress || profile.walletAddress)
      console.log(`[Tipping] Routing Direct P2P to: ${targetAddress} (Staking: false)`)
      sendTransaction({
        to: targetAddress as `0x${string}`,
        value: parseEther(amount),
      })
    }
  }

  return (
    <div className="min-h-screen bg-cyber-dark text-white flex flex-col font-sans selection:bg-neon-cyan/30">
      <Navbar />
      
      <main className="flex-1 relative overflow-hidden pb-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(0,255,242,0.1),transparent_50%)]" />
        <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-neon-cyan/50 to-transparent" />

        <div className="max-w-4xl mx-auto px-6 pt-24 relative z-10 space-y-16">
          <section className="text-center space-y-6">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative inline-block group"
            >
              <div className="w-32 h-32 md:w-40 md:h-40 bg-white/5 border-2 border-neon-cyan/20 p-1 skew-x--5 group-hover:border-neon-cyan/50 transition-all duration-500">
                <div className="w-full h-full bg-black overflow-hidden relative">
                  {profile.avatarUrl ? (
                    <img 
                      src={profile.avatarUrl} 
                      alt={profile.displayName || 'Creator'} 
                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-white/5">
                      <Zap size={48} className="text-neon-cyan opacity-20" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-linear-to-t from-black/80 to-transparent" />
                </div>
              </div>
              <div className="absolute -bottom-2 -right-2 bg-neon-pink p-2 skew-x--10 glow-pink">
                <ShieldCheck size={16} className="text-black" />
              </div>
            </motion.div>

            <div className="space-y-2">
              <GlitchText text={profile.displayName || 'ANONYMOUS_CREATOR'} className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter" />
              <div className="flex items-center justify-center gap-3">
                <span className="text-neon-cyan font-mono text-xs tracking-widest uppercase">@ {profile.username}</span>
                <span className="w-1 h-1 bg-white/20 rounded-full" />
                <span className="text-neutral-500 font-mono text-[10px] uppercase tracking-widest">{profile.walletAddress.slice(0,6)}...{profile.walletAddress.slice(-4)}</span>
              </div>
            </div>

            {profile.bio && (
              <p className="text-neutral-400 max-w-lg mx-auto text-sm leading-relaxed font-medium uppercase tracking-wide">
                {profile.bio}
              </p>
            )}

            <div className="flex items-center justify-center gap-6 pt-4">
              <SocialIcon icon={<Twitter size={18} />} href="#" />
              <SocialIcon icon={<Globe size={18} />} href="#" />
              <SocialIcon icon={<ExternalLink size={18} />} href="#" />
            </div>
          </section>

          {activeVoting && (
            <section className="glass-card border border-neon-cyan/20 p-8 md:p-12 relative bg-black/40 backdrop-blur-3xl overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-neon-cyan" />
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-neon-cyan animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-neon-cyan">Active_Poll_Session</span>
                  </div>
                  <h3 className="text-3xl font-black italic uppercase tracking-tighter text-white">{activeVoting.title}</h3>
                </div>
                <div className="bg-white/5 border border-white/10 px-4 py-2 skew-x--10">
                  <p className="text-[10px] font-black uppercase text-neutral-400 skew-x-10">Status: In_Progress</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(activeVoting.options as string[]).map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleVote(idx)}
                    disabled={votedIndex !== null || isVoting || !isConnected}
                    className={`p-6 border transition-all relative group text-left skew-x--5 overflow-hidden ${
                      votedIndex === idx
                        ? 'bg-neon-cyan text-black border-neon-cyan shadow-[0_0_20px_rgba(0,255,242,0.3)]'
                        : 'bg-white/2 border-white/5 hover:border-neon-cyan/50 text-white'
                    } disabled:cursor-not-allowed`}
                  >
                    <div className="skew-x-5 flex justify-between items-center relative z-10">
                      <span className="text-sm font-black uppercase tracking-widest">{option}</span>
                      {votedIndex === idx && <ShieldCheck size={16} />}
                    </div>
                    {votedIndex !== null && votedIndex !== idx && (
                      <div className="absolute inset-0 bg-black/40" />
                    )}
                  </button>
                ))}
              </div>

              {!isConnected && (
                <p className="text-[10px] font-bold text-neon-pink uppercase text-center mt-6 animate-pulse">
                  Connect wallet to participate in voting_
                </p>
              )}
            </section>
          )}

          <section className="glass-card border border-white/5 p-8 md:p-12 relative group bg-black/40 backdrop-blur-3xl">
            <div className="absolute -top-px left-0 w-full h-px bg-linear-to-r from-transparent via-neon-pink to-transparent opacity-50" />
            
            {isConfirmed ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12 space-y-6"
              >
                <div className="w-20 h-20 bg-green-500/10 border border-green-500/50 mx-auto flex items-center justify-center skew-x--10 glow-green">
                  <CheckCircleIcon className="text-green-500 skew-x-10" size={40} />
                </div>
                <div>
                  <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white">Transmission_Successful</h3>
                  <p className="text-neutral-500 text-[10px] font-black uppercase tracking-[0.4em] mt-2">Transaction Hash: {currentHash?.slice(0,10)}...{currentHash?.slice(-8)}</p>
                </div>
                <NeonButton variant="cyan" onClick={() => window.location.reload()} className="mx-auto">
                  Send_Another_Support
                </NeonButton>
              </motion.div>
            ) : (
              <>
                <div className="text-center mb-12">
                  <h3 className="text-xs font-black text-neon-pink uppercase tracking-[0.4em] mb-4">Initialize_Support_Sync</h3>
                  <p className="text-3xl font-black italic uppercase tracking-tighter">Fuel the <span className="text-neon-cyan">Vision</span></p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                  {[1, 5, 10, 25].map((amt) => (
                    <button 
                      key={amt}
                      onClick={() => {
                        setAmount(amt.toString())
                        setIsCustom(false)
                      }}
                      className={`p-6 border transition-all group relative skew-x--5 ${
                        !isCustom && amount === amt.toString() 
                        ? 'bg-neon-cyan/10 border-neon-cyan shadow-[0_0_20px_rgba(0,255,242,0.2)]' 
                        : 'bg-white/2 border-white/5 hover:border-neon-cyan/50'
                      }`}
                    >
                      <div className="skew-x-5 text-center">
                        <span className={`block text-2xl font-black transition-colors ${!isCustom && amount === amt.toString() ? 'text-neon-cyan' : 'text-white group-hover:text-neon-cyan'}`}>{amt}</span>
                        <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest">MON</span>
                      </div>
                    </button>
                  ))}
                  <button 
                    onClick={() => {
                      setIsCustom(true)
                      setAmount('')
                    }}
                    className={`p-6 border transition-all group relative skew-x--5 ${
                      isCustom 
                      ? 'bg-neon-pink/10 border-neon-pink shadow-[0_0_20px_rgba(255,0,230,0.2)]' 
                      : 'bg-white/2 border-white/5 hover:border-neon-pink/50'
                    }`}
                  >
                    <div className="skew-x-5 text-center">
                      <span className={`block text-xl font-black transition-colors ${isCustom ? 'text-neon-pink' : 'text-white group-hover:text-neon-pink'}`}>CUSTOM</span>
                      <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest">EDIT_VAL</span>
                    </div>
                  </button>
                </div>

                <AnimatePresence>
                  {isCustom && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden mb-8"
                    >
                      <div className="max-w-md mx-auto relative">
                        <input 
                          type="text"
                          inputMode="decimal"
                          value={amount}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9.]/g, '')
                            if (val.split('.').length <= 2) setAmount(val)
                          }}
                          placeholder="ENTER_CUSTOM_AMOUNT_MON"
                          className="w-full bg-black border border-neon-pink p-4 font-mono text-2xl text-center text-neon-pink focus:outline-none focus:shadow-[0_0_15px_rgba(255,0,230,0.3)] skew-x--10 placeholder:text-neutral-800"
                          autoFocus
                        />
                        <div className="absolute right-6 top-1/2 -translate-y-1/2 text-xs font-black text-neutral-600 skew-x-10 uppercase tracking-widest">MON</div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-6 max-w-md mx-auto">
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-neon-cyan/20 blur opacity-0 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                    <div className="relative bg-black border border-white/10 p-4 flex items-start gap-4 focus-within:border-neon-cyan transition-all">
                      <MessageSquare size={18} className="text-neutral-600 mt-1" />
                      <textarea 
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Enter an encrypted message (optional)..."
                        className="w-full bg-transparent outline-none text-xs font-bold uppercase tracking-wider placeholder:text-neutral-700 min-h-20 resize-none"
                      />
                    </div>
                  </div>

                  <NeonButton
                    variant="pink"
                    className="w-full"
                    onClick={handleTip}
                    disabled={isPending || isConfirming || !isConnected}
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="animate-spin" size={18} />
                        <span>Requesting_Sig</span>
                      </>
                    ) : isConfirming ? (
                      <>
                        <Loader2 className="animate-spin" size={18} />
                        <span>Confirming_Tx</span>
                      </>
                    ) : (
                      'Transmit Tip_'
                    )}
                  </NeonButton>

                  {error && (
                    <p className="text-[10px] font-bold text-neon-pink uppercase text-center animate-pulse">
                      Error: {error.message.includes('User rejected') ? 'User_Rejected_Signature' : 'Blockchain_Sync_Failure'}
                    </p>
                  )}
                </div>
              </>
            )}

            <div className="mt-8 text-center">
              <p className="text-[8px] font-mono text-neutral-700 uppercase tracking-[0.5em]">
                Secure_P2P_Encryption // Monad_Testnet_Active
              </p>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  )
}

function CheckCircleIcon({ className, size }: { className?: string, size?: number }) {
  return (
    <svg 
      className={className} 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="3" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

function SocialIcon({ icon, href }: { icon: React.ReactNode, href: string }) {
  return (
    <a 
      href={href} 
      className="text-neutral-600 hover:text-neon-cyan transition-colors duration-300"
      target="_blank"
      rel="noopener noreferrer"
    >
      {icon}
    </a>
  )
}
