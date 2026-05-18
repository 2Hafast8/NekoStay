import { differenceInDays, isAfter, isBefore, format } from 'date-fns'
import { id } from 'date-fns/locale'

/** Hitung jumlah hari antara 2 tanggal */
export function daysBetween(from, to) {
  const d1 = typeof from === 'string' ? new Date(from) : from
  const d2 = typeof to === 'string' ? new Date(to) : to
  return differenceInDays(d2, d1)
}

/** Apakah tanggal sudah lewat? */
export function isPastDate(date) {
  const d = typeof date === 'string' ? new Date(date) : date
  return isBefore(d, new Date())
}

/** Format tanggal ke string Indonesia */
export function formatDate(date, style = 'short') {
  const d = typeof date === 'string' ? new Date(date) : date
  if (style === 'long') return format(d, 'EEEE, dd MMMM yyyy', { locale: id })
  if (style === 'datetime') return format(d, 'dd MMM yyyy, HH:mm', { locale: id })
  return format(d, 'dd MMM yyyy', { locale: id })
}

/** Format tanggal ke format ISO (yyyy-MM-dd) */
export function toISODate(date) {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, 'yyyy-MM-dd')
}

/** Cek apakah pesanan terlambat */
export function isLate(checkOutDate, actualDate = new Date()) {
  return isAfter(actualDate, new Date(checkOutDate))
}

/** Hitung hari keterlambatan */
export function lateDays(checkOutDate, actualDate = new Date()) {
  const days = differenceInDays(actualDate, new Date(checkOutDate))
  return Math.max(0, days)
}

/** Format relative time (e.g., "2 menit lalu") */
export function timeAgo(date) {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = now - d
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Baru saja'
  if (diffMins < 60) return `${diffMins}m lalu`
  if (diffHours < 24) return `${diffHours}j lalu`
  if (diffDays < 7) return `${diffDays}h lalu`
  return formatDate(d, 'short')
}
