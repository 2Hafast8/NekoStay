'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Home, Package, Bell, User } from 'lucide-react'
import { useUser } from '@/hooks/useUser'
import { useNotifications } from '@/hooks/useNotifications'

const tabs = [
  { href: '/dashboard', label: 'Beranda', icon: Home },
  { href: '/booking/new', label: 'Pesanan', icon: Package },
  { href: '/notifications', label: 'Notif', icon: Bell },
  { href: '/profile', label: 'Profil', icon: User },
]

export function BottomTabBar() {
  const pathname = usePathname()
  const { user } = useUser()
  const { unreadCount } = useNotifications(user?.id)

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 sm:hidden">
      <div className="flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/')
          const Icon = tab.icon
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors relative ${
                isActive
                  ? 'text-brand-500'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            >
              <div className="relative">
                <Icon size={20} />
                {tab.label === 'Notif' && unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">{tab.label}</span>
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-brand-500 rounded-b-full" />
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
