'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BookingStatusBadge } from '@/components/booking/BookingStatus'
import { formatDate } from '@/lib/utils/dates'
import { formatRupiah } from '@/lib/utils/format'
import {
  ChevronLeft,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  Send,
  Eye,
} from 'lucide-react'
import { toast } from 'sonner'

export default function AdminBookingDetailPage() {
  const router = useRouter()
  const params = useParams()
  const bookingId = params.id
  const supabase = createClient()

  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const { data, error } = await supabase
          .from('bookings')
          .select(`
            *,
            profiles:user_id (id, full_name, phone, email),
            cat_reports (id, health_status, photo_url, notes, report_date)
          `)
          .eq('id', bookingId)
          .single()

        if (error) throw error
        setBooking(data)
      } catch (err) {
        toast.error('Gagal memuat booking')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    if (bookingId) fetchBooking()
  }, [bookingId])

  const handleConfirm = async () => {
    try {
      setActing(true)
      const res = await fetch(`/api/bookings/${bookingId}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error)
      }

      toast.success('Pesanan berhasil dikonfirmasi')
      setShowConfirmDialog(false)
      setBooking({ ...booking, status: 'Aktif' })
    } catch (err) {
      toast.error(err.message || 'Gagal mengkonfirmasi pesanan')
    } finally {
      setActing(false)
    }
  }

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error('Alasan penolakan harus diisi')
      return
    }

    try {
      setActing(true)
      const res = await fetch(`/api/bookings/${bookingId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error)
      }

      toast.success('Pesanan berhasil ditolak')
      setShowRejectDialog(false)
      setBooking({ ...booking, status: 'Dibatalkan', reject_reason: rejectReason })
    } catch (err) {
      toast.error(err.message || 'Gagal menolak pesanan')
    } finally {
      setActing(false)
    }
  }

  const handleComplete = async () => {
    try {
      setActing(true)
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'Selesai' })
        .eq('id', bookingId)

      if (error) throw error

      toast.success('Pesanan berhasil diselesaikan')
      setBooking({ ...booking, status: 'Selesai' })
    } catch (err) {
      toast.error('Gagal menyelesaikan pesanan')
    } finally {
      setActing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-brand-500" size={40} />
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto text-red-500 mb-4" size={40} />
          <p className="text-slate-600">Booking tidak ditemukan</p>
          <Link href="/admin/dashboard" className="text-brand-500 hover:underline mt-4">
            Kembali
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back Button */}
      <Link
        href="/admin/dashboard"
        className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-brand-500"
      >
        <ChevronLeft size={16} />
        Kembali
      </Link>

      {/* Header */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            {booking.cat_name}
          </h1>
          <div className="flex gap-2 flex-wrap">
            <Badge>{booking.cat_gender}</Badge>
            <Badge>{booking.cat_age}</Badge>
            <Badge>{booking.class}</Badge>
          </div>
        </div>
        <BookingStatusBadge status={booking.status} size="lg" />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Data Pesanan */}
        <div className="lg:col-span-2 space-y-6">
          {/* Jadwal */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">
              Jadwal Penitipan
            </h3>
            <div className="grid grid-cols-2 gap-4">
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
              <div className="col-span-2">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                  Durasi
                </p>
                <p className="font-semibold text-slate-900 dark:text-white">
                  {booking.total_days} hari
                </p>
              </div>
            </div>
          </div>

          {/* Data Kucing */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">
              Data Kucing
            </h3>
            {booking.cat_photo_url && (
              <img
                src={booking.cat_photo_url}
                alt={booking.cat_name}
                className="w-full max-w-xs rounded-lg mb-4"
              />
            )}
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-slate-600 dark:text-slate-400">Status Kesehatan</p>
                <p className="font-medium text-slate-900 dark:text-white">
                  {booking.cat_health_status}
                </p>
              </div>
              {booking.cat_favorite_food && (
                <div>
                  <p className="text-slate-600 dark:text-slate-400">Makanan Favorit</p>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {booking.cat_favorite_food}
                  </p>
                </div>
              )}
              {booking.cat_is_pregnant && (
                <div className="text-yellow-600 font-medium flex items-center gap-2">
                  <AlertCircle size={16} />
                  Sedang Hamil
                </div>
              )}
              {booking.cat_notes && (
                <div>
                  <p className="text-slate-600 dark:text-slate-400">Catatan</p>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {booking.cat_notes}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Pemilik */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">
              Data Pemilik
            </h3>
            <div className="space-y-2 text-sm">
              <div>
                <p className="text-slate-600 dark:text-slate-400">Nama</p>
                <p className="font-medium text-slate-900 dark:text-white">
                  {booking.profiles?.full_name}
                </p>
              </div>
              <div>
                <p className="text-slate-600 dark:text-slate-400">Nomor HP</p>
                <p className="font-medium text-slate-900 dark:text-white">
                  {booking.profiles?.phone}
                </p>
              </div>
            </div>
          </div>

          {/* Laporan Kucing */}
          {booking.cat_reports && booking.cat_reports.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4">
                Laporan Kucing ({booking.cat_reports.length})
              </h3>
              <div className="space-y-4">
                {booking.cat_reports.map((report) => (
                  <div
                    key={report.id}
                    className="border border-slate-200 dark:border-slate-700 rounded-lg p-4"
                  >
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                      {formatDate(report.report_date, 'datetime')}
                    </p>
                    <Badge className="mb-3">{report.health_status}</Badge>
                    {report.photo_url && (
                      <img
                        src={report.photo_url}
                        alt="Report"
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
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Biaya */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">
              Rincian Biaya
            </h3>
            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Kelas</span>
                <span className="font-medium">{booking.class}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Harga/hari</span>
                <span className="font-medium">
                  {formatRupiah(booking.price_per_day)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Durasi</span>
                <span className="font-medium">{booking.total_days} hari</span>
              </div>
              <div className="border-t border-slate-200 dark:border-slate-700 pt-2 mt-2">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-900 dark:text-white">
                    Total
                  </span>
                  <span className="text-lg font-bold text-brand-500">
                    {formatRupiah(booking.estimated_total)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">
              Aksi
            </h3>
            <div className="space-y-3">
              {booking.status === 'Menunggu' && (
                <>
                  <Button
                    onClick={() => setShowConfirmDialog(true)}
                    className="w-full gap-2"
                    disabled={acting}
                  >
                    <CheckCircle size={16} />
                    Konfirmasi
                  </Button>
                  <Button
                    onClick={() => setShowRejectDialog(true)}
                    variant="destructive"
                    className="w-full gap-2"
                    disabled={acting}
                  >
                    <XCircle size={16} />
                    Tolak
                  </Button>
                </>
              )}

              {booking.status === 'Aktif' && (
                <>
                  <Link href={`/admin/bookings/${bookingId}/send-report`}>
                    <Button variant="outline" className="w-full gap-2">
                      <Send size={16} />
                      Kirim Laporan
                    </Button>
                  </Link>
                  <Button
                    onClick={handleComplete}
                    className="w-full gap-2"
                    disabled={acting}
                  >
                    <CheckCircle size={16} />
                    Selesaikan
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
              Konfirmasi Pesanan
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Apakah Anda yakin ingin mengkonfirmasi pesanan {booking.cat_name}?
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowConfirmDialog(false)}
              >
                Batal
              </Button>
              <Button
                className="flex-1"
                disabled={acting}
                onClick={handleConfirm}
              >
                {acting ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
                Ya, Konfirmasi
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Dialog */}
      {showRejectDialog && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
              Tolak Pesanan
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-4 text-sm">
              Jelaskan alasan penolakan pesanan ini.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Alasan penolakan..."
              className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-3 mb-4 dark:bg-slate-700 dark:text-white text-sm"
              rows={3}
            />
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowRejectDialog(false)
                  setRejectReason('')
                }}
              >
                Batal
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                disabled={acting || !rejectReason.trim()}
                onClick={handleReject}
              >
                {acting ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
                Tolak
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
