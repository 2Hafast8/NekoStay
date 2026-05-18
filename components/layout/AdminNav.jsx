'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useUser } from '@/hooks/useUser'
import { Button } from '@/components/ui/button'
import {
  LayoutDashboard,
  Package,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Cat,
} from 'lucide-react'
import { toast } from 'sonner'

export function AdminNav() {
  const router = useRouter()
  const { user, profile, signOut } = useUser()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = async () => {
    await signOut()
    toast.success('Berhasil logout')
    router.push('/login')
  }

  const navItems = [
    {
      label: 'Dashboard',
      href: '/admin/dashboard',
      icon: LayoutDashboard,
    },
    {
      label: 'Pesanan',
      href: '/admin/bookings',
      icon: Package,
    },
    {
      label: 'Laporan',
      href: '/admin/reports',
      icon: BarChart3,
    },
    {
      label: 'Pengaturan',
      href: '/admin/settings',
      icon: Settings,
    },
  ]

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-4 left-4 z-50 sm:hidden"
      >
        {mobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <nav
        className={`fixed inset-y-0 left-0 w-64 bg-slate-900 dark:bg-slate-950 text-white transform transition-transform duration-300 z-40 sm:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center">
              <Cat className="text-white" size={20} />
            </div>
            <div>
              <h1 className="font-bold text-lg">NekoStay</h1>
              <p className="text-xs text-slate-400">Admin Panel</p>
            </div>
          </div>
        </div>

        {/* Nav Items */}
        <div className="p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800 transition-colors"
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </div>

        {/* User Info & Logout */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700">
          {profile && (
            <>
              <p className="text-sm font-medium text-white mb-3">
                {profile.full_name}
              </p>
              <Button
                onClick={handleLogout}
                variant="outline"
                className="w-full gap-2 text-slate-300 border-slate-600 hover:bg-slate-800"
              >
                <LogOut size={16} />
                Logout
              </Button>
            </>
          )}
        </div>
      </nav>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 sm:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </>
  )
}
