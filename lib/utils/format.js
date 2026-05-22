/** Format number to IDR currency string */
export function formatRupiah(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/** Format currency with short abbreviation (e.g. 50rb) */
export function formatShortRupiah(value) {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1).replace(".0", "")}jt`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}rb`;
  }
  return value.toString();
}
