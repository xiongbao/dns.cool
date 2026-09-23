'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useTransition,
  type ReactNode,
} from 'react'
import {
  createEntry,
  deleteEntry as deleteEntryAction,
  reverifyEntry as reverifyEntryAction,
  toggleVote as toggleVoteAction,
  updateEntry as updateEntryAction,
  type EntryPatch,
} from '@/app/actions/entries'
import {
  adminDeleteEntry,
  setFeatured as setFeaturedAction,
  setStatus as setStatusAction,
} from '@/app/actions/admin'
import { authClient } from '@/lib/auth-client'
import type {
  CurrentUser,
  EntryStatus,
  FeedTab,
  NewSubmission,
  NsEntry,
  UserRole,
} from './types'

export type { NewSubmission }

export type ViewRole = 'guest' | 'user' | 'admin'

const DEMO_USER: CurrentUser = {
  id: 'demo-user',
  name: 'Demo Maintainer',
  username: 'demo-maintainer',
  avatarUrl: '',
  role: 'user',
}

const DEMO_ADMIN: CurrentUser = {
  id: 'demo-admin',
  name: 'Demo Admin',
  username: 'demo-admin',
  avatarUrl: '',
  role: 'admin',
}

type StoreValue = {
  entries: NsEntry[]
  votedIds: Set<string>
  currentUser: CurrentUser | null
  realUser: CurrentUser | null
  viewRole: ViewRole
  isDemo: boolean
  repo: string
  setViewRole: (role: ViewRole) => void
  toggleVote: (id: string) => void
  addEntry: (submission: NewSubmission) => Promise<NsEntry>
  updateEntry: (id: string, patch: EntryPatch) => Promise<void>
  deleteEntry: (id: string) => Promise<void>
  reverifyEntry: (id: string) => Promise<void>
  setFeatured: (id: string, featured: boolean) => Promise<void>
  setStatus: (id: string, status: EntryStatus) => Promise<void>
  findDuplicate: (nameservers: string[]) => NsEntry | undefined
  myEntries: NsEntry[]
  getBySlug: (slug: string) => NsEntry | undefined
  rankOf: (id: string) => number
  signIn: () => Promise<void>
  signOut: () => Promise<void>
}

const StoreContext = createContext<StoreValue | null>(null)

async function signInWithGitHub() {
  await authClient.signIn.social({ provider: 'github', callbackURL: '/' })
}

/** Sorted, lowercased signature so `ns1+ns2` matches `ns2+ns1`. */
export function nsSignature(nameservers: string[]) {
  return nameservers
    .map((ns) => ns.trim().toLowerCase())
    .filter(Boolean)
    .sort()
    .join('|')
}

function defaultViewRole(user: CurrentUser | null): ViewRole {
  if (!user) return 'guest'
  return user.role === 'admin' ? 'admin' : 'user'
}

const VIEW_ROLE_KEY = 'dns-cool:view-role'

function readStoredViewRole(): ViewRole | null {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem(VIEW_ROLE_KEY)
  return raw === 'guest' || raw === 'user' || raw === 'admin' ? raw : null
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
  const [viewRole, setViewRoleState] = useState<ViewRole>(() =>
    defaultViewRole(currentUser),
  )
  const [, startTransition] = useTransition()

  // Restore a previewed role after a full navigation (each page is a fresh
  // client tree, so useState alone would reset the toggle to its default).
  useEffect(() => {
    const stored = readStoredViewRole()
    if (stored) setViewRoleState(stored)
  }, [])

  const setViewRole = useCallback((role: ViewRole) => {
    setViewRoleState(role)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(VIEW_ROLE_KEY, role)
    }
  }, [])

  const realUser = currentUser
  const isDemo =
    !realUser || defaultViewRole(realUser) !== viewRole
      ? viewRole !== 'guest'
      : false

  // The user the UI should present. Falls back to a demo persona when the
  // role toggle previews a state the real session doesn't cover.
  const effectiveUser = useMemo<CurrentUser | null>(() => {
    if (viewRole === 'guest') return null
    const wanted: UserRole = viewRole === 'admin' ? 'admin' : 'user'
    if (realUser && (realUser.role === wanted || wanted === 'user')) {
      return { ...realUser, role: wanted }
    }
    return wanted === 'admin' ? DEMO_ADMIN : DEMO_USER
  }, [viewRole, realUser])

  const patchLocal = useCallback((id: string, patch: Partial<NsEntry>) => {
    setEntries((list) =>
      list.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)),
    )
  }, [])

  const toggleVote = useCallback(
    (id: string) => {
      if (!effectiveUser) {
        void signInWithGitHub()
        return
      }
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
          patchLocal(id, { votes })
        } catch {
          setVotedIds((prev) => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
          })
        }
      })
    },
    [effectiveUser, patchLocal],
  )

  const addEntry = useCallback(async (submission: NewSubmission) => {
    const entry = await createEntry(submission)
    setEntries((list) => [entry, ...list.filter((e) => e.id !== entry.id)])
    return entry
  }, [])

  // Management mutations apply optimistically so the role-preview demo stays
  // responsive, then sync to the server (which enforces the real permissions).
  const updateEntry = useCallback(
    async (id: string, patch: EntryPatch) => {
      patchLocal(id, patch as Partial<NsEntry>)
      try {
        const row = await updateEntryAction(id, patch)
        patchLocal(id, row)
      } catch (err) {
        console.log('[v0] updateEntry sync skipped:', (err as Error)?.message)
      }
    },
    [patchLocal],
  )

  const deleteEntry = useCallback(async (id: string) => {
    setEntries((list) => list.filter((e) => e.id !== id))
    try {
      await deleteEntryAction(id)
    } catch (err) {
      console.log('[v0] deleteEntry sync skipped:', (err as Error)?.message)
    }
  }, [])

  const reverifyEntry = useCallback(
    async (id: string) => {
      patchLocal(id, { verified: true, status: 'active' })
      try {
        const row = await reverifyEntryAction(id)
        patchLocal(id, row)
      } catch (err) {
        console.log('[v0] reverifyEntry sync skipped:', (err as Error)?.message)
      }
    },
    [patchLocal],
  )

  const setFeatured = useCallback(
    async (id: string, featured: boolean) => {
      patchLocal(id, { featured })
      try {
        await setFeaturedAction(id, featured)
      } catch (err) {
        console.log('[v0] setFeatured sync skipped:', (err as Error)?.message)
      }
    },
    [patchLocal],
  )

  const setStatus = useCallback(
    async (id: string, status: EntryStatus) => {
      patchLocal(id, { status, verified: status === 'active' })
      try {
        await setStatusAction(id, status)
      } catch (err) {
        console.log('[v0] setStatus sync skipped:', (err as Error)?.message)
      }
    },
    [patchLocal],
  )

  const ranked = useMemo(
    () => [...entries].sort((a, b) => b.votes - a.votes).map((e) => e.id),
    [entries],
  )

  const myEntries = useMemo(() => {
    if (!effectiveUser) return []
    const owned = entries.filter((e) => e.userId === effectiveUser.id)
    // In a demo persona there is no real owned data — surface a representative
    // slice so the dashboard can be previewed.
    if (owned.length === 0 && effectiveUser.id.startsWith('demo-')) {
      return entries.slice(0, 3)
    }
    return owned
  }, [entries, effectiveUser])

  const value = useMemo<StoreValue>(
    () => ({
      entries,
      votedIds,
      currentUser: effectiveUser,
      realUser,
      viewRole,
      isDemo,
      repo,
      setViewRole,
      toggleVote,
      addEntry,
      updateEntry,
      deleteEntry,
      reverifyEntry,
      setFeatured,
      setStatus,
      findDuplicate: (nameservers) => {
        const sig = nsSignature(nameservers)
        if (!sig) return undefined
        return entries.find((e) => nsSignature(e.nameservers) === sig)
      },
      myEntries,
      getBySlug: (slug) => entries.find((e) => e.slug === slug),
      rankOf: (id) => ranked.indexOf(id) + 1,
      signIn: signInWithGitHub,
      signOut: async () => {
        try {
          await authClient.signOut()
        } catch (err) {
          console.log('[v0] signOut error:', (err as Error)?.message)
        }
        window.location.assign('/')
      },
    }),
    [
      entries,
      votedIds,
      effectiveUser,
      realUser,
      viewRole,
      isDemo,
      repo,
      toggleVote,
      addEntry,
      updateEntry,
      deleteEntry,
      reverifyEntry,
      setFeatured,
      setStatus,
      myEntries,
      ranked,
    ],
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
  const pinFeatured = (a: NsEntry, b: NsEntry) =>
    Number(b.featured) - Number(a.featured)

  switch (tab) {
    case 'latest':
      return list.sort(
        (a, b) =>
          pinFeatured(a, b) || +new Date(b.createdAt) - +new Date(a.createdAt),
      )
    case 'hall-of-fame':
      return list
        .filter((e) => e.verified && e.votes >= 150)
        .sort((a, b) => pinFeatured(a, b) || b.votes - a.votes)
    case 'trending':
    default: {
      const score = (e: NsEntry) => {
        const ageHours = (Date.now() - +new Date(e.createdAt)) / HOURS
        return e.votes / Math.pow(ageHours + 2, 1.2)
      }
      return list.sort((a, b) => pinFeatured(a, b) || score(b) - score(a))
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
