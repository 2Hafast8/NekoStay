'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatDate } from '@/lib/utils/dates'
import { formatRupiah } from '@/lib/utils/format'
import { BookingStatusBadge } from '@/components/booking/BookingStatus'
import { Calendar, Package, Clock, CheckCircle, AlertCircle, Loader2, Eye } from 'lucide-react'
import Link from 'next/link'

export default function AdminDashboardPage() {
  const supabase = createClient()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('Menunggu')

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('bookings')
          .select(`
            *,
            profiles:user_id (id, full_name, phone, email)
          `)
          .order('created_at', { ascending: false })

        if (error) throw error
        setBookings(data || [])
      } catch (err) {
        console.error('Error fetching bookings:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchBookings()

    // Subscribe to realtime changes
    const channel = supabase
      .channel('bookings-admin')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setBookings((prev) => [payload.new, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            setBookings((prev) =>
              prev.map((b) => (b.id === payload.new.id ? payload.new : b))
            )
          }
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [])

  // Filter bookings berdasarkan tab
  const filteredBookings =
    activeTab === 'semua'
      ? bookings
      : bookings.filter((b) => b.status === activeTab)

  // Hitung statistik
  const stats = {
    total: bookings.length,
    menunggu: bookings.filter((b) => b.status === 'Menunggu').length,
    aktif: bookings.filter((b) => b.status === 'Aktif').length,
    selesai: bookings.filter((b) => b.status === 'Selesai').length,
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          Dashboard Admin
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Kelola pesanan penitipan kucing
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-2">
            <Package className="text-blue-500" size={20} />
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Total Pesanan
            </p>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {stats.total}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="text-amber-500" size={20} />
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Menunggu
            </p>
          </div>
          <p className="text-2xl font-bold text-amber-600">{stats.menunggu}</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-2">
            <AlertCircle className="text-green-500" size={20} />
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Aktif
            </p>
          </div>
          <p className="text-2xl font-bold text-green-600">{stats.aktif}</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="text-slate-500" size={20} />
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Selesai
            </p>
          </div>
          <p className="text-2xl font-bold text-slate-600">{stats.selesai}</p>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="border-b border-slate-200 dark:border-slate-700 px-6">
            <TabsList className="h-auto gap-0 bg-transparent p-0 rounded-none">
              <TabsTrigger
                value="semua"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-brand-500 data-[state=active]:bg-transparent"
              >
                Semua
              </TabsTrigger>
              <TabsTrigger
                value="Menunggu"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-brand-500 data-[state=active]:bg-transparent"
              >
                Menunggu
              </TabsTrigger>
              <TabsTrigger
                value="Aktif"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-brand-500 data-[state=active]:bg-transparent"
              >
                Aktif
              </TabsTrigger>
              <TabsTrigger
                value="Selesai"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-brand-500 data-[state=active]:bg-transparent"
              >
                Selesai
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="overflow-x-auto">
            <TabsContent value={activeTab} className="mt-0">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="animate-spin text-brand-500" size={40} />
                </div>
              ) : filteredBookings.length === 0 ? (
                <div className="py-12 text-center">
                  <Package className="mx-auto text-slate-400 mb-3" size={40} />
                  <p className="text-slate-600 dark:text-slate-400">
                    Tidak ada pesanan
                  </p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 dark:text-white">
                        Kucing
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 dark:text-white">
                        Pemilik
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 dark:text-white">
                        Kelas
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 dark:text-white">
                        Tanggal
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 dark:text-white">
                        Total
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 dark:text-white">
                        Status
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-slate-900 dark:text-white">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {filteredBookings.map((booking) => (
                      <tr
                        key={booking.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {booking.cat_photo_url ? (
                              <img
                                src={booking.cat_photo_url}
                                alt={booking.cat_name}
                                className="w-10 h-10 rounded object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded bg-brand-50 dark:bg-brand-950/30 flex items-center justify-center">
                                <span className="text-xs">🐱</span>
                              </div>
                            )}
                            <span className="font-medium text-slate-900 dark:text-white">
                              {booking.cat_name}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <p className="font-medium text-slate-900 dark:text-white">
                              {booking.profiles?.full_name || '-'}
                            </p>
                            <p className="text-slate-500 dark:text-slate-400 text-xs">
                              {booking.profiles?.phone || '-'}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-medium text-slate-900 dark:text-white">
                            {booking.class}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <p className="text-slate-900 dark:text-white">
                              {formatDate(booking.check_in_date)}
                            </p>
                            <p className="text-slate-500 dark:text-slate-400 text-xs">
                              {booking.total_days} hari
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-semibold text-brand-600">
                            {formatRupiah(booking.estimated_total)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <BookingStatusBadge status={booking.status} />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link href={`/admin/bookings/${booking.id}`}>
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1"
                            >
                              <Eye size={16} />
                              <span className="hidden sm:inline">Lihat</span>
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  )
}
