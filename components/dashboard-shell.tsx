'use client'

import Link from 'next/link'
import { ArrowLeft, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DashboardHeader } from '@/components/dashboard-header'
import { RoleSwitcher } from '@/components/role-switcher'
import { useStore, type ViewRole } from '@/lib/store'

export function DashboardShell({
  requires,
  children,
}: {
  requires: 'user' | 'admin'
  children: React.ReactNode
}) {
  const { currentUser, viewRole, signIn } = useStore()

  const allowed =
    requires === 'admin'
      ? viewRole === 'admin' && currentUser?.role === 'admin'
      : Boolean(currentUser)

  return (
    <div className="relative flex min-h-dvh flex-col">
      <div
        aria-hidden="true"
        className="grid-paper pointer-events-none absolute inset-x-0 top-0 -z-10 h-48"
      />
      <DashboardHeader />
      <main className="flex-1">
        {allowed ? children : <Denied requires={requires} viewRole={viewRole} onSignIn={signIn} />}
      </main>
      <RoleSwitcher />
    </div>
  )
}

function Denied({
  requires,
  viewRole,
  onSignIn,
}: {
  requires: 'user' | 'admin'
  viewRole: ViewRole
  onSignIn: () => void
}) {
  const needsAuth = viewRole === 'guest'
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted">
        <Lock className="size-5 text-muted-foreground" />
      </div>
      <h1 className="mt-4 text-lg font-semibold tracking-tight">
        {needsAuth ? 'Sign in required' : 'Admins only'}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground text-pretty">
        {needsAuth
          ? 'Sign in with GitHub to access your dashboard, or use the role preview below.'
          : requires === 'admin'
            ? 'This area is restricted to administrators. Switch to the Admin preview below to explore it.'
            : 'You need an account to view this page.'}
      </p>
      <div className="mt-5 flex items-center gap-2">
        <Button variant="secondary" render={<Link href="/" />} nativeButton={false}>
          <ArrowLeft data-icon="inline-start" />
          Back to showcase
        </Button>
        {needsAuth && <Button onClick={onSignIn}>Sign in</Button>}
      </div>
    </div>
  )
}
