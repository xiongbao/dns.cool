'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Props = {
  value: string
  label?: string
  size?: 'sm' | 'default'
  variant?: 'outline' | 'secondary' | 'default'
  className?: string
}

export function CopyButton({
  value,
  label = 'Copy NS',
  size = 'sm',
  variant = 'outline',
  className,
}: Props) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  return (
    <Button
      type="button"
      size={size}
      variant={variant}
      onClick={copy}
      className={className}
      aria-live="polite"
    >
      {copied ? <Check data-icon="inline-start" /> : <Copy data-icon="inline-start" />}
      {copied ? 'Copied' : label}
    </Button>
  )
}
