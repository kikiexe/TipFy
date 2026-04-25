import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { db } from '#/db/index'
import { donation } from '#/db/schema'
import { censorMessageServerFn } from '../../../lib/ai-utils'
import { verifyMonadTransaction } from '#/lib/monad-utils'
import { parseEther } from 'viem'
import { TIPFY_VAULT_ADDRESS } from '#/lib/TipFyVaultABI'

const donationSchema = z.object({
  slug: z.string(),
  senderAddress: z.string(),
  senderName: z.string().optional(),
  amount: z.string().regex(/^\d+(\.\d+)?$/, 'Amount must be a numeric string'),
  txHash: z.string(),
  message: z.string().optional(),
})

export const Route = createFileRoute('/api/donation/record')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json()
          const validation = donationSchema.safeParse(body)

          if (!validation.success) {
            return new Response(
              JSON.stringify({ error: 'Invalid input', details: validation.error.format() }),
              { status: 400 },
            )
          }

          const { slug, senderAddress, senderName, amount, txHash, message } = validation.data

          const targetProfile = await db.query.profile.findFirst({
            where: (p, { eq }) => eq(p.slug, slug),
          })

          if (!targetProfile) {
            return new Response(
              JSON.stringify({ error: 'Profile not found' }),
              { status: 404 },
            )
          }

          // Verify transaction on Monad network
          console.log(`[Donation API] Verifying transaction: ${txHash}`)
          const verification = await verifyMonadTransaction(txHash)
          
          if (verification.status !== 'confirmed') {
            return new Response(
              JSON.stringify({ 
                error: `Transaction verification failed: status is ${verification.status}`,
                verification 
              }),
              { status: 400 },
            )
          }

          // Strict Security Check: Verify Destination
          if (verification.to?.toLowerCase() !== TIPFY_VAULT_ADDRESS.toLowerCase()) {
            return new Response(
              JSON.stringify({ error: 'Security Alert: Transaction destination does not match TipFy Vault' }),
              { status: 403 },
            )
          }

          // Strict Security Check: Verify Amount
          const expectedAmountWei = parseEther(amount)
          if (BigInt(verification.value || 0) < expectedAmountWei) {
            return new Response(
              JSON.stringify({ error: 'Security Alert: Transaction value is less than reported donation amount' }),
              { status: 403 },
            )
          }

          let filteredMessage = message
          if (message) {
            try {
              const result = await (censorMessageServerFn as any)({
                data: { message },
              })
              filteredMessage = result.censored
            } catch (err) {
              console.error('[AI Shield] Failed:', err)
            }
          }

          const donationData = {
            profileId: targetProfile.id,
            senderAddress: senderAddress,
            senderName: senderName || 'Anonymous',
            amount: amount,
            txHash: txHash,
            message: filteredMessage,
            currency: 'MON',
            status: verification.status,
            blockNumber: verification.blockNumber,
          }

          const [newDonation] = await db
            .insert(donation)
            .values(donationData)
            .returning()

          // Robust Alert Delivery via central utility
          try {
            const { publishDonationAlert } = await import('#/lib/ably-utils')
            await publishDonationAlert(targetProfile.walletAddress, newDonation)
          } catch (ablyErr) {
            console.error('[Ably] Publish failed, alert not sent:', ablyErr)
            // Note: We still return success as the donation is recorded in DB
          }

          return new Response(JSON.stringify({ ok: true, donation: newDonation }), {
            headers: { 'Content-Type': 'application/json' },
          })
        } catch (e: any) {
          console.error('[Donation API] Error:', e)
          return new Response(JSON.stringify({ error: e.message }), {
            status: 500,
          })
        }
      },
    },
  },
})
