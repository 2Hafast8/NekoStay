# NekoStay — Security Audit & Compliance Report

> Laporan Audit Keamanan, DevSecOps, Analisis Kerentanan OWASP Top 10, dan Kepatuhan Privasi Data Platform **NekoStay**.
> Disusun berdasarkan skill `security-auditor`, `backend-security-coder`, `frontend-security-coder`, dan `security-compliance-compliance-check`.

---

## 🛡️ 1. Matriks Evaluasi OWASP Top 10

| No | Kategori OWASP | Status | Implementasi & Proteksi di NekoStay |
|---|---|---|---|
| **A01:2021** | **Broken Access Control** | ✅ Aman | - Validasi `verifyAdmin()` pada seluruh endpoint manajemen (`bulk`, `confirm`, `reject`, `edit`, `scan-offline`, `whatsapp`).<br>- Validasi `verifyBookingAccess()` untuk memastikan pemilik pesanan hanya dapat mengakses resource miliknya (`receipt`, `cancel`, `wa-request-change`).<br>- RLS (Row Level Security) aktif di semua tabel Supabase.<br>- **Open Redirect Guard**: Sanitasi URL pengalihan di callback autentikasi (`sanitizeRedirectPath`) mencegah eksfiltrasi token auth ke domain luar. |
| **A02:2021** | **Cryptographic Failures** | ✅ Aman | - Komunikasi HTTPS wajib dengan HSTS `max-age=63072000; includeSubDomains; preload`.<br>- Verifikasi SHA512 signature key untuk webhook Midtrans.<br>- Supabase Auth menggunakan enkripsi hash bcrypt/argon2 standar industri. |
| **A03:2021** | **Injection** | ✅ Aman | - Semua query database menggunakan PostgreSQL parameterized queries via Supabase JS SDK (mencegah SQL Injection).<br>- Validasi tipe data dan batasan panjang string ketat via Zod Schemas (`lib/validations/booking.js`).<br>- **Email HTML Injection Guard**: Seluruh template email transaksional di [`lib/email/resend.js`](../lib/email/resend.js) dibersihkan dengan helper `escapeHtml()` untuk mencegah Stored XSS.<br>- **Client MIME Whitelisting**: Pemeriksaan format file gambar di sisi browser hanya menerima `image/jpeg`, `image/png`, dan `image/webp`. |
| **A04:2021** | **Insecure Design** | ✅ Aman | - Race-condition prevention saat pembatalan pesanan menggunakan lock atomik (`.eq('status', 'Menunggu')`).<br>- QR token pembayaran offline berbatas waktu 24 jam dan bersifat *one-time use* (`offline_token_used = true`).<br>- **In-Memory Sliding-Window Rate Limiter**: Endpoint verifikasi kupon dan referral dibatasi 30 request/menit per IP dengan auto-pruning memori (`lib/utils/rate-limit.js`). |
| **A05:2021** | **Security Misconfiguration** | ✅ Aman | - Header keamanan modern di `next.config.mjs`: `Content-Security-Policy: frame-ancestors 'none'`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-DNS-Prefetch-Control: on`, `Permissions-Policy`.<br>- Proteksi endpoint cron dengan bearer secret token. |
| **A06:2021** | **Vulnerable & Outdated Components** | ✅ Aman | - Next.js 16.2.6 & React 19 dengan dependensi terkunci di `package-lock.json`.<br>- Pemindaian dependensi berkala via `npm audit`.<br>- Migrasi library WhatsApp ke paket resmi `@whiskeysockets/baileys`. |
| **A07:2021** | **Identification & Authentication Failures** | ✅ Aman | - Autentikasi sesi ganda via `@supabase/ssr` (Server Component cookie validation & client token refresh).<br>- **Cloudflare Turnstile Captcha**: Seluruh formulir Login, Registrasi, dan Lupa Password diproteksi dengan verifikasi bot Turnstile.<br>- Endpoint `notify-password-changed` hanya menerima sesi terotentikasi valid. |
| **A08:2021** | **Software & Data Integrity Failures** | ✅ Aman | - Integritas webhook pembayaran divalidasi via HMAC/SHA512.<br>- Proteksi data referral point awarding terikat dengan UUID booking valid. |
| **A09:2021** | **Security Logging & Monitoring Failures** | ✅ Aman | - Structured logging di seluruh controller API tanpa mengekspos credential rahasia.<br>- Seluruh interaksi bot WhatsApp dicatat ke `whatsapp_logs`. |
| **A10:2021** | **Server-Side Request Forgery (SSRF) & Resource Starvation** | ✅ Aman | - URL gambar dan resource eksternal divalidasi format URL skema HTTPS valid.<br>- **Outbound API Fetch Timeout**: Panggilan ke API Midtrans dibatasi dengan `AbortSignal.timeout(10000)` guna mencegah ancaman *hanging socket* dan kehabisan memori server. |

---

## 🔒 2. Kepatuhan Privasi Data & Compliance (GDPR / PDP)

1. **Prinsip Minimisasi Data**: Data kucing dan kontak pemilik hanya disimpan untuk keperluan operasional penitipan dan pengiriman notifikasi/struk.
2. **Hak Akses & Penghapusan**: Kebijakan Foreign Key `ON DELETE CASCADE` memastikan jika akun pengguna dihapus, data relasi pesanan, ulasan, dan notifikasi ikut terhapus secara bersih.
3. **Privasi Bukti Transaksi**: Endpoint pengunduhan struk PDF (`/api/bookings/[id]/receipt`) diamankan sehingga pihak ketiga tanpa hak otorisasi tidak dapat mengintip identitas atau tagihan pelanggan lain.

---

## 🛡️ 3. Ringkasan Pengerasan Keamanan (Security Hardening Highlights)

| Komponen | Proteksi | Lokasi File |
|---|---|---|
| **CSP Anti-Clickjacking** | `frame-ancestors 'none'`, `X-Frame-Options: DENY` | [`next.config.mjs`](../next.config.mjs) |
| **Open Redirect Defense** | Sanitasi URL redirect auth callback | [`app/api/auth/callback/route.js`](../app/api/auth/callback/route.js) |
| **Rate Limiter** | Sliding window 30 req/min per IP | [`lib/utils/rate-limit.js`](../lib/utils/rate-limit.js) |
| **Email HTML Sanitizer** | `escapeHtml` entitas karakter rawan XSS | [`lib/email/resend.js`](../lib/email/resend.js) |
| **MIME Validation** | Client-side allowlist (`jpeg`, `png`, `webp`) | [`components/booking/BookingForm.jsx`](../components/booking/BookingForm.jsx) |
| **Outbound Timeout** | `AbortSignal.timeout(10000)` pada Midtrans | [`app/api/payments/check-status/route.js`](../app/api/payments/check-status/route.js) |
| **Anti-Bot Captcha** | Cloudflare Turnstile token validation | [`components/shared/SupabaseCaptcha.jsx`](../components/shared/SupabaseCaptcha.jsx) |

