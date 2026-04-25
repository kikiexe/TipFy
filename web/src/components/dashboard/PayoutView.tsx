import { useForm } from '@tanstack/react-form'
import { updatePayoutSettingsServerFn } from '../../lib/payout-utils'
import { Wallet, ShieldCheck, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { TipFyVaultABI, TIPFY_VAULT_ADDRESS } from '../../lib/TipFyVaultABI'

// Address is now imported from TipFyVaultABI.ts

export const PayoutView = ({
  initialAddress,
  initialStaking,
}: {
  initialAddress: string
  initialStaking?: boolean
}) => {
  const [success, setSuccess] = useState(false)
  const { data: hash, writeContract, isPending: isTxPending } = useWriteContract()
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash })

  const form = useForm({
    defaultValues: {
      payoutAddress: initialAddress || '',
      isStakingEnabled: initialStaking || false,
    },
    onSubmit: async ({ value }) => {
      try {
        // 1. Update Smart Contract if status changed
        if (value.isStakingEnabled !== initialStaking) {
          writeContract({
            address: TIPFY_VAULT_ADDRESS,
            abi: TipFyVaultABI,
            functionName: 'toggleStaking',
            args: [value.isStakingEnabled],
          })
        }

        await (updatePayoutSettingsServerFn as any)({ data: value })
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      } catch (err) {
        console.error('Update failed:', err)
      }
    },
  })

  return (
    <div className="max-w-2xl space-y-12">
      <div>
        <h2 className="text-4xl font-black italic uppercase tracking-tighter">
          Protocol_<span className="text-neon-cyan">Configuration</span>
        </h2>
        <p className="text-neutral-500 text-[10px] font-black uppercase tracking-[0.4em] mt-2">
          Configure how you receive transmissions (donations) from the grid.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          e.stopPropagation()
          form.handleSubmit()
        }}
        className="space-y-10"
      >
        {/* Donation Mode Selection */}
        <div className="space-y-4">
          <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest flex items-center gap-2">
            <ShieldCheck size={14} className="text-neon-cyan" /> Select
            Transmission Mode
          </label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <form.Field
              name="isStakingEnabled"
              children={(field) => (
                <>
                  <button
                    type="button"
                    onClick={() => field.handleChange(false)}
                    className={`p-6 border text-left transition-all skew-x--5 ${!field.state.value ? 'bg-neon-cyan/10 border-neon-cyan' : 'bg-white/2 border-white/5 hover:border-white/20'}`}
                  >
                    <div className="skew-x-5 space-y-2">
                      <div className="flex justify-between items-center">
                        <span
                          className={`text-[10px] font-black uppercase tracking-widest ${!field.state.value ? 'text-neon-cyan' : 'text-neutral-500'}`}
                        >
                          Direct_P2P
                        </span>
                        {!field.state.value && (
                          <div className="w-2 h-2 rounded-full bg-neon-cyan animate-pulse" />
                        )}
                      </div>
                      <p className="text-[14px] font-bold text-white uppercase italic">
                        Immediate Settlement
                      </p>
                      <p className="text-[9px] text-neutral-500 leading-relaxed uppercase font-bold tracking-tight">
                        Donations are sent directly to your wallet. Zero delay,
                        zero yield.
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => field.handleChange(true)}
                    className={`p-6 border text-left transition-all skew-x--5 ${field.state.value ? 'bg-neon-pink/10 border-neon-pink shadow-[0_0_20px_rgba(255,0,230,0.1)]' : 'bg-white/2 border-white/5 hover:border-white/20'}`}
                  >
                    <div className="skew-x-5 space-y-2">
                      <div className="flex justify-between items-center">
                        <span
                          className={`text-[10px] font-black uppercase tracking-widest ${field.state.value ? 'text-neon-pink' : 'text-neutral-500'}`}
                        >
                          Vault_Staking
                        </span>
                        {field.state.value && (
                          <div className="w-2 h-2 rounded-full bg-neon-pink animate-pulse" />
                        )}
                      </div>
                      <p className="text-[14px] font-bold text-white uppercase italic">
                        3.5% APR Yield
                      </p>
                      <p className="text-[9px] text-neutral-500 leading-relaxed uppercase font-bold tracking-tight">
                        Funds are held in the secure Tipfy Vault (Aave V3). Earn
                        rewards while you stream.
                      </p>
                    </div>
                  </button>
                </>
              )}
            />
          </div>
        </div>

        <div className="p-8 bg-white/2 border border-white/5 space-y-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <Wallet size={80} />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest flex items-center gap-2">
              Receiver Wallet Address
            </label>

            <form.Field
              name="payoutAddress"
              children={(field) => (
                <>
                  <input
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className={`w-full bg-black border ${field.state.meta.errors.length ? 'border-neon-pink' : 'border-white/10'} p-4 font-mono text-xs text-white focus:border-neon-cyan focus:outline-none transition-colors skew-x--5`}
                    placeholder="0x..."
                  />
                  {field.state.meta.errors.length > 0 && (
                    <p className="text-[8px] font-bold text-neon-pink uppercase mt-2 tracking-widest">
                      {field.state.meta.errors.join(', ')}
                    </p>
                  )}
                </>
              )}
            />
          </div>

          <button
            type="submit"
            disabled={form.state.isSubmitting || isTxPending || isConfirming}
            className="w-full py-4 bg-neon-cyan text-black font-black uppercase tracking-[0.3em] italic skew-x--10 hover:bg-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <span className="skew-x-10 flex items-center gap-2">
              {(form.state.isSubmitting || isTxPending || isConfirming) && <Loader2 className="animate-spin" size={16} />}
              {form.state.isSubmitting || isTxPending || isConfirming
                ? 'Syncing_Protocols...'
                : 'Save Configuration'}
            </span>
          </button>

          {success && (
            <p className="text-center text-[10px] font-black text-green-500 uppercase animate-pulse mt-4">
              Transmission protocols updated successfully!
            </p>
          )}
        </div>
      </form>
    </div>
  )
}
