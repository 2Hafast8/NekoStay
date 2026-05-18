import Link from 'next/link'
import { BookingStatusBadge } from '@/components/booking/BookingStatus'
import { formatRupiah } from '@/lib/utils/format'
import { formatDate } from '@/lib/utils/dates'
import { Calendar, ChevronRight, Cat } from 'lucide-react'

const borderColors = {
  'Menunggu': 'border-l-amber-400',
  'Aktif': 'border-l-green-400',
  'Selesai': 'border-l-slate-300',
  'Dibatalkan': 'border-l-red-400',
}

export function BookingCard({ booking }) {
  const isCancelled = booking.status === 'Dibatalkan'

  return (
    <Link href={`/booking/${booking.id}`}>
      <div className={`bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl p-5 
        border-l-4 ${borderColors[booking.status] || 'border-l-slate-300'}
        hover:shadow-md transition-all duration-200 group
        ${isCancelled ? 'opacity-60' : ''}`}
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            {booking.cat_photo_url ? (
              <img
                src={booking.cat_photo_url}
                alt={booking.cat_name}
                className="w-12 h-12 rounded-lg object-cover shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-brand-50 dark:bg-brand-950/30 flex items-center justify-center shrink-0">
                <Cat className="text-brand-400" size={24} />
              </div>
            )}
            <div className="min-w-0">
              <h3 className="font-semibold text-slate-900 dark:text-white truncate">
                {booking.cat_name}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {booking.class} · {booking.total_days || '—'} hari
              </p>
            </div>
          </div>
          <BookingStatusBadge status={booking.status} />
        </div>

        <div className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 mb-2">
          <Calendar size={14} />
          <span>
            {formatDate(booking.check_in_date)} → {formatDate(booking.check_out_date)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="font-bold text-brand-500 text-sm">
            {formatRupiah(booking.estimated_total || 0)}
          </span>
          <span className="text-xs text-slate-400 group-hover:text-brand-500 transition-colors flex items-center gap-1">
            Lihat <ChevronRight size={14} />
          </span>
        </div>
      </div>
    </Link>
  )
}
