'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useUser'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils/dates'
import {
  Bell,
  CheckCircle,
  AlertCircle,
  Info,
  Trash2,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'

export default function NotificationsPage() {
  const supabase = createClient()
  const { user } = useUser()

  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(null)

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (error) throw error
        setNotifications(data || [])
      } catch (err) {
        console.error('Error fetching notifications:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchNotifications()

    if (!user) return

    // Subscribe to realtime notifications
    const channel = supabase
      .channel('notifications-user')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setNotifications((prev) => [payload.new, ...prev])
          } else if (payload.eventType === 'DELETE') {
            setNotifications((prev) =>
              prev.filter((n) => n.id !== payload.old.id)
            )
          }
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [user])

  const handleDelete = async (id) => {
    try {
      setDeleting(id)
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id)

      if (error) throw error
      setNotifications((prev) => prev.filter((n) => n.id !== id))
      toast.success('Notifikasi dihapus')
    } catch (err) {
      toast.error('Gagal menghapus notifikasi')
    } finally {
      setDeleting(null)
    }
  }

  const getIconAndColor = (type) => {
    const iconMap = {
      success: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-950/30' },
      error: { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-950/30' },
      info: { icon: Info, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/30' },
      warning: { icon: AlertCircle, color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-950/30' },
    }
    return iconMap[type] || iconMap.info
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-brand-500" size={40} />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
        Notifikasi
      </h1>
      <p className="text-slate-600 dark:text-slate-400 mb-8">
        Pantau perkembangan pesanan dan laporan kucing Anda
      </p>

      {notifications.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
          <Bell className="mx-auto text-slate-400 mb-4" size={40} />
          <h2 className="font-semibold text-slate-900 dark:text-white mb-2">
            Belum ada notifikasi
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            Notifikasi akan muncul di sini saat ada update tentang pesanan Anda
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notif) => {
            const { icon: Icon, color, bg } = getIconAndColor(notif.type)
            return (
              <div
                key={notif.id}
                className={`${bg} border border-slate-200 dark:border-slate-700 rounded-xl p-5 flex items-start gap-4`}
              >
                <Icon className={`${color} shrink-0 mt-1`} size={20} />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 dark:text-white">
                    {notif.title}
                  </h3>
                  {notif.message && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      {notif.message}
                    </p>
                  )}
                  <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">
                    {formatDate(notif.created_at, 'datetime')}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(notif.id)}
                  disabled={deleting === notif.id}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors shrink-0"
                >
                  {deleting === notif.id ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <Trash2 size={16} />
                  )}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
