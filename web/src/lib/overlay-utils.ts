import { createServerFn } from '@tanstack/react-start'
import { eq, and, desc } from 'drizzle-orm'
import crypto from 'node:crypto'

export const getOverlayConfigServerFn = createServerFn({
  method: 'GET',
}).handler(async ({ data: { type } }) => {
    const { getOverlayConfig } = await import('./db-actions.server')
    return await getOverlayConfig(type)
  })

export const getPublicOverlayConfigServerFn = createServerFn({
  method: 'GET',
}).handler(async ({ data: { type, address } }) => {
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

    return config || null
  })

export const getLatestDonationServerFn = createServerFn({
  method: 'GET',
}).handler(async ({ data: { address } }) => {
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

export const getDonationsServerFn = createServerFn({ method: 'GET' }).handler(
  async (): Promise<any[]> => {
    const { getDonations } = await import('./db-actions.server')
    return await getDonations()
  },
)

export const getDashboardStatsServerFn = createServerFn({
  method: 'GET',
}).handler(async (): Promise<any> => {
  const { getDashboardStats } = await import('./db-actions.server')
  return await getDashboardStats()
})

export const saveOverlayConfigServerFn = createServerFn({
  method: 'POST',
}).handler(async ({ data: { type, config, isEnabled } }) => {
    const { saveOverlayConfig } = await import('./db-actions.server')
    return await saveOverlayConfig(type, config, isEnabled)
  })

export const saveVotingServerFn = createServerFn({
  method: 'POST',
}).handler(async ({ data }) => {
    const { saveVoting } = await import('./db-actions.server')
    return await saveVoting(data)
  })

export const getActiveVotingServerFn = createServerFn({
  method: 'GET',
}).handler(async ({ data: { profileId } }) => {
    const { getActiveVoting } = await import('./db-actions.server')
    return await getActiveVoting(profileId)
  })

export const submitVoteServerFn = createServerFn({
  method: 'POST',
}).handler(async ({ data: { votingId, optionIndex, voterAddress } }) => {
    const { submitVote } = await import('./db-actions.server')
    return await submitVote(votingId, optionIndex, voterAddress)
  })

export const getVotingResultsServerFn = createServerFn({
  method: 'GET',
}).handler(async ({ data: { votingId } }) => {
    const { getVotingResults } = await import('./db-actions.server')
    return await getVotingResults(votingId)
  })

export const getLeaderboardServerFn = createServerFn({
  method: 'GET',
}).handler(async ({ data: { profileId, timeRange, startDate } }) => {
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

  let storageOptions = {}
  try {
    // If it's a JSON string, parse it. Otherwise, let it be (could be a path in local dev)
    if (env.GOOGLE_APPLICATION_CREDENTIALS.startsWith('{')) {
      storageOptions = { credentials: JSON.parse(env.GOOGLE_APPLICATION_CREDENTIALS) }
    }
  } catch (e) {
    console.error('[GCS Error]: Failed to parse credentials JSON', e)
  }

  const storage = new Storage(storageOptions)
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
