'use client'

import { useMemo } from 'react'
import { SearchX } from 'lucide-react'
import { NsCard } from '@/components/ns-card'
import { matchesQuery, sortForTab, useStore } from '@/lib/store'
import type { FeedTab } from '@/lib/types'

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

export function ShowcaseFeed({ tab, query }: { tab: FeedTab; query: string }) {
  const { entries, rankOf } = useStore()

  const visible = useMemo(
    () => sortForTab(entries, tab).filter((e) => matchesQuery(e, query)),
    [entries, tab, query],
  )

  const heading = HEADINGS[tab]

  return (
    <section
      aria-labelledby="feed-heading"
      className="mx-auto w-full max-w-7xl px-4 pb-24 sm:px-6"
    >
      <div className="flex flex-col gap-1 py-8 sm:flex-row sm:items-end sm:justify-between">
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
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
