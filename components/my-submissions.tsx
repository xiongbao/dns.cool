'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowUpRight,
  Heart,
  MessageSquare,
  Pencil,
  Plus,
  RotateCw,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StatusChip, AvailabilityTag } from '@/components/ns-card'
import { EditEntryDialog } from '@/components/edit-entry-dialog'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { useStore } from '@/lib/store'
import type { NsEntry } from '@/lib/types'

export function MySubmissions() {
  const { myEntries, updateEntry, deleteEntry, reverifyEntry } = useStore()
  const [editing, setEditing] = useState<NsEntry | null>(null)
  const [deleting, setDeleting] = useState<NsEntry | null>(null)
  const [reverifyingId, setReverifyingId] = useState<string | null>(null)

  const totalVotes = myEntries.reduce((sum, e) => sum + e.votes, 0)
  const verifiedCount = myEntries.filter((e) => e.verified).length

  async function handleReverify(id: string) {
    setReverifyingId(id)
    try {
      await reverifyEntry(id)
    } finally {
      setReverifyingId(null)
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:py-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-balance">
            My submissions
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage the vanity nameservers you&apos;ve published.
          </p>
        </div>
        <Button render={<Link href="/submit" />} nativeButton={false}>
          <Plus data-icon="inline-start" />
          New submission
        </Button>
      </header>

      <dl className="mt-6 grid grid-cols-3 gap-3">
        <Stat label="Entries" value={myEntries.length} />
        <Stat label="Verified" value={verifiedCount} />
        <Stat label="Total Cool" value={totalVotes} />
      </dl>

      <div className="mt-6 flex flex-col gap-3">
        {myEntries.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border px-6 py-16 text-center">
            <p className="text-sm text-muted-foreground">
              You haven&apos;t published any nameservers yet.
            </p>
            <Button
              className="mt-4"
              render={<Link href="/submit" />}
              nativeButton={false}
            >
              <Plus data-icon="inline-start" />
              Publish your first NS
            </Button>
          </div>
        ) : (
          myEntries.map((entry) => (
            <article
              key={entry.id}
              className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusChip verified={entry.verified} />
                  {entry.featured && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                      Featured
                    </span>
                  )}
                  <AvailabilityTag isPublic={entry.availability === 'public'} />
                </div>
                <div className="mt-2 flex flex-col font-mono text-sm font-medium">
                  {entry.nameservers.map((ns) => (
                    <span key={ns} className="truncate">
                      {ns}
                    </span>
                  ))}
                </div>
                <p className="mt-1 truncate text-sm text-muted-foreground">
                  {entry.description}
                </p>
                <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground tabular-nums">
                  <span className="inline-flex items-center gap-1">
                    <Heart className="size-3.5" />
                    {entry.votes}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MessageSquare className="size-3.5" />
                    {entry.comments}
                  </span>
                </div>
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                {!entry.verified && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleReverify(entry.id)}
                    disabled={reverifyingId === entry.id}
                  >
                    <RotateCw
                      data-icon="inline-start"
                      className={reverifyingId === entry.id ? 'animate-spin' : undefined}
                    />
                    Re-verify
                  </Button>
                )}
                <Button size="icon-sm" variant="ghost" onClick={() => setEditing(entry)} aria-label="Edit">
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
            </article>
          ))
        )}
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

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-mono text-2xl font-semibold tabular-nums">{value}</dd>
    </div>
  )
}
