import { createServerFn } from '@tanstack/react-start'
import { eq, and, desc } from 'drizzle-orm'
import crypto from 'node:crypto'
import { z } from 'zod'

export const getOverlayConfigServerFn = createServerFn({
  method: 'GET',
})
  .inputValidator(z.string())
  .handler(async ({ data: type }: { data: string }) => {
    const { getOverlayConfig } = await import('./db-actions.server')
    const config = await getOverlayConfig(type)
    return config ? (config as any) : undefined
  })

export const getPublicOverlayConfigServerFn = createServerFn({
  method: 'GET',
})
  .inputValidator(z.object({ type: z.string(), address: z.string() }))
  .handler(async ({ data: { type, address } }: { data: { type: string, address: string } }) => {
    const { db } = await import('#/db/index')
    const { overlayConfigs, profile } = await import('#/db/schema')

    const userProfile = await db.query.profile.findFirst({
      where: eq(profile.walletAddress, address),
    })
    if (!userProfile) throw new Error('Profile not found')

    const config = await db.query.overlayConfigs.findFirst({
      where: and(
        eq(overlayConfigs.profileId, userProfile.id),
        eq(overlayConfigs.type, type.toUpperCase()),
      ),
    })

    return config ? (config as any) : null
  })

export const getLatestDonationServerFn = createServerFn({
  method: 'GET',
})
  .inputValidator(z.object({ address: z.string() }))
  .handler(async ({ data: { address } }: { data: { address: string } }) => {
    const { db } = await import('#/db/index')
    const { donation, profile } = await import('#/db/schema')

    const userProfile = await db.query.profile.findFirst({
      where: eq(profile.walletAddress, address),
    })
    if (!userProfile) return null

    const latest = await db.query.donation.findFirst({
      where: eq(donation.profileId, userProfile.id),
      orderBy: [desc(donation.createdAt)],
    })

    return latest || null
  })

export const getDonationsServerFn = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ limit: z.number().optional(), offset: z.number().optional() }).optional())
  .handler(async ({ data }: { data?: { limit?: number, offset?: number } }) => {
    const { getDonations } = await import('./db-actions.server')
    return await getDonations(data?.limit, data?.offset)
  })

export const getDashboardStatsServerFn = createServerFn({
  method: 'GET',
}).handler(async (): Promise<any> => {
  const { getDashboardStats } = await import('./db-actions.server')
  return await getDashboardStats()
})

export const saveOverlayConfigServerFn = createServerFn({
  method: 'POST',
})
  .inputValidator(z.object({ type: z.string(), config: z.any(), isEnabled: z.boolean().optional() }))
  .handler(async ({ data: { type, config, isEnabled } }: { data: { type: string, config: any, isEnabled?: boolean } }) => {
    const { saveOverlayConfig } = await import('./db-actions.server')
    return await saveOverlayConfig(type, config, isEnabled)
  })

export const saveVotingServerFn = createServerFn({
  method: 'POST',
})
  .inputValidator(z.object({
    title: z.string(),
    options: z.array(z.string()),
    startDate: z.string(), // Expecting ISO string
    endDate: z.string(),   // Expecting ISO string
  }))
  .handler(async ({ data }: { data: { title: string, options: string[], startDate: string, endDate: string } }) => {
    const { saveVoting } = await import('./db-actions.server')
    const res = await saveVoting(data)
    return res as any
  })

export const getActiveVotingServerFn = createServerFn({
  method: 'GET',
})
  .inputValidator(z.object({ profileId: z.number() }))
  .handler(async ({ data: { profileId } }: { data: { profileId: number } }) => {
    const { getActiveVoting } = await import('./db-actions.server')
    const res = await getActiveVoting(profileId)
    return res ? (res as any) : undefined
  })

export const submitVoteServerFn = createServerFn({
  method: 'POST',
})
  .inputValidator(z.object({ votingId: z.number(), optionIndex: z.number(), voterAddress: z.string() }))
  .handler(async ({ data: { votingId, optionIndex, voterAddress } }: { data: { votingId: number, optionIndex: number, voterAddress: string } }) => {
    const { submitVote } = await import('./db-actions.server')
    return await submitVote(votingId, optionIndex, voterAddress)
  })

export const getVotingResultsServerFn = createServerFn({
  method: 'GET',
})
  .inputValidator(z.object({ votingId: z.number() }))
  .handler(async ({ data: { votingId } }: { data: { votingId: number } }) => {
    const { getVotingResults } = await import('./db-actions.server')
    return await getVotingResults(votingId)
  })

export const getLeaderboardServerFn = createServerFn({
  method: 'GET',
})
  .inputValidator(z.object({ profileId: z.number(), timeRange: z.string(), startDate: z.string().optional() }))
  .handler(async ({ data: { profileId, timeRange, startDate } }: { data: { profileId: number, timeRange: string, startDate?: string } }) => {
    const { getLeaderboardData } = await import('./db-actions.server')
    return await getLeaderboardData(profileId, timeRange, startDate)
  })

export const uploadToBucketServerFn = createServerFn({
  method: 'POST',
}).handler(async (ctx: any): Promise<any> => {
  const formData = ctx.data as FormData
  const file = formData.get('file') as File
  if (!file) throw new Error('No file provided')

  const { Storage } = await import('@google-cloud/storage')
  const { env } = await import('../env')

  console.log('[DEBUG GCS]: Target Bucket ->', env.GCS_BUCKET_NAME)
  console.log('[DEBUG GCS]: Credentials Path ->', env.GOOGLE_APPLICATION_CREDENTIALS)

  const storage = new Storage()
  const bucket = storage.bucket(env.GCS_BUCKET_NAME)

  const uniqueId = crypto.randomUUID()
  const fileName = `${uniqueId}-${file.name.replace(/\s+/g, '_')}`
  const gcsFile = bucket.file(`uploads/${fileName}`)

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  await gcsFile.save(buffer, {
    metadata: { contentType: file.type },
    resumable: false,
  })

  const publicUrl = `https://storage.googleapis.com/${env.GCS_BUCKET_NAME}/uploads/${fileName}`

  return {
    url: publicUrl,
    name: file.name,
  }
})

export const seedDefaultOverlays = async (profileId: number) => {
  try {
    const { db } = await import('#/db/index')
    const { overlayConfigs } = await import('#/db/schema')

    const baseConfig = {
      backgroundColor: '#00000000',
      textColor: '#ffffff',
      highlightColor: '#00f3ff',
      minAmount: 1,
      minTtsAmount: 5,
      minMediaAmount: 10,
      duration: 5000,
      ttsEnabled: true,
      ttsVoice: 'id-ID-Standard-A',
      mediaEnabled: true,
      blockedKeywords: '',
      sounds: [],
      profanityEnabled: true,
      gamblingEnabled: true,
      pinjolEnabled: true,
      saraEnabled: true,
    }

    const ALL_TYPES = [
      'ALERT',
      'SOUNDBOARD',
      'SUBATHON',
      'VOTING',
      'QR_CODE',
      'MILESTONE',
      'LEADERBOARD',
      'RUNNING_TEXT',
      'WHEEL',
    ]

    for (const type of ALL_TYPES) {
      const existing = await db.query.overlayConfigs.findFirst({
        where: and(
          eq(overlayConfigs.profileId, profileId),
          eq(overlayConfigs.type, type),
        ),
      })

      if (!existing) {
        await db.insert(overlayConfigs).values({
          profileId,
          type: type,
          config:
            type === 'MILESTONE'
              ? {
                  ...baseConfig,
                  title: 'Target Donasi',
                  target: 1000,
                  current: 0,
                }
              : type === 'SUBATHON'
                ? {
                    ...baseConfig,
                    initialHours: 1,
                    initialMinutes: 0,
                    initialSeconds: 0,
                    rules: [
                      { amount: 5000, hours: 0, minutes: 1, seconds: 0 },
                      { amount: 10000, hours: 0, minutes: 2, seconds: 30 },
                    ],
                    showBorder: true,
                    fontWeight: '900',
                    fontSize: '64px',
                  }
                : type === 'LEADERBOARD'
                ? { ...baseConfig, title: 'Top Supporters', period: 'alltime' }
                : baseConfig,
        })
      }
    }
  } catch (e) {
    console.error('[Seed Error]:', e)
  }
}
