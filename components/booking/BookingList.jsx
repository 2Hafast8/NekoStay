import { BookingCard } from '@/components/booking/BookingCard'
import { Calendar, AlertCircle } from 'lucide-react'

export function BookingList({ bookings, loading, status = null }) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-24 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse"
          />
        ))}
      </div>
    )
  }

  if (!bookings || bookings.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
          <Calendar className="text-slate-400" size={24} />
        </div>
        <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
          {status ? `Belum ada pesanan ${status.toLowerCase()}` : 'Belum ada pesanan'}
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
          Mulai penitipan kucing Anda sekarang dan dapatkan perawatan terbaik
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {bookings.map((booking) => (
        <BookingCard key={booking.id} booking={booking} />
      ))}
    </div>
  )
}
