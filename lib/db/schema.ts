import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core'

// ─── Better Auth tables ──────────────────────────────────────────────
// Column names are camelCase to match Better Auth's defaults. Do not rename.

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('emailVerified').notNull().default(false),
  image: text('image'),
  role: text('role').notNull().default('user'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expiresAt').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
})

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('accountId').notNull(),
  providerId: text('providerId').notNull(),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('accessToken'),
  refreshToken: text('refreshToken'),
  idToken: text('idToken'),
  accessTokenExpiresAt: timestamp('accessTokenExpiresAt'),
  refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expiresAt').notNull(),
  createdAt: timestamp('createdAt').defaultNow(),
  updatedAt: timestamp('updatedAt').defaultNow(),
})

// ─── App tables ──────────────────────────────────────────────────────

export const nsEntries = pgTable('ns_entries', {
  id: text('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  nameservers: text('nameservers').array().notNull(),
  description: text('description').notNull().default(''),
  domains: text('domains').array().notNull().default([]),
  availability: text('availability').notNull().default('public'),
  verified: boolean('verified').notNull().default(false),
  status: text('status').notNull().default('pending'),
  featured: boolean('featured').notNull().default(false),
  verificationToken: text('verificationToken'),
  votes: integer('votes').notNull().default(0),
  comments: integer('comments').notNull().default(0),
  discussionNumber: integer('discussionNumber'),
  discussionUrl: text('discussionUrl'),
  ownerUsername: text('ownerUsername').notNull(),
  ownerAvatarUrl: text('ownerAvatarUrl').notNull().default(''),
  userId: text('userId'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
})

export const nsVotes = pgTable(
  'ns_votes',
  {
    id: text('id').primaryKey(),
    entryId: text('entryId').notNull(),
    userId: text('userId').notNull(),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
  },
  (t) => ({
    uniqueVote: unique().on(t.entryId, t.userId),
  }),
)
