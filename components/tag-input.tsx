'use client'

import { useState, type KeyboardEvent } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  id?: string
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  validate?: (tag: string) => boolean
}

export function TagInput({ id, value, onChange, placeholder, validate }: Props) {
  const [draft, setDraft] = useState('')
  const [invalid, setInvalid] = useState(false)

  function commit() {
    const tag = draft.trim().toLowerCase().replace(/,$/, '')
    if (!tag) return
    if (validate && !validate(tag)) {
      setInvalid(true)
      return
    }
    if (!value.includes(tag)) onChange([...value, tag])
    setDraft('')
    setInvalid(false)
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.nativeEvent.isComposing || e.keyCode === 229) return
    if (e.key === 'Enter' || e.key === ',' || e.key === ' ') {
      e.preventDefault()
      commit()
    } else if (e.key === 'Backspace' && !draft && value.length) {
      onChange(value.slice(0, -1))
    }
  }

  return (
    <div
      className={cn(
        'flex min-h-9 flex-wrap items-center gap-1.5 rounded-md border bg-transparent px-2 py-1.5 transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50',
        invalid ? 'border-destructive' : 'border-input',
      )}
    >
      {value.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 font-mono text-xs"
        >
          {tag}
          <button
            type="button"
            onClick={() => onChange(value.filter((t) => t !== tag))}
            aria-label={`Remove ${tag}`}
            className="rounded-sm text-muted-foreground hover:text-foreground"
          >
            <X className="size-3" />
          </button>
        </span>
      ))}
      <input
        id={id}
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value)
          setInvalid(false)
        }}
        onKeyDown={onKeyDown}
        onBlur={commit}
        placeholder={value.length ? '' : placeholder}
        aria-invalid={invalid || undefined}
        className="min-w-24 flex-1 bg-transparent font-mono text-sm outline-none placeholder:text-muted-foreground"
      />
    </div>
  )
}
