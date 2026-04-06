import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import Sidebar from '@/components/ui/Sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect('/login')

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar user={session} />
      <main className="flex-1 overflow-y-auto bg-surface-1">
        <div className="max-w-7xl mx-auto p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
