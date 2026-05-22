# CLAUDE.md — NekoStay Project

> File ini adalah panduan konteks proyek untuk Claude Code.
> Letakkan file ini di **root folder** project Next.js kamu.
> Claude akan membaca file ini secara otomatis setiap kali bekerja di project ini.

---

## IDENTITAS PROYEK

| Key | Value |
|---|---|
| **Nama Proyek** | NekoStay |
| **Deskripsi** | Platform web pemesanan jasa penitipan kucing berbasis online |
| **Framework** | Next.js 14+ (App Router) |
| **Database** | Supabase (PostgreSQL + Auth + Storage + Realtime) |
| **Styling** | Tailwind CSS + shadcn/ui |
| **Email** | Resend |
| **Deploy** | Vercel |
| **Bahasa Utama** | TypeScript |

---

## PERAN PENGGUNA DALAM SISTEM

Sistem memiliki **2 role** yang harus selalu diperhatikan saat menulis kode:

### `user` — Pemilik Kucing
- Daftar/login dengan email & password
- Membuat pesanan penitipan kucing
- Memantau status pesanan dan laporan kondisi kucing
- Membatalkan pesanan (hanya saat status `Menunggu` atau `Aktif`)
- Menerima email & notifikasi in-app

### `admin` — Pengelola Penitipan
- Memproses pesanan masuk (konfirmasi / tolak)
- Mengubah status pesanan (`Menunggu` → `Aktif` → `Selesai`)
- Mengirim laporan kondisi kucing setiap 2 hari sekali
- Memperbarui data pesanan jika ada perubahan class/tanggal dari user
- Melihat dashboard statistik & grafik

> **PENTING**: Role disimpan di tabel `profiles.role`. Middleware wajib cek role sebelum render halaman admin.

---

## STRUKTUR DATABASE — RINGKASAN CEPAT

### Tabel Utama

```
profiles         → Data user (ekstensi auth.users)
bookings         → Data pesanan penitipan
cat_reports      → Laporan kondisi kucing dari admin
notifications    → Notifikasi in-app user/admin
classes          → Data kelas & harga penitipan
```

### Status Pesanan & Transisinya

```
Menunggu  ──(admin konfirmasi)──→  Aktif
Menunggu  ──(admin tolak)───────→  Dibatalkan
Menunggu  ──(user cancel)───────→  Dibatalkan
Aktif     ──(admin selesai)─────→  Selesai
Aktif     ──(user cancel)───────→  Dibatalkan
```

### Kelas & Harga Penitipan

| Class | Harga/Hari |
|---|---|
| `Basic` | Rp 50.000 |
| `Standard` | Rp 80.000 |
| `Premium` | Rp 130.000 |

---

## ATURAN BISNIS KRITIKAL

Selalu ikuti aturan ini saat menulis logika apapun yang berhubungan dengan pesanan dan pembayaran:

### 1. Kalkulasi Harga Normal
```
Total Biaya = total_days × price_per_day
total_days  = check_out_date - check_in_date
```

### 2. Pengambilan Lebih Cepat → REFUND
```
sisa_hari    = check_out_date - actual_checkout
refund       = sisa_hari × price_per_day × 0.90   (90%)
```

### 3. Pengambilan Terlambat → DENDA AKUMULATIF
```
Hari ke-N denda = price_per_day × 1.08^N

Contoh (Standard Rp 80.000/hari):
  Hari +1 terlambat = 80.000 × 1.08¹ = Rp 86.400
  Hari +2 terlambat = 80.000 × 1.08² = Rp 93.312
  Hari +N terlambat = 80.000 × 1.08^N
```

### 4. Pembatalan Pesanan
- User **wajib** mengisi alasan pembatalan
- Pesanan **TIDAK dihapus** dari database — hanya status berubah ke `Dibatalkan`
- Simpan alasan di kolom `cancel_reason`

### 5. Penolakan oleh Admin
- Admin **wajib** mengisi alasan penolakan
- Simpan alasan di kolom `reject_reason`
- Kirim email notifikasi ke user dengan alasan tersebut

### 6. Laporan Kucing
- Dikirim admin setiap **2 hari sekali** selama pesanan berstatus `Aktif`
- Berisi: status kesehatan, foto terbaru, catatan
- Dikirim via **email** (Resend) + disimpan di tabel `cat_reports`
- Bisa dilihat user di halaman detail pesanan

### 7. Perubahan Class / Perpanjangan Hari
- Tidak ada form khusus di website untuk user
- User menghubungi admin via **WhatsApp** (nomor tertera di website)
- Admin memperbarui data di tabel `bookings` melalui panel admin
- Sistem otomatis recalculate total biaya

---

## KONVENSI KODE

### Naming Convention
```typescript
// Komponen React → PascalCase
BookingForm.tsx
AdminDashboard.tsx
CatReportCard.tsx

// File utilitas & hooks → camelCase
useBookings.ts
pricing.ts
dates.ts

// API Routes → kebab-case folder
/api/bookings/[id]/cancel/route.ts
/api/cron/check-late/route.ts

// Variabel & fungsi → camelCase
const totalDays = ...
function calculateRefund() {}

// Konstanta global → UPPER_SNAKE_CASE
const CLASS_PRICES = { Basic: 50000, ... }
const REFUND_PERCENTAGE = 0.90
const LATE_FEE_MULTIPLIER = 1.08
```

### TypeScript Types Utama
```typescript
// Selalu gunakan types ini, jangan buat ulang
type UserRole = 'user' | 'admin'
type BookingStatus = 'Menunggu' | 'Aktif' | 'Selesai' | 'Dibatalkan'
type CatGender = 'Jantan' | 'Betina'
type CatHealth = 'Sehat' | 'Sakit' | 'Dalam Pengobatan'
type CatReportHealth = 'Sehat' | 'Kurang Fit' | 'Perlu Perhatian'
type BookingClass = 'Basic' | 'Standard' | 'Premium'
```

### Import Order (selalu urutan ini)
```typescript
// 1. React & Next.js
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

// 2. Third-party libraries
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

// 3. Internal — lib & utils
import { createClient } from '@/lib/supabase/client'
import { calculateRefund } from '@/lib/utils/pricing'

// 4. Internal — components
import { BookingCard } from '@/components/booking/BookingCard'

// 5. Internal — types
import type { Booking, Profile } from '@/types'
```

### Supabase Client — Kapan Pakai Yang Mana
```typescript
// Komponen Client (CSC) — pakai browser client
'use client'
import { createClient } from '@/lib/supabase/client'

// Server Component / API Route / Server Action — pakai server client
import { createClient } from '@/lib/supabase/server'
// ⚠️ Selalu await createClient() karena dia async
const supabase = await createClient()
```

---

## ATURAN PENGEMBANGAN

### Yang HARUS dilakukan:
- ✅ Selalu validasi input dengan **Zod** di sisi server (API Routes)
- ✅ Selalu cek **session & role** di setiap API Route sebelum operasi DB
- ✅ Gunakan **RLS Supabase** sebagai lapisan keamanan data
- ✅ Gunakan `SUPABASE_SERVICE_ROLE_KEY` hanya di server-side (API Routes)
- ✅ Tangani semua error dari Supabase dengan `try/catch` dan return response yang jelas
- ✅ Format angka rupiah selalu dengan `toLocaleString('id-ID')` → `Rp 80.000`
- ✅ Format tanggal selalu dengan `date-fns` dan locale `id` (Bahasa Indonesia)
- ✅ Foto kucing diupload ke **Supabase Storage**, simpan URL-nya di database
- ✅ Setiap perubahan status pesanan **wajib** diikuti notifikasi (in-app + email)

### Yang DILARANG:
- ❌ Jangan expose `SUPABASE_SERVICE_ROLE_KEY` ke client-side / `NEXT_PUBLIC_`
- ❌ Jangan hapus data pesanan dari database (gunakan status `Dibatalkan`)
- ❌ Jangan biarkan user mengakses atau memodifikasi data milik user lain
- ❌ Jangan skip validasi server-side meski sudah ada validasi client-side
- ❌ Jangan buat logika kalkulasi harga di luar `lib/utils/pricing.ts`
- ❌ Jangan gunakan `any` di TypeScript tanpa alasan yang kuat

---

## ENVIRONMENT VARIABLES

```bash
# File: .env.local (JANGAN commit ke git)

# Supabase — public (aman di client)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Supabase — secret (server only)
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Email
RESEND_API_KEY=re_xxxxx

# Cron security
CRON_SECRET=random-string-panjang-dan-unik

# App
NEXT_PUBLIC_APP_URL=https://nekostay.vercel.app
NEXT_PUBLIC_ADMIN_WHATSAPP=628xxxxxxxxxx
```

---

## ALUR KERJA FITUR — REFERENSI CEPAT

### Saat membuat fitur baru, ikuti urutan ini:
1. **Buat/update tabel Supabase** (jika perlu schema baru)
2. **Tambahkan RLS policy** yang sesuai
3. **Definisikan TypeScript type** di `types/index.ts`
4. **Buat API Route** di `app/api/` dengan validasi Zod
5. **Buat custom hook** di `hooks/` jika data dipakai banyak komponen
6. **Buat komponen UI** di `components/`
7. **Buat halaman** di `app/`
8. **Test** skenario user & admin

### Saat ada bug terkait auth/akses:
1. Cek `middleware.ts` — apakah route sudah diproteksi?
2. Cek RLS policy di Supabase dashboard
3. Cek apakah API Route memverifikasi session & role
4. Cek apakah menggunakan client yang benar (browser vs server)

---

## TESTING MANUAL — SKENARIO WAJIB

Sebelum deploy, pastikan semua skenario ini berjalan:

```
[ ] Register user baru → verifikasi email → login
[ ] Buat pesanan baru (isi semua field + upload foto)
[ ] Admin konfirmasi pesanan → cek email user
[ ] Admin tolak pesanan → cek email user (ada alasan)
[ ] User batal pesanan saat Menunggu → cek alasan tersimpan
[ ] Admin kirim laporan kucing → cek email user
[ ] Simulasi keterlambatan → cek denda terhitung benar
[ ] Simulasi pengambilan lebih cepat → cek refund 90%
[ ] Cek notifikasi realtime muncul tanpa refresh
[ ] Cek halaman admin tidak bisa diakses user biasa
[ ] Cek data user lain tidak bisa diakses user lain
```

---

## KONTAK & REFERENSI

- **Supabase Docs**: https://supabase.com/docs
- **Next.js App Router**: https://nextjs.org/docs/app
- **shadcn/ui**: https://ui.shadcn.com
- **Resend Docs**: https://resend.com/docs
- **date-fns**: https://date-fns.org
- **Vercel Cron**: https://vercel.com/docs/cron-jobs
- **Tailwind CSS**: https://tailwindcss.com/docs

---

*File ini diperbarui setiap ada perubahan arsitektur signifikan pada project NekoStay.*
