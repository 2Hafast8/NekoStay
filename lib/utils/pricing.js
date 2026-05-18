import { differenceInDays } from 'date-fns'

export const CLASS_PRICES = {
  Basic: 50000,
  Standard: 80000,
  Premium: 130000,
}

export const REFUND_PERCENTAGE = 0.90
export const LATE_FEE_MULTIPLIER = 1.08

/**
 * Hitung estimasi total biaya pemesanan
 * @param {number} pricePerDay
 * @param {Date|string} checkIn
 * @param {Date|string} checkOut
 * @returns {number}
 */
export function calculateEstimatedTotal(pricePerDay, checkIn, checkOut) {
  const d1 = typeof checkIn === 'string' ? new Date(checkIn) : checkIn
  const d2 = typeof checkOut === 'string' ? new Date(checkOut) : checkOut
  const days = differenceInDays(d2, d1)
  return days * pricePerDay
}

/**
 * Hitung refund jika pengambilan lebih cepat
 * Refund = sisa_hari × harga/hari × 90%
 * @param {number} pricePerDay
 * @param {Date|string} scheduledCheckout
 * @param {Date|string} actualCheckout
 * @returns {number}
 */
export function calculateRefund(pricePerDay, scheduledCheckout, actualCheckout) {
  const d1 = typeof scheduledCheckout === 'string' ? new Date(scheduledCheckout) : scheduledCheckout
  const d2 = typeof actualCheckout === 'string' ? new Date(actualCheckout) : actualCheckout
  const remainingDays = differenceInDays(d1, d2)
  if (remainingDays <= 0) return 0
  return Math.floor(remainingDays * pricePerDay * REFUND_PERCENTAGE)
}

/**
 * Hitung denda keterlambatan (akumulatif naik 8% per hari)
 * @param {number} pricePerDay
 * @param {Date|string} scheduledCheckout
 * @param {Date|string} actualCheckout
 * @returns {{ totalFee: number, breakdown: Array<{ day: number, fee: number }> }}
 */
export function calculateLateFee(pricePerDay, scheduledCheckout, actualCheckout) {
  const d1 = typeof scheduledCheckout === 'string' ? new Date(scheduledCheckout) : scheduledCheckout
  const d2 = typeof actualCheckout === 'string' ? new Date(actualCheckout) : actualCheckout
  const lateDays = differenceInDays(d2, d1)
  if (lateDays <= 0) return { totalFee: 0, breakdown: [] }

  const breakdown = []
  let totalFee = 0

  for (let i = 1; i <= lateDays; i++) {
    const fee = Math.floor(pricePerDay * Math.pow(LATE_FEE_MULTIPLIER, i))
    breakdown.push({ day: i, fee })
    totalFee += fee
  }

  return { totalFee, breakdown }
}

/**
 * Get booking summary for price preview
 * @param {string} className
 * @param {Date|string} checkIn
 * @param {Date|string} checkOut
 * @returns {{ pricePerDay: number, totalDays: number, totalCost: number }}
 */
export function getBookingSummary(className, checkIn, checkOut) {
  const d1 = typeof checkIn === 'string' ? new Date(checkIn) : checkIn
  const d2 = typeof checkOut === 'string' ? new Date(checkOut) : checkOut
  const pricePerDay = CLASS_PRICES[className] || 0
  const totalDays = differenceInDays(d2, d1)
  const totalCost = totalDays * pricePerDay
  return { pricePerDay, totalDays, totalCost }
}
