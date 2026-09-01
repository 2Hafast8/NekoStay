/**
 * NekoStay Automated Test Suite
 * Memverifikasi integritas logika bisnis, kalkulasi harga, fungsi tanggal, validasi Zod, dan respon API.
 * Sesuai skill `javascript-testing-patterns`.
 */

import {
  calculateEstimatedTotal,
  calculateLateFee,
  calculateRefund,
  getCheckoutCalculation,
  CLASS_PRICES,
} from "../lib/utils/pricing.js";
import {
  daysBetween,
  isLate,
  lateDays,
  formatDate,
} from "../lib/utils/dates.js";
import {
  bookingFormSchema,
  catReportSchema,
  reviewSchema,
  cancelBookingSchema,
  bulkActionSchema,
  scanOfflineSchema,
  editBookingSchema,
} from "../lib/validations/booking.js";
import {
  apiSuccess,
  apiError,
  apiUnauthorized,
  apiForbidden,
  apiNotFound,
  apiBadRequest,
} from "../lib/utils/response.js";

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ PASS: ${message}`);
  } else {
    failedTests++;
    console.error(`  ❌ FAIL: ${message}`);
  }
}

function group(title, fn) {
  console.log(`\n📌 [TEST SUITE] ${title}`);
  fn();
}

// -------------------------------------------------------------
// 1. UNIT TEST: LOGIKA KALKULASI HARGA & PRICING
// -------------------------------------------------------------
group("Pricing & Mathematical Calculations", () => {
  // Test Estimasi Biaya
  const checkIn = new Date("2026-09-10");
  const checkOut = new Date("2026-09-15");
  const totalCostBasic = calculateEstimatedTotal(CLASS_PRICES.Basic, checkIn, checkOut);
  assert(totalCostBasic === 5 * 50000, `Estimasi Basic 5 hari harus Rp 250.000 (Didapat: ${totalCostBasic})`);

  const totalCostStandard = calculateEstimatedTotal(CLASS_PRICES.Standard, checkIn, checkOut);
  assert(totalCostStandard === 5 * 80000, `Estimasi Standard 5 hari harus Rp 400.000 (Didapat: ${totalCostStandard})`);

  const totalCostPremium = calculateEstimatedTotal(CLASS_PRICES.Premium, checkIn, checkOut);
  assert(totalCostPremium === 5 * 130000, `Estimasi Premium 5 hari harus Rp 650.000 (Didapat: ${totalCostPremium})`);

  // Test Denda Keterlambatan (8% kumulatif harian: hari ke-1 1.08, hari ke-2 1.08^2)
  const scheduledCheckout = new Date("2026-09-15");
  const actualCheckoutLate = new Date("2026-09-17"); // Terlambat 2 hari
  const lateFeeResult = calculateLateFee(50000, scheduledCheckout, actualCheckoutLate);
  
  const expectedDay1 = Math.floor(50000 * 1.08); // 54000
  const expectedDay2 = Math.floor(50000 * Math.pow(1.08, 2)); // 58320
  const expectedTotalFee = expectedDay1 + expectedDay2; // 112320

  assert(lateFeeResult.breakdown.length === 2, `Jumlah hari terlambat harus 2 hari (Didapat: ${lateFeeResult.breakdown.length})`);
  assert(lateFeeResult.totalFee === expectedTotalFee, `Total denda 2 hari kelas Basic harus ${expectedTotalFee} (Didapat: ${lateFeeResult.totalFee})`);

  // Test Refund Pengambilan Cepat (90% dari tarif sisa hari)
  const actualCheckoutEarly = new Date("2026-09-13"); // Sisa 2 hari dari scheduled 2026-09-15
  const refundAmount = calculateRefund(50000, scheduledCheckout, actualCheckoutEarly, checkIn, 90);
  const expectedRefund = Math.floor(2 * 50000 * 0.9); // 90.000
  assert(refundAmount === expectedRefund, `Refund 2 hari lebih cepat harus Rp ${expectedRefund} (Didapat: ${refundAmount})`);

  // Test Checkout Calculation Helper
  const mockBooking = {
    check_in_date: "2026-09-10",
    check_out_date: "2026-09-15",
    price_per_day: 50000,
    estimated_total: 250000,
  };
  const onTimeCheckout = getCheckoutCalculation(mockBooking, new Date("2026-09-15"));
  assert(onTimeCheckout.lateFee === 0 && onTimeCheckout.refund === 0, "Checkout tepat waktu denda & refund harus 0");
  assert(onTimeCheckout.finalCost === 250000, `Biaya checkout tepat waktu harus Rp 250.000 (Didapat: ${onTimeCheckout.finalCost})`);
});

// -------------------------------------------------------------
// 2. UNIT TEST: FUNGSI TANGGAL & DATE-FNS UTILS
// -------------------------------------------------------------
group("Date Utilities", () => {
  const d1 = "2026-09-10";
  const d2 = "2026-09-14";
  assert(daysBetween(d1, d2) === 4, `Selisih hari antara 10 dan 14 September harus 4 hari (Didapat: ${daysBetween(d1, d2)})`);

  const pastDate = "2020-01-01";
  assert(isLate(pastDate, new Date()), "Tanggal 2020-01-01 harus terdeteksi terlambat terhadap waktu sekarang");
  assert(lateDays(pastDate, new Date("2020-01-05")) === 4, "Selisih hari keterlambatan harus 4 hari");

  const formattedShort = formatDate(new Date("2026-09-15"), "short");
  assert(formattedShort.includes("2026"), `Format tanggal short harus memuat tahun 2026 (Didapat: ${formattedShort})`);
});

// -------------------------------------------------------------
// 3. UNIT TEST: VALIDASI ZOD SCHEMAS
// -------------------------------------------------------------
group("Zod Validation Schemas", () => {
  // Booking Form Schema Valid
  const validBookingPayload = {
    cat_name: "Mochi",
    cat_gender: "Jantan",
    cat_age: "2 Tahun",
    cat_health_status: "Sehat",
    class: "Premium",
    check_in_date: "2026-09-10",
    check_out_date: "2026-09-15",
  };
  const validBookingResult = bookingFormSchema.safeParse(validBookingPayload);
  assert(validBookingResult.success === true, "Payload pesanan valid harus lolos validasi");

  // Booking Form Schema Invalid (Check-out sebelum check-in)
  const invalidDatePayload = {
    ...validBookingPayload,
    check_in_date: "2026-09-15",
    check_out_date: "2026-09-10",
  };
  const invalidDateResult = bookingFormSchema.safeParse(invalidDatePayload);
  assert(invalidDateResult.success === false, "Check-out sebelum Check-in harus ditolak oleh Zod refine");

  // Cat Report Schema Valid & Invalid
  const validReport = catReportSchema.safeParse({
    healthStatus: "Sehat",
    notes: "Kucing makan lahap dan aktif bermain.",
  });
  assert(validReport.success === true, "Laporan kondisi kucing valid harus lolos");

  const invalidReport = catReportSchema.safeParse({
    healthStatus: "InvalidStatus",
  });
  assert(invalidReport.success === false, "Status kesehatan tidak dikenal harus ditolak");

  // Review Schema
  const validReview = reviewSchema.safeParse({
    bookingId: "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
    rating: 5,
    reviewText: "Pelayanan sangat memuaskan!",
  });
  assert(validReview.success === true, "Review valid harus lolos");

  const invalidReview = reviewSchema.safeParse({
    bookingId: "not-a-uuid",
    rating: 6, // out of range
  });
  assert(invalidReview.success === false, "Rating di atas 5 dan UUID salah harus ditolak");

  // Cancel Booking Schema
  const validCancel = cancelBookingSchema.safeParse({
    reason: "Ada perubahan jadwal mendadak ke luar kota.",
  });
  assert(validCancel.success === true, "Alasan cancel minimal 5 karakter harus lolos");

  const invalidCancel = cancelBookingSchema.safeParse({
    reason: "no", // too short
  });
  assert(invalidCancel.success === false, "Alasan cancel terlalu pendek harus ditolak");

  // Bulk Action Schema
  const validBulk = bulkActionSchema.safeParse({
    ids: ["a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d"],
    action: "approve",
  });
  assert(validBulk.success === true, "Tindakan massal approve dengan UUID harus lolos");

  // Scan Offline Schema
  const validScan = scanOfflineSchema.safeParse({
    token: "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
  });
  assert(validScan.success === true, "Token scan offline UUID valid harus lolos");
});

// -------------------------------------------------------------
// 4. UNIT TEST: STANDARDIZED API RESPONSES
// -------------------------------------------------------------
group("API Response Helpers", () => {
  const successRes = apiSuccess({ test: 123 }, "Data berhasil diambil", 200);
  assert(successRes.status === 200, "apiSuccess harus mengembalikan status 200");

  const unauthRes = apiUnauthorized();
  assert(unauthRes.status === 401, "apiUnauthorized harus mengembalikan status 401");

  const forbiddenRes = apiForbidden();
  assert(forbiddenRes.status === 403, "apiForbidden harus mengembalikan status 403");

  const notFoundRes = apiNotFound();
  assert(notFoundRes.status === 404, "apiNotFound harus mengembalikan status 404");

  const badReqRes = apiBadRequest();
  assert(badReqRes.status === 400, "apiBadRequest harus mengembalikan status 400");
});

// -------------------------------------------------------------
// RINGKASAN HASIL
// -------------------------------------------------------------
console.log("\n========================================================");
console.log(`📊 HASIL PENGUJIAN OTOMATIS: ${passedTests} / ${totalTests} BERHASIL`);
if (failedTests > 0) {
  console.error(`🚨 Terdapat ${failedTests} pengujian yang gagal!`);
  process.exit(1);
} else {
  console.log("🎉 SELURUH PENGUJIAN LOGIKA BISNIS & KEAMANAN BERHASIL 100%!");
  console.log("========================================================\n");
}

