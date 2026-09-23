import { DashboardShell } from '@/components/dashboard-shell'
import { AdminConsole } from '@/components/admin-console'

export default function AdminPage() {
  return (
    <DashboardShell requires="admin">
      <AdminConsole />
    </DashboardShell>
  )
}
