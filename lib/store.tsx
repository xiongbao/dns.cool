'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { seedEntries } from './data'
import type { Availability, FeedTab, NsEntry } from './types'

export type NewSubmission = {
  nameservers: string[]
  description: string
  domains: string[]
  availability: Availability
}

type StoreValue = {
  entries: NsEntry[]
  votedIds: Set<string>
  toggleVote: (id: string) => void
  addEntry: (submission: NewSubmission) => Promise<NsEntry>
  getBySlug: (slug: string) => NsEntry | undefined
  rankOf: (id: string) => number
}

const StoreContext = createContext<StoreValue | null>(null)

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

export function StoreProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<NsEntry[]>(seedEntries)
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set())

  const toggleVote = useCallback((id: string) => {
    setVotedIds((prev) => {
      const next = new Set(prev)
      const hasVoted = next.has(id)
      if (hasVoted) next.delete(id)
      else next.add(id)
      setEntries((list) =>
        list.map((entry) =>
          entry.id === id
            ? { ...entry, votes: entry.votes + (hasVoted ? -1 : 1) }
            : entry,
        ),
      )
      return next
    })
  }, [])

  const addEntry = useCallback(async (submission: NewSubmission) => {
    // Simulates verification + discussion creation latency until the backend is wired.
    await new Promise((resolve) => setTimeout(resolve, 1400))
    const maxDiscussion = Math.max(...entries.map((e) => e.discussionNumber))
    const entry: NsEntry = {
      id: crypto.randomUUID(),
      slug: slugify(submission.nameservers.join('-')),
      nameservers: submission.nameservers,
      description: submission.description,
      domains: submission.domains,
      availability: submission.availability,
      verified: true,
      votes: 1,
      comments: 0,
      discussionNumber: maxDiscussion + 1,
      owner: { username: 'you', avatarUrl: 'https://github.com/ghost.png' },
      createdAt: new Date().toISOString(),
    }
    setEntries((list) => [entry, ...list])
    setVotedIds((prev) => new Set(prev).add(entry.id))
    return entry
  }, [entries])

  const ranked = useMemo(
    () => [...entries].sort((a, b) => b.votes - a.votes).map((e) => e.id),
    [entries],
  )

  const value = useMemo<StoreValue>(
    () => ({
      entries,
      votedIds,
      toggleVote,
      addEntry,
      getBySlug: (slug) => entries.find((e) => e.slug === slug),
      rankOf: (id) => ranked.indexOf(id) + 1,
    }),
    [entries, votedIds, toggleVote, addEntry, ranked],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}

const HOURS = 60 * 60 * 1000

export function sortForTab(entries: NsEntry[], tab: FeedTab): NsEntry[] {
  const list = [...entries]
  switch (tab) {
    case 'latest':
      return list.sort(
        (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
      )
    case 'hall-of-fame':
      return list
        .filter((e) => e.verified && e.votes >= 150)
        .sort((a, b) => b.votes - a.votes)
    case 'trending':
    default: {
      const score = (e: NsEntry) => {
        const ageHours = (Date.now() - +new Date(e.createdAt)) / HOURS
        return e.votes / Math.pow(ageHours + 2, 1.2)
      }
      return list.sort((a, b) => score(b) - score(a))
    }
  }
}

export function matchesQuery(entry: NsEntry, query: string) {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return [
    ...entry.nameservers,
    ...entry.domains,
    entry.description,
    entry.owner.username,
  ].some((field) => field.toLowerCase().includes(q))
}
