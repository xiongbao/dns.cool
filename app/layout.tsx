import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { headers } from 'next/headers'
import { TooltipProvider } from '@/components/ui/tooltip'
import { eq } from 'drizzle-orm'
import { StoreProvider } from '@/lib/store'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { user as userTable } from '@/lib/db/schema'
import { listEntries } from '@/app/actions/entries'
import { DISCUSSIONS_REPO } from '@/lib/github'
import type { UserRole } from '@/lib/types'
import './globals.css'

const geistSans = Geist({ subsets: ['latin'], variable: '--font-geist-sans' })
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' })

export const metadata: Metadata = {
  title: 'dns.cool — Vanity nameserver showcase',
  description:
    'A community showcase and voting platform for vanity and custom nameservers. Publish your NS pair, collect Cool votes, and open access requests through GitHub Discussions.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fafbfc' },
    { media: '(prefers-color-scheme: dark)', color: '#12141c' },
  ],
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const [{ entries, votedIds }, session] = await Promise.all([
    listEntries(),
    auth.api.getSession({ headers: await headers() }),
  ])

  let currentUser = null
  if (session?.user) {
    const [row] = await db
      .select({ role: userTable.role })
      .from(userTable)
      .where(eq(userTable.id, session.user.id))
      .limit(1)
    currentUser = {
      id: session.user.id,
      name: session.user.name,
      username: session.user.name,
      avatarUrl: session.user.image ?? '',
      role: (row?.role === 'admin' ? 'admin' : 'user') as UserRole,
    }
  }

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} bg-background`}
    >
      <body className="min-h-dvh font-sans antialiased">
        <TooltipProvider>
          <StoreProvider
            initialEntries={entries}
            initialVotedIds={votedIds}
            currentUser={currentUser}
            repo={DISCUSSIONS_REPO}
          >
            {children}
          </StoreProvider>
        </TooltipProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
