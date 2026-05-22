# SKILL.md — NekoStay Technical Skills Guide

> Dokumen referensi teknis untuk setiap teknologi yang digunakan dalam project NekoStay.
> Berisi pola implementasi, contoh kode, dan best practices yang **spesifik untuk project ini**.
> **Bahasa kode: JavaScript** — gunakan ekstensi `.js` (utilitas/API) dan `.jsx` (komponen React).

---

## DAFTAR ISI

1. [Next.js App Router](#1-nextjs-app-router)
2. [Supabase — Database](#2-supabase--database)
3. [Supabase — Auth](#3-supabase--auth)
4. [Supabase — Storage](#4-supabase--storage)
5. [Supabase — Realtime](#5-supabase--realtime)
6. [Tailwind CSS + shadcn/ui](#6-tailwind-css--shadcnui)
7. [React Hook Form + Zod](#7-react-hook-form--zod)
8. [Resend — Email](#8-resend--email)
9. [date-fns — Tanggal](#9-date-fns--tanggal)
10. [Vercel — Deploy & Cron](#10-vercel--deploy--cron)
11. [JavaScript — Konstanta & JSDoc](#11-javascript--konstanta--jsdoc)
12. [Pola Umum yang Sering Dipakai](#12-pola-umum-yang-sering-dipakai)

---

## 1. NEXT.JS APP ROUTER

### Kapan Pakai Server Component vs Client Component

| Situasi | Gunakan |
|---|---|
| Fetch data dari Supabase saat halaman load | **Server Component** (default) |
| Ada `useState`, `useEffect`, event handler | **Client Component** (`'use client'`) |
| Form interaktif | **Client Component** |
| Layout statis / wrapper | **Server Component** |
| Realtime subscription | **Client Component** |

### Pola Server Component (fetch data di server)
```tsx
// app/(user)/dashboard/page.jsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BookingCard } from '@/components/booking/BookingCard'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: bookings, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching bookings:', error)
    return <div>Terjadi kesalahan. Coba lagi.</div>
  }

  return (
    <div>
      <h1>Pesanan Saya</h1>
      {bookings.length === 0
        ? <p>Belum ada pesanan.</p>
        : bookings.map(b => <BookingCard key={b.id} booking={b} />)
      }
    </div>
  )
}
```

### Pola API Route (server-side logic)
```javascript
// app/api/bookings/route.js
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const bookingSchema = z.object({
  cat_name: z.string().min(1, 'Nama kucing wajib diisi'),
  class: z.enum(['Basic', 'Standard', 'Premium']),
  check_in_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  check_out_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  // ... field lainnya
})

export async function POST(request) {
  // 1. Auth check
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Parse & validasi body
  const body = await request.json()
  const parsed = bookingSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  // 3. Business logic
  const data = parsed.data
  const checkIn = new Date(data.check_in_date)
  const checkOut = new Date(data.check_out_date)
  if (checkOut <= checkIn) {
    return NextResponse.json(
      { error: 'Tanggal keluar harus setelah tanggal masuk' },
      { status: 400 }
    )
  }

  // 4. Insert ke database
  const { data: booking, error } = await supabase
    .from('bookings')
    .insert({ ...data, user_id: user.id })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ booking }, { status: 201 })
}
```

### Dynamic Routes
```javascript
// app/api/bookings/[id]/route.js
export async function GET(request, { params }) {
  const { id } = await params
  // ... gunakan id
}
```

### Metadata Halaman
```javascript
// app/(user)/dashboard/page.jsx
export const metadata = {
  title: 'Dashboard — NekoStay',
  description: 'Lihat dan kelola pesanan penitipan kucing Anda',
}
```

---

## 2. SUPABASE — DATABASE

### Setup Client (2 versi wajib)

```javascript
// lib/supabase/client.js — untuk browser / Client Component
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

```javascript
// lib/supabase/server.js — untuk Server Component & API Route
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

### Pola Query yang Sering Dipakai

```javascript
// SELECT dengan filter
const { data, error } = await supabase
  .from('bookings')
  .select('id, cat_name, status, check_in_date, check_out_date')
  .eq('user_id', userId)
  .eq('status', 'Aktif')
  .order('created_at', { ascending: false })
  .limit(10)

// SELECT dengan JOIN (relasi)
const { data } = await supabase
  .from('bookings')
  .select(`
    *,
    profiles (full_name, phone),
    cat_reports (id, health_status, report_date, photo_url)
  `)
  .eq('id', bookingId)
  .single()

// INSERT
const { data, error } = await supabase
  .from('bookings')
  .insert({ cat_name: 'Mochi', user_id: userId, ... })
  .select()    // return data yang baru diinsert
  .single()

// UPDATE
const { data, error } = await supabase
  .from('bookings')
  .update({ status: 'Aktif', updated_at: new Date().toISOString() })
  .eq('id', bookingId)
  .select()
  .single()

// UPDATE dengan cek ownership (keamanan ekstra)
const { data, error } = await supabase
  .from('bookings')
  .update({ status: 'Dibatalkan', cancel_reason: reason })
  .eq('id', bookingId)
  .eq('user_id', userId)   // pastikan milik user ini
  .select()
  .single()
```

### Error Handling Pattern
```javascript
const { data, error } = await supabase.from('bookings').select('*')

if (error) {
  console.error('[DB Error]', error.code, error.message)
  // Jangan expose error.message ke user — buat pesan generik
  return NextResponse.json(
    { error: 'Gagal mengambil data. Coba lagi.' },
    { status: 500 }
  )
}

// Aman pakai data di sini — data tidak null
```

---

## 3. SUPABASE — AUTH

### Register User Baru
```javascript
// Setelah signUp, Supabase kirim email verifikasi otomatis
const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: { full_name: fullName }  // masuk ke auth.users.raw_user_meta_data
  }
})

if (error) throw error

// Insert ke tabel profiles secara manual
// (atau buat trigger di Supabase — lebih recommended)
await supabase.from('profiles').insert({
  id: data.user!.id,
  full_name: fullName,
  phone: phone,
  role: 'user',
})
```

### Auto-create Profile via Supabase Trigger (RECOMMENDED)
```sql
-- Jalankan di Supabase SQL Editor
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    'user'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

### Login
```javascript
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password,
})

if (error) {
  // error.message: "Invalid login credentials" → tampilkan pesan Indonesia
  throw new Error('Email atau password salah')
}

// Setelah login sukses, cek role untuk redirect
const { data: profile } = await supabase
  .from('profiles')
  .select('role')
  .eq('id', data.user.id)
  .single()

const redirectTo = profile?.role === 'admin' ? '/admin/dashboard' : '/dashboard'
router.push(redirectTo)
```

### Lupa Password
```javascript
// Step 1: Kirim email reset
await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/update-password`,
})

// Step 2: Di halaman /update-password, update password baru
await supabase.auth.updateUser({ password: newPassword })
```

### Logout
```javascript
await supabase.auth.signOut()
router.push('/login')
```

### Get Current User (Server Component)
```javascript
const { data: { user } } = await supabase.auth.getUser()
// ⚠️ Gunakan getUser() bukan getSession() untuk verifikasi server-side
// getSession() hanya baca dari cookie, tidak divalidasi ke server Supabase
```

---

## 4. SUPABASE — STORAGE

### Upload Foto Kucing
```javascript
// Nama bucket: 'cat-photos' (buat di Supabase Dashboard > Storage)
// Set bucket visibility: Public (agar URL bisa ditampilkan)

async function uploadCatPhoto(file, bookingId) {
  const supabase = createClient()
  const ext = file.name.split('.').pop()
  const fileName = `${bookingId}/${Date.now()}.${ext}`

  const { data, error } = await supabase.storage
    .from('cat-photos')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) throw new Error(`Upload gagal: ${error.message}`)

  // Dapatkan public URL
  const { data: urlData } = supabase.storage
    .from('cat-photos')
    .getPublicUrl(data.path)

  return urlData.publicUrl
}
```

### Komponen Upload Foto (Client)
```tsx
// components/shared/ImageUpload.jsx
'use client'
import { useState } from 'react'
import Image from 'next/image'

/** @param {{ onUpload: (url: string) => void, label?: string }} props */
export function ImageUpload({ onUpload, label = 'Upload Foto' }) {
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validasi tipe & ukuran (max 2MB)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      alert('Hanya file JPG, PNG, atau WebP yang diperbolehkan')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      alert('Ukuran file maksimal 2MB')
      return
    }

    // Preview lokal
    const reader = new FileReader()
    reader.onload = (ev) => setPreview(ev.target?.result)
    reader.readAsDataURL(file)

    // Upload ke Supabase
    setUploading(true)
    try {
      const url = await uploadCatPhoto(file, crypto.randomUUID())
      onUpload(url)
    } catch (err) {
      alert('Upload gagal, coba lagi')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <label>{label}</label>
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        disabled={uploading}
      />
      {uploading && <p>Mengupload...</p>}
      {preview && (
        <Image src={preview} alt="Preview" width={200} height={200}
          className="rounded-lg object-cover mt-2" />
      )}
    </div>
  )
}
```

### Storage Policy (RLS)
```sql
-- Di Supabase Dashboard > Storage > Policies
-- Allow public read untuk foto kucing
CREATE POLICY "Public read cat photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'cat-photos');

-- Allow authenticated user upload
CREATE POLICY "Authenticated users can upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'cat-photos' AND auth.role() = 'authenticated');
```

---

## 5. SUPABASE — REALTIME

### Subscribe Notifikasi Live
```javascript
// hooks/useNotifications.js
'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
export function useNotifications(userId) {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const supabase = createClient()

  const fetchNotifications = useCallback(async () => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)

    if (data) {
      setNotifications(data)
      setUnreadCount(data.filter(n => !n.is_read).length)
    }
  }, [userId])

  useEffect(() => {
    fetchNotifications()

    // Subscribe realtime INSERT
    const channel = supabase
      .channel(`notifications-${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      }, (payload) => {
        setNotifications(prev => [payload.new, ...prev])
        setUnreadCount(prev => prev + 1)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId, fetchNotifications])

  const markAllRead = async () => {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false)
    setUnreadCount(0)
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  return { notifications, unreadCount, markAllRead, refetch: fetchNotifications }
}
```

---

## 6. TAILWIND CSS + SHADCN/UI

### Setup shadcn/ui
```bash
npx shadcn-ui@latest init
# Pilih: Default style, Slate base color, CSS variables: yes

# Install komponen yang dipakai di project ini:
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add label
npx shadcn-ui@latest add select
npx shadcn-ui@latest add textarea
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add card
npx shadcn-ui@latest add table
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add avatar
npx shadcn-ui@latest add separator
npx shadcn-ui@latest add skeleton
```

### Badge Status Pesanan
```tsx
// components/booking/BookingStatus.jsx
import { Badge } from '@/components/ui/badge'
const statusConfig = {
  'Menunggu':    { label: '⏳ Menunggu',   variant: 'secondary' },
  'Aktif':       { label: '✅ Aktif',      variant: 'default' },
  'Selesai':     { label: '🏁 Selesai',    variant: 'outline' },
  'Dibatalkan':  { label: '❌ Dibatalkan', variant: 'destructive' },
}

export function BookingStatus({ status }) {
  const config = statusConfig[status]
  return <Badge variant={config.variant}>{config.label}</Badge>
}
```

### Format Rupiah (selalu pakai ini)
```javascript
// lib/utils/format.js
export function formatRupiah(amount) {
  return `Rp ${amount.toLocaleString('id-ID')}`
}
// Output: "Rp 80.000"
```

### cn() utility (wajib ada)
```javascript
// lib/utils/cn.js
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
```

---

## 7. REACT HOOK FORM + ZOD

### Schema Validasi Pemesanan
```javascript
// lib/validations/booking.js
import { z } from 'zod'

export const bookingFormSchema = z.object({
  // Data Kucing
  cat_name: z.string()
    .min(1, 'Nama kucing wajib diisi')
    .max(50, 'Nama kucing maksimal 50 karakter'),
  cat_gender: z.enum(['Jantan', 'Betina'], {
    required_error: 'Gender kucing wajib dipilih',
  }),
  cat_age: z.string().min(1, 'Usia kucing wajib diisi'),
  cat_health_status: z.enum(['Sehat', 'Sakit', 'Dalam Pengobatan']),
  cat_favorite_food: z.string().optional(),
  cat_is_pregnant: z.boolean().default(false),
  cat_notes: z.string().optional(),
  cat_photo_url: z.string().url('URL foto tidak valid').optional(),

  // Data Pemesanan
  class: z.enum(['Basic', 'Standard', 'Premium']),
  check_in_date: z.string().min(1, 'Tanggal masuk wajib diisi'),
  check_out_date: z.string().min(1, 'Tanggal keluar wajib diisi'),
}).refine(
  (data) => new Date(data.check_out_date) > new Date(data.check_in_date),
  {
    message: 'Tanggal keluar harus setelah tanggal masuk',
    path: ['check_out_date'],
  }
).refine(
  (data) => {
    // Kalau betina, tampilkan field hamil (validasi handled di UI)
    if (data.cat_gender === 'Betina') return true
    return true
  }
)

// Nilai form = hasil parse bookingFormSchema (Zod)
```

### Implementasi Form
```tsx
// components/booking/BookingForm.jsx
'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { bookingFormSchema } from '@/lib/validations/booking'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function BookingForm() {
  const form = useForm({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      cat_gender: 'Jantan',
      cat_health_status: 'Sehat',
      cat_is_pregnant: false,
      class: 'Basic',
    },
  })

  const { watch, formState: { errors, isSubmitting } } = form

  // Watch untuk kalkulasi harga real-time
  const selectedClass = watch('class')
  const checkIn = watch('check_in_date')
  const checkOut = watch('check_out_date')
  const catGender = watch('cat_gender')

  // Kalkulasi preview harga
  const pricePreview = useMemo(() => {
    if (!checkIn || !checkOut) return null
    return getBookingSummary(selectedClass, new Date(checkIn), new Date(checkOut))
  }, [selectedClass, checkIn, checkOut])

  const onSubmit = async (values) => {
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      if (!res.ok) throw new Error('Gagal membuat pesanan')
      const { booking } = await res.json()
      router.push(`/booking/${booking.id}`)
    } catch (err) {
      // tampilkan toast error
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <Input
        {...form.register('cat_name')}
        placeholder="Nama kucing"
      />
      {errors.cat_name && (
        <p className="text-red-500 text-sm">{errors.cat_name.message}</p>
      )}

      {/* Field hamil hanya muncul kalau gender Betina */}
      {catGender === 'Betina' && (
        <div>
          {/* checkbox is_pregnant */}
        </div>
      )}

      {/* Preview harga */}
      {pricePreview && (
        <div className="bg-muted p-4 rounded-lg">
          <p>Total: {formatRupiah(pricePreview.totalCost)}</p>
          <p>Durasi: {pricePreview.totalDays} hari</p>
        </div>
      )}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Mengirim...' : 'Buat Pesanan'}
      </Button>
    </form>
  )
}
```

---

## 8. RESEND — EMAIL

### Konfigurasi
```javascript
// lib/email/resend.js
import { Resend } from 'resend'

// ⚠️ Hanya dipakai di server-side
const resend = new Resend(process.env.RESEND_API_KEY)
export default resend
```

### Fungsi Email yang Tersedia di Project

| Fungsi | Trigger | Penerima |
|---|---|---|
| `sendBookingConfirmation()` | User buat pesanan | User |
| `sendBookingStatusUpdate()` | Admin ubah status | User |
| `sendBookingRejected()` | Admin tolak pesanan | User (+ alasan) |
| `sendCatReport()` | Admin kirim laporan | User |
| `sendLateWarning()` | Cron harian (keterlambatan) | User |
| `sendPasswordReset()` | Supabase bawaan | User |

### Contoh Template Email HTML
```javascript
// lib/email/templates/cat-report.js
export function catReportTemplate({
  catName,
  ownerName,
  healthStatus,
  notes,
  photoUrl,
  reportDate,
  bookingUrl,
}) {
  const healthColor = {
    'Sehat': '#22c55e',
    'Kurang Fit': '#f59e0b',
    'Perlu Perhatian': '#ef4444',
  }[healthStatus]

  return `
    <!DOCTYPE html>
    <html>
    <body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #f97316; padding: 20px; border-radius: 8px; text-align: center;">
        <h1 style="color: white; margin: 0;">🐱 NekoStay</h1>
        <p style="color: white; margin: 4px 0;">Laporan Kondisi Kucing</p>
      </div>

      <div style="padding: 24px 0;">
        <p>Halo <strong>${ownerName}</strong>,</p>
        <p>Berikut laporan kondisi <strong>${catName}</strong> pada ${reportDate}:</p>

        <div style="background: ${healthColor}20; border-left: 4px solid ${healthColor}; padding: 12px; border-radius: 4px;">
          <strong>Status Kesehatan:</strong>
          <span style="color: ${healthColor}; font-weight: bold; margin-left: 8px;">${healthStatus}</span>
        </div>

        ${photoUrl ? `
          <div style="margin: 16px 0;">
            <img src="${photoUrl}" alt="Foto ${catName}"
              style="width: 100%; max-width: 400px; border-radius: 8px; display: block; margin: 0 auto;" />
          </div>
        ` : ''}

        ${notes ? `
          <div style="background: #f8fafc; padding: 12px; border-radius: 4px; margin: 16px 0;">
            <strong>Catatan:</strong>
            <p style="margin: 4px 0;">${notes}</p>
          </div>
        ` : ''}

        <a href="${bookingUrl}"
          style="display: inline-block; background: #f97316; color: white; padding: 12px 24px;
                 border-radius: 6px; text-decoration: none; margin-top: 16px;">
          Lihat Detail Pesanan
        </a>
      </div>

      <hr style="border: none; border-top: 1px solid #e2e8f0;" />
      <p style="color: #94a3b8; font-size: 12px; text-align: center;">
        NekoStay — Platform Penitipan Kucing Terpercaya
      </p>
    </body>
    </html>
  `
}
```

---

## 9. DATE-FNS — TANGGAL

### Import yang Dipakai di Project
```javascript
import {
  differenceInDays,  // hitung selisih hari
  addDays,           // tambah hari
  isBefore,          // perbandingan tanggal
  isAfter,
  format,            // format tanggal ke string
  parseISO,          // parse string ISO ke Date
} from 'date-fns'
import { id } from 'date-fns/locale'  // locale Bahasa Indonesia
```

### Format Tanggal yang Dipakai
```javascript
// Standar format di seluruh project NekoStay:

// Format panjang: "Senin, 15 Januari 2025"
format(date, 'EEEE, dd MMMM yyyy', { locale: id })

// Format pendek: "15 Jan 2025"
format(date, 'dd MMM yyyy', { locale: id })

// Format database (ISO): "2025-01-15"
format(date, 'yyyy-MM-dd')

// Format dengan jam: "15 Jan 2025, 08:30"
format(date, 'dd MMM yyyy, HH:mm', { locale: id })
```

### Helper Functions (lib/utils/dates.js)
```javascript
import { differenceInDays, isAfter, isBefore, format } from 'date-fns'
import { id } from 'date-fns/locale'

/** Hitung jumlah hari antara 2 tanggal */
export function daysBetween(from, to) {
  const d1 = typeof from === 'string' ? new Date(from) : from
  const d2 = typeof to === 'string' ? new Date(to) : to
  return differenceInDays(d2, d1)
}

/** Apakah tanggal sudah lewat? */
export function isPastDate(date) {
  const d = typeof date === 'string' ? new Date(date) : date
  return isBefore(d, new Date())
}

/** Format tanggal ke string Indonesia */
export function formatDate(date, style = 'short') {
  const d = typeof date === 'string' ? new Date(date) : date
  if (style === 'long') return format(d, 'EEEE, dd MMMM yyyy', { locale: id })
  return format(d, 'dd MMM yyyy', { locale: id })
}

/** Cek apakah pesanan terlambat */
export function isLate(checkOutDate, actualDate = new Date()) {
  return isAfter(actualDate, new Date(checkOutDate))
}

/** Hitung hari keterlambatan */
export function lateDays(checkOutDate, actualDate = new Date()) {
  const days = differenceInDays(actualDate, new Date(checkOutDate))
  return Math.max(0, days)
}
```

---

## 10. VERCEL — DEPLOY & CRON

### vercel.json
```json
{
  "crons": [
    {
      "path": "/api/cron/check-late",
      "schedule": "0 1 * * *"
    },
    {
      "path": "/api/cron/report-reminder",
      "schedule": "0 8 */2 * *"
    }
  ]
}
```

> Schedule format: `menit jam hari-bulan bulan hari-minggu`
> `0 1 * * *` = setiap hari jam 01:00 UTC (= 08:00 WIB)
> `0 8 */2 * *` = setiap 2 hari jam 08:00 UTC (= 15:00 WIB)

### Proteksi Endpoint Cron
```javascript
// app/api/cron/check-late/route.js
export async function GET(request) {
  // Vercel mengirim header ini secara otomatis
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }
  // ... logika cron
}
```

### Environment Variables di Vercel
```
Vercel Dashboard → Project → Settings → Environment Variables
Tambahkan semua variable dari .env.local
Pilih environment: Production, Preview, Development
```

---

## 11. JAVASCRIPT — KONSTANTA & JSDOC

```javascript
// lib/constants/index.js — nilai enum & label project NekoStay

export const USER_ROLES = ['user', 'admin']

export const BOOKING_STATUSES = ['Menunggu', 'Aktif', 'Selesai', 'Dibatalkan']

export const CAT_GENDERS = ['Jantan', 'Betina']

export const CAT_HEALTH_STATUSES = ['Sehat', 'Sakit', 'Dalam Pengobatan']

export const CAT_REPORT_HEALTH_STATUSES = ['Sehat', 'Kurang Fit', 'Perlu Perhatian']

export const BOOKING_CLASSES = ['Basic', 'Standard', 'Premium']

export const NOTIFICATION_TYPES = ['info', 'warning', 'success', 'error']

/**
 * @typedef {Object} Profile
 * @property {string} id
 * @property {string} full_name
 * @property {string|null} phone
 * @property {'user'|'admin'} role
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
 * @property {'Menunggu'|'Aktif'|'Selesai'|'Dibatalkan'} status
 * @property {string|null} cancel_reason
 * @property {string|null} reject_reason
 * @property {string|null} actual_checkout
 * @property {number} late_fee_total
 * @property {number} refund_amount
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
 * @typedef {Object} PriceSummary
 * @property {number} pricePerDay
 * @property {number} totalDays
 * @property {number} totalCost
 */
```

---

## 12. POLA UMUM YANG SERING DIPAKAI

### Helper: Insert Notifikasi
```javascript
// Selalu gunakan fungsi ini — jangan buat inline
async function insertNotification(
  supabase,
  userId,
  title,
  message,
  type,
  bookingId
) {
  await supabase.from('notifications').insert({
    user_id: userId,
    title,
    message,
    type,
    booking_id: bookingId ?? null,
  })
}
```

### Helper: Verifikasi Admin di API Route
```javascript
// Selalu gunakan ini di setiap endpoint yang butuh akses admin
async function verifyAdmin(supabase) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  return profile?.role === 'admin'
}

// Penggunaan di API Route:
if (!await verifyAdmin(supabase)) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
```

### Pola Loading State di Client Component
```tsx
// Gunakan shadcn Skeleton untuk loading
import { Skeleton } from '@/components/ui/skeleton'

function BookingListSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="p-4 border rounded-lg space-y-2">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-1/4" />
        </div>
      ))}
    </div>
  )
}
```

### Pola Konfirmasi Dialog (Cancel / Tolak)
```tsx
// Selalu pakai Dialog dari shadcn untuk aksi destructive
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter, DialogDescription
} from '@/components/ui/dialog'

function CancelBookingDialog({ open, onClose, onConfirm, isLoading }) {
  const [reason, setReason] = useState('')

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Batalkan Pesanan?</DialogTitle>
          <DialogDescription>
            Tindakan ini tidak dapat dibatalkan.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          placeholder="Tulis alasan pembatalan..."
          value={reason}
          onChange={e => setReason(e.target.value)}
          required
        />
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Tidak</Button>
          <Button
            variant="destructive"
            disabled={!reason.trim() || isLoading}
            onClick={() => onConfirm(reason)}
          >
            {isLoading ? 'Membatalkan...' : 'Ya, Batalkan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

---

*File ini adalah referensi teknis hidup untuk project NekoStay. Perbarui setiap kali ada pattern baru yang disepakati oleh tim.*
