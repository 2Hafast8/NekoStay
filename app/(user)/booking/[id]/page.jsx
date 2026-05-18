'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BookingStatusBadge } from '@/components/booking/BookingStatus'
import { formatDate, isPastDate } from '@/lib/utils/dates'
import { formatRupiah } from '@/lib/utils/format'
import { 
  ChevronLeft, 
  Calendar, 
  Heart, 
  AlertCircle, 
  Loader2, 
  Cat,
  Clock,
  FileText,
} from 'lucide-react'
import { toast } from 'sonner'

export default function BookingDetailPage() {
  const router = useRouter()
  const params = useParams()
  const bookingId = params.id
  const supabase = createClient()

  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [canceling, setCanceling] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [cancelReason, setCancelReason] = useState('')

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('bookings')
          .select(`
            *,
            profiles:user_id (id, full_name, phone),
            cat_reports (id, health_status, photo_url, notes, report_date)
          `)
          .eq('id', bookingId)
          .single()

        if (error) throw error
        setBooking(data)
      } catch (err) {
        toast.error('Gagal memuat detail pesanan')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    if (bookingId) fetchBooking()
  }, [bookingId])

  const handleCancelBooking = async () => {
    if (!cancelReason.trim()) {
      toast.error('Alasan pembatalan harus diisi')
      return
    }

    try {
      setCanceling(true)
      const { error } = await supabase
        .from('bookings')
        .update({
          status: 'Dibatalkan',
          cancel_reason: cancelReason,
        })
        .eq('id', bookingId)

      if (error) throw error

      toast.success('Pesanan berhasil dibatalkan')
      setShowCancelDialog(false)
      router.push('/dashboard')
    } catch (err) {
      toast.error('Gagal membatalkan pesanan')
      console.error(err)
    } finally {
      setCanceling(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <Loader2 className="animate-spin text-brand-500" size={40} />
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto text-red-500 mb-4" size={40} />
          <h1 className="font-semibold text-slate-900 dark:text-white mb-2">
            Pesanan Tidak Ditemukan
          </h1>
          <Link href="/dashboard" className="text-brand-500 hover:underline">
            Kembali ke dashboard
          </Link>
        </div>
      </div>
    )
  }

  const canCancel = booking.status === 'Menunggu' || booking.status === 'Aktif'

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-brand-500 mb-6 transition-colors"
        >
          <ChevronLeft size={16} />
          Kembali
        </Link>

        <div className="space-y-6">
          {/* Header */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              {booking.cat_photo_url ? (
                <img
                  src={booking.cat_photo_url}
                  alt={booking.cat_name}
                  className="w-24 h-24 rounded-lg object-cover"
                />
              ) : (
                <div className="w-24 h-24 rounded-lg bg-brand-50 dark:bg-brand-950/30 flex items-center justify-center">
                  <Cat className="text-brand-400" size={40} />
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  {booking.cat_name}
                </h1>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="outline">
                    {booking.cat_gender}
                  </Badge>
                  <Badge variant="outline">
                    {booking.cat_age}
                  </Badge>
                  <Badge variant="outline">
                    {booking.class}
                  </Badge>
                </div>
              </div>
            </div>
            <BookingStatusBadge status={booking.status} size="lg" />
          </div>

          {/* Main Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Jadwal */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Calendar size={18} />
                Jadwal Penitipan
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                    Check-in
                  </p>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {formatDate(booking.check_in_date, 'long')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                    Check-out
                  </p>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {formatDate(booking.check_out_date, 'long')}
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                    Durasi
                  </p>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {booking.total_days} hari
                  </p>
                </div>
              </div>
            </div>

            {/* Biaya */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4">
                Rincian Biaya
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">
                    Harga/hari
                  </span>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {formatRupiah(booking.price_per_day)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">
                    {booking.total_days} hari ×
                  </span>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {formatRupiah(booking.price_per_day * booking.total_days)}
                  </span>
                </div>
                <div className="border-t border-slate-200 dark:border-slate-700 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-900 dark:text-white">
                      Total Estimasi
                    </span>
                    <span className="text-xl font-extrabold text-brand-500">
                      {formatRupiah(booking.estimated_total)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Data Kucing */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Heart size={18} />
              Data Kucing
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                  Status Kesehatan
                </p>
                <p className="font-medium text-slate-900 dark:text-white">
                  {booking.cat_health_status}
                </p>
              </div>
              {booking.cat_favorite_food && (
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                    Makanan Favorit
                  </p>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {booking.cat_favorite_food}
                  </p>
                </div>
              )}
              {booking.cat_is_pregnant && (
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                    Status
                  </p>
                  <p className="font-medium text-yellow-600">⚠️ Sedang Hamil</p>
                </div>
              )}
            </div>
            {booking.cat_notes && (
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                  Catatan Tambahan
                </p>
                <p className="text-slate-900 dark:text-white">{booking.cat_notes}</p>
              </div>
            )}
          </div>

          {/* Laporan Kucing */}
          {booking.cat_reports && booking.cat_reports.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <FileText size={18} />
                Laporan Kondisi Kucing ({booking.cat_reports.length})
              </h3>
              <div className="space-y-4">
                {booking.cat_reports.map((report) => (
                  <div
                    key={report.id}
                    className="border border-slate-200 dark:border-slate-700 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
                        <Clock size={14} />
                        {formatDate(report.report_date, 'datetime')}
                      </p>
                      <Badge>{report.health_status}</Badge>
                    </div>
                    {report.photo_url && (
                      <img
                        src={report.photo_url}
                        alt="Laporan"
                        className="w-full max-w-xs rounded-lg mb-3"
                      />
                    )}
                    {report.notes && (
                      <p className="text-slate-700 dark:text-slate-300 text-sm">
                        {report.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Alasan Pembatalan */}
          {booking.status === 'Dibatalkan' && booking.cancel_reason && (
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-xl p-6">
              <h3 className="font-semibold text-red-900 dark:text-red-400 mb-2 flex items-center gap-2">
                <AlertCircle size={18} />
                Alasan Pembatalan
              </h3>
              <p className="text-red-800 dark:text-red-300">{booking.cancel_reason}</p>
            </div>
          )}

          {/* Status Ditolak */}
          {booking.status === 'Dibatalkan' && booking.reject_reason && (
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-xl p-6">
              <h3 className="font-semibold text-amber-900 dark:text-amber-400 mb-2 flex items-center gap-2">
                <AlertCircle size={18} />
                Alasan Penolakan
              </h3>
              <p className="text-amber-800 dark:text-amber-300">{booking.reject_reason}</p>
            </div>
          )}

          {/* Action Buttons */}
          {canCancel && (
            <div className="sticky bottom-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 p-4 rounded-t-xl flex gap-3">
              <Button
                type="button"
                variant="destructive"
                className="flex-1"
                onClick={() => setShowCancelDialog(true)}
              >
                Batalkan Pesanan
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Cancel Dialog */}
      {showCancelDialog && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
              Batalkan Pesanan
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
              Anda yakin ingin membatalkan pesanan ini? Jelaskan alasan pembatalan.
            </p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Alasan pembatalan..."
              className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-3 mb-4 dark:bg-slate-700 dark:text-white"
              rows={3}
            />
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setShowCancelDialog(false)}
              >
                Tidak
              </Button>
              <Button
                type="button"
                variant="destructive"
                className="flex-1"
                disabled={canceling || !cancelReason.trim()}
                onClick={handleCancelBooking}
              >
                {canceling ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
                Ya, Batalkan
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
