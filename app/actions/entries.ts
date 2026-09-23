'use server'

import { randomUUID } from 'crypto'
import { and, desc, eq, sql } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { account, nsEntries, nsVotes } from '@/lib/db/schema'
import { createDiscussion, DISCUSSIONS_REPO, fetchGithubIdentity } from '@/lib/github'
import { seedEntries } from '@/lib/data'
import type { NewSubmission, NsEntry } from '@/lib/types'

type EntryRow = typeof nsEntries.$inferSelect

function discussionsIndexUrl() {
  return `https://github.com/${DISCUSSIONS_REPO}/discussions`
}

const STATUSES = ['active', 'pending', 'invalid', 'banned'] as const
function normalizeStatus(value: string): NsEntry['status'] {
  return (STATUSES as readonly string[]).includes(value)
    ? (value as NsEntry['status'])
    : 'pending'
}

function toEntry(row: EntryRow): NsEntry {
  return {
    id: row.id,
    slug: row.slug,
    nameservers: row.nameservers,
    description: row.description,
    domains: row.domains,
    availability: row.availability === 'private' ? 'private' : 'public',
    verified: row.verified,
    status: normalizeStatus(row.status),
    featured: row.featured,
    verificationToken: row.verificationToken,
    votes: row.votes,
    comments: row.comments,
    discussionNumber: row.discussionNumber,
    discussionUrl: row.discussionUrl ?? discussionsIndexUrl(),
    owner: { username: row.ownerUsername, avatarUrl: row.ownerAvatarUrl },
    userId: row.userId,
    createdAt: row.createdAt.toISOString(),
  }
}

function slugify(nameservers: string[]) {
  return nameservers
    .join('-')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

async function getSessionUser() {
  const session = await auth.api.getSession({ headers: await headers() })
  return session?.user ?? null
}

async function requireUserId() {
  const user = await getSessionUser()
  if (!user) throw new Error('Unauthorized')
  return user.id
}

/** Insert the curated seed set the first time the table is empty. */
async function seedIfEmpty() {
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(nsEntries)
  if (count > 0) return

  await db
    .insert(nsEntries)
    .values(
      seedEntries.map((e) => ({
        id: e.id,
        slug: e.slug,
        nameservers: e.nameservers,
        description: e.description,
        domains: e.domains,
        availability: e.availability,
        verified: e.verified,
        status: e.verified ? 'active' : 'pending',
        featured: false,
        votes: e.votes,
        comments: e.comments,
        discussionNumber: e.discussionNumber,
        discussionUrl: `https://github.com/${DISCUSSIONS_REPO}/discussions`,
        ownerUsername: e.owner.username,
        ownerAvatarUrl: e.owner.avatarUrl,
        userId: null,
        createdAt: new Date(e.createdAt),
      })),
    )
    .onConflictDoNothing()
}

export async function listEntries(): Promise<{
  entries: NsEntry[]
  votedIds: string[]
}> {
  await seedIfEmpty()
  const rows = await db
    .select()
    .from(nsEntries)
    .orderBy(desc(nsEntries.createdAt))

  const user = await getSessionUser()
  let votedIds: string[] = []
  if (user) {
    const votes = await db
      .select({ entryId: nsVotes.entryId })
      .from(nsVotes)
      .where(eq(nsVotes.userId, user.id))
    votedIds = votes.map((v) => v.entryId)
  }

  return { entries: rows.map(toEntry), votedIds }
}

async function resolveOwner(userId: string, fallbackName: string, fallbackImage: string) {
  const [gh] = await db
    .select({ accessToken: account.accessToken })
    .from(account)
    .where(and(eq(account.userId, userId), eq(account.providerId, 'github')))
    .limit(1)

  if (gh?.accessToken) {
    const identity = await fetchGithubIdentity(gh.accessToken)
    if (identity) {
      return { username: identity.login, avatarUrl: identity.avatarUrl || fallbackImage }
    }
  }
  return { username: fallbackName, avatarUrl: fallbackImage }
}

export async function createEntry(submission: NewSubmission): Promise<NsEntry> {
  // Login is optional: signed-in users get verified GitHub attribution,
  // anonymous submissions are published as pending under "anonymous".
  const user = await getSessionUser()

  const nameservers = submission.nameservers
    .map((ns) => ns.trim().toLowerCase())
    .filter(Boolean)
  if (nameservers.length < 2) throw new Error('At least two nameservers are required.')

  const description = submission.description.trim()
  const owner = user
    ? await resolveOwner(user.id, user.name || 'anonymous', user.image ?? '')
    : { username: 'anonymous', avatarUrl: '' }

  // Ensure a unique slug even when two pairs collide.
  let slug = slugify(nameservers)
  const existing = await db
    .select({ slug: nsEntries.slug })
    .from(nsEntries)
    .where(eq(nsEntries.slug, slug))
    .limit(1)
  if (existing.length) slug = `${slug}-${randomUUID().slice(0, 6)}`

  const discussion = await createDiscussion({
    title: nameservers.join(' + '),
    body: [
      description,
      '',
      `**Nameservers**`,
      ...nameservers.map((ns) => `- \`${ns}\``),
      '',
      submission.domains.length
        ? `**Powered domains**\n${submission.domains.map((d) => `- ${d}`).join('\n')}`
        : '',
      '',
      submission.availability === 'public'
        ? '_Open for public use — request access in this thread._'
        : '_Private / showcase only._',
      '',
      `Submitted by @${owner.username} via dns.cool.`,
    ]
      .filter((line) => line !== undefined)
      .join('\n'),
  })

  // A completed TXT-ownership step (client passes the verification token it
  // proved) promotes the entry to verified/active. Otherwise it stays pending.
  const ownershipProven = Boolean(submission.verificationToken)
  const verified = ownershipProven || Boolean(user)
  const status = verified ? 'active' : 'pending'

  const id = randomUUID()
  const [row] = await db
    .insert(nsEntries)
    .values({
      id,
      slug,
      nameservers,
      description,
      domains: submission.domains,
      availability: submission.availability,
      verified,
      status,
      featured: false,
      verificationToken: submission.verificationToken ?? null,
      votes: 0,
      comments: 0,
      discussionNumber: discussion?.number ?? null,
      discussionUrl: discussion?.url ?? discussionsIndexUrl(),
      ownerUsername: owner.username,
      ownerAvatarUrl: owner.avatarUrl,
      userId: user?.id ?? null,
    })
    .returning()

  revalidatePath('/')
  revalidatePath(`/ns/${slug}`)
  return toEntry(row)
}

export async function toggleVote(
  entryId: string,
): Promise<{ voted: boolean; votes: number }> {
  const userId = await requireUserId()

  const [existing] = await db
    .select({ id: nsVotes.id })
    .from(nsVotes)
    .where(and(eq(nsVotes.entryId, entryId), eq(nsVotes.userId, userId)))
    .limit(1)

  let voted: boolean
  if (existing) {
    await db.delete(nsVotes).where(eq(nsVotes.id, existing.id))
    await db
      .update(nsEntries)
      .set({ votes: sql`GREATEST(${nsEntries.votes} - 1, 0)` })
      .where(eq(nsEntries.id, entryId))
    voted = false
  } else {
    await db
      .insert(nsVotes)
      .values({ id: randomUUID(), entryId, userId })
      .onConflictDoNothing()
    await db
      .update(nsEntries)
      .set({ votes: sql`${nsEntries.votes} + 1` })
      .where(eq(nsEntries.id, entryId))
    voted = true
  }

  const [row] = await db
    .select({ votes: nsEntries.votes })
    .from(nsEntries)
    .where(eq(nsEntries.id, entryId))
    .limit(1)

  revalidatePath('/')
  return { voted, votes: row?.votes ?? 0 }
}

/** Entries owned by the signed-in user, for the /my dashboard. */
export async function getMyEntries(): Promise<NsEntry[]> {
  const userId = await requireUserId()
  const rows = await db
    .select()
    .from(nsEntries)
    .where(eq(nsEntries.userId, userId))
    .orderBy(desc(nsEntries.createdAt))
  return rows.map(toEntry)
}

export type EntryPatch = {
  description?: string
  domains?: string[]
  availability?: 'public' | 'private'
}

/** Owner-scoped metadata edit. Nameservers are immutable by design. */
export async function updateEntry(
  entryId: string,
  patch: EntryPatch,
): Promise<NsEntry> {
  const userId = await requireUserId()

  const set: Partial<typeof nsEntries.$inferInsert> = {}
  if (typeof patch.description === 'string')
    set.description = patch.description.trim()
  if (Array.isArray(patch.domains)) set.domains = patch.domains
  if (patch.availability === 'public' || patch.availability === 'private')
    set.availability = patch.availability

  const [row] = await db
    .update(nsEntries)
    .set(set)
    .where(and(eq(nsEntries.id, entryId), eq(nsEntries.userId, userId)))
    .returning()

  if (!row) throw new Error('Not found')
  revalidatePath('/')
  revalidatePath('/my')
  revalidatePath(`/ns/${row.slug}`)
  return toEntry(row)
}

export async function deleteEntry(entryId: string): Promise<void> {
  const userId = await requireUserId()
  await db
    .delete(nsEntries)
    .where(and(eq(nsEntries.id, entryId), eq(nsEntries.userId, userId)))
  await db.delete(nsVotes).where(eq(nsVotes.entryId, entryId))
  revalidatePath('/')
  revalidatePath('/my')
}

/**
 * Re-run the TXT ownership check. The lookup is simulated (a real DoH query
 * would hit the endorsed domain's `_dns_cool` record) and resolves to active.
 */
export async function reverifyEntry(entryId: string): Promise<NsEntry> {
  const userId = await requireUserId()
  const token = `dc_${randomUUID().replace(/-/g, '').slice(0, 12)}`
  const [row] = await db
    .update(nsEntries)
    .set({ verified: true, status: 'active', verificationToken: token })
    .where(and(eq(nsEntries.id, entryId), eq(nsEntries.userId, userId)))
    .returning()

  if (!row) throw new Error('Not found')
  revalidatePath('/')
  revalidatePath('/my')
  return toEntry(row)
}
