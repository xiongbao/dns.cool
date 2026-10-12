'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { LayoutGrid, LogOut, Shield } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { GitHubIcon } from '@/components/github-icon'
import { useStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

export function UserMenu() {
  const { currentUser, signIn, signOut } = useStore()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onPointer(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (!currentUser) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => void signIn()}
      >
        <GitHubIcon />
        Sign in
      </Button>
    )
  }

  const initials = currentUser.username.slice(0, 2).toUpperCase()

  return (
    <div ref={ref} className="relative ml-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full outline-none ring-offset-2 ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Avatar size="sm" className="ring-1 ring-border">
          <AvatarImage src={currentUser.avatarUrl} alt="" />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-56 origin-top-right animate-in fade-in zoom-in-95 rounded-xl border border-border bg-popover p-1.5 text-popover-foreground shadow-xl shadow-primary/5 duration-100"
        >
          <div className="flex items-center gap-2.5 px-2.5 py-2">
            <Avatar>
              <AvatarImage src={currentUser.avatarUrl} alt="" />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                @{currentUser.username}
              </p>
              <p className="truncate text-xs capitalize text-muted-foreground">
                {currentUser.role}
              </p>
            </div>
          </div>
          <div className="my-1 h-px bg-border" />

          <MenuLink href="/my" icon={<LayoutGrid className="size-4" />} onSelect={() => setOpen(false)}>
            My submissions
          </MenuLink>
          {/* <MenuLink
            href={`https://github.com/${currentUser.username}`}
            external
            icon={<User className="size-4" />}
            onSelect={() => setOpen(false)}
          >
            GitHub profile
          </MenuLink> */}
          {currentUser.role === 'admin' && (
            <MenuLink
              href="/admin"
              icon={<Shield className="size-4" />}
              onSelect={() => setOpen(false)}
            >
              Admin console
            </MenuLink>
          )}

          <div className="my-1 h-px bg-border" />
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false)
              void signOut()
            }}
            className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm text-destructive transition-colors hover:bg-destructive/10"
          >
            <LogOut className="size-4" />
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}

function MenuLink({
  href,
  external,
  icon,
  children,
  onSelect,
}: {
  href: string
  external?: boolean
  icon: React.ReactNode
  children: React.ReactNode
  onSelect: () => void
}) {
  const className = cn(
    'flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm transition-colors hover:bg-muted',
  )
  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        role="menuitem"
        onClick={onSelect}
        className={className}
      >
        {icon}
        {children}
      </a>
    )
  }
  return (
    <Link href={href} role="menuitem" onClick={onSelect} className={className}>
      {icon}
      {children}
    </Link>
  )
}
