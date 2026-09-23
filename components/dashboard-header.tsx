'use client'

import Link from 'next/link'
import { UserMenu } from '@/components/user-menu'

export function DashboardHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 font-mono text-sm font-semibold tracking-tight">
          <span className="grid size-6 place-items-center rounded-md bg-foreground text-[11px] text-background">
            NS
          </span>
          dns.cool
        </Link>
        <UserMenu />
      </div>
    </header>
  )
}
