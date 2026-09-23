'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowUpRight, Globe, MessageSquare } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { SiteHeader } from '@/components/site-header'
import { SubmitDialog } from '@/components/submit-dialog'
import { CopyButton } from '@/components/copy-button'
import { VoteButton } from '@/components/vote-button'
import { AvailabilityTag, StatusChip } from '@/components/ns-card'
import { GitHubIcon } from '@/components/github-icon'
import { useStore } from '@/lib/store'

export function NsDetail({ slug }: { slug: string }) {
  const { getBySlug, rankOf, repo } = useStore()
  const [submitOpen, setSubmitOpen] = useState(false)
  const entry = getBySlug(slug)

  return (
    <div className="relative flex min-h-dvh flex-col">
      <div
        aria-hidden="true"
        className="grid-paper pointer-events-none absolute inset-x-0 top-0 -z-10 h-72"
      />
      <SiteHeader onSubmit={() => setSubmitOpen(true)} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-8 pb-24 sm:px-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Back to showcase
        </Link>

        {!entry ? (
          <NotFound />
        ) : (
          <article className="mt-8 flex flex-col gap-10">
            <header className="flex flex-col gap-5">
              <div className="flex flex-wrap items-center gap-2">
                <StatusChip verified={entry.verified} />
                <span className="font-mono text-xs text-muted-foreground tabular-nums">
                  Rank #{String(rankOf(entry.id)).padStart(2, '0')}
                </span>
                <span className="text-muted-foreground" aria-hidden="true">
                  ·
                </span>
                <AvailabilityTag isPublic={entry.availability === 'public'} />
              </div>

              <div className="flex flex-col gap-1">
                {entry.nameservers.map((ns, i) => (
                  <h1
                    key={ns}
                    className={
                      i === 0
                        ? 'font-mono text-3xl font-semibold tracking-tight text-balance sm:text-5xl'
                        : 'font-mono text-3xl font-semibold tracking-tight text-foreground/60 text-balance sm:text-5xl'
                    }
                  >
                    {ns}
                  </h1>
                ))}
              </div>

              <p className="max-w-2xl text-base leading-relaxed text-foreground/85 text-pretty sm:text-lg">
                {entry.description}
              </p>

              <div className="flex flex-wrap items-center gap-2">
                <VoteButton entryId={entry.id} votes={entry.votes} size="lg" />
                <CopyButton
                  value={entry.nameservers.join('\n')}
                  size="default"
                  className="h-10 px-4"
                />
                <Button
                  variant="outline"
                  className="h-10 px-4"
                  nativeButton={false}
                  render={
                    <a href={entry.discussionUrl} target="_blank" rel="noreferrer" />
                  }
                >
                  <GitHubIcon className="size-4" data-icon="inline-start" />
                  {entry.discussionNumber
                    ? `Open Discussion #${entry.discussionNumber} on GitHub`
                    : 'Open Discussions on GitHub'}
                  <ArrowUpRight data-icon="inline-end" />
                </Button>
              </div>
            </header>

            {entry.availability === 'public' && (
              <aside
                aria-label="Public access guidance"
                className="flex flex-col gap-4 rounded-xl border border-open/30 bg-open/6 p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex gap-3">
                  <span
                    aria-hidden="true"
                    className="mt-1.5 size-2 shrink-0 rounded-full bg-open"
                  />
                  <div>
                    <h2 className="font-medium">
                      Want to point your domains to this NS?
                    </h2>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground text-pretty">
                      Jump into GitHub Discussion #{entry.discussionNumber} to
                      request authorization or read the connection rules set by
                      @{entry.owner.username}.
                    </p>
                  </div>
                </div>
                <Button
                  className="shrink-0 bg-open text-open-foreground hover:bg-open/90"
                  nativeButton={false}
                  render={
                    <a
                      href={entry.discussionUrl}
                      target="_blank"
                      rel="noreferrer"
                    />
                  }
                >
                  Request via GitHub Discussion
                  <ArrowUpRight data-icon="inline-end" />
                </Button>
              </aside>
            )}

            <div className="grid gap-6 md:grid-cols-[1fr_320px]">
              <section
                aria-labelledby="domains-heading"
                className="rounded-xl border border-border bg-card p-5"
              >
                <div className="flex items-center justify-between">
                  <h2 id="domains-heading" className="flex items-center gap-2 font-medium">
                    <Globe className="size-4 text-muted-foreground" />
                    Powered domains
                  </h2>
                  <span className="font-mono text-xs text-muted-foreground tabular-nums">
                    {entry.domains.length}
                  </span>
                </div>
                {entry.domains.length ? (
                  <ul className="mt-4 divide-y divide-border">
                    {entry.domains.map((domain) => (
                      <li
                        key={domain}
                        className="flex items-center justify-between gap-3 py-2.5"
                      >
                        <span className="font-mono text-sm">{domain}</span>
                        <span className="font-mono text-[11px] text-muted-foreground">
                          NS → {entry.nameservers[0]}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-4 text-sm text-muted-foreground">
                    No showcased domains listed yet.
                  </p>
                )}
              </section>

              <div className="flex flex-col gap-4">
                <section
                  aria-labelledby="owner-heading"
                  className="rounded-xl border border-border bg-card p-5"
                >
                  <h2 id="owner-heading" className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    Owner
                  </h2>
                  <div className="mt-3 flex items-center gap-3">
                    <Avatar size="lg">
                      <AvatarImage src={entry.owner.avatarUrl} alt="" />
                      <AvatarFallback>
                        {entry.owner.username.slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate font-mono text-sm font-medium">
                        @{entry.owner.username}
                      </p>
                      <a
                        href={`https://github.com/${entry.owner.username}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                      >
                        <GitHubIcon className="size-3" />
                        GitHub profile
                        <ArrowUpRight className="size-3" />
                      </a>
                    </div>
                  </div>
                </section>

                <section
                  aria-labelledby="thread-heading"
                  className="rounded-xl border border-border bg-card p-5"
                >
                  <h2 id="thread-heading" className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    Discussion thread
                  </h2>
                  <dl className="mt-3 flex flex-col gap-2 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <dt className="text-muted-foreground">Repository</dt>
                      <dd className="truncate font-mono text-xs">{repo}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <dt className="text-muted-foreground">Thread</dt>
                      <dd className="font-mono text-xs">#{entry.discussionNumber}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <dt className="text-muted-foreground">Comments</dt>
                      <dd className="inline-flex items-center gap-1 font-mono text-xs tabular-nums">
                        <MessageSquare className="size-3" />
                        {entry.comments}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <dt className="text-muted-foreground">Published</dt>
                      <dd className="font-mono text-xs">
                        {new Date(entry.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </dd>
                    </div>
                  </dl>
                </section>
              </div>
            </div>
          </article>
        )}
      </main>
      <SubmitDialog open={submitOpen} onOpenChange={setSubmitOpen} />
    </div>
  )
}

function NotFound() {
  return (
    <div className="mt-16 flex flex-col items-center gap-3 text-center">
      <p className="font-mono text-sm text-muted-foreground">NXDOMAIN</p>
      <h1 className="text-2xl font-semibold tracking-tight">
        This nameserver isn&apos;t listed
      </h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        It may have been removed, or the link is wrong.
      </p>
      <Button className="mt-2" nativeButton={false} render={<Link href="/" />}>
        Back to showcase
      </Button>
    </div>
  )
}
