'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowUpRight,
  Pencil,
  Pin,
  PinOff,
  Search,
  Trash2,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { EditEntryDialog } from '@/components/edit-entry-dialog'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { useStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import type { EntryStatus, NsEntry } from '@/lib/types'

const STATUS_OPTIONS: EntryStatus[] = ['active', 'pending', 'invalid', 'banned']

const STATUS_STYLES: Record<EntryStatus, string> = {
  active: 'bg-open/10 text-open border-open/20',
  pending: 'bg-muted text-muted-foreground border-border',
  invalid: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  banned: 'bg-destructive/10 text-destructive border-destructive/20',
}

export function AdminConsole() {
  const { entries, updateEntry, deleteEntry, setFeatured, setStatus } = useStore()
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<EntryStatus | 'all'>('all')
  const [editing, setEditing] = useState<NsEntry | null>(null)
  const [deleting, setDeleting] = useState<NsEntry | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return entries
      .filter((e) => statusFilter === 'all' || e.status === statusFilter)
      .filter(
        (e) =>
          !q ||
          e.nameservers.some((ns) => ns.toLowerCase().includes(q)) ||
          e.owner.username.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q),
      )
      .sort((a, b) => Number(b.featured) - Number(a.featured))
  }, [entries, query, statusFilter])

  const counts = useMemo(() => {
    const base: Record<string, number> = { all: entries.length }
    for (const s of STATUS_OPTIONS) base[s] = 0
    for (const e of entries) base[e.status] = (base[e.status] ?? 0) + 1
    return base
  }, [entries])

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:py-12">
      <header>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">Admin console</h1>
          <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            {entries.length} entries
          </span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Moderate submissions, pin featured entries, and manage status.
        </p>
      </header>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search NS, owner, description"
            className="pl-8"
            aria-label="Search entries"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1">
          <FilterChip
            active={statusFilter === 'all'}
            onClick={() => setStatusFilter('all')}
            label="All"
            count={counts.all}
          />
          {STATUS_OPTIONS.map((s) => (
            <FilterChip
              key={s}
              active={statusFilter === s}
              onClick={() => setStatusFilter(s)}
              label={s}
              count={counts[s]}
            />
          ))}
        </div>
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-2.5 font-medium">Nameservers</th>
              <th className="px-4 py-2.5 font-medium">Owner</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5 text-right font-medium">Cool</th>
              <th className="px-4 py-2.5 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((entry) => (
              <tr
                key={entry.id}
                className={cn(
                  'border-b border-border last:border-0 transition-colors hover:bg-muted/30',
                  entry.featured && 'bg-primary/[0.03]',
                )}
              >
                <td className="max-w-64 px-4 py-3">
                  <div className="flex items-center gap-2">
                    {entry.featured && (
                      <Pin className="size-3.5 shrink-0 text-primary" aria-label="Featured" />
                    )}
                    <div className="min-w-0 font-mono text-xs">
                      {entry.nameservers.map((ns) => (
                        <div key={ns} className="truncate">
                          {ns}
                        </div>
                      ))}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Avatar size="sm">
                      <AvatarImage src={entry.owner.avatarUrl} alt="" />
                      <AvatarFallback>
                        {entry.owner.username.slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate font-mono text-xs">
                      @{entry.owner.username}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={entry.status}
                    onChange={(e) =>
                      void setStatus(entry.id, e.target.value as EntryStatus)
                    }
                    aria-label={`Status for ${entry.nameservers.join(' + ')}`}
                    className={cn(
                      'rounded-md border px-2 py-1 text-xs font-medium capitalize outline-none',
                      STATUS_STYLES[entry.status],
                    )}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s} className="bg-popover text-foreground">
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3 text-right font-mono tabular-nums">
                  {entry.votes}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => void setFeatured(entry.id, !entry.featured)}
                      aria-label={entry.featured ? 'Unfeature' : 'Feature'}
                      className={entry.featured ? 'text-primary' : undefined}
                    >
                      {entry.featured ? <PinOff /> : <Pin />}
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => setEditing(entry)}
                      aria-label="Edit"
                    >
                      <Pencil />
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      render={<Link href={`/ns/${entry.slug}`} />}
                      nativeButton={false}
                      aria-label="View public page"
                    >
                      <ArrowUpRight />
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => setDeleting(entry)}
                      aria-label="Delete"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-16 text-center text-sm text-muted-foreground">
                  No entries match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <EditEntryDialog
        entry={editing}
        open={Boolean(editing)}
        onOpenChange={(next) => !next && setEditing(null)}
        onSave={async (patch) => {
          if (editing) await updateEntry(editing.id, patch)
        }}
      />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(next) => !next && setDeleting(null)}
        title="Delete this entry?"
        description={`"${deleting?.nameservers.join(' + ')}" and its votes will be permanently removed.`}
        confirmLabel="Delete"
        destructive
        onConfirm={async () => {
          if (deleting) await deleteEntry(deleting.id)
        }}
      />
    </div>
  )
}

function FilterChip({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean
  onClick: () => void
  label: string
  count?: number
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium capitalize transition-colors',
        active
          ? 'bg-foreground text-background'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
      )}
    >
      {label}
      {typeof count === 'number' && (
        <span className={cn('tabular-nums', active ? 'text-background/70' : 'text-muted-foreground/70')}>
          {count}
        </span>
      )}
    </button>
  )
}
