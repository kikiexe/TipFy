import {
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
  integer,
  index,
  boolean,
  jsonb,
  uuid,
} from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  walletAddress: varchar('wallet_address', { length: 42 }).primaryKey(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  walletAddress: varchar('wallet_address', { length: 42 })
    .notNull()
    .references(() => users.walletAddress),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const profile = pgTable(
  'profile',
  {
    id: serial('id').primaryKey(),
    walletAddress: varchar('wallet_address', { length: 42 })
      .notNull()
      .unique()
      .references(() => users.walletAddress),
    slug: varchar('slug', { length: 50 }).notNull().unique(),
    displayName: varchar('display_name', { length: 100 }),
    avatarUrl: text('avatar_url'),
    bio: text('bio'),
    bannerImage: text('banner_image'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [index('slug_idx').on(table.slug)],
)

export const donation = pgTable('donation', {
  id: serial('id').primaryKey(),
  profileId: integer('profile_id')
    .notNull()
    .references(() => profile.id),
  senderName: text('sender_name').default('Anonymous'),
  message: text('message'),
  amount: varchar('amount', { length: 64 }).notNull(),
  currency: varchar('currency', { length: 10 }).default('MON'),
  txHash: varchar('tx_hash', { length: 66 }).notNull().unique(),
  senderAddress: varchar('sender_address', { length: 42 }),
  status: varchar('status', { length: 20 }).default('pending').notNull(), // 'pending', 'confirmed', 'failed'
  blockNumber: text('block_number'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const payoutSettings = pgTable('payout_settings', {
  id: serial('id').primaryKey(),
  profileId: integer('profile_id')
    .notNull()
    .unique()
    .references(() => profile.id),
  payoutAddress: varchar('payout_address', { length: 42 }).notNull(),
  isActive: boolean('is_active').default(false).notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const overlayConfigs = pgTable('overlay_configs', {
  id: uuid('id').defaultRandom().primaryKey(),
  profileId: integer('profile_id')
    .notNull()
    .references(() => profile.id),
  type: varchar('type', { length: 50 }).notNull(), // 'alert', 'goal', 'leaderboard', 'soundboard', etc.
  isEnabled: boolean('is_enabled').default(true).notNull(),
  config: jsonb('config').notNull(), 
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('overlay_profile_type_idx').on(table.profileId, table.type)
])

export const voting = pgTable('voting', {
  id: serial('id').primaryKey(),
  profileId: integer('profile_id')
    .notNull()
    .references(() => profile.id),
  title: text('title').notNull(),
  options: jsonb('options').notNull(), // ["Option 1", "Option 2"]
  startAt: timestamp('start_at').notNull(),
  endAt: timestamp('end_at').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const votes = pgTable('votes', {
  id: serial('id').primaryKey(),
  votingId: integer('voting_id')
    .notNull()
    .references(() => voting.id),
  voterAddress: varchar('voter_address', { length: 42 }).notNull(),
  optionIndex: integer('option_index').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('voting_voter_idx').on(table.votingId, table.voterAddress)
])
