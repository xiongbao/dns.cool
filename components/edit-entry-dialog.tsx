'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { TagInput } from '@/components/tag-input'
import type { NsEntry } from '@/lib/types'

const HOSTNAME_RE =
  /^(?=.{1,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i

type Patch = {
  description: string
  domains: string[]
  availability: 'public' | 'private'
}

type Props = {
  entry: NsEntry | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (patch: Patch) => Promise<void>
}

export function EditEntryDialog({ entry, open, onOpenChange, onSave }: Props) {
  const [description, setDescription] = useState('')
  const [domains, setDomains] = useState<string[]>([])
  const [isPublic, setIsPublic] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (entry) {
      setDescription(entry.description)
      setDomains(entry.domains)
      setIsPublic(entry.availability === 'public')
    }
  }, [entry])

  async function handleSave() {
    setSaving(true)
    try {
      await onSave({
        description: description.trim(),
        domains,
        availability: isPublic ? 'public' : 'private',
      })
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !saving && onOpenChange(next)}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg tracking-tight">Edit entry</DialogTitle>
          <DialogDescription>
            {entry?.nameservers.join(' + ')}. Nameservers are immutable — submit a
            new pair to change them.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5 py-1">
          <div className="flex flex-col gap-2">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 160))}
              rows={2}
              className="resize-none"
            />
            <span className="self-end font-mono text-[11px] text-muted-foreground tabular-nums">
              {description.length}/160
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="edit-domains">Showcased / powered domains</Label>
            <TagInput
              id="edit-domains"
              value={domains}
              onChange={setDomains}
              placeholder="maketrash.com, dev.me"
              validate={(tag) => HOSTNAME_RE.test(tag)}
            />
          </div>

          <div className="flex items-start justify-between gap-4 rounded-lg border border-border p-3">
            <div className="flex flex-col gap-0.5">
              <Label htmlFor="edit-availability" className="cursor-pointer">
                {isPublic ? 'Open for Public Use' : 'Private / Showcase Only'}
              </Label>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {isPublic
                  ? 'Others can request access through the Discussion thread.'
                  : 'Listed as a trophy. Access requests are disabled.'}
              </p>
            </div>
            <Switch
              id="edit-availability"
              checked={isPublic}
              onCheckedChange={setIsPublic}
              className="mt-0.5 data-[checked]:bg-open"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 data-icon="inline-start" className="animate-spin" />}
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
