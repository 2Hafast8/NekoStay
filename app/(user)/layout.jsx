import { Navbar } from '@/components/layout/Navbar'
import { BottomTabBar } from '@/components/layout/BottomTabBar'

export default function UserLayout({ children }) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />
      <main className="pb-20 sm:pb-8">
        {children}
      </main>
      <BottomTabBar />
    </div>
  )
}
