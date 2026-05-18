import { AdminNav } from '@/components/layout/AdminNav'

export default function AdminLayout({ children }) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex">
      <AdminNav />
      <main className="flex-1 ml-0 sm:ml-64">
        <div className="p-4 sm:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
