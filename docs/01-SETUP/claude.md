# CLAUDE.md — NekoStay Project Context & AI Guidelines

> File ini adalah panduan konteks proyek komprehensif untuk asisten AI (Claude, Antigravity, dsb.).
> Digunakan secara otomatis saat bekerja pada codebase NekoStay.

---

## 🐱 IDENTITAS PROYEK

| Properti | Nilai / Spesifikasi |
|---|---|
| **Nama Proyek** | NekoStay |
| **Deskripsi** | Platform web pemesanan dan manajemen jasa penitipan kucing modern, aman, dan terpercaya |
| **Framework** | Next.js 16.2.6 (App Router + Turbopack) & React 19.2.4 |
| **Database & Auth** | Supabase (PostgreSQL 15+, Auth SSR, Storage, Realtime WebSocket CDC, RLS) |
| **Styling & UI** | Tailwind CSS v4, shadcn/ui, Lucide Icons, GSAP & Anime.js |
| **Payment Gateway** | Midtrans (Snap Online) + QR Code Scanner Offline (One-time 24h token) |
| **WhatsApp Gateway** | `@whiskeysockets/baileys` Multi-Device Engine (Cloud sync ke `whatsapp_bot_state` & `whatsapp_logs`, direct chat admin) |
| **Email & Receipt** | Dual-Mode Engine (Resend & EmailJS) + jsPDF Stream Generator |
| **Arsitektur Domain** | Modular Services bergaya NestJS di `lib/modules/` (`pricing`, `whatsapp`) |
| **Error Handling** | User-Centric Error Sanitizer (`lib/utils/errors.js`), `UserErrorAlert`, & zero sensitive leakage in production |
| **Testing Suite** | Node.js Test Suite (`scripts/test-suite.mjs` / `npm test` — 141 tests 100% pass) |
| **Bahasa Utama** | JavaScript Modern (ES6+ dengan JSDoc Type Annotations lengkap) |

---

## 👥 PERAN PENGGUNA (ROLE-BASED ACCESS CONTROL)

Sistem menerapkan kontrol akses berbasis peran (RBAC) ketat:

### 1. `user` — Pemilik Kucing
- Registrasi, login, lupa password, reset password via email.
- Membuat pesanan penitipan kucing baru (termasuk status antrian jika penuh).
- Melihat riwayat pesanan, status menginap, laporan kondisi kucing harian, dan notifikasi realtime.
- Melakukan pembayaran online via Midtrans atau mengunduh struk PDF dengan QR Code untuk bayar di kasir.
- Mengajukan pembatalan pesanan saat status `Menunggu`.
- Memberikan rating dan ulasan untuk pesanan berstatus `Selesai`.
- Berbagi kode referral unik (`NEKO-XXXXXXXX`) untuk mendapatkan Poin Neko.

### 2. `admin` — Pengelola Penitipan
- Dashboard analitik pendapatan, occupancy rate kamar, dan grafik statistik.
- Mengelola dan memproses pesanan (`Menunggu`/`Antrian` → `Aktif` → `Selesai` atau `Dibatalkan`).
- Menolak pesanan dengan alasan jelas atau melakukan persetujuan massal (*bulk action*).
- Memindai (*scanner*) QR Code bukti pemesanan kasir untuk verifikasi pembayaran offline.
- Membuat dan mengirim laporan kondisi harian kucing (foto + catatan) yang otomatis dikirim ke email pemilik.
- Membalas ulasan pelanggan dengan notifikasi email otomatis.
- Mengontrol koneksi WhatsApp Gateway (QR Pair/Scan, Logs interaksi chat bot, simulasi).

---

## 🗄️ STRUKTUR DATABASE SUPABASE

```
profiles             → Data profil user (ekstensi auth.users), role ('user'|'admin'), referral_code, neko_points
classes              → Master paket kandang ('Basic', 'Standard', 'Premium') & harga/fasilitas
bookings             → Data pesanan penitipan, status, tanggal, offline QR token, payment info
cat_reports          → Laporan harian kondisi kesehatan kucing dari admin
notifications        → Notifikasi in-app realtime untuk user & admin
reviews              → Ulasan dan rating bintang 1-5 beserta balasan admin
promos               → Voucher promo diskon transaksi
whatsapp_bot_state   → Status live koneksi Baileys WhatsApp bot (QR, status, phone)
whatsapp_logs        → Riwayat log pesan masuk & keluar interaksi chat bot WhatsApp
```

---

## 💼 ATURAN BISNIS & FORMULA KALKULASI

1. **Estimasi Biaya Normal**:
   $$\text{Total Biaya} = (\text{check\_out\_date} - \text{check\_in\_date}) \times \text{price\_per\_day}$$

2. **Pengambilan Lebih Cepat (Refund 90%)**:
   $$\text{Refund} = (\text{check\_out\_date} - \text{actual\_checkout}) \times \text{price\_per\_day} \times 0.90$$

3. **Keterlambatan Pengambilan (Denda Akumulatif 8% Harian)**:
   $$\text{Denda Hari ke-}n = \text{price\_per\_day} \times 1.08^n$$
   $$\text{Total Denda} = \sum_{i=1}^{\text{late\_days}} \lfloor \text{price\_per\_day} \times 1.08^i \rfloor$$

4. **Kalkulasi Checkout Kasir**:
   $$\text{Total Pembayaran Akhir} = \text{estimated\_total} + \text{late\_fee\_total} - \text{refund\_amount} - \text{discount\_amount}$$

---

## 🔒 STANDAR KEAMANAN & ARSITEKTUR KODE

1. **Validasi Input**: Seluruh payload request API wajib divalidasi menggunakan Zod Schemas di [`lib/validations/booking.js`](../../lib/validations/booking.js).
2. **Otorisasi Server**:
   - Gunakan [`verifyAdmin(supabase)`](../../lib/supabase/admin.js) untuk melindungi rute admin.
   - Gunakan [`verifyBookingAccess(supabase, bookingId)`](../../lib/supabase/admin.js) untuk memastikan isolasi data antar pengguna.
3. **Format Respons Standar & Sanitasi Error**: Seluruh API route menggunakan helper terpusat di [`lib/utils/response.js`](../../lib/utils/response.js) (`apiSuccess`, `apiError`) yang terintegrasi dengan sanitasi error [`lib/utils/errors.js`](../../lib/utils/errors.js) untuk mencegah kebocoran informasi sensitif di mode produksi (OWASP A04/A05).
4. **Antarmuka Error Ramah Pengguna**: Gunakan komponen [`UserErrorAlert`](../../components/shared/UserErrorAlert.jsx) yang menyajikan pesan empati dari perspektif pengguna beserta tips aksi solutif.
5. **Testing Suite**: Jalankan `npm test` untuk memvalidasi 141 skenario pengujian bisnis dan keamanan sebelum perubahan dipublikasikan.
