# 🧪 NekoStay — Complete Testing & Launch Guide

> Panduan komprehensif pengujian otomatis, 24 skenario manual QA, dan checklist peluncuran produksi platform **NekoStay**.
> Sesuai standar skill `javascript-testing-patterns` & `security-auditor`.

---

## ⚡ 1. AUTOMATED TEST SUITE (Node.js Test Runner)

NekoStay dilengkapi test suite otomatis tanpa dependensi eksternal berat untuk memverifikasi logika matematika, fungsi tanggal, validasi Zod, dan respons API.

```bash
# Menjalankan seluruh pengujian otomatis
npm test
```

### Lingkup yang Diuji Otomatis:
1. **Pricing & Mathematical Calculations**:
   - Estimasi biaya paket `Basic` (Rp 50rb), `Standard` (Rp 80rb), `Premium` (Rp 130rb).
   - Akumulasi denda keterlambatan 8% majemuk harian ($\text{price} \times 1.08^n$).
   - Perhitungan refund 90% tarif harian saat pengambilan kucing lebih cepat.
   - Helper `getCheckoutCalculation` untuk kasir.
2. **Date Utilities**:
   - `daysBetween()`, `isLate()`, `lateDays()`, dan format tanggal Indonesia `formatDate()`.
3. **Zod Validation Schemas**:
   - `bookingFormSchema` (validasi format, check-in vs check-out).
   - `catReportSchema`, `reviewSchema`, `cancelBookingSchema`, `bulkActionSchema`, `scanOfflineSchema`.
4. **Standardized API Responses**:
   - Helper `apiSuccess`, `apiError`, `apiUnauthorized`, `apiForbidden`, `apiNotFound`, `apiBadRequest`.

---

## 🧪 2. MANUAL TESTING CHECKLIST (24 SCENARIOS)

### GROUP 1: Authentication & Account (5 Tests)
- [x] **Test 1**: Registrasi user baru via `/register` (nama, email, phone, password).
- [x] **Test 2**: Auto-generate referral code unik `NEKO-XXXXXXXX` di tabel `profiles`.
- [x] **Test 3**: Login user dengan kredensial benar → redirect ke `/dashboard`.
- [x] **Test 4**: Login dengan password salah → tampilkan pesan toast error bersahabat.
- [x] **Test 5**: Lupa password & update password baru → email notifikasi keamanan terkirim.

### GROUP 2: Booking Flow & Form Heuristics (5 Tests)
- [x] **Test 6**: Buat pesanan baru dengan data lengkap + upload foto kucing.
- [x] **Test 7**: Validasi tanggal keluar harus setelah tanggal masuk (Zod refine).
- [x] **Test 8**: Auto kalkulasi harga real-time saat ganti tanggal/kelas kamar.
- [x] **Test 9**: Pesanan antrian (*waitlist*) jika kelas kamar penuh.
- [x] **Test 10**: Email konfirmasi pesanan masuk ke inbox user via Resend/EmailJS.

### GROUP 3: Admin Operations & Workflow (5 Tests)
- [x] **Test 11**: Admin login → dashboard statistik & chart occupancy termuat.
- [x] **Test 12**: Konfirmasi pesanan (`Menunggu` → `Aktif`) → auto generate QR token.
- [x] **Test 13**: Tolak pesanan dengan alasan penolakan → email notifikasi terkirim.
- [x] **Test 14**: Buat laporan kondisi kucing harian (`/admin/reports`) dengan upload foto.
- [x] **Test 15**: Tindakan massal (*Bulk approve / Bulk reject*) pada daftar antrian pesanan.

### GROUP 4: Payments & Kasir QR Scanner (4 Tests)
- [x] **Test 16**: Pembayaran online Snap Midtrans menghasilkan token & URL redirect.
- [x] **Test 17**: Webhook callback Midtrans memvalidasi SHA512 signature key.
- [x] **Test 18**: Unduh bukti pemesanan PDF resmi yang memuat QR code offline kasir.
- [x] **Test 19**: Admin memindai QR Code di `/admin/scanner` → status terverifikasi Lunas (one-time 24 jam).

### GROUP 5: Reviews, Referral, WhatsApp & Multi-Bahasa (5 Tests)
- [x] **Test 20**: User memberikan rating bintang 1-5 dan ulasan untuk pesanan selesai.
- [x] **Test 21**: Admin membalas ulasan di `/admin/reviews` → notifikasi email terkirim ke pemilik.
- [x] **Test 22**: Penerapan kode referral saat pemesanan (diskon otomatis & award Poin Neko).
- [x] **Test 23**: WhatsApp Gateway sinkronisasi pairing QR code & auto-response chat bot.
- [x] **Test 24**: Toggle tema Dark/Light mode dan bahasa ID/EN berfungsi lancar.

---

## 🚀 3. PRE-DEPLOYMENT BUILD VERIFICATION

Sebelum melakukan deployment ke Vercel:
```bash
# 1. Jalankan unit test
npm test

# 2. Jalankan build produksi Turbopack
npm run build

# Output wajib: 0 errors, 44 routes generated successfully.
```
