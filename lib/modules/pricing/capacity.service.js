import { MAX_WAITLIST_DAYS, getCapacityFullRejectReason } from "../../constants/index.js";

/**
 * Menghitung kapasitas kamar/ruang dan ketersediaan waktu tunggu antrian (maks. 3 hari).
 */
export function calculateCapacityAndWaitlist({
  effectiveCapacity,
  totalCages = 10,
  maintenanceCages = 0,
  overlappingBookings = [],
  checkInDate,
  checkOutDate,
  className = "Standard",
}) {
  const count = overlappingBookings?.length || 0;
  const isFull = count >= effectiveCapacity;

  if (!isFull) {
    return {
      isFull: false,
      effectiveCapacity,
      totalCages,
      maintenanceCages,
      overlappingCount: count,
      earliestCheckoutDate: null,
      daysUntilAvailable: 0,
      canWaitlist: true,
      maxWaitlistDays: MAX_WAITLIST_DAYS,
      rejectReason: null,
    };
  }

  // Kandang PENUH! Urutkan overlapping bookings berdasarkan tanggal check-out paling awal
  const sorted = [...overlappingBookings].sort(
    (a, b) => new Date(a.check_out_date).getTime() - new Date(b.check_out_date).getTime()
  );

  const earliestBooking = sorted[0];
  const earliestDate = earliestBooking?.check_out_date || (typeof checkOutDate === "string" ? checkOutDate : checkOutDate.toISOString().split("T")[0]);

  // Hitung selisih hari dari tanggal check-in (atau hari ini jika check-in sebelum hari ini)
  const baseInDate = new Date(checkInDate);
  const now = new Date();
  const referenceDate = baseInDate.getTime() > now.getTime() ? baseInDate : now;
  const targetCheckout = new Date(earliestDate);

  const diffMs = targetCheckout.getTime() - referenceDate.getTime();
  const daysDiff = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

  // Toleransi maksimal antrian adalah 3 hari
  const canWaitlist = daysDiff <= MAX_WAITLIST_DAYS;
  const rejectReason = canWaitlist ? null : getCapacityFullRejectReason(className, daysDiff);

  return {
    isFull: true,
    effectiveCapacity,
    totalCages,
    maintenanceCages,
    overlappingCount: count,
    earliestCheckoutDate: earliestDate,
    daysUntilAvailable: daysDiff,
    canWaitlist,
    maxWaitlistDays: MAX_WAITLIST_DAYS,
    rejectReason,
  };
}

