# 📋 NekoStay — Deployment & Production Checklist

> Checklist komprehensif untuk deployment dan verifikasi produksi platform **NekoStay**.
> **Status**: Siap Rilis ke Produksi (100% Feature Complete & Build Passed) ✅

---

## 1. Environment Variables Setup (Vercel & Production)

Pastikan variabel lingkungan berikut telah dikonfigurasi di dashboard Vercel (**Project Settings → Environment Variables**):

```bash
# Supabase Core
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Email & Receipt Engine (Dual-Mode: Resend / EmailJS)
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_xxxxx
RESEND_FROM_EMAIL=onboarding@resend.dev
# Opsional jika menggunakan EmailJS:
# EMAILJS_SERVICE_ID=service_xxxxx
# EMAILJS_TEMPLATE_ID=template_xxxxx
# EMAILJS_PUBLIC_KEY=xxxxx

# Midtrans Payment Gateway
MIDTRANS_SERVER_KEY=SB-Mid-server-xxxxx
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=SB-Mid-client-xxxxx
MIDTRANS_IS_PRODUCTION=false # Ubah ke true saat go-live akun produksi Midtrans

# Cron Security Token
CRON_SECRET=random-string-rahasia-panjang-dan-unik

# App URLs & WhatsApp
NEXT_PUBLIC_APP_URL=https://nekostay.vercel.app
NEXT_PUBLIC_ADMIN_WHATSAPP=6282371986344
```

---

## 2. Database Setup & RLS (Supabase)

- [x] **Jalankan Skema SQL**: Eksekusi seluruh isi [`supabase/schema.sql`](../../supabase/schema.sql) di Supabase SQL Editor.
- [x] **Aktifkan RLS**: Pastikan seluruh 9 tabel (`profiles`, `classes`, `bookings`, `cat_reports`, `notifications`, `reviews`, `promos`, `whatsapp_bot_state`, `whatsapp_logs`) memiliki RLS enabled.
- [x] **Supabase Storage Bucket**: Buat bucket `cat-photos` dengan akses publik untuk thumbnail foto kucing.
- [x] **Setup Admin Akun**: Daftarkan email admin di `handle_new_user()` trigger atau update role via SQL Editor:
  ```sql
  UPDATE public.profiles SET role = 'admin' WHERE email = 'admin@nekostay.com';
  ```

---

## 3. Pre-Deployment Verification Commands

```bash
# 1. Menjalankan Automated Test Suite
npm test

# 2. Menjalankan Linting
npm run lint

# 3. Menjalankan Kompilasi Build Produksi
npm run build
# Output wajib: 0 error, 44 routes generated.
```

---

## 4. Vercel Deployment Steps

1. Hubungkan repository GitHub ke Vercel.
2. Masukkan seluruh environment variables di atas.
3. Deploy branch `main`.
4. Setup custom domain (misal: `https://nekostay.com`) dan pastikan SSL aktif.
5. Konfigurasi URL Webhook di Midtrans Dashboard:
   - **Payment Notification URL**: `https://nekostay.com/api/payments/webhook`
6. Jadwalkan Vercel Cron via `vercel.json` untuk `/api/cron/check-late`.
