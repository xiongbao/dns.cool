'use server'

import { desc, eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { nsEntries, nsVotes, user as userTable } from '@/lib/db/schema'
import type { EntryStatus, NsEntry } from '@/lib/types'

type EntryRow = typeof nsEntries.$inferSelect

function discussionsIndexUrl() {
  return `https://github.com/${process.env.GITHUB_DISCUSSIONS_REPO ?? 'xiongbao/dns.cool'}/discussions`
}

const STATUSES: EntryStatus[] = ['active', 'pending', 'invalid', 'banned']

function toEntry(row: EntryRow): NsEntry {
  return {
    id: row.id,
    slug: row.slug,
    nameservers: row.nameservers,
    description: row.description,
    domains: row.domains,
    availability: row.availability === 'private' ? 'private' : 'public',
    verified: row.verified,
    status: STATUSES.includes(row.status as EntryStatus)
      ? (row.status as EntryStatus)
      : 'pending',
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

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  const [row] = await db
    .select({ role: userTable.role })
    .from(userTable)
    .where(eq(userTable.id, session.user.id))
    .limit(1)
  if (row?.role !== 'admin') throw new Error('Forbidden')
  return session.user.id
}

export async function listAllEntries(): Promise<NsEntry[]> {
  await requireAdmin()
  const rows = await db
    .select()
    .from(nsEntries)
    .orderBy(desc(nsEntries.featured), desc(nsEntries.createdAt))
  return rows.map(toEntry)
}

export async function setFeatured(
  entryId: string,
  featured: boolean,
): Promise<NsEntry> {
  await requireAdmin()
  const [row] = await db
    .update(nsEntries)
    .set({ featured })
    .where(eq(nsEntries.id, entryId))
    .returning()
  if (!row) throw new Error('Not found')
  revalidatePath('/')
  revalidatePath('/admin')
  return toEntry(row)
}

export async function setStatus(
  entryId: string,
  status: EntryStatus,
): Promise<NsEntry> {
  await requireAdmin()
  if (!STATUSES.includes(status)) throw new Error('Invalid status')
  // Keep the verified flag consistent with the coarse status.
  const verified = status === 'active'
  const [row] = await db
    .update(nsEntries)
    .set({ status, verified })
    .where(eq(nsEntries.id, entryId))
    .returning()
  if (!row) throw new Error('Not found')
  revalidatePath('/')
  revalidatePath('/admin')
  return toEntry(row)
}

export type AdminPatch = {
  description?: string
  domains?: string[]
  availability?: 'public' | 'private'
}

export async function adminUpdateEntry(
  entryId: string,
  patch: AdminPatch,
): Promise<NsEntry> {
  await requireAdmin()
  const set: Partial<typeof nsEntries.$inferInsert> = {}
  if (typeof patch.description === 'string')
    set.description = patch.description.trim()
  if (Array.isArray(patch.domains)) set.domains = patch.domains
  if (patch.availability === 'public' || patch.availability === 'private')
    set.availability = patch.availability

  const [row] = await db
    .update(nsEntries)
    .set(set)
    .where(eq(nsEntries.id, entryId))
    .returning()
  if (!row) throw new Error('Not found')
  revalidatePath('/')
  revalidatePath('/admin')
  return toEntry(row)
}

export async function adminDeleteEntry(entryId: string): Promise<void> {
  await requireAdmin()
  await db.delete(nsEntries).where(eq(nsEntries.id, entryId))
  await db.delete(nsVotes).where(eq(nsVotes.entryId, entryId))
  revalidatePath('/')
  revalidatePath('/admin')
}
