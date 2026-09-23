'use client'

import { useState } from 'react'
import { SiteHeader } from '@/components/site-header'
import { ShowcaseFeed } from '@/components/showcase-feed'
import { SubmitDialog } from '@/components/submit-dialog'
import type { FeedTab } from '@/lib/types'

export function ShowcaseShell() {
  const [tab, setTab] = useState<FeedTab>('trending')
  const [query, setQuery] = useState('')
  const [submitOpen, setSubmitOpen] = useState(false)

  return (
    <div className="relative flex min-h-dvh flex-col">
      <div
        aria-hidden="true"
        className="grid-paper pointer-events-none absolute inset-x-0 top-0 -z-10 h-72"
      />
      <SiteHeader
        tab={tab}
        onTabChange={setTab}
        query={query}
        onQueryChange={setQuery}
        onSubmit={() => setSubmitOpen(true)}
      />
      <main className="flex-1">
        <ShowcaseFeed tab={tab} query={query} />
      </main>
      <SubmitDialog open={submitOpen} onOpenChange={setSubmitOpen} />
    </div>
  )
}
