'use client'

import { SiteHeader } from '@/components/site-header'
import { HeroBanner } from '@/components/hero-banner'
import { ShowcaseFeed } from '@/components/showcase-feed'
import { RoleSwitcher } from '@/components/role-switcher'

export function ShowcaseShell() {
  return (
    <div className="relative flex min-h-dvh flex-col">
      <SiteHeader />
      <HeroBanner />
      <main className="flex-1">
        <ShowcaseFeed />
      </main>
      <RoleSwitcher />
    </div>
  )
}
