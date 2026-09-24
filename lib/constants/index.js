// lib/constants/index.js: nilai enum, konstanta bisnis & label project NekoStay

export const USER_ROLES = ["user", "admin"];

export const BOOKING_STATUSES = ["Menunggu", "Aktif", "Selesai", "Dibatalkan", "Antrian"];

export const PAYMENT_STATUSES = ["Unpaid", "Paid", "Failed", "Refunded"];

export const CAT_GENDERS = ["Jantan", "Betina"];

export const CAT_HEALTH_STATUSES = ["Sehat", "Sakit", "Dalam Pengobatan"];

export const CAT_REPORT_HEALTH_STATUSES = ["Sehat", "Kurang Fit", "Perlu Perhatian"];

export const BOOKING_CLASSES = ["Basic", "Standard", "Premium"];

export const NOTIFICATION_TYPES = ["info", "warning", "success", "error"];

export const CLASS_PRICES = {
  Basic: 50000,
  Standard: 80000,
  Premium: 130000,
};

export const DEFAULT_CLASS_COLORS = {
  Basic: "#3b82f6",     // Blue
  Standard: "#f59e0b",  // Amber
  Premium: "#8b5cf6",   // Purple
  VIP: "#10b981",       // Emerald
  Deluxe: "#ec4899",    // Pink
  Suite: "#06b6d4",     // Cyan
  Executive: "#6366f1", // Indigo
  Royal: "#eab308",     // Yellow
  Economy: "#64748b",   // Slate
};

export const EXTENDED_COLOR_PALETTE = [
  "#3b82f6", // Blue
  "#f59e0b", // Amber
  "#8b5cf6", // Purple
  "#10b981", // Emerald
  "#ec4899", // Pink
  "#06b6d4", // Cyan
  "#f97316", // Orange
  "#6366f1", // Indigo
  "#14b8a6", // Teal
  "#d946ef", // Fuchsia
  "#84cc16", // Lime
  "#0284c7", // Sky
  "#e11d48", // Rose
  "#a855f7", // Violet
  "#eab308", // Yellow
  "#64748b", // Slate
];

/**
 * Mendapatkan warna representasi kelas kamar secara dinamis dan adaptif.
 * Prioritas: Warna Kustom > Warna Preset (Case-Insensitive) > Warna Palet Otomatis Berdasarkan Index/Hash.
 *
 * @param {string} className - Nama kelas kamar
 * @param {number} [index=0] - Urutan index kelas
 * @param {Record<string, string>} [customMap={}] - Peta warna kustom dari pengguna
 * @returns {string} Kode warna Hex (e.g. #3b82f6)
 */
export function getClassColor(className, index = 0, customMap = {}) {
  if (!className) return EXTENDED_COLOR_PALETTE[index % EXTENDED_COLOR_PALETTE.length];

  const trimmed = className.trim();

  // 1. Cek warna kustom yang disesuaikan user
  if (customMap && customMap[trimmed]) {
    return customMap[trimmed];
  }

  // 2. Cek warna default spesifik (Exact & Case-Insensitive)
  if (DEFAULT_CLASS_COLORS[trimmed]) {
    return DEFAULT_CLASS_COLORS[trimmed];
  }
  const lower = trimmed.toLowerCase();
  for (const [key, color] of Object.entries(DEFAULT_CLASS_COLORS)) {
    if (key.toLowerCase() === lower) return color;
  }

  // 3. Fallback ke Extended Palette secara deterministik
  let charCodeSum = 0;
  for (let i = 0; i < trimmed.length; i++) {
    charCodeSum += trimmed.charCodeAt(i);
  }
  const paletteIndex = (index + charCodeSum) % EXTENDED_COLOR_PALETTE.length;
  return EXTENDED_COLOR_PALETTE[paletteIndex];
}

export const CLASS_DETAILS = {
  Basic: {
    name: "Basic",
    price: 50000,
    description: "Perawatan dasar untuk kucing Anda",
    facilities: ["Kandang standar", "Makan 2x/hari", "Air minum segar"],
  },
  Standard: {
    name: "Standard",
    price: 80000,
    description: "Kenyamanan lebih dengan fasilitas lengkap",
    facilities: ["Kandang luas", "Makan 3x/hari", "Mainan dasar", "Monitoring harian"],
  },
  Premium: {
    name: "Premium",
    price: 130000,
    description: "Pengalaman terbaik untuk kucing kesayangan",
    facilities: ["Ruang privat", "Makan teratur", "Grooming harian", "Laporan foto harian", "Area bermain pribadi"],
  },
};

export const REFUND_PERCENTAGE = 0.90;
export const LATE_FEE_MULTIPLIER = 1.08;

/** Batas maksimal jarak waktu tunggu / antrian saat kamar penuh (dalam hari) */
export const MAX_WAITLIST_DAYS = 3;

/**
 * Template alasan penolakan otomatis ketika kamar/kandang penuh melampaui batas maksimal toleransi.
 * @param {string} className - Nama kelas kamar (Basic, Standard, Premium)
 * @param {number} [daysUntilAvailable] - Estimasi hari terdekat kamar baru tersedia
 * @returns {string}
 */
export function getCapacityFullRejectReason(className = "kamar", daysUntilAvailable) {
  if (daysUntilAvailable && daysUntilAvailable > 0) {
    return `Mohon maaf, pemesanan tidak dapat diterima karena seluruh kamar/ruang kelas ${className} telah penuh dan tidak tersedia ruang kosong dalam batas maksimal waktu 3 hari (kamar terdekat baru tersedia dalam ~${daysUntilAvailable} hari).`;
  }
  return `Mohon maaf, pemesanan tidak dapat diterima karena seluruh kamar/ruang kelas ${className} telah penuh dan tidak tersedia ruang kosong dalam batas maksimal 3 hari ke depan.`;
}

export const ADMIN_WHATSAPP = process.env.NEXT_PUBLIC_ADMIN_WHATSAPP || "6282371986344";
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://nekostay.vercel.app";

/**
 * @typedef {Object} Profile
 * @property {string} id
 * @property {string} full_name
 * @property {string|null} phone
 * @property {string|null} email
 * @property {'user'|'admin'} role
 * @property {string|null} referral_code
 * @property {string|null} referred_by
 * @property {number} [neko_points]
 * @property {string} created_at
 */

/**
 * @typedef {Object} Booking
 * @property {string} id
 * @property {string} user_id
 * @property {string} cat_name
 * @property {'Jantan'|'Betina'} cat_gender
 * @property {string} cat_age
 * @property {'Sehat'|'Sakit'|'Dalam Pengobatan'} cat_health_status
 * @property {string|null} cat_favorite_food
 * @property {boolean} cat_is_pregnant
 * @property {string|null} cat_notes
 * @property {string|null} cat_photo_url
 * @property {'Basic'|'Standard'|'Premium'} class
 * @property {number} price_per_day
 * @property {string} check_in_date
 * @property {string} check_out_date
 * @property {number} total_days
 * @property {number} estimated_total
 * @property {'Menunggu'|'Aktif'|'Selesai'|'Dibatalkan'|'Antrian'} status
 * @property {string|null} cancel_reason
 * @property {string|null} reject_reason
 * @property {string|null} admin_notes
 * @property {string|null} actual_checkout
 * @property {number} late_fee_total
 * @property {number} refund_amount
 * @property {number} discount_amount
 * @property {'Unpaid'|'Paid'|'Failed'|'Refunded'} [payment_status]
 * @property {string|null} [payment_token]
 * @property {string|null} [offline_payment_token]
 * @property {boolean} [offline_token_used]
 * @property {string|null} [offline_token_created_at]
 * @property {string} created_at
 * @property {string} updated_at
 * @property {Profile} [profiles]
 * @property {CatReport[]} [cat_reports]
 */

/**
 * @typedef {Object} CatReport
 * @property {string} id
 * @property {string} booking_id
 * @property {string} admin_id
 * @property {'Sehat'|'Kurang Fit'|'Perlu Perhatian'} health_status
 * @property {string|null} photo_url
 * @property {string|null} notes
 * @property {string} report_date
 * @property {string} created_at
 */

/**
 * @typedef {Object} Notification
 * @property {string} id
 * @property {string} user_id
 * @property {string} title
 * @property {string} message
 * @property {'info'|'warning'|'success'|'error'} type
 * @property {boolean} is_read
 * @property {string|null} booking_id
 * @property {string} created_at
 */

/**
 * @typedef {Object} Review
 * @property {string} id
 * @property {string} user_id
 * @property {string} booking_id
 * @property {number} rating
 * @property {string|null} review_text
 * @property {string|null} reply_text
 * @property {string} created_at
 * @property {Profile} [profiles]
 */

/**
 * @typedef {Object} PriceSummary
 * @property {number} pricePerDay
 * @property {number} totalDays
 * @property {number} totalCost
 */
