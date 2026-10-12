'use client'

import { useState } from 'react'
import { ChevronUp, Eye, ShieldHalf, User2, UserX } from 'lucide-react'
import { useStore, type ViewRole } from '@/lib/store'
import { cn } from '@/lib/utils'

const ROLES: { value: ViewRole; label: string; icon: typeof User2 }[] = [
  { value: 'guest', label: 'Guest', icon: UserX },
  { value: 'user', label: 'User', icon: User2 },
  { value: 'admin', label: 'Admin', icon: ShieldHalf },
]

export function RoleSwitcher() {
  const { viewRole, setViewRole, isDemo } = useStore()
  const [collapsed, setCollapsed] = useState(false)

  // Development-only affordance: never render in a production build, even if
  // some page still references it.
  if (process.env.NODE_ENV === 'production') return null

  return (
    <div className="fixed bottom-4 left-1/2 z-40 -translate-x-1/2">
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-popover/90 p-2 shadow-lg ring-1 ring-foreground/5 backdrop-blur-md">
        {!collapsed && (
          <>
            <div className="flex items-center gap-1.5 px-1 pt-0.5 text-[11px] font-medium text-muted-foreground">
              <Eye className="size-3" />
              Preview as
              {isDemo && (
                <span className="rounded-full bg-primary/10 px-1.5 py-px text-[10px] font-semibold text-primary">
                  demo
                </span>
              )}
            </div>
            <div
              role="radiogroup"
              aria-label="Preview role"
              className="flex items-center gap-1 rounded-xl bg-muted p-1"
            >
              {ROLES.map(({ value, label, icon: Icon }) => {
                const active = viewRole === value
                return (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setViewRole(value)}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                      active
                        ? 'bg-background text-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    <Icon className="size-3.5" />
                    {label}
                  </button>
                )
              })}
            </div>
          </>
        )}
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="inline-flex items-center gap-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
          aria-expanded={!collapsed}
        >
          <ChevronUp
            className={cn('size-3 transition-transform', collapsed && 'rotate-180')}
          />
          {collapsed ? `Preview: ${viewRole}` : 'Hide'}
        </button>
      </div>
    </div>
  )
}
