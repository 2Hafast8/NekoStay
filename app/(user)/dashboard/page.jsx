'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useBookings } from '@/hooks/useBookings'
import { BookingList } from '@/components/booking/BookingList'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, TrendingUp } from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('semua')
  const { bookings, loading } = useBookings()

  // Filter bookings berdasarkan status
  const filteredBookings = activeTab === 'semua'
    ? bookings
    : bookings.filter((b) => b.status === activeTab)

  // Hitung statistik
  const activeBookings = bookings.filter((b) => b.status === 'Aktif').length
  const totalSpent = bookings
    .filter((b) => b.status === 'Selesai' || b.status === 'Aktif')
    .reduce((sum, b) => sum + (b.estimated_total || 0), 0)

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              Pesanan Saya
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Kelola pesanan penitipan kucing Anda
            </p>
          </div>
          <Link href="/booking/new">
            <Button className="gap-2">
              <Plus size={18} />
              <span className="hidden sm:inline">Pesanan Baru</span>
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
              Pesanan Aktif
            </p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {activeBookings}
            </p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
              Total Biaya
            </p>
            <p className="text-lg font-bold text-brand-500">
              Rp {totalSpent.toLocaleString('id-ID')}
            </p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 col-span-2 sm:col-span-1">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
              Total Pesanan
            </p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {bookings.length}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="border-b border-slate-200 dark:border-slate-700">
              <TabsList className="w-full h-auto gap-0 bg-transparent p-0 rounded-none">
                <TabsTrigger
                  value="semua"
                  className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-brand-500 data-[state=active]:bg-transparent"
                >
                  Semua
                </TabsTrigger>
                <TabsTrigger
                  value="Menunggu"
                  className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-brand-500 data-[state=active]:bg-transparent"
                >
                  Menunggu
                </TabsTrigger>
                <TabsTrigger
                  value="Aktif"
                  className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-brand-500 data-[state=active]:bg-transparent"
                >
                  Aktif
                </TabsTrigger>
                <TabsTrigger
                  value="Selesai"
                  className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-brand-500 data-[state=active]:bg-transparent"
                >
                  Selesai
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="p-6">
              <TabsContent value={activeTab} className="mt-0">
                <BookingList
                  bookings={filteredBookings}
                  loading={loading}
                  status={activeTab === 'semua' ? null : activeTab}
                />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
