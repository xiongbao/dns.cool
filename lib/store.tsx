'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useTransition,
  type ReactNode,
} from 'react'
import { createEntry, toggleVote as toggleVoteAction } from '@/app/actions/entries'
import { authClient } from '@/lib/auth-client'
import type {
  CurrentUser,
  FeedTab,
  NewSubmission,
  NsEntry,
} from './types'

export type { NewSubmission }

type StoreValue = {
  entries: NsEntry[]
  votedIds: Set<string>
  currentUser: CurrentUser | null
  repo: string
  toggleVote: (id: string) => void
  addEntry: (submission: NewSubmission) => Promise<NsEntry>
  getBySlug: (slug: string) => NsEntry | undefined
  rankOf: (id: string) => number
  signIn: () => Promise<void>
  signOut: () => Promise<void>
}

const StoreContext = createContext<StoreValue | null>(null)

async function signInWithGitHub() {
  await authClient.signIn.social({ provider: 'github', callbackURL: '/' })
}

export function StoreProvider({
  children,
  initialEntries,
  initialVotedIds,
  currentUser,
  repo,
}: {
  children: ReactNode
  initialEntries: NsEntry[]
  initialVotedIds: string[]
  currentUser: CurrentUser | null
  repo: string
}) {
  const [entries, setEntries] = useState<NsEntry[]>(initialEntries)
  const [votedIds, setVotedIds] = useState<Set<string>>(
    () => new Set(initialVotedIds),
  )
  const [, startTransition] = useTransition()

  const toggleVote = useCallback(
    (id: string) => {
      if (!currentUser) {
        void signInWithGitHub()
        return
      }
      // Optimistic flip; reconcile with the server's authoritative count.
      setVotedIds((prev) => {
        const next = new Set(prev)
        const hadVoted = next.has(id)
        if (hadVoted) next.delete(id)
        else next.add(id)
        setEntries((list) =>
          list.map((entry) =>
            entry.id === id
              ? { ...entry, votes: entry.votes + (hadVoted ? -1 : 1) }
              : entry,
          ),
        )
        return next
      })

      startTransition(async () => {
        try {
          const { voted, votes } = await toggleVoteAction(id)
          setVotedIds((prev) => {
            const next = new Set(prev)
            if (voted) next.add(id)
            else next.delete(id)
            return next
          })
          setEntries((list) =>
            list.map((entry) =>
              entry.id === id ? { ...entry, votes } : entry,
            ),
          )
        } catch {
          // Revert on failure.
          setVotedIds((prev) => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
          })
        }
      })
    },
    [currentUser],
  )

  const addEntry = useCallback(async (submission: NewSubmission) => {
    const entry = await createEntry(submission)
    setEntries((list) => [entry, ...list.filter((e) => e.id !== entry.id)])
    return entry
  }, [])

  const ranked = useMemo(
    () => [...entries].sort((a, b) => b.votes - a.votes).map((e) => e.id),
    [entries],
  )

  const value = useMemo<StoreValue>(
    () => ({
      entries,
      votedIds,
      currentUser,
      repo,
      toggleVote,
      addEntry,
      getBySlug: (slug) => entries.find((e) => e.slug === slug),
      rankOf: (id) => ranked.indexOf(id) + 1,
      signIn: signInWithGitHub,
      signOut: async () => {
        try {
          await authClient.signOut()
        } catch (err) {
          console.log('[v0] signOut error:', (err as Error)?.message)
        }
        // Force a hard navigation so the server re-reads the (now cleared)
        // session cookie and the UI reflects the signed-out state.
        window.location.assign('/')
      },
    }),
    [entries, votedIds, currentUser, repo, toggleVote, addEntry, ranked],
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
