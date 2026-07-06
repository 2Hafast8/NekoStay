'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useUser } from '@/hooks/useUser'
import {
  LayoutDashboard,
  Package,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Cat,
  MessageSquare,
  User,
  ChevronDown,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'

export function AdminNav() {
  const router = useRouter()
  const pathname = usePathname()
  const { user, profile, signOut } = useUser()
  const [mobileOpen, setMobileOpen] = useState(false)


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
      label: 'Ulasan',
      href: '/admin/reviews',
      icon: MessageSquare,
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
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </div>

        {/* User Dropdown */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700">
          {profile && (
            <DropdownMenu>
              <DropdownMenuTrigger
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-700/60 transition-all duration-200 group border border-slate-700/50"
              >
                <div className="w-8 h-8 rounded-lg bg-brand-500/20 border border-brand-500/30 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-brand-400" />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{profile.full_name}</p>
                  <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-200 transition-colors shrink-0" />
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" sideOffset={8}>
                <DropdownMenuLabel>Admin Panel</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => router.push('/admin/profile')}
                >
                  <User className="w-4 h-4" />
                  Profil Admin
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={async () => {
                    await signOut()
                    toast.success('Berhasil logout')
                    router.push('/login')
                  }}
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
