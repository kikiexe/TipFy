import { getCookie } from '@tanstack/react-start/server'
import { db } from '#/db/index'
import { donation, profile, sessions, payoutSettings, overlayConfigs, voting, votes } from '#/db/schema'
import { eq, and, desc, sql, count, countDistinct } from 'drizzle-orm'

export async function saveVoting(data: { title: string, options: string[], startDate: string, endDate: string }) {
  const userContext = await getSessionUser()
  if (!userContext || !userContext.profile) throw new Error('Unauthorized')

  const startAt = new Date(data.startDate)
  const endAt = new Date(data.endDate)

  const existing = await db.query.voting.findFirst({
    where: and(
      eq(voting.profileId, userContext.profile.id),
      eq(voting.isActive, true)
    ),
    orderBy: [desc(voting.createdAt)]
  })

  if (existing) {
    const [res] = await db.update(voting).set({
      title: data.title,
      options: data.options,
      startAt,
      endAt,
    }).where(eq(voting.id, existing.id)).returning()
    return res
  }

  const [res] = await db.insert(voting).values({
    profileId: userContext.profile.id,
    title: data.title,
    options: data.options,
    startAt,
    endAt,
    isActive: true,
  }).returning()

  return res
}

export async function getActiveVoting(profileId: number) {
  return await db.query.voting.findFirst({
    where: and(
      eq(voting.profileId, profileId),
      eq(voting.isActive, true)
    ),
    orderBy: [desc(voting.createdAt)]
  })
}

export async function submitVote(votingId: number, optionIndex: number, voterAddress: string) {
  // Check if already voted
  const existing = await db.query.votes.findFirst({
    where: and(
      eq(votes.votingId, votingId),
      eq(votes.voterAddress, voterAddress)
    )
  })

  if (existing) throw new Error('Already voted')

  return await db.insert(votes).values({
    votingId,
    voterAddress,
    optionIndex,
  })
}

export async function getVotingResults(votingId: number) {
  const result = await db
    .select({
      optionIndex: votes.optionIndex,
      count: count(votes.id),
    })
    .from(votes)
    .where(eq(votes.votingId, votingId))
    .groupBy(votes.optionIndex)

  return result
}

export async function getLeaderboardData(profileId: number, timeRange: string, startDate?: string) {
  let dateFilter = sql`1=1`
  const now = new Date()

  if (timeRange === 'WEEKLY') {
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    dateFilter = sql`${donation.createdAt} >= ${lastWeek}`
  } else if (timeRange === 'MONTHLY') {
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
    dateFilter = sql`${donation.createdAt} >= ${lastMonth}`
  } else if (timeRange === 'YEARLY') {
    const lastYear = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
    dateFilter = sql`${donation.createdAt} >= ${lastYear}`
  } else if (timeRange === 'CUSTOM' && startDate) {
    const start = new Date(startDate)
    dateFilter = sql`${donation.createdAt} >= ${start}`
  }

  const result = await db
    .select({
      senderName: donation.senderName,
      senderAddress: donation.senderAddress,
      totalAmount: sql<string>`sum(cast(${donation.amount} as numeric))`,
    })
    .from(donation)
    .where(and(eq(donation.profileId, profileId), dateFilter))
    .groupBy(donation.senderName, donation.senderAddress)
    .orderBy(desc(sql`sum(cast(${donation.amount} as numeric))`))
    .limit(10)

  return result
}

export async function checkProfileExistence() {
  const sessionId = getCookie('session_id')
  if (!sessionId) return { isAuthenticated: false, hasProfile: false }

  try {
    const now = new Date()
    const res = await db.query.sessions.findFirst({
      where: (s: any, { eq }: any) => eq(s.id, sessionId)
    })

    if (!res || res.expiresAt < now) {
      if (res) {
        await db.delete(sessions).where(eq(sessions.id, sessionId))
      }
      return { isAuthenticated: false, hasProfile: false }
    }

    const userProfile = await db.query.profile.findFirst({
      where: (p: any, { eq }: any) => eq(p.walletAddress, res.walletAddress)
    })

    return { 
      isAuthenticated: true, 
      hasProfile: !!userProfile, 
      walletAddress: res.walletAddress,
      slug: userProfile?.slug
    }
  } catch (e) {
    console.error('[DB Error] checkProfileExistence failed:', e);
    return { isAuthenticated: false, hasProfile: false }
  }
}

export async function getSessionUser() {
  const sessionId = getCookie('session_id')
  if (!sessionId) return null

  const session = await db.query.sessions.findFirst({
    where: eq(sessions.id, sessionId),
  })
  if (!session) return null

  const userProfile = await db.query.profile.findFirst({
    where: eq(profile.walletAddress, session.walletAddress),
  })
  
  return { session, profile: userProfile }
}

export async function getDashboardStats() {
  const userContext = await getSessionUser()
  if (!userContext || !userContext.profile) {
    return { totalEarnings: '0', totalDonations: 0, uniqueWallets: 0 }
  }

  const [stats] = await db
    .select({
      totalEarnings: sql<string>`sum(cast(${donation.amount} as numeric))`,
      totalDonations: count(donation.id),
      uniqueWallets: countDistinct(donation.senderAddress),
    })
    .from(donation)
    .where(eq(donation.profileId, userContext.profile.id))

  return {
    totalEarnings: stats?.totalEarnings || '0',
    totalDonations: stats?.totalDonations || 0,
    uniqueWallets: stats?.uniqueWallets || 0,
  }
}

export async function getDonations() {
  const userContext = await getSessionUser()
  if (!userContext || !userContext.profile) return []

  return await db.query.donation.findMany({
    where: eq(donation.profileId, userContext.profile.id),
    orderBy: [desc(donation.createdAt)],
    limit: 50,
  })
}

export async function getOverlayConfig(type: string) {
  const userContext = await getSessionUser()
  if (!userContext || !userContext.profile) throw new Error('Unauthorized')

  return await db.query.overlayConfigs.findFirst({
    where: and(
      eq(overlayConfigs.profileId, userContext.profile.id),
      eq(overlayConfigs.type, type),
    ),
  })
}

export async function saveOverlayConfig(type: string, config: any, isEnabled?: boolean) {
  const userContext = await getSessionUser()
  if (!userContext || !userContext.profile) throw new Error('Unauthorized')

  const existing = await db.query.overlayConfigs.findFirst({
    where: and(
      eq(overlayConfigs.profileId, userContext.profile.id),
      eq(overlayConfigs.type, type),
    ),
  })

  const updateData: any = {
    config: config,
    updatedAt: new Date(),
  }
  
  if (isEnabled !== undefined) {
    updateData.isEnabled = isEnabled
  }

  if (existing) {
    await db
      .update(overlayConfigs)
      .set(updateData)
      .where(eq(overlayConfigs.id, existing.id))
  } else {
    await db.insert(overlayConfigs).values({
      profileId: userContext.profile.id,
      type: type,
      config: config,
      isEnabled: isEnabled ?? true,
    })
  }

  return { ok: true }
}

export async function getPayoutSettings() {
  const userContext = await getSessionUser()
  if (!userContext) return { isActive: false, payoutAddress: '' }

  const settings = await db.query.payoutSettings.findFirst({
    where: eq(payoutSettings.profileId, userContext.profile?.id || -1),
  })

  return settings || { isActive: false, payoutAddress: '' }
}

export async function updatePayoutSettings(payoutAddress: string, isStakingEnabled?: boolean) {
  const userContext = await getSessionUser()
  if (!userContext || !userContext.profile) throw new Error('Unauthorized')

  const existing = await db.query.payoutSettings.findFirst({
    where: eq(payoutSettings.profileId, userContext.profile.id),
  })

  if (existing) {
    await db
      .update(payoutSettings)
      .set({
        payoutAddress: payoutAddress,
        isStakingEnabled: isStakingEnabled ?? existing.isStakingEnabled,
        isActive: payoutAddress.length === 42,
        updatedAt: new Date(),
      })
      .where(eq(payoutSettings.id, existing.id))
  } else {
    await db.insert(payoutSettings).values({
      profileId: userContext.profile.id,
      payoutAddress: payoutAddress,
      isStakingEnabled: isStakingEnabled ?? false,
      isActive: payoutAddress.length === 42,
    })
  }

  return { ok: true }
}
