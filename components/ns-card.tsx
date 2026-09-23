'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowUpRight,
  BadgeCheck,
  Clock,
  Lock,
  MessageSquare,
  RotateCcw,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { CopyButton } from '@/components/copy-button'
import { VoteButton } from '@/components/vote-button'
import { cn } from '@/lib/utils'
import { discussionUrl, type NsEntry } from '@/lib/types'

type Props = {
  entry: NsEntry
  rank: number
  index?: number
}

export function NsCard({ entry, rank, index = 0 }: Props) {
  const [flipped, setFlipped] = useState(false)
  const flip = () => setFlipped((f) => !f)

  return (
    <article
      className="perspective-1200 h-80 animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-500"
      style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}
      aria-label={entry.nameservers.join(' and ')}
    >
      <div
        className={cn(
          'transform-3d relative h-full w-full transition-transform duration-600 [transition-timing-function:cubic-bezier(.2,.8,.2,1)]',
          flipped && 'rotate-y-180',
        )}
      >
        <CardFront entry={entry} rank={rank} onFlip={flip} hidden={flipped} />
        <CardBack entry={entry} onFlip={flip} hidden={!flipped} />
      </div>
    </article>
  )
}

const faceClass =
  'backface-hidden absolute inset-0 flex flex-col rounded-xl border border-border bg-card text-card-foreground shadow-xs'

function CardFront({
  entry,
  rank,
  onFlip,
  hidden,
}: {
  entry: NsEntry
  rank: number
  onFlip: () => void
  hidden: boolean
}) {
  return (
    <div className={faceClass} aria-hidden={hidden}>
      <div className="flex items-center justify-between gap-2 px-4 pt-3.5">
        <div className="flex items-center gap-2">
          <StatusChip verified={entry.verified} />
          <span className="font-mono text-xs font-medium text-muted-foreground tabular-nums">
            #{String(rank).padStart(2, '0')}
          </span>
        </div>
        <Button
          size="icon-xs"
          variant="ghost"
          onClick={onFlip}
          tabIndex={hidden ? -1 : 0}
          aria-label="Flip card to see owner and details"
        >
          <RotateCcw />
        </Button>
      </div>

      <div className="flex flex-1 flex-col justify-center gap-1 px-4">
        {entry.nameservers.map((ns, i) => (
          <p
            key={ns}
            className={cn(
              'truncate font-mono font-semibold tracking-tight text-balance',
              entry.nameservers.length > 2 ? 'text-lg' : 'text-xl sm:text-2xl',
              i > 0 && 'text-foreground/70',
            )}
          >
            {ns}
          </p>
        ))}
      </div>

      <p className="truncate px-4 text-sm text-muted-foreground">
        {entry.description}
      </p>

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-border px-3 py-2.5">
        <div className="flex items-center gap-1.5">
          <VoteButton entryId={entry.id} votes={entry.votes} />
          <a
            href={discussionUrl(entry.discussionNumber)}
            target="_blank"
            rel="noreferrer"
            tabIndex={hidden ? -1 : 0}
            className="inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-muted-foreground tabular-nums transition-colors hover:bg-muted hover:text-foreground"
            aria-label={`${entry.comments} comments in GitHub Discussion #${entry.discussionNumber}`}
          >
            <MessageSquare className="size-3.5" />
            {entry.comments}
          </a>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={onFlip}
          tabIndex={hidden ? -1 : 0}
          className="text-muted-foreground"
        >
          Details
          <RotateCcw data-icon="inline-end" />
        </Button>
      </div>
    </div>
  )
}

function CardBack({
  entry,
  onFlip,
  hidden,
}: {
  entry: NsEntry
  onFlip: () => void
  hidden: boolean
}) {
  const isPublic = entry.availability === 'public'
  return (
    <div className={cn(faceClass, 'rotate-y-180')} aria-hidden={hidden}>
      <div className="flex items-center justify-between gap-2 px-4 pt-3.5">
        <a
          href={`https://github.com/${entry.owner.username}`}
          target="_blank"
          rel="noreferrer"
          tabIndex={hidden ? -1 : 0}
          className="group/owner flex items-center gap-2"
        >
          <Avatar size="sm">
            <AvatarImage src={entry.owner.avatarUrl} alt="" />
            <AvatarFallback>{entry.owner.username.slice(0, 2)}</AvatarFallback>
          </Avatar>
          <span className="font-mono text-sm font-medium group-hover/owner:underline">
            @{entry.owner.username}
          </span>
        </a>
        <Button
          size="icon-xs"
          variant="ghost"
          onClick={onFlip}
          tabIndex={hidden ? -1 : 0}
          aria-label="Flip card back"
        >
          <RotateCcw className="-scale-x-100" />
        </Button>
      </div>

      <div className="flex flex-1 flex-col gap-3 overflow-hidden px-4 pt-3">
        <p className="line-clamp-3 text-sm leading-relaxed text-foreground/85">
          {entry.description}
        </p>
        <ul className="flex flex-wrap gap-1.5" aria-label="Showcased domains">
          {entry.domains.slice(0, 4).map((domain) => (
            <li
              key={domain}
              className="rounded-md bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground"
            >
              {domain}
            </li>
          ))}
          {entry.domains.length > 4 && (
            <li className="rounded-md px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
              +{entry.domains.length - 4}
            </li>
          )}
        </ul>
        <AvailabilityTag isPublic={isPublic} />
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-border px-3 py-2.5">
        <CopyButton
          value={entry.nameservers.join('\n')}
          className={hidden ? 'pointer-events-none' : undefined}
        />
        <Button
          size="sm"
          variant="secondary"
          render={<Link href={`/ns/${entry.slug}`} />}
          nativeButton={false}
          tabIndex={hidden ? -1 : 0}
        >
          View Details
          <ArrowUpRight data-icon="inline-end" />
        </Button>
      </div>
    </div>
  )
}

export function StatusChip({ verified }: { verified: boolean }) {
  return verified ? (
    <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/8 px-2 py-0.5 text-[11px] font-medium text-primary">
      <BadgeCheck className="size-3" />
      Verified
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
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
        'inline-flex w-fit items-center gap-1.5 rounded-md px-2 py-1 font-mono text-xs font-medium',
        isPublic ? 'bg-open/10 text-open' : 'bg-muted text-muted-foreground',
        className,
      )}
    >
      {isPublic ? (
        <>
          <span className="size-1.5 rounded-full bg-open" aria-hidden="true" />
          Open for Public
        </>
      ) : (
        <>
          <Lock className="size-3" />
          Private Trophy
        </>
      )}
    </span>
  )
}
