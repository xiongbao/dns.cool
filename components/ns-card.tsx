'use client'

import Link from 'next/link'
import {
  BadgeCheck,
  Clock,
  Lock,
  GlobeCheck,
  Flame,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import type { NsEntry } from '@/lib/types'

type Props = {
  entry: NsEntry
  rank: number
  index?: number
}

export function NsCard({ entry, rank, index = 0 }: Props) {

  return (
    <Link
      href={`/ns/${entry.slug}`}
      className="block animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-500 overflow-hidden rounded-xl border border-muted bg-card hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5"
      style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}
      aria-label={entry.nameservers.join(' and ')}
    >
      <Card entry={entry} rank={rank} />
    </Link>
  )
}

function Card({
  entry,
  rank,
}: {
  entry: NsEntry,
  rank: number
}) {
  const isPublic = entry.availability === 'public'
  return (
    <div className="h-60 flex flex-col text-card-foreground">
      <div className="flex items-center justify-between gap-2 px-4 pt-3.5">
        <div className="flex items-center gap-1.5">
          <Avatar size="sm">
            <AvatarImage src={entry.owner.avatarUrl} alt="" />
            <AvatarFallback>{entry.owner.username.slice(0, 2)}</AvatarFallback>
          </Avatar>
          <span className="font-mono text-sm font-medium group-hover/owner:underline">
            {entry.owner.username}
          </span>
        </div>
        <span className="font-mono text-xs font-medium text-muted-foreground tabular-nums">
          #{String(rank).padStart(2, '0')}
        </span>
      </div>

      <div className="flex flex-1 flex-col justify-center items-center gap-1 px-4">
        {entry.nameservers.map((ns, i) => (
          <p
            key={ns}
            className={cn(
              'truncate font-mono font-semibold tracking-tight text-balance',
              entry.nameservers.length > 2 ? 'text-lg' : 'text-xl sm:text-2xl',
              !entry.verified && 'text-muted-foreground',
            )}
          >
            {ns}
          </p>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-secondary mx-3 py-2.5">
        <AvailabilityTag isPublic={isPublic} />
        {entry.verified ? (
          <span
            className="ml-auto inline-flex items-center gap-0.5 text-xs text-muted-foreground"
          >
            <Flame className="size-3.5 -mt-0.5" />
            {entry.votes.toLocaleString()}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">Pending</span>
        )}
      </div>
    </div>
  )
}

export function StatusChip({ verified }: { verified: boolean }) {
  return verified ? (
    <span className="inline-flex items-center gap-1 rounded-full text-[11px] font-medium text-primary">
      <BadgeCheck className="size-3" />
      Verified
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full text-[11px] font-medium text-muted-foreground">
      <Clock className="size-3" />
      Pending
    </span>
  )
}

export function AvailabilityTag({
  isPublic,
  className,
}: {
  isPublic: boolean
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-mono text-xs font-medium text-muted-foreground',
        className,
      )}
    >
      {isPublic ? (
        <>
          <GlobeCheck className="size-3 text-open" />
          Public
        </>
      ) : (
        <>
          <Lock className="size-3" />
          Private
        </>
      )}
    </span>
  )
}
