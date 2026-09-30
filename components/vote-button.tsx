'use client'

import { Flame } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useStore } from '@/lib/store'

type Props = {
  entryId: string
  votes: number
  size?: 'sm' | 'lg'
  className?: string
}

export function VoteButton({ entryId, votes, size = 'sm', className }: Props) {
  const { votedIds, toggleVote } = useStore()
  const voted = votedIds.has(entryId)

  return (
    <button
      type="button"
      aria-pressed={voted}
      aria-label={voted ? 'Remove your Cool vote' : 'Vote Cool'}
      onClick={() => toggleVote(entryId)}
      className={cn(
        'cursor-pointer group/vote inline-flex items-center gap-1.5 rounded-md border font-medium tabular-nums transition-all select-none active:translate-y-px',
        size === 'sm' ? 'h-7 px-2 text-xs' : 'h-10 px-4 text-sm',
        voted
          ? 'border-fire/40 bg-fire/10 text-fire'
          : 'border-border bg-card text-foreground hover:border-fire/40 hover:text-fire',
        className,
      )}
    >
      <Flame
        className={cn(
          size === 'sm' ? 'size-3.5' : 'size-4',
          // 'transition-transform group-hover/vote:-translate-y-px',
          voted && 'fill-current',
        )}
      />
      <span className="text-muted-foreground group-aria-pressed/vote:text-fire/80">
        {votes.toLocaleString()}
      </span>
    </button>
  )
}
