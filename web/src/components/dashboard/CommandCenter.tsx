import { motion } from 'framer-motion'
import { StatCard } from './StatCard'
import { FeedItem } from './FeedItem'
import { GlitchText } from '../ui/GlitchText'
import {
  Zap,
  ShieldCheck,
  ExternalLink,
  Wallet,
  TrendingUp,
  Users,
  Activity,
  Terminal as TerminalIcon,
  Lock,
  Coins,
  ArrowDownCircle,
  Loader2,
} from 'lucide-react'
import { Link, Await } from '@tanstack/react-router'
import { Suspense, useMemo } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { formatEther } from 'viem'
import { TipFyVaultABI, TIPFY_VAULT_ADDRESS } from '../../lib/TipFyVaultABI'

// Address is now imported from TipFyVaultABI.ts

interface CommandCenterProps {
  user: any
  deferredStats: any
  deferredDonations: any
  isStakingEnabled?: boolean
}

export const CommandCenter = ({
  user,
  deferredStats,
  deferredDonations,
  isStakingEnabled,
}: CommandCenterProps) => {
  const { address } = useAccount()
  const chartData = [40, 70, 45, 90, 65, 80, 50, 85, 40, 60, 75, 95]

  // --- Contract Reads ---
  const { data: vaultBalance } = useReadContract({
    address: TIPFY_VAULT_ADDRESS,
    abi: TipFyVaultABI,
    functionName: 'balances',
    args: [address as `0x${string}`],
    query: { enabled: !!address && !!isStakingEnabled }
  })

  const { data: accruedYield } = useReadContract({
    address: TIPFY_VAULT_ADDRESS,
    abi: TipFyVaultABI,
    functionName: 'calculateYield',
    args: [address as `0x${string}`],
    query: { enabled: !!address && !!isStakingEnabled }
  })

  const { data: lastStakeTime } = useReadContract({
    address: TIPFY_VAULT_ADDRESS,
    abi: TipFyVaultABI,
    functionName: 'lastStakeTimestamp',
    args: [address as `0x${string}`],
    query: { enabled: !!address && !!isStakingEnabled }
  })

  const { data: stakeDuration } = useReadContract({
    address: TIPFY_VAULT_ADDRESS,
    abi: TipFyVaultABI,
    functionName: 'STAKE_DURATION',
    query: { enabled: !!isStakingEnabled }
  })

  // --- Contract Writes ---
  const { data: hash, writeContract, isPending } = useWriteContract()
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash })

  const handleWithdraw = () => {
    if (!vaultBalance || Number(vaultBalance) === 0) {
      alert('Vault balance is zero.')
      return
    }
    writeContract({
      address: TIPFY_VAULT_ADDRESS,
      abi: TipFyVaultABI,
      functionName: 'withdraw',
      args: [vaultBalance],
    })
  }

  const handleClaimYield = () => {
    writeContract({
      address: TIPFY_VAULT_ADDRESS,
      abi: TipFyVaultABI,
      functionName: 'claimYield',
    })
  }

  // --- Calculations ---
  const maturityInfo = useMemo(() => {
    if (!lastStakeTime || !stakeDuration || Number(lastStakeTime) === 0) return 'No Active Stake'
    const maturityAt = Number(lastStakeTime) + Number(stakeDuration)
    const now = Math.floor(Date.now() / 1000)
    const diff = maturityAt - now
    if (diff <= 0) return 'MATURED: CLAIM READY'
    const days = Math.ceil(diff / 86400)
    return `${days} DAYS REMAINING`
  }, [lastStakeTime, stakeDuration])

  const canClaimYield = useMemo(() => {
    return !!(accruedYield && Number(accruedYield) > 0 && maturityInfo === 'MATURED: CLAIM READY')
  }, [accruedYield, maturityInfo])

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-12"
    >
      <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-white/5 pb-12">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Zap size={14} className="text-neon-cyan animate-pulse" />
            <GlitchText
              text={
                isStakingEnabled
                  ? 'PROTOCOL_VAULT: STAKING_ACTIVE'
                  : 'STATUS_AKUN: AKTIF'
              }
              className={`${isStakingEnabled ? 'text-neon-pink' : 'text-neon-cyan'} text-[10px] font-black tracking-[0.4em] uppercase`}
            />
          </div>
          <h1 className="text-6xl font-black italic tracking-tighter uppercase leading-none">
            Dash<span className="text-neon-pink">board</span>
          </h1>
          <p className="text-neutral-500 font-bold uppercase tracking-widest text-xs mt-4 flex items-center gap-2">
            <ShieldCheck size={14} /> Panel Kontrol Kreator v1.0
          </p>
        </div>
        <div className="flex gap-4">
          {user?.slug && (
            <Link
              to={`/u/${user.slug}`}
              className="px-6 py-3 bg-white/5 border border-white/10 hover:border-neon-cyan/50 transition-all uppercase text-[10px] font-black tracking-[0.2em] flex items-center gap-2 skew-x--10"
            >
              <span className="skew-x-10 flex items-center gap-2">
                <ExternalLink size={14} /> Profil Publik Saya
              </span>
            </Link>
          )}
        </div>
      </section>

      <Suspense
        fallback={
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
            <div className="h-32 bg-white/5 skew-x--10" />
            <div className="h-32 bg-white/5 skew-x--10" />
            <div className="h-32 bg-white/5 skew-x--10" />
          </section>
        }
      >
        <Await promise={deferredStats}>
          {(stats: any) => (
            <div className="space-y-6">
              <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                  icon={<Wallet className="text-neon-cyan" />}
                  label="Total Earnings"
                  value={Number(stats.totalEarnings || 0).toLocaleString()}
                  unit="MON"
                  trend="Cumulative"
                />
                <StatCard
                  icon={<TrendingUp className="text-neon-pink" />}
                  label="Recent Tips"
                  value={(stats.totalDonations || 0).toString()}
                  unit="Transactions"
                  trend="All time"
                />
                <StatCard
                  icon={<Users className="text-white" />}
                  label="Top Supporters"
                  value={(stats.uniqueWallets || 0).toString()}
                  unit="Unique Wallets"
                  trend="Community"
                />
              </section>

              {/* Vault & Staking Special Section */}
              {isStakingEnabled && (
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-8 bg-neon-pink/5 border border-neon-pink/20 skew-x--5 flex flex-col md:flex-row justify-between items-center gap-8"
                >
                  <div className="skew-x-5 flex-1 flex flex-col md:flex-row gap-12">
                    <div>
                      <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-1 flex items-center gap-2">
                        <Lock size={12} className="text-neon-pink" />{' '}
                        Vault_Balance
                      </p>
                      <p className="text-4xl font-black text-white italic">
                        {vaultBalance ? formatEther(vaultBalance) : '0.00'}{' '}
                        <span className="text-xs text-neutral-500 not-italic uppercase">
                          MON
                        </span>
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-1 flex items-center gap-2">
                        <Coins size={12} className="text-green-500" />{' '}
                        Accrued_Yield
                      </p>
                      <p className="text-4xl font-black text-green-500 italic">
                        +{accruedYield ? formatEther(accruedYield) : '0.00'}{' '}
                        <span className="text-xs text-neutral-500 not-italic uppercase">
                          MON
                        </span>
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-1">
                        Time_to_Maturity
                      </p>
                      <p className="text-sm font-black text-white uppercase tracking-tighter">
                        {maturityInfo}
                      </p>
                    </div>
                  </div>

                  <div className="skew-x-5 flex gap-4 w-full md:w-auto">
                    <button
                      onClick={handleWithdraw}
                      disabled={isPending || isConfirming || !vaultBalance || Number(vaultBalance) === 0}
                      className="flex-1 md:flex-none px-6 py-4 bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase tracking-widest hover:bg-neon-pink/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                      {isPending || isConfirming ? <Loader2 className="animate-spin" size={16} /> : <ArrowDownCircle size={16} />}
                      Withdraw_Principal
                    </button>
                    <button
                      onClick={handleClaimYield}
                      disabled={!canClaimYield || isPending || isConfirming}
                      className={`flex-1 md:flex-none px-6 py-4 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${
                        canClaimYield 
                        ? 'bg-green-500/10 border border-green-500/50 text-green-500 hover:bg-green-500/20' 
                        : 'bg-neutral-800 text-neutral-600 border border-transparent cursor-not-allowed'
                      }`}
                    >
                      <Zap size={16} /> Claim_Yield
                    </button>
                  </div>
                </motion.section>
              )}
            </div>
          )}
        </Await>
      </Suspense>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8 space-y-12">
          <div className="p-8 bg-white/2 border border-white/5 relative group">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <Activity size={18} className="text-neon-cyan" />
                <h3 className="text-xs font-black uppercase tracking-[0.3em]">
                  Earnings_Analysis
                </h3>
              </div>
              <div className="flex gap-2">
                <div className="w-2 h-2 rounded-full bg-neon-cyan animate-ping" />
                <span className="text-[10px] font-mono text-neon-cyan uppercase">
                  Live_Updates
                </span>
              </div>
            </div>
            <div className="h-64 flex items-end gap-2 md:gap-4 px-2">
              {chartData.map((val, i) => (
                <motion.div
                  key={i}
                  initial={{ height: 0 }}
                  animate={{ height: `${val}%` }}
                  transition={{
                    delay: i * 0.05,
                    duration: 0.8,
                    ease: 'circOut',
                  }}
                  className="flex-1 bg-linear-to-t from-neon-cyan/10 via-neon-cyan/40 to-neon-cyan relative group/bar"
                >
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[8px] font-mono text-neon-cyan opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap">
                    VAL_{val}
                  </div>
                  <div className="absolute inset-0 bg-white opacity-0 group-hover/bar:opacity-20 transition-opacity" />
                </motion.div>
              ))}
            </div>
            <div className="flex justify-between mt-4 text-[8px] font-mono text-neutral-600 uppercase tracking-widest px-2">
              <span>00:00</span>
              <span>06:00</span>
              <span>12:00</span>
              <span>18:00</span>
              <span>23:59</span>
            </div>
          </div>
        </div>
        <div className="lg:col-span-4">
          <div className="bg-black border border-white/5 overflow-hidden flex flex-col h-100">
            <div className="p-4 border-b border-white/5 bg-white/2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TerminalIcon size={14} className="text-neon-pink" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em]">
                  Recent_Activity
                </span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono">
              <Suspense
                fallback={
                  <div className="p-4 text-[10px] uppercase animate-pulse">
                    Syncing_Activity...
                  </div>
                }
              >
                <Await promise={deferredDonations}>
                  {(donations: any) => (
                    <>
                      {donations &&
                      Array.isArray(donations) &&
                      donations.length > 0 ? (
                        donations
                          .slice(0, 10)
                          .map((item: any) => (
                            <FeedItem
                              key={item.id}
                              user={
                                item.senderName ||
                                item.senderAddress?.slice(0, 6) ||
                                'Anon'
                              }
                              msg={`${item.amount} ${item.currency}: ${item.message || 'Sent support.'}`}
                              type="tip"
                            />
                          ))
                      ) : (
                        <>
                          <FeedItem
                            user="system"
                            msg="Connection established."
                            type="info"
                          />
                          <FeedItem
                            user="system"
                            msg="No activity found."
                            type="info"
                          />
                        </>
                      )}
                    </>
                  )}
                </Await>
              </Suspense>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
