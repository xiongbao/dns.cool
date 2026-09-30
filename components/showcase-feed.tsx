'use client'

import { useMemo, useState } from 'react'
import { Divide, Flame, Search, SearchX } from 'lucide-react'
import { NsCard } from '@/components/ns-card'
import { Input } from '@/components/ui/input'
import { matchesQuery, sortForTab, useStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import type { FeedTab } from '@/lib/types'

const TABS: { value: FeedTab; label: string; icon?: boolean }[] = [
  { value: 'trending', label: 'Trending', icon: true },
  { value: 'latest', label: 'Latest' },
  { value: 'hall-of-fame', label: 'Hall of Fame' },
]

const HEADINGS: Record<FeedTab, { title: string; blurb: string }> = {
  trending: {
    title: 'Trending this week',
    blurb: 'Vanity nameservers gaining Cool votes fastest right now.',
  },
  latest: {
    title: 'Freshly published',
    blurb: 'The newest NS pairs, straight from verification.',
  },
  'hall-of-fame': {
    title: 'Hall of Fame',
    blurb: 'Verified legends with 150+ Cool votes, ranked all-time.',
  },
}

export function ShowcaseFeed() {
  const { entries, rankOf } = useStore()
  const [tab, setTab] = useState<FeedTab>('trending')
  const [query, setQuery] = useState('')

  const visible = useMemo(
    () => sortForTab(entries, tab).filter((e) => matchesQuery(e, query)),
    [entries, tab, query],
  )

  const heading = HEADINGS[tab]

  return (
    <section
      aria-labelledby="feed-heading"
      className="mx-auto w-full max-w-3xl px-4 pb-24 sm:px-6 space-y-8"
    >
      <FeedControls
        tab={tab}
        onTabChange={setTab}
        query={query}
        onQueryChange={setQuery}
      />


      <div className="border-t border-muted flex flex-col gap-1 py-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1
            id="feed-heading"
            className="text-2xl font-semibold tracking-tight text-balance"
          >
            {heading.title}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{heading.blurb}</p>
        </div>
        <p className="font-mono text-xs text-muted-foreground tabular-nums">
          {visible.length} {visible.length === 1 ? 'entry' : 'entries'}
          {query && (
            <>
              {' '}
              matching <span className="text-foreground">&quot;{query}&quot;</span>
            </>
          )}
        </p>
      </div>

      {visible.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-20 text-center">
          <SearchX className="size-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Nothing matches that search yet.
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {visible.map((entry, i) => (
            <li key={`${tab}-${entry.id}`}>
              <NsCard entry={entry} rank={rankOf(entry.id)} index={i} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

type ControlsProps = {
  tab: FeedTab
  onTabChange: (tab: FeedTab) => void
  query: string
  onQueryChange: (query: string) => void
}

function FeedControls({
  tab,
  onTabChange,
  query,
  onQueryChange,
}: ControlsProps) {
  return (
    <div className="pt-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <TabRow tab={tab} onTabChange={onTabChange} className="hidden md:flex" />
        <SearchBox query={query} onQueryChange={onQueryChange} />
      </div>
      <TabRow
        tab={tab}
        onTabChange={onTabChange}
        className="mt-3 flex border-t border-border/60 md:hidden"
      />
    </div>
  )
}

function TabRow({
  tab,
  onTabChange,
  className,
}: Pick<ControlsProps, 'tab' | 'onTabChange'> & { className?: string }) {
  return (
    <nav
      aria-label="Feed"
      className={cn(
        'items-center gap-1 overflow-x-auto rounded-lg bg-muted p-1',
        className,
      )}
    >
      {TABS.map((t) => {
        const active = t.value === tab
        return (
          <button
            key={t.value}
            type="button"
            onClick={() => onTabChange(t.value)}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex h-7 shrink-0 items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors',
              active
                ? 'bg-card text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {t.label}
            {t.icon && (
              <Flame
                className={cn(
                  'size-3.5',
                  active ? 'text-fire' : 'text-muted-foreground',
                )}
              />
            )}
          </button>
        )
      })}
    </nav>
  )
}

function SearchBox({
  query,
  onQueryChange,
}: Pick<ControlsProps, 'query' | 'onQueryChange'>) {
  return (
    <div className="relative w-full sm:w-auto">
      <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder="Search nameservers…"
        aria-label="Search nameservers"
        className="h-8 w-full pl-8 font-mono text-xs sm:w-56"
      />
    </div>
  )
}
