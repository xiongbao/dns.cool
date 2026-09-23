'use client'

import Link from 'next/link'
import { Flame, Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { UserMenu } from '@/components/user-menu'
import { useStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import type { FeedTab } from '@/lib/types'

const TABS: { value: FeedTab; label: string; icon?: boolean }[] = [
  { value: 'trending', label: 'Trending', icon: true },
  { value: 'latest', label: 'Latest' },
  { value: 'hall-of-fame', label: 'Hall of Fame' },
]

type Props = {
  tab?: FeedTab
  onTabChange?: (tab: FeedTab) => void
  query?: string
  onQueryChange?: (query: string) => void
  onSubmit: () => void
}

export function SiteHeader({
  tab,
  onTabChange,
  query = '',
  onQueryChange,
  onSubmit,
}: Props) {
  const showFeedControls = Boolean(onTabChange)

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-3 px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-baseline gap-2 font-semibold tracking-tight"
        >
          <span className="text-lg">dns.cool</span>
          <span className="rounded border border-border bg-muted px-1 py-px font-mono text-[10px] font-medium tracking-wider text-muted-foreground">
            [BETA]
          </span>
        </Link>

        {showFeedControls && (
          <nav
            aria-label="Feed"
            className="mx-auto hidden items-center gap-1 rounded-lg bg-muted p-1 md:flex"
          >
            {TABS.map((t) => {
              const active = t.value === tab
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => onTabChange?.(t.value)}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex h-7 items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors',
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
        )}

        <div className={cn('flex items-center gap-2', !showFeedControls && 'ml-auto')}>
          {onQueryChange && (
            <div className="relative hidden sm:block">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                value={query}
                onChange={(e) => onQueryChange(e.target.value)}
                placeholder="Search nameservers…"
                aria-label="Search nameservers"
                className="h-8 w-44 pl-8 font-mono text-xs lg:w-56"
              />
            </div>
          )}
          <Button size="sm" onClick={onSubmit}>
            <Plus data-icon="inline-start" />
            Submit NS
          </Button>
          <UserMenu />
        </div>
      </div>

      {showFeedControls && (
        <nav
          aria-label="Feed"
          className="flex items-center gap-1 overflow-x-auto border-t border-border/60 px-4 py-1.5 md:hidden"
        >
          {TABS.map((t) => {
            const active = t.value === tab
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => onTabChange?.(t.value)}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex h-7 shrink-0 items-center gap-1.5 rounded-md px-3 text-sm font-medium',
                  active ? 'bg-muted text-foreground' : 'text-muted-foreground',
                )}
              >
                {t.label}
                {t.icon && <Flame className="size-3.5 text-fire" />}
              </button>
            )
          })}
        </nav>
      )}
    </header>
  )
}
