import { differenceInDays, isAfter, isBefore, format } from "date-fns";
import { id } from "date-fns/locale";

/** Hitung jumlah hari antara 2 tanggal */
export function daysBetween(from, to) {
  const d1 = typeof from === "string" ? new Date(from) : from;
  const d2 = typeof to === "string" ? new Date(to) : to;
  return differenceInDays(d2, d1);
}

/** Apakah tanggal sudah lewat? */
export function isPastDate(date) {
  const d = typeof date === "string" ? new Date(date) : date;
  return isBefore(d, new Date());
}

/** Format tanggal ke string Indonesia */
export function formatDate(date, style = "short") {
  const d = typeof date === "string" ? new Date(date) : date;
  if (style === "long") return format(d, "EEEE, dd MMMM yyyy", { locale: id });
  return format(d, "dd MMM yyyy", { locale: id });
}

/** Cek apakah pesanan terlambat */
export function isLate(checkOutDate, actualDate = new Date()) {
  return isAfter(actualDate, new Date(checkOutDate));
}

/** Hitung hari keterlambatan */
export function lateDays(checkOutDate, actualDate = new Date()) {
  const days = differenceInDays(actualDate, new Date(checkOutDate));
  return Math.max(0, days);
}
