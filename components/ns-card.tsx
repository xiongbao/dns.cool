'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  ArrowUpRight,
  BadgeCheck,
  Clock,
  Lock,
  MessageSquare,
  RotateCcw,
  FlipHorizontal2Icon
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { CopyButton } from '@/components/copy-button'
import { VoteButton } from '@/components/vote-button'
import { cn } from '@/lib/utils'
import type { NsEntry } from '@/lib/types'

type Props = {
  entry: NsEntry
  rank: number
  index?: number
}

// Maximum tilt in degrees applied at the card edges.
const MAX_TILT = 9

export function NsCard({ entry, rank, index = 0 }: Props) {
  const [flipped, setFlipped] = useState(false)
  const flip = useCallback(() => setFlipped((f) => !f), [])

  // Flip on card click, but never when the click lands on an interactive
  // control inside the card (link, vote, copy, ...).
  const handleCardClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if ((e.target as HTMLElement).closest('a, button, input, select, textarea')) {
        return
      }
      flip()
    },
    [flip],
  )

  const handleCardKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      // Only handle keys when the card surface itself has focus, otherwise
      // inner controls (links, vote, copy) would flip the card too.
      if (e.target !== e.currentTarget) return
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        flip()
      }
    },
    [flip],
  )

  const tiltRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<number | null>(null)
  const reducedMotion = useRef(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => (reducedMotion.current = mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => {
      mq.removeEventListener('change', sync)
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
  }, [])

  const applyTilt = useCallback((rx: number, ry: number) => {
    const el = tiltRef.current
    if (!el) return
    el.style.setProperty('--rx', `${rx.toFixed(2)}deg`)
    el.style.setProperty('--ry', `${ry.toFixed(2)}deg`)
  }, [])

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (reducedMotion.current || e.pointerType === 'touch') return
      const rect = e.currentTarget.getBoundingClientRect()
      const px = (e.clientX - rect.left) / rect.width
      const py = (e.clientY - rect.top) / rect.height
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
      frameRef.current = requestAnimationFrame(() => {
        applyTilt((0.5 - py) * 2 * MAX_TILT, (px - 0.5) * 2 * MAX_TILT)
      })
    },
    [applyTilt],
  )

  const handlePointerEnter = useCallback(() => {
    tiltRef.current?.style.setProperty('--tilt-lift', '1')
  }, [])

  const handlePointerLeave = useCallback(() => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current)
    tiltRef.current?.style.setProperty('--tilt-lift', '0')
    applyTilt(0, 0)
  }, [applyTilt])

  return (
    <article
      className="group perspective-1200 h-60 animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-500"
      style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}
      aria-label={entry.nameservers.join(' and ')}
    >
      {/* Tilt layer: follows the pointer, composes with the flip layer inside it. */}
      <div
        ref={tiltRef}
        role="button"
        tabIndex={0}
        aria-pressed={flipped}
        aria-label="Flip card to see owner and details"
        onClick={handleCardClick}
        onKeyDown={handleCardKeyDown}
        onPointerMove={handlePointerMove}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        className="transform-3d relative h-full w-full cursor-pointer rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50 [transform:rotateY(var(--ry,0deg))_scale(calc(1+var(--tilt-lift,0)*0.02))] [transition:transform_140ms_ease-out] will-change-transform"
      >
        {/* Flip layer */}
        <div
          className={cn(
            'transform-3d relative h-full w-full transition-transform duration-600 [transition-timing-function:cubic-bezier(.2,.8,.2,1)]',
            flipped && 'rotate-y-180',
          )}
        >
          <CardFront entry={entry} rank={rank} hidden={flipped} />
          <CardBack entry={entry} hidden={!flipped} />
        </div>
      </div>
    </article>
  )
}

const faceClass =
  'backface-hidden absolute inset-0 flex flex-col overflow-hidden rounded-xl border border-border bg-card text-card-foreground transition-shadow duration-300 group-hover:shadow-xl group-hover:shadow-primary/5'

function CardFront({
  entry,
  rank,
  hidden,
}: {
  entry: NsEntry
  rank: number
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
      </div>

      <div className="flex flex-1 flex-col justify-center items-center gap-1 px-4">
        {entry.nameservers.map((ns, i) => (
          <p
            key={ns}
            className={cn(
              'truncate font-mono font-semibold tracking-tight text-balance',
              entry.nameservers.length > 2 ? 'text-lg' : 'text-xl sm:text-2xl',
            )}
          >
            {ns}
          </p>
        ))}
      </div>

      {/* <p className="truncate px-4 text-sm text-muted-foreground">
        {entry.description}
      </p> */}

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-secondary mx-3 py-2.5">
        <div className="flex items-center gap-1.5">
          <VoteButton entryId={entry.id} votes={entry.votes} />
          <a
            href={entry.discussionUrl}
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
        <span
          aria-hidden="true"
          className="inline-flex h-7 shrink-0 items-center gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] font-medium text-muted-foreground transition-colors group-hover:text-foreground"
        >
          Details
          <FlipHorizontal2Icon className="size-3.5" />
        </span>
      </div>
    </div>
  )
}

function CardBack({
  entry,
  hidden,
}: {
  entry: NsEntry
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
        <span
          aria-hidden="true"
          className="inline-flex size-6 shrink-0 items-center justify-center rounded-[min(var(--radius-md),10px)] text-muted-foreground transition-colors group-hover:text-foreground"
        >
          <RotateCcw className="size-3 -scale-x-100" />
        </span>
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

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-secondary mx-3 py-2.5">
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
    <span className="inline-flex items-center gap-1 rounded-full bg-primary/8 px-2 py-0.5 text-[11px] font-medium text-primary">
      <BadgeCheck className="size-3" />
      Verified
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
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
