'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { UserMenu } from '@/components/user-menu'

export function SiteHeader() {
  return (
    <header>
      <div className="mx-auto flex w-full max-w-3xl items-center gap-3 px-4 pt-10 pb-8 sm:px-6">
        <Link
          href="/"
          className="flex justify-center items-center gap-2 tracking-tight"
        >
          <Image
            src="/logo.svg"
            alt=""
            aria-hidden="true"
            width={28}
            height={28}
            priority
          />
          <div className="text-2xl h-7 uppercase font-main">DNS<span className="hidden">.</span><span className="text-indigo-600">Cool</span></div>
        </Link>

        <div className="ml-auto flex items-center gap-2">
          <Button
            size="sm"
            render={<Link href="/submit" />}
            nativeButton={false}
          >
            <Plus data-icon="inline-start" />
            Submit NS
          </Button>
          <UserMenu />
        </div>
      </div>
    </header>
  )
}
