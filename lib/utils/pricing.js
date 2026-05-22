import { differenceInDays } from "date-fns";

export const CLASS_PRICES = {
  Basic: 50000,
  Standard: 80000,
  Premium: 130000,
};

/**
 * Hitung estimasi total biaya pemesanan
 */
export function calculateEstimatedTotal(pricePerDay, checkIn, checkOut) {
  const days = differenceInDays(checkOut, checkIn);
  return Math.max(0, days) * pricePerDay;
}

/**
 * Hitung refund jika pengambilan lebih cepat
 * Refund = sisa_hari × harga/hari × 90%
 */
export function calculateRefund(
  pricePerDay,
  scheduledCheckout,
  actualCheckout,
  checkIn = null
) {
  const scheduled = new Date(scheduledCheckout);
  const actual = new Date(actualCheckout);
  
  const scheduledDayOnly = new Date(
    scheduled.getFullYear(),
    scheduled.getMonth(),
    scheduled.getDate()
  );
  const actualDayOnly = new Date(
    actual.getFullYear(),
    actual.getMonth(),
    actual.getDate()
  );
  
  let remainingDays = differenceInDays(scheduledDayOnly, actualDayOnly);
  if (remainingDays <= 0) return 0;
  
  if (checkIn) {
    const ci = new Date(checkIn);
    const ciDayOnly = new Date(ci.getFullYear(), ci.getMonth(), ci.getDate());
    const totalBookedDays = differenceInDays(scheduledDayOnly, ciDayOnly);
    remainingDays = Math.min(totalBookedDays, remainingDays);
  }
  
  return Math.floor(remainingDays * pricePerDay * 0.9);
}

/**
 * Hitung denda keterlambatan (akumulatif naik 8% per hari)
 * Hari ke-1: harga × 1.08
 * Hari ke-2: harga × 1.08²
 * Hari ke-n: harga × 1.08^n
 */
export function calculateLateFee(
  pricePerDay,
  scheduledCheckout,
  actualCheckout,
) {
  const lateDays = differenceInDays(actualCheckout, scheduledCheckout);
  if (lateDays <= 0) return { totalFee: 0, breakdown: [] };

  const breakdown = [];
  let totalFee = 0;

  for (let i = 1; i <= lateDays; i++) {
    const fee = Math.floor(pricePerDay * Math.pow(1.08, i));
    breakdown.push({ day: i, fee });
    totalFee += fee;
  }

  return { totalFee, breakdown };
}

/**
 * Contoh output kalkulasi untuk UI preview
 */
export function getBookingSummary(className, checkIn, checkOut) {
  const pricePerDay = CLASS_PRICES[className];
  const totalDays = differenceInDays(checkOut, checkIn);
  const totalCost = Math.max(0, totalDays) * pricePerDay;
  return { pricePerDay, totalDays, totalCost };
}

/**
 * Kalkulasi lengkap checkout harian (denda / refund)
 */
export function getCheckoutCalculation(booking, actualCheckoutDate) {
  const checkIn = new Date(booking.check_in_date);
  const scheduledCheckout = new Date(booking.check_out_date);
  const checkInDayOnly = new Date(
    checkIn.getFullYear(),
    checkIn.getMonth(),
    checkIn.getDate()
  );
  const scheduledCheckoutDayOnly = new Date(
    scheduledCheckout.getFullYear(),
    scheduledCheckout.getMonth(),
    scheduledCheckout.getDate(),
  );
  const actualCheckoutDayOnly = new Date(
    actualCheckoutDate.getFullYear(),
    actualCheckoutDate.getMonth(),
    actualCheckoutDate.getDate(),
  );
  const diffDays = differenceInDays(
    actualCheckoutDayOnly,
    scheduledCheckoutDayOnly,
  );
  let lateDaysCount = 0;
  let lateFee = 0;
  let refundDays = 0;
  let refund = 0;
  let notes = "Kucing dijemput sesuai jadwal.";

  if (diffDays > 0) {
    lateDaysCount = diffDays;
    const calculation = calculateLateFee(
      booking.price_per_day,
      scheduledCheckoutDayOnly,
      actualCheckoutDayOnly,
    );
    lateFee = calculation.totalFee;
    notes = `Terlambat ${lateDaysCount} hari. Denda tambahan dikenakan akumulatif 8% per hari.`;
  } else if (diffDays < 0) {
    // Cap refund days to total booked days to prevent refund from exceeding estimated total
    const totalBookedDays = Math.max(0, differenceInDays(scheduledCheckoutDayOnly, checkInDayOnly));
    refundDays = Math.min(totalBookedDays, Math.abs(diffDays));
    refund = Math.floor(refundDays * booking.price_per_day * 0.9);
    notes = `Dijemput ${refundDays} hari lebih awal. Mendapatkan refund 90% tarif per hari sisa.`;
  }

  const finalCost = booking.estimated_total + lateFee - refund;

  return {
    actualCheckoutDate,
    lateDaysCount,
    lateFee,
    refundDays,
    refund,
    finalCost,
    notes,
  };
}
