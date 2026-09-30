'use client'

import Image from 'next/image'
import Link from 'next/link'
import { UserMenu } from '@/components/user-menu'

export function DashboardHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-center justify-center gap-2 tracking-tight">
          <Image
            src="/logo.svg"
            alt=""
            aria-hidden="true"
            width={24}
            height={24}
            priority
          />
          <div className="text-xl h-6 uppercase font-main">DNS<span className="hidden">.</span><span className="text-indigo-600">Cool</span></div>
        </Link>
        <UserMenu />
      </div>
    </header>
  )
}
