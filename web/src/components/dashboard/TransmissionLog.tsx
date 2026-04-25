import { motion } from 'framer-motion'
import { Activity, ArrowDownLeft, ExternalLink, User } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getDonationsServerFn } from '../../lib/overlay-utils'

export const TransmissionLog = () => {
  const [donations, setDonations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [offset, setOffset] = useState(0)
  const LIMIT = 10

  const fetchDonations = async (currentOffset: number, isInitial: boolean) => {
    try {
      if (isInitial) setLoading(true)
      else setLoadingMore(true)

      const data = await (getDonationsServerFn as any)({
        data: { limit: LIMIT, offset: currentOffset }
      })
      
      if (data.length < LIMIT) {
        setHasMore(false)
      }

      if (isInitial) {
        setDonations(data)
      } else {
        setDonations(prev => [...prev, ...data])
      }
    } catch (err) {
      console.error('Fetch donations failed:', err)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  useEffect(() => {
    fetchDonations(0, true)
  }, [])

  const handleLoadMore = () => {
    const nextOffset = offset + LIMIT
    setOffset(nextOffset)
    fetchDonations(nextOffset, false)
  }

  if (loading) {
    return (
      <div className="p-12 text-center text-[10px] font-black uppercase tracking-[0.5em] animate-pulse">
        Synchronizing_Ledger...
      </div>
    )
  }

  if (donations.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="space-y-8"
      >
        <div>
          <h2 className="text-4xl font-black italic uppercase tracking-tighter">Transaction_<span className="text-neon-pink">History</span></h2>
          <p className="text-neutral-500 text-[10px] font-black uppercase tracking-[0.4em] mt-2 italic">No transaction activity detected yet.</p>
        </div>
        <div className="p-20 bg-white/2 border border-white/5 text-center space-y-4 skew-x--5">
          <div className="skew-x-5">
            <Activity size={40} className="text-neutral-800 mx-auto mb-4" />
            <p className="text-[10px] font-black text-neutral-600 uppercase tracking-widest italic">Silent_Frequency... Waiting for the first support.</p>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-8 pb-20"
    >
      <div>
        <h2 className="text-4xl font-black italic uppercase tracking-tighter">Transaction_<span className="text-neon-pink">History</span></h2>
        <p className="text-neutral-500 text-[10px] font-black uppercase tracking-[0.4em] mt-2 italic">Monitoring real-time incoming support</p>
      </div>

      <div className="space-y-4">
        {donations.map((item, idx) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: (idx % LIMIT) * 0.05 }}
            className="p-6 bg-white/2 border border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 group hover:border-neon-pink/30 transition-all skew-x--2"
          >
            <div className="flex items-center gap-4 skew-x-2">
              <div className="w-12 h-12 bg-white/5 flex items-center justify-center text-neon-pink">
                {item.senderAddress ? <User size={20} /> : <Activity size={20} />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black italic uppercase text-sm tracking-tighter text-white">
                    {item.senderName || 'Anonymous'}
                  </h3>
                  <span className="text-[8px] bg-white/5 px-2 py-0.5 text-neutral-500 font-black uppercase tracking-widest">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400 font-bold tracking-tight mt-1 max-w-md truncate italic">
                  "{item.message || 'Tanpa pesan.'}"
                </p>
              </div>
            </div>

            <div className="flex flex-row-reverse md:flex-row items-center gap-6 w-full md:w-auto justify-between md:justify-end skew-x-2">
              <div className="text-right">
                <div className="text-xl font-black italic text-neon-cyan tracking-tighter">
                  {item.amount} {item.currency}
                </div>
                <div className="flex items-center justify-end gap-1 text-[8px] text-neutral-600 font-black uppercase tracking-widest mt-1">
                  <ArrowDownLeft size={10} /> Received_Protocol
                </div>
              </div>
              
              <a 
                href={`https://testnet.monadexplorer.com/tx/${item.txHash}`}
                target="_blank"
                className="p-3 bg-white/5 hover:bg-neon-pink/20 border border-white/10 text-neutral-600 hover:text-neon-pink transition-all"
              >
                <ExternalLink size={14} />
              </a>
            </div>
          </motion.div>
        ))}
      </div>

      {hasMore && (
        <button
          onClick={handleLoadMore}
          disabled={loadingMore}
          className="w-full py-4 bg-white/2 border border-white/5 hover:border-neon-pink/30 text-[10px] font-black uppercase tracking-[0.4em] transition-all skew-x--10 flex items-center justify-center gap-2"
        >
          {loadingMore ? 'Syncing_More_Data...' : 'Fetch_Older_Transmissions'}
        </button>
      )}
    </motion.div>
  )
}
