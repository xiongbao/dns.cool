import { DashboardShell } from '@/components/dashboard-shell'
import { MySubmissions } from '@/components/my-submissions'

export default function MyPage() {
  return (
    <DashboardShell requires="user">
      <MySubmissions />
    </DashboardShell>
  )
}
