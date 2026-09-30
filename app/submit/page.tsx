import type { Metadata } from 'next'
import { DashboardShell } from '@/components/dashboard-shell'
import { SubmitForm } from '@/components/submit-form'

export const metadata: Metadata = {
  title: 'Publish a Vanity NS — dns.cool',
  description:
    'Publish your vanity nameserver pair to the dns.cool showcase. Sign in with GitHub to get verified attribution and a paired discussion thread.',
}

export default function SubmitPage() {
  return (
    <DashboardShell requires="user">
      <SubmitForm />
    </DashboardShell>
  )
}
