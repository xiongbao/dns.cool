'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Plus, ShieldCheck, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { TagInput } from '@/components/tag-input'
import { GitHubIcon } from '@/components/github-icon'
import { useStore } from '@/lib/store'
import { DISCUSSIONS_REPO } from '@/lib/types'

const HOSTNAME_RE =
  /^(?=.{1,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SubmitDialog({ open, onOpenChange }: Props) {
  const router = useRouter()
  const { addEntry } = useStore()
  const [nameservers, setNameservers] = useState(['', ''])
  const [description, setDescription] = useState('')
  const [domains, setDomains] = useState<string[]>([])
  const [isPublic, setIsPublic] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function reset() {
    setNameservers(['', ''])
    setDescription('')
    setDomains([])
    setIsPublic(true)
    setError(null)
  }

  function updateNs(index: number, value: string) {
    setNameservers((list) => list.map((ns, i) => (i === index ? value : ns)))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const cleaned = nameservers.map((ns) => ns.trim().toLowerCase()).filter(Boolean)
    if (cleaned.length < 2) {
      setError('Add at least two nameservers.')
      return
    }
    const bad = cleaned.find((ns) => !HOSTNAME_RE.test(ns))
    if (bad) {
      setError(`"${bad}" is not a valid hostname.`)
      return
    }
    if (description.trim().length < 8) {
      setError('Give it a short description (8+ characters).')
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      const entry = await addEntry({
        nameservers: cleaned,
        description: description.trim(),
        domains,
        availability: isPublic ? 'public' : 'private',
      })
      onOpenChange(false)
      reset()
      router.push(`/ns/${entry.slug}`)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (submitting) return
        onOpenChange(next)
        if (!next) reset()
      }}
    >
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-lg">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <DialogHeader>
            <DialogTitle className="text-xl tracking-tight">
              Publish your Vanity NS
            </DialogTitle>
            <DialogDescription>
              Verified entries appear in the feed within minutes. Ownership is
              checked against your domain&apos;s live NS records.
            </DialogDescription>
          </DialogHeader>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-sm font-medium">Nameservers</legend>
            {nameservers.map((ns, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-9 shrink-0 font-mono text-xs text-muted-foreground">
                  NS{i + 1}
                </span>
                <Input
                  value={ns}
                  onChange={(e) => updateNs(i, e.target.value)}
                  placeholder={i === 0 ? 'ns1.dns.dog' : `ns${i + 1}.dns.cat`}
                  aria-label={`Nameserver ${i + 1}`}
                  autoComplete="off"
                  spellCheck={false}
                  className="font-mono"
                  required={i < 2}
                />
                {nameservers.length > 2 && (
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    aria-label={`Remove nameserver ${i + 1}`}
                    onClick={() =>
                      setNameservers((list) => list.filter((_, idx) => idx !== i))
                    }
                  >
                    <X />
                  </Button>
                )}
              </div>
            ))}
            {nameservers.length < 6 && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="w-fit text-muted-foreground"
                onClick={() => setNameservers((list) => [...list, ''])}
              >
                <Plus data-icon="inline-start" />
                Add NS
              </Button>
            )}
          </fieldset>

          <div className="flex flex-col gap-2">
            <Label htmlFor="ns-description">Short description</Label>
            <Textarea
              id="ns-description"
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 160))}
              placeholder="Symmetrical cat & dog dual-stack NS"
              rows={2}
              className="resize-none"
            />
            <span className="self-end font-mono text-[11px] text-muted-foreground tabular-nums">
              {description.length}/160
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="ns-domains">Showcased / powered domains</Label>
            <TagInput
              id="ns-domains"
              value={domains}
              onChange={setDomains}
              placeholder="maketrash.com, dev.me"
              validate={(tag) => HOSTNAME_RE.test(tag)}
            />
            <p className="text-xs text-muted-foreground">
              Press Enter or comma to add a domain.
            </p>
          </div>

          <div className="flex items-start justify-between gap-4 rounded-lg border border-border p-3">
            <div className="flex flex-col gap-0.5">
              <Label htmlFor="ns-availability" className="cursor-pointer">
                {isPublic ? 'Open for Public Use' : 'Private / Showcase Only'}
              </Label>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {isPublic
                  ? 'Others can request to point their domains at your NS through the Discussion thread.'
                  : 'Listed as a trophy. Access requests are disabled.'}
              </p>
            </div>
            <Switch
              id="ns-availability"
              checked={isPublic}
              onCheckedChange={setIsPublic}
              className="mt-0.5 data-[checked]:bg-open"
            />
          </div>

          <div className="flex gap-3 rounded-lg bg-accent px-3 py-2.5 text-accent-foreground">
            <GitHubIcon className="mt-0.5 size-4 shrink-0" />
            <p className="text-xs leading-relaxed">
              Publishing will automatically create a paired thread in{' '}
              <span className="font-mono">{DISCUSSIONS_REPO}</span> GitHub
              Discussions to track discussions &amp; access requests.
            </p>
          </div>

          {error && (
            <p role="alert" className="-mt-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting} className="min-w-52">
              {submitting ? (
                <>
                  <Loader2 data-icon="inline-start" className="animate-spin" />
                  Verifying &amp; creating thread…
                </>
              ) : (
                <>
                  <ShieldCheck data-icon="inline-start" />
                  Verify &amp; Create Discussion
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
