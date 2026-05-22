# 🐱 NekoStay — Rancangan Teknis Website
**Platform Web Pemesanan Jasa Penitipan Kucing Berbasis Online**

> Disusun oleh: Professional Developer Blueprint  
> Stack: Next.js · Supabase · Vercel  
> Bahasa: JavaScript (`.js` / `.jsx`)  
> Versi: 1.0

---

## DAFTAR ISI

1. [Ringkasan Proyek](#1-ringkasan-proyek)
2. [Arsitektur Sistem](#2-arsitektur-sistem)
3. [Tech Stack & Tools](#3-tech-stack--tools)
4. [Struktur Database (Supabase)](#4-struktur-database-supabase)
5. [Struktur Folder Next.js](#5-struktur-folder-nextjs)
6. [Halaman & Routing](#6-halaman--routing)
7. [Fitur Detail & Alur Kerja](#7-fitur-detail--alur-kerja)
8. [Sistem Autentikasi](#8-sistem-autentikasi)
9. [Sistem Pembayaran & Kalkulasi](#9-sistem-pembayaran--kalkulasi)
10. [Sistem Notifikasi & Email](#10-sistem-notifikasi--email)
11. [Deployment Vercel](#11-deployment-vercel)
12. [Timeline Pengerjaan](#12-timeline-pengerjaan)
13. [Checklist Developer](#13-checklist-developer)

---

## 1. RINGKASAN PROYEK

NekoStay adalah platform web yang menghubungkan **pemilik kucing (User)** dengan **pengelola penitipan (Admin)**. Sistem memiliki dua peran utama dengan akses dan fitur yang berbeda, dibangun di atas arsitektur modern berbasis Next.js App Router, database real-time Supabase, dan dideploy di Vercel.

### Tujuan Utama Sistem:
- Memudahkan pemesanan penitipan kucing secara online
- Memberikan transparansi status penitipan secara real-time
- Mengirim laporan kondisi kucing setiap 2 hari sekali
- Mengelola pembayaran dengan skenario refund dan denda keterlambatan

---

## 2. ARSITEKTUR SISTEM

```
┌─────────────────────────────────────────────────────────┐
│                        CLIENT                           │
│              Browser (User / Admin)                     │
└─────────────────────┬───────────────────────────────────┘
                      │ HTTPS
┌─────────────────────▼───────────────────────────────────┐
│                   NEXT.JS (App Router)                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │  Pages/UI    │  │ API Routes   │  │  Middleware  │   │
│  │ (RSC + CSC)  │  │ (/api/*)     │  │ (Auth Guard) │   │
│  └──────────────┘  └──────────────┘  └──────────────┘   │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│                     SUPABASE                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │  PostgreSQL  │  │  Auth        │  │  Storage     │   │
│  │  (Database)  │  │  (JWT/OAuth) │  │ (Foto Kucing)│   │
│  └──────────────┘  └──────────────┘  └──────────────┘   │
│  ┌──────────────┐  ┌──────────────┐                     │
│  │  Realtime    │  │  Edge Func   │                     │
│  │  (Notifikasi)│  │  (Scheduler) │                     │
│  └──────────────┘  └──────────────┘                     │
└─────────────────────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│                EXTERNAL SERVICES                        │
│        Resend / Nodemailer (Email Notification)         │
└─────────────────────────────────────────────────────────┘
```

---

## 3. TECH STACK & TOOLS

| Kategori | Teknologi | Keterangan |
|---|---|---|
| **Framework** | Next.js 14+ (App Router) | SSR, API Routes, Middleware |
| **Database** | Supabase (PostgreSQL) | Cloud DB + Auth + Storage |
| **Auth** | Supabase Auth | Email/Password, JWT Session |
| **Styling** | Tailwind CSS | Utility-first CSS |
| **UI Components** | shadcn/ui | Komponen siap pakai |
| **Form Handling** | React Hook Form + Zod | Validasi form & schema |
| **State Management** | Zustand / React Context | State global ringan |
| **Email** | Resend | Kirim email transaksional |
| **Storage** | Supabase Storage | Upload foto kucing |
| **Date Handling** | date-fns | Kalkulasi hari & tanggal |
| **Charts** | Recharts | Grafik dashboard admin |
| **Deploy** | Vercel | Hosting + CI/CD otomatis |
| **Env Management** | `.env.local` | Variabel lingkungan |

### Package Dependencies Utama:
```bash
# Init project
npx create-next-app@latest nekostay --js --tailwind --app

# Install dependencies
npm install @supabase/supabase-js @supabase/ssr
npm install react-hook-form @hookform/resolvers zod
npm install date-fns
npm install resend
npm install recharts
npm install zustand
npm install lucide-react
npx shadcn-ui@latest init
```

---

## 4. STRUKTUR DATABASE (SUPABASE)

### 4.1 Tabel `profiles`
Ekstensi dari `auth.users` Supabase untuk menyimpan data profil user.

```sql
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT NOT NULL,
  phone       TEXT,
  role        TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

---

### 4.2 Tabel `bookings`
Inti sistem — menyimpan seluruh data pemesanan.

```sql
CREATE TABLE bookings (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Data Kucing
  cat_name            TEXT NOT NULL,
  cat_gender          TEXT NOT NULL CHECK (cat_gender IN ('Jantan', 'Betina')),
  cat_age             TEXT NOT NULL,
  cat_health_status   TEXT NOT NULL CHECK (cat_health_status IN ('Sehat', 'Sakit', 'Dalam Pengobatan')),
  cat_favorite_food   TEXT,
  cat_is_pregnant     BOOLEAN DEFAULT FALSE,
  cat_notes           TEXT,
  cat_photo_url       TEXT,

  -- Data Pemesanan
  class               TEXT NOT NULL CHECK (class IN ('Basic', 'Standard', 'Premium')),
  price_per_day       INTEGER NOT NULL,
  check_in_date       DATE NOT NULL,
  check_out_date      DATE NOT NULL,
  total_days          INTEGER GENERATED ALWAYS AS (check_out_date - check_in_date) STORED,
  estimated_total     INTEGER GENERATED ALWAYS AS ((check_out_date - check_in_date) * price_per_day) STORED,

  -- Status & Meta
  status              TEXT NOT NULL DEFAULT 'Menunggu' 
                        CHECK (status IN ('Menunggu', 'Aktif', 'Selesai', 'Dibatalkan')),
  cancel_reason       TEXT,
  reject_reason       TEXT,
  actual_checkout     DATE,
  late_fee_total      INTEGER DEFAULT 0,
  refund_amount       INTEGER DEFAULT 0,

  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);
```

---

### 4.3 Tabel `cat_reports`
Laporan kondisi kucing yang dikirim admin setiap 2 hari sekali.

```sql
CREATE TABLE cat_reports (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id      UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  admin_id        UUID NOT NULL REFERENCES profiles(id),

  health_status   TEXT NOT NULL CHECK (health_status IN ('Sehat', 'Kurang Fit', 'Perlu Perhatian')),
  photo_url       TEXT,
  notes           TEXT,
  report_date     DATE NOT NULL DEFAULT CURRENT_DATE,

  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

---

### 4.4 Tabel `notifications`
Penyimpanan notifikasi in-app untuk user dan admin.

```sql
CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  message     TEXT NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('info', 'warning', 'success', 'error')),
  is_read     BOOLEAN DEFAULT FALSE,
  booking_id  UUID REFERENCES bookings(id),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

---

### 4.5 Tabel `classes`
Referensi data kelas penitipan (bisa dikonfigurasi admin).

```sql
CREATE TABLE classes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL CHECK (name IN ('Basic', 'Standard', 'Premium')),
  price_per_day INTEGER NOT NULL,
  description   TEXT,
  facilities    TEXT[]
);

-- Seed data awal
INSERT INTO classes (name, price_per_day, description, facilities) VALUES
('Basic',    50000,  'Kandang standar', ARRAY['Kandang standar', 'Makan 2x/hari', 'Air minum']),
('Standard', 80000,  'Kandang luas',    ARRAY['Kandang luas', 'Makan 3x/hari', 'Mainan dasar']),
('Premium',  130000, 'Ruang privat',    ARRAY['Ruang privat', 'Makan teratur', 'Grooming harian']);
```

---

### 4.6 Row Level Security (RLS) — WAJIB DIAKTIFKAN

```sql
-- Enable RLS pada semua tabel
ALTER TABLE profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings    ENABLE ROW LEVEL SECURITY;
ALTER TABLE cat_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policy: User hanya bisa lihat data sendiri
CREATE POLICY "User lihat bookings sendiri"
  ON bookings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "User buat booking"
  ON bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "User update booking sendiri (cancel)"
  ON bookings FOR UPDATE
  USING (auth.uid() = user_id AND status IN ('Menunggu'));

-- Policy: Admin bisa lihat & update semua
CREATE POLICY "Admin full access bookings"
  ON bookings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

---

### 4.7 Database Trigger — Auto Update `updated_at`

```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

---

## 5. STRUKTUR FOLDER NEXT.JS

```
nekostay/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.jsx              # Halaman login
│   │   ├── register/
│   │   │   └── page.jsx              # Halaman register
│   │   └── forgot-password/
│   │       └── page.jsx              # Lupa password
│   │
│   ├── (user)/
│   │   ├── layout.jsx                # Layout user (navbar, sidebar)
│   │   ├── dashboard/
│   │   │   └── page.jsx              # Dashboard user - list pesanan
│   │   ├── booking/
│   │   │   ├── new/
│   │   │   │   └── page.jsx          # Form pemesanan baru
│   │   │   └── [id]/
│   │   │       └── page.jsx          # Detail pesanan user
│   │   ├── profile/
│   │   │   └── page.jsx              # Edit profil user
│   │   └── notifications/
│   │       └── page.jsx              # Notifikasi user
│   │
│   ├── (admin)/
│   │   ├── layout.jsx                # Layout admin (sidebar)
│   │   ├── admin/
│   │   │   ├── dashboard/
│   │   │   │   └── page.jsx          # Dashboard admin + statistik
│   │   │   ├── bookings/
│   │   │   │   ├── page.jsx          # List semua pesanan
│   │   │   │   └── [id]/
│   │   │   │       └── page.jsx      # Detail & kelola pesanan
│   │   │   ├── reports/
│   │   │   │   └── page.jsx          # Kirim laporan kondisi kucing
│   │   │   └── settings/
│   │   │       └── page.jsx          # Setting kelas & harga
│   │
│   ├── api/
│   │   ├── auth/
│   │   │   └── callback/
│   │   │       └── route.js          # Supabase OAuth callback
│   │   ├── bookings/
│   │   │   ├── route.js              # GET list, POST buat booking
│   │   │   └── [id]/
│   │   │       ├── route.js          # GET detail, PATCH update, DELETE cancel
│   │   │       ├── cancel/
│   │   │       │   └── route.js      # POST cancel booking
│   │   │       └── report/
│   │   │           └── route.js      # POST kirim laporan kucing
│   │   ├── notifications/
│   │   │   └── route.js              # GET & PATCH (mark as read)
│   │   └── cron/
│   │       ├── check-late/
│   │       │   └── route.js          # Cek keterlambatan harian
│   │       └── report-reminder/
│   │           └── route.js          # Reminder laporan 2 hari
│   │
│   ├── layout.jsx                    # Root layout
│   └── page.jsx                      # Landing page / redirect
│
├── components/
│   ├── ui/                           # shadcn/ui components
│   ├── auth/
│   │   ├── LoginForm.jsx
│   │   └── RegisterForm.jsx
│   ├── booking/
│   │   ├── BookingForm.jsx           # Form pemesanan lengkap
│   │   ├── BookingCard.jsx           # Kartu pesanan di list
│   │   ├── BookingDetail.jsx         # Detail pesanan
│   │   ├── BookingStatus.jsx         # Badge status
│   │   ├── PriceCalculator.jsx       # Komponen kalkulasi harga
│   │   └── ClassSelector.jsx         # Pilihan kelas
│   ├── admin/
│   │   ├── AdminBookingTable.jsx     # Tabel pesanan admin
│   │   ├── ReportForm.jsx            # Form kirim laporan
│   │   ├── StatusUpdater.jsx         # Update status pesanan
│   │   └── DashboardStats.jsx        # Statistik & grafik
│   ├── layout/
│   │   ├── Navbar.jsx
│   │   ├── UserSidebar.jsx
│   │   ├── AdminSidebar.jsx
│   │   └── NotificationBell.jsx
│   └── shared/
│       ├── ImageUpload.jsx           # Upload foto kucing
│       ├── DatePicker.jsx            # Pilih tanggal
│       └── ConfirmDialog.jsx         # Dialog konfirmasi
│
├── lib/
│   ├── supabase/
│   │   ├── client.js                 # Supabase browser client
│   │   ├── server.js                 # Supabase server client
│   │   └── middleware.js             # Supabase middleware helper
│   ├── utils/
│   │   ├── pricing.js                # Fungsi kalkulasi harga, refund, denda
│   │   ├── dates.js                  # Helper tanggal
│   │   └── cn.js                     # Class utility (shadcn)
│   ├── constants/
│   │   └── index.js                  # Konstanta enum & JSDoc referensi
│   └── email/
│       └── resend.js                 # Konfigurasi & template email
│
├── hooks/
│   ├── useBookings.js                # Custom hook data pesanan
│   ├── useNotifications.js           # Custom hook notifikasi
│   └── useUser.js                    # Custom hook data user
│
├── middleware.js                      # Auth guard & route protection
├── .env.local                         # Environment variables
└── next.config.js                     # Next.js config
```

---

## 6. HALAMAN & ROUTING

### 6.1 Route Map Lengkap

| Path | Akses | Deskripsi |
|---|---|---|
| `/` | Public | Landing page / redirect ke dashboard |
| `/login` | Public (Guest only) | Halaman login |
| `/register` | Public (Guest only) | Halaman registrasi |
| `/forgot-password` | Public | Reset password via email |
| `/dashboard` | User | Daftar pesanan milik user |
| `/booking/new` | User | Form buat pesanan baru |
| `/booking/[id]` | User (owner) | Detail pesanan + laporan kucing |
| `/profile` | User | Edit profil |
| `/notifications` | User | Notifikasi masuk |
| `/admin/dashboard` | Admin | Statistik & ringkasan |
| `/admin/bookings` | Admin | Semua pesanan + filter |
| `/admin/bookings/[id]` | Admin | Detail & manajemen pesanan |
| `/admin/reports` | Admin | Buat & lihat laporan kondisi |
| `/admin/settings` | Admin | Kelola kelas & harga |

### 6.2 Middleware Proteksi Route

```javascript
// middleware.js
import { createMiddlewareClient } from '@/lib/supabase/middleware'
import { NextResponse } from 'next/server'
export async function middleware(req) {
  const { supabase, response } = createMiddlewareClient(req)
  const { data: { session } } = await supabase.auth.getSession()

  const isAuthPage = req.nextUrl.pathname.startsWith('/login') ||
                     req.nextUrl.pathname.startsWith('/register')
  const isAdminPage = req.nextUrl.pathname.startsWith('/admin')
  const isProtectedPage = req.nextUrl.pathname.startsWith('/dashboard') ||
                          req.nextUrl.pathname.startsWith('/booking') ||
                          req.nextUrl.pathname.startsWith('/profile')

  // Redirect ke login jika belum login
  if (!session && (isProtectedPage || isAdminPage)) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Redirect ke dashboard jika sudah login tapi akses auth page
  if (session && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // Cek role admin
  if (isAdminPage && session) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/auth).*)'],
}
```

---

## 7. FITUR DETAIL & ALUR KERJA

### 7.1 Alur Registrasi & Login

```
[User buka /register]
  → Isi: Nama, Email, No. HP, Password
  → Validasi Zod (format email, min password 8 char)
  → Supabase Auth: signUp()
  → Insert ke tabel profiles (id, full_name, phone, role='user')
  → Kirim email verifikasi (via Supabase bawaan)
  → Redirect ke /login

[User buka /login]
  → Isi: Email, Password
  → Supabase Auth: signInWithPassword()
  → Cek role di tabel profiles
  → role='user'  → Redirect /dashboard
  → role='admin' → Redirect /admin/dashboard
```

---

### 7.2 Alur Pemesanan (User)

```
[User buka /booking/new]
  → Step 1: Isi Data Kucing
      - Nama, Gender, Usia, Status Kesehatan
      - Makanan Favorit, Status Hamil (jika betina)
      - Catatan Tambahan
      - Upload Foto Kucing → Supabase Storage
  
  → Step 2: Isi Data Pemesanan
      - Pilih Class (Basic/Standard/Premium)
      - Pilih Tanggal Masuk
      - Pilih Tanggal Keluar (estimasi)
      - Preview Kalkulasi Harga (auto-computed)
  
  → Step 3: Review & Konfirmasi
      - Tampilkan ringkasan semua data
      - Tombol "Kirim Pesanan"
  
  → Submit → API POST /api/bookings
      - Validasi server-side
      - Insert ke tabel bookings (status: 'Menunggu')
      - Insert notifikasi ke admin
      - Kirim email konfirmasi ke user
  
  → Redirect ke /booking/[id] (halaman detail pesanan)
```

---

### 7.3 Alur Admin Memproses Pesanan

```
[Admin melihat pesanan baru di /admin/bookings]
  → Filter: status = 'Menunggu'
  → Buka detail pesanan /admin/bookings/[id]
  → Lihat semua data kucing & pemesanan
  
  → Pilih aksi:
    A. KONFIRMASI → Update status: 'Menunggu' → 'Aktif'
       - Kirim notifikasi + email ke user: "Pesanan Anda dikonfirmasi"
    
    B. TOLAK → Modal isi alasan penolakan
       - Update status: 'Menunggu' → 'Dibatalkan'
       - Simpan reject_reason di tabel bookings
       - Kirim notifikasi + email ke user dengan alasan

[Pesanan status 'Aktif']
  → Admin bisa klik "Tandai Selesai"
  → Isi actual_checkout date
  → Sistem hitung: lebih cepat/terlambat?
  → Update status: 'Aktif' → 'Selesai'
```

---

### 7.4 Alur Pembatalan oleh User

```
[User di halaman /booking/[id]]
  → Tombol "Batalkan Pesanan" (hanya muncul jika status = 'Menunggu' atau 'Aktif')
  → Modal konfirmasi: isi alasan pembatalan (wajib diisi)
  → Submit → API POST /api/bookings/[id]/cancel
      - Simpan cancel_reason
      - Update status → 'Dibatalkan'
      - Kirim notifikasi ke admin
  → Pesanan tetap ada di database (tidak dihapus), hanya statusnya berubah
  → Ditampilkan dengan badge "Dibatalkan" di dashboard
```

> **Catatan Developer**: Pesanan tidak benar-benar dihapus dari DB (soft delete via status). Ini penting untuk histori data admin.

---

### 7.5 Alur Laporan Kondisi Kucing (Admin → User)

```
[Admin buka /admin/reports]
  → List pesanan dengan status 'Aktif'
  → Pilih pesanan kucing yang akan dilaporkan
  → Isi Form Laporan:
      - Status Kesehatan (Sehat / Kurang Fit / Perlu Perhatian)
      - Upload Foto Kucing terbaru → Supabase Storage
      - Catatan (opsional)
  
  → Submit → API POST /api/bookings/[id]/report
      - Insert ke tabel cat_reports
      - Kirim email ke user dengan detail laporan + foto
      - Insert notifikasi in-app ke user
  
[User buka /booking/[id]]
  → Bisa melihat semua riwayat laporan kondisi kucing
  → Terurut dari terbaru ke terlama
```

---

## 8. SISTEM AUTENTIKASI

### 8.1 Setup Supabase Client

```javascript
// lib/supabase/client.js (untuk komponen browser/CSC)
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

```javascript
// lib/supabase/server.js (untuk Server Components & API Routes)
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}
```

### 8.2 Lupa Password Flow

```
User klik "Lupa Password" di /login
  → Isi email di /forgot-password
  → Supabase: resetPasswordForEmail(email, { redirectTo: '/update-password' })
  → User dapat email dengan link reset
  → User klik link → redirect ke /update-password
  → User isi password baru
  → Supabase: updateUser({ password: newPassword })
  → Redirect ke /login
```

---

## 9. SISTEM PEMBAYARAN & KALKULASI

### 9.1 Utility Fungsi Pricing

```javascript
// lib/utils/pricing.js

export const CLASS_PRICES = {
  Basic:    50000,
  Standard: 80000,
  Premium:  130000,
}

/**
 * Hitung estimasi total biaya pemesanan
 */
export function calculateEstimatedTotal(pricePerDay, checkIn, checkOut) {
  const days = differenceInDays(checkOut, checkIn)
  return days * pricePerDay
}

/**
 * Hitung refund jika pengambilan lebih cepat
 * Refund = sisa_hari × harga/hari × 90%
 */
export function calculateRefund(pricePerDay, scheduledCheckout, actualCheckout) {
  const remainingDays = differenceInDays(scheduledCheckout, actualCheckout)
  if (remainingDays <= 0) return 0
  return Math.floor(remainingDays * pricePerDay * 0.9)
}

/**
 * Hitung denda keterlambatan (akumulatif naik 8% per hari)
 * Hari ke-1: harga × 1.08
 * Hari ke-2: harga × 1.08²
 * Hari ke-n: harga × 1.08^n
 */
export function calculateLateFee(pricePerDay, scheduledCheckout, actualCheckout) {
  const lateDays = differenceInDays(actualCheckout, scheduledCheckout)
  if (lateDays <= 0) return { totalFee: 0, breakdown: [] }

  const breakdown = []
  let totalFee = 0

  for (let i = 1; i <= lateDays; i++) {
    const fee = Math.floor(pricePerDay * Math.pow(1.08, i))
    breakdown.push({ day: i, fee })
    totalFee += fee
  }

  return { totalFee, breakdown }
}

/**
 * Contoh output kalkulasi untuk UI preview
 */
export function getBookingSummary(className, checkIn, checkOut) {
  const pricePerDay = CLASS_PRICES[className]
  const totalDays = differenceInDays(checkOut, checkIn)
  const totalCost = totalDays * pricePerDay
  return { pricePerDay, totalDays, totalCost }
}
```

### 9.2 Skenario Pembayaran

| Skenario | Kondisi | Kalkulasi |
|---|---|---|
| Normal | actual = scheduled | Bayar sesuai estimasi |
| Lebih Cepat | actual < scheduled | Refund = sisa_hari × harga × 90% |
| Terlambat H+1 | actual = scheduled + 1 hari | Denda = harga × 1.08 |
| Terlambat H+2 | actual = scheduled + 2 hari | Denda += harga × 1.08² |
| Terlambat H+N | actual = scheduled + N hari | Denda += harga × 1.08^N |

---

## 10. SISTEM NOTIFIKASI & EMAIL

### 10.1 Notifikasi In-App (Real-time)

Gunakan **Supabase Realtime** untuk notifikasi live tanpa refresh:

```javascript
// hooks/useNotifications.js
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useNotifications(userId) {
  const supabase = createClient()
  const [notifications, setNotifications] = useState([])

  useEffect(() => {
    // Subscribe realtime changes
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      }, (payload) => {
        setNotifications(prev => [payload.new, ...prev])
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId])

  return notifications
}
```

### 10.2 Email dengan Resend

```javascript
// lib/email/resend.js
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendBookingConfirmation(
  userEmail,
  userName,
  catName,
  bookingId,
  checkIn,
  checkOut,
  className,
  totalCost
) {
  await resend.emails.send({
    from: 'NekoStay <noreply@nekostay.com>',
    to: userEmail,
    subject: `Pesanan Penitipan ${catName} Telah Diterima`,
    html: `
      <h2>Halo ${userName}! 🐱</h2>
      <p>Pesanan penitipan kucing <strong>${catName}</strong> Anda telah berhasil dibuat.</p>
      <table>
        <tr><td>Kelas</td><td>${className}</td></tr>
        <tr><td>Tanggal Masuk</td><td>${checkIn}</td></tr>
        <tr><td>Tanggal Keluar</td><td>${checkOut}</td></tr>
        <tr><td>Estimasi Biaya</td><td>Rp ${totalCost.toLocaleString('id-ID')}</td></tr>
      </table>
      <p>Pembayaran dilakukan saat pengantaran kucing.</p>
      <a href="https://nekostay.com/booking/${bookingId}">Lihat Detail Pesanan</a>
    `,
  })
}

export async function sendCatReport(
  userEmail,
  catName,
  healthStatus,
  notes,
  photoUrl,
  reportDate
) {
  await resend.emails.send({
    from: 'NekoStay <noreply@nekostay.com>',
    to: userEmail,
    subject: `Laporan Kondisi ${catName} — ${reportDate}`,
    html: `
      <h2>Laporan Kondisi Kucing 🐾</h2>
      <p>Berikut laporan kondisi <strong>${catName}</strong> hari ini:</p>
      <p><strong>Status Kesehatan:</strong> ${healthStatus}</p>
      <img src="${photoUrl}" alt="Foto ${catName}" style="max-width:400px;" />
      ${notes ? `<p><strong>Catatan:</strong> ${notes}</p>` : ''}
    `,
  })
}

export async function sendLateWarning(
  userEmail,
  catName,
  lateDays,
  additionalFee
) {
  await resend.emails.send({
    from: 'NekoStay <noreply@nekostay.com>',
    to: userEmail,
    subject: `⚠️ Peringatan Keterlambatan Pengambilan ${catName}`,
    html: `
      <h2>Peringatan Keterlambatan</h2>
      <p>Kucing <strong>${catName}</strong> belum diambil selama <strong>${lateDays} hari</strong> 
      dari jadwal yang ditentukan.</p>
      <p>Biaya tambahan hari ini: <strong>Rp ${additionalFee.toLocaleString('id-ID')}</strong></p>
      <p>Mohon segera hubungi kami.</p>
    `,
  })
}
```

### 10.3 Cron Job — Cek Keterlambatan Harian

```javascript
// app/api/cron/check-late/route.js
// Dijalankan setiap hari jam 08:00 via Vercel Cron

import { createClient } from '@/lib/supabase/server'
import { calculateLateFee } from '@/lib/utils/pricing'
import { sendLateWarning } from '@/lib/email/resend'

export async function GET(request) {
  // Verifikasi cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const supabase = await createClient()
  const today = new Date()

  // Ambil semua pesanan aktif yang sudah melewati tanggal keluar
  const { data: lateBookings } = await supabase
    .from('bookings')
    .select('*, profiles(email, full_name)')
    .eq('status', 'Aktif')
    .lt('check_out_date', today.toISOString().split('T')[0])

  for (const booking of lateBookings || []) {
    const { totalFee, breakdown } = calculateLateFee(
      booking.price_per_day,
      new Date(booking.check_out_date),
      today
    )

    const todayFee = breakdown[breakdown.length - 1]?.fee || 0

    // Update late_fee_total
    await supabase
      .from('bookings')
      .update({ late_fee_total: totalFee })
      .eq('id', booking.id)

    // Kirim email peringatan
    await sendLateWarning(
      booking.profiles.email,
      booking.cat_name,
      breakdown.length,
      todayFee
    )

    // Insert notifikasi in-app
    await supabase.from('notifications').insert({
      user_id: booking.user_id,
      title: 'Peringatan Keterlambatan',
      message: `Kucing ${booking.cat_name} belum diambil. Denda hari ini: Rp ${todayFee.toLocaleString('id-ID')}`,
      type: 'warning',
      booking_id: booking.id,
    })
  }

  return Response.json({ processed: lateBookings?.length || 0 })
}
```

---

## 11. DEPLOYMENT VERCEL

### 11.1 Environment Variables

Buat file `.env.local` untuk development, dan isi yang sama di **Vercel Dashboard > Settings > Environment Variables**:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # Hanya untuk server-side

# Email (Resend)
RESEND_API_KEY=re_xxxxx

# Cron Security
CRON_SECRET=random-secret-string-yang-panjang

# App
NEXT_PUBLIC_APP_URL=https://nekostay.vercel.app
NEXT_PUBLIC_ADMIN_WHATSAPP=628xxxxxxxxxx
```

### 11.2 Vercel Cron Jobs

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/check-late",
      "schedule": "0 1 * * *"
    },
    {
      "path": "/api/cron/report-reminder",
      "schedule": "0 8 * * *"
    }
  ]
}
```

> **Jadwal**: `0 1 * * *` = setiap hari jam 08:00 WIB (01:00 UTC)

### 11.3 Langkah Deploy

```bash
# 1. Push ke GitHub
git init
git add .
git commit -m "feat: initial NekoStay setup"
git remote add origin https://github.com/username/nekostay.git
git push -u origin main

# 2. Connect ke Vercel
# - Buka vercel.com → New Project → Import dari GitHub
# - Set framework: Next.js (auto-detect)
# - Isi environment variables
# - Klik Deploy

# 3. Domain (opsional)
# - Beli domain atau pakai .vercel.app gratis
# - Update NEXT_PUBLIC_APP_URL sesuai domain
```

### 11.4 Supabase Setup Awal

```bash
# Install Supabase CLI
npm install -g supabase

# Login & link project
supabase login
supabase link --project-ref YOUR_PROJECT_REF

# Jalankan migrasi SQL
# Copy semua SQL schema di bagian 4 ke Supabase SQL Editor
# atau gunakan migrasi file:
supabase db push
```

---

## 12. TIMELINE PENGERJAAN

> Estimasi untuk 1 developer full-time

| Fase | Pekerjaan | Estimasi |
|---|---|---|
| **Fase 1** | Setup project, konfigurasi Supabase, auth (login/register/forgot password) | 3–4 hari |
| **Fase 2** | Form pemesanan multi-step, upload foto, kalkulasi harga real-time | 4–5 hari |
| **Fase 3** | Dashboard user, detail pesanan, pembatalan, halaman notifikasi | 3–4 hari |
| **Fase 4** | Dashboard admin, manajemen pesanan, update status, alasan penolakan | 4–5 hari |
| **Fase 5** | Form laporan kondisi kucing, integrasi email Resend | 3–4 hari |
| **Fase 6** | Cron job keterlambatan, realtime notifikasi, grafik admin | 3–4 hari |
| **Fase 7** | Testing menyeluruh, bug fix, polish UI, deploy ke Vercel | 4–5 hari |
| **Total** | | **~24–31 hari kerja** |

---

## 13. CHECKLIST DEVELOPER

### Setup Awal
- [ ] Buat project Next.js dengan JavaScript + Tailwind
- [ ] Setup Supabase project baru
- [ ] Install semua dependencies
- [ ] Buat semua tabel & RLS di Supabase
- [ ] Konfigurasi env variables
- [ ] Setup Resend account & domain email

### Autentikasi
- [ ] Halaman register + validasi Zod
- [ ] Halaman login
- [ ] Halaman lupa password
- [ ] Middleware proteksi route
- [ ] Auto-insert ke tabel `profiles` setelah register

### Fitur User
- [ ] Dashboard pesanan
- [ ] Form pemesanan multi-step (data kucing + data booking)
- [ ] Upload foto kucing ke Supabase Storage
- [ ] Preview kalkulasi harga real-time
- [ ] Halaman detail pesanan
- [ ] Tampilan laporan kondisi kucing di detail pesanan
- [ ] Tombol & flow pembatalan pesanan
- [ ] Halaman notifikasi

### Fitur Admin
- [ ] Dashboard statistik + grafik Recharts
- [ ] Tabel semua pesanan dengan filter status
- [ ] Detail pesanan admin (tampilkan semua data kucing)
- [ ] Tombol konfirmasi / tolak pesanan
- [ ] Form alasan penolakan
- [ ] Tandai pesanan selesai + hitung refund/denda
- [ ] Form kirim laporan kondisi kucing (2 hari sekali)
- [ ] Pengingat pesanan mendekati/melewati batas

### Sistem & Integrasi
- [ ] Email konfirmasi pemesanan (Resend)
- [ ] Email laporan kondisi kucing
- [ ] Email peringatan keterlambatan
- [ ] Email reset password
- [ ] Notifikasi realtime Supabase
- [ ] Cron job cek keterlambatan harian
- [ ] Cron job reminder laporan 2 hari

### Deploy & Final
- [ ] Upload ke GitHub
- [ ] Connect Vercel + env variables
- [ ] Setup vercel.json untuk cron jobs
- [ ] Testing end-to-end (register → booking → admin proses → laporan)
- [ ] Test skenario pembayaran (normal, refund, denda)
- [ ] Mobile responsive check

---

## CATATAN PENTING

> **WhatsApp Admin**: Untuk fitur perpanjangan hari dan perubahan class, alur komunikasi dilakukan via WhatsApp admin di luar sistem. Website hanya menampilkan nomor WhatsApp admin yang bisa diklik langsung (`wa.me/628xxxxxxx?text=...`) dengan pesan template yang sudah diisi nama kucing secara otomatis. Admin kemudian memperbarui data di sistem secara manual.

> **Pembayaran**: NekoStay tidak mengintegrasikan payment gateway. Pembayaran dilakukan secara langsung (cash/transfer) saat pengantaran hewan. Sistem hanya melakukan **kalkulasi dan pencatatan** biaya, bukan transaksi digital.

> **Security**: Pastikan `SUPABASE_SERVICE_ROLE_KEY` **TIDAK PERNAH** diekspos ke client-side (browser). Hanya gunakan di API Routes server-side.

---

*Dokumen ini adalah rancangan teknis lengkap untuk project NekoStay. Setiap bagian dapat disesuaikan lebih lanjut sesuai kebutuhan pengembangan.*
