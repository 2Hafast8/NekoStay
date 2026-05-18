import { formatRupiah } from '@/lib/utils/format'
import { CLASS_PRICES } from '@/lib/utils/pricing'
import { getBookingSummary } from '@/lib/utils/pricing'
import { Info } from 'lucide-react'

export function PriceCalculator({ className, checkIn, checkOut }) {
  if (!className || !checkIn || !checkOut) return null

  const summary = getBookingSummary(className, checkIn, checkOut)
  if (summary.totalDays <= 0) return null

  return (
    <div className="bg-brand-50 dark:bg-brand-950/20 border border-brand-200 dark:border-brand-800 rounded-xl p-5">
      <h4 className="font-semibold text-slate-900 dark:text-white mb-3">Ringkasan Biaya</h4>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-slate-600 dark:text-slate-400">Kelas</span>
          <span className="font-medium text-slate-900 dark:text-white">{className}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-600 dark:text-slate-400">Harga/hari</span>
          <span className="font-medium text-slate-900 dark:text-white">{formatRupiah(summary.pricePerDay)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-600 dark:text-slate-400">Durasi</span>
          <span className="font-medium text-slate-900 dark:text-white">{summary.totalDays} hari</span>
        </div>
        <div className="border-t border-brand-200 dark:border-brand-700 my-2" />
        <div className="flex justify-between items-center">
          <span className="font-semibold text-slate-900 dark:text-white">Total Estimasi</span>
          <span className="text-xl font-extrabold text-brand-500">{formatRupiah(summary.totalCost)}</span>
        </div>
      </div>
      <div className="flex items-start gap-2 mt-4 p-3 bg-white/60 dark:bg-slate-800/40 rounded-lg">
        <Info size={14} className="text-brand-500 shrink-0 mt-0.5" />
        <p className="text-xs text-slate-600 dark:text-slate-400">
          Pembayaran dilakukan saat pengantaran kucing ke lokasi kami.
        </p>
      </div>
    </div>
  )
}
