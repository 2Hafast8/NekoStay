# NekoStay — API Specification & Endpoint Registry

> Spesifikasi teknis REST API lengkap untuk platform **NekoStay**.
> Sesuai standar skill `code-documentation-doc-generate` & `backend-security-coder`.

---

## 🔐 Tingkat Otorisasi (Auth Levels)
* **Public**: Dapat diakses tanpa login.
* **Authenticated (User)**: Memerlukan sesi user terotentikasi via cookie/bearer token.
* **Owner Only**: Memerlukan sesi user dan kepemilikan resource (`user_id === user.id`).
* **Admin Only**: Memerlukan akun dengan peran `role = 'admin'`.
* **Cron Secret**: Memerlukan header `Authorization: Bearer <CRON_SECRET>`.
* **Webhook Signature**: Memerlukan verifikasi signature SHA512 (Midtrans).

---

## 📋 Daftar 30 API Endpoints

### 1. Booking Endpoints (`/api/bookings`)

| Endpoint | Method | Auth Level | Deskripsi |
|---|---|---|---|
| `/api/bookings` | `POST` | Authenticated | Membuat pesanan penitipan kucing baru. |
| `/api/bookings/bulk` | `POST` | Admin Only | Menyetujui atau menolak pesanan secara massal. |
| `/api/bookings/[id]/confirm` | `POST` | Admin Only | Mengonfirmasi pesanan ('Menunggu'/'Antrian' → 'Aktif'). |
| `/api/bookings/[id]/reject` | `POST` | Admin Only | Menolak pesanan dengan alasan penolakan. |
| `/api/bookings/[id]/cancel` | `POST` | Owner Only | Membatalkan pesanan yang belum disetujui admin. |
| `/api/bookings/[id]/edit` | `PUT` | Admin Only | Mengubah kelas kamar atau tanggal sewa pesanan. |
| `/api/bookings/[id]/receipt` | `GET` | Owner / Admin | Mengunduh file PDF bukti pemesanan resmi. |
| `/api/bookings/[id]/resend-receipt` | `POST` | Admin Only | Mengirim ulang bukti pemesanan PDF ke email user. |
| `/api/bookings/[id]/payment-status` | `PATCH` | Admin Only | Memperbarui status pembayaran secara manual. |
| `/api/bookings/[id]/report` | `POST` | Admin Only | Menambahkan laporan harian kondisi kucing. |
| `/api/bookings/[id]/wa-request-change` | `POST` | Owner / Admin | Notifikasi admin saat user mengajukan perubahan via WA. |

---

### 2. Payment Endpoints (`/api/payments`)

| Endpoint | Method | Auth Level | Deskripsi |
|---|---|---|---|
| `/api/payments/create` | `POST` | Authenticated | Menginisiasi transaksi Snap Midtrans untuk pembayaran online. |
| `/api/payments/webhook` | `POST` | Webhook Signature | Callback notifikasi status pembayaran dari server Midtrans. |
| `/api/payments/scan-offline` | `POST` | Admin Only | Memvalidasi pemindaian QR token pembayaran tunai di kasir. |
| `/api/payments/send-receipt` | `POST` | Owner / Admin | Mengirimkan bukti pembayaran PDF ke email pelanggan. |
| `/api/payments/check-status` | `GET` | Authenticated | Cek status transaksi pembayaran terkini. |
| `/api/payments/sandbox-mock` | `POST` | Admin Only | Simulasi pembayaran untuk pengujian sandbox lokal. |

---

### 3. Review Endpoints (`/api/reviews`)

| Endpoint | Method | Auth Level | Deskripsi |
|---|---|---|---|
| `/api/reviews` | `GET` | Public | Mengambil daftar ulasan publik terbaru. |
| `/api/reviews` | `POST` | Owner Only | Mengirimkan ulasan untuk pesanan berstatus 'Selesai'. |
| `/api/reviews/reply` | `POST` | Admin Only | Membalas ulasan pelanggan dan mengirim email. |

---

### 4. Referral & Promo Endpoints

| Endpoint | Method | Auth Level | Deskripsi |
|---|---|---|---|
| `/api/referral/verify` | `GET` | Public / User | Memverifikasi kevalidan kode referral dan kuota 1x pakai. |
| `/api/referral/award-points` | `POST` | Owner / Admin | Menambahkan poin reward ke akun pemilik referral. |
| `/api/promos/verify` | `GET` | Public | Memvalidasi kode voucher promo dan menghitung diskon. |

---

### 5. WhatsApp Gateway Endpoints (`/api/whatsapp`)

| Endpoint | Method | Auth Level | Deskripsi |
|---|---|---|---|
| `/api/whatsapp/status` | `GET` | Admin Only | Memeriksa status koneksi WhatsApp Gateway (QR / Connected). |
| `/api/whatsapp/connect` | `POST` | Admin Only | Menginisialisasi koneksi socket Baileys WhatsApp. |
| `/api/whatsapp/disconnect` | `POST` | Admin Only | Memutuskan sesi WhatsApp dan membersihkan credentials. |
| `/api/whatsapp/logs` | `GET` | Admin Only | Mengambil riwayat log pesan masuk dan keluar WhatsApp. |
| `/api/whatsapp/simulate` | `POST` | Admin Only | Simulasi interaksi chat bot WhatsApp untuk pengujian internal. |

---

### 6. Authentication & Cron Endpoints

| Endpoint | Method | Auth Level | Deskripsi |
|---|---|---|---|
| `/api/auth/callback` | `GET` | Public | Handler OAuth & Email Verification callback Supabase. |
| `/api/auth/notify-password-changed` | `POST` | Authenticated | Mengirim alert keamanan in-app & email setelah reset password. |
| `/api/cron/check-late` | `GET` | Cron Secret | Cron harian perhitungan akumulatif denda 8% keterlambatan. |

