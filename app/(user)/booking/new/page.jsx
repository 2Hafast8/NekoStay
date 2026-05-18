import { BookingForm } from '@/components/booking/BookingForm'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export const metadata = {
  title: 'Pesanan Baru - NekoStay',
  description: 'Buat pesanan penitipan kucing baru',
}

export default function NewBookingPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-brand-500 mb-6 transition-colors"
        >
          <ChevronLeft size={16} />
          Kembali
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Pesanan Penitipan Baru
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Isi formulir di bawah untuk membuat pesanan penitipan kucing baru
          </p>
        </div>

        {/* Form */}
        <BookingForm />
      </div>
    </div>
  )
}
