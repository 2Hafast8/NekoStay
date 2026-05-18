import { Badge } from '@/components/ui/badge'

const statusConfig = {
  'Menunggu': { label: '⏳ Menunggu', className: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800' },
  'Aktif': { label: '✅ Aktif', className: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800' },
  'Selesai': { label: '🏁 Selesai', className: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700' },
  'Dibatalkan': { label: '❌ Dibatalkan', className: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800' },
}

const healthConfig = {
  'Sehat': { label: '✅ Sehat', className: 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400' },
  'Kurang Fit': { label: '⚠️ Kurang Fit', className: 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400' },
  'Perlu Perhatian': { label: '🔴 Perlu Perhatian', className: 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400' },
}

export function BookingStatusBadge({ status }) {
  const config = statusConfig[status] || statusConfig['Menunggu']
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.className}`}>
      {config.label}
    </span>
  )
}

export function HealthStatusBadge({ status }) {
  const config = healthConfig[status] || healthConfig['Sehat']
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${config.className}`}>
      {config.label}
    </span>
  )
}
