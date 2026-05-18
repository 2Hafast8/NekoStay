# 📋 NekoStay — Deployment Checklist

Checklist lengkap untuk memastikan project siap di-deploy ke production.

## 1. Environment Variables Setup

### Di Supabase Dashboard
- [ ] Buat project Supabase baru atau gunakan yang existing
- [ ] Copy `NEXT_PUBLIC_SUPABASE_URL` dari project settings
- [ ] Copy `NEXT_PUBLIC_SUPABASE_ANON_KEY` dari project settings
- [ ] Copy `SUPABASE_SERVICE_ROLE_KEY` dari project settings
- [ ] Setup Storage bucket `cat-photos` untuk upload foto kucing

### Di `.env.local` (Local Development)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
RESEND_API_KEY=re_xxxxx
CRON_SECRET=random-string-panjang-dan-unik
NEXT_PUBLIC_APP_URL=https://nekostay.vercel.app
NEXT_PUBLIC_ADMIN_WHATSAPP=628xxxxxxxxxx
```

---

## 2. Database Setup (Supabase)

### Create Tables
- [ ] `profiles` — Data user (role, phone, dll)
- [ ] `bookings` — Data pesanan kucing
- [ ] `cat_reports` — Laporan kondisi kucing
- [ ] `notifications` — Notifikasi in-app
- [ ] `classes` — Kelas & harga penitipan
- [ ] `_prisma_migrations` — (auto-created jika pakai Prisma)

### Enable RLS on All Tables
- [ ] RLS enabled di `profiles`
- [ ] RLS enabled di `bookings`
- [ ] RLS enabled di `cat_reports`
- [ ] RLS enabled di `notifications`
- [ ] RLS enabled di `classes`

### Setup RLS Policies
- [ ] Jalankan semua policies dari `RLS_POLICIES.md`
- [ ] Verify semua policies sudah terbuat
- [ ] Test dengan SQL queries untuk memastikan policies bekerja

### Setup Auth
- [ ] Enable Email auth di Supabase Auth settings
- [ ] Configure email templates (optional but recommended)
- [ ] Set JWT expiry time (default 3600 seconds)
- [ ] Configure redirect URLs

### Setup Storage
- [ ] Create bucket `cat-photos`
- [ ] Set bucket to private
- [ ] Add storage policies untuk upload (admin bisa upload)
- [ ] Add storage policies untuk read (user bisa baca foto sendiri)

---

## 3. Code Verification

### User Pages
- [ ] `/dashboard` — Dashboard user with booking list
- [ ] `/booking/new` — Booking form
- [ ] `/booking/[id]` — Booking detail & cancel option
- [ ] `/profile` — User profile & logout
- [ ] `/notifications` — User notifications

### Admin Pages
- [ ] `/admin/dashboard` — Admin dashboard with stats & booking table
- [ ] `/admin/bookings/[id]` — Booking detail dengan confirm/reject/complete actions
- [ ] Admin Navbar dengan navigation yang benar

### API Routes
- [ ] `POST /api/bookings/[id]/cancel` — User cancel booking
- [ ] `POST /api/bookings/[id]/confirm` — Admin confirm booking
- [ ] `POST /api/bookings/[id]/reject` — Admin reject booking
- [ ] `POST /api/bookings/[id]/reports` — Admin send cat report (optional)

### Middleware
- [ ] Auth protection untuk protected routes
- [ ] Role checking untuk admin routes
- [ ] Redirect ke login untuk unauthenticated users
- [ ] Redirect ke dashboard/admin based on role

### Components
- [ ] BookingList component
- [ ] BookingForm component
- [ ] BookingCard component
- [ ] BookingStatusBadge component
- [ ] PriceCalculator component
- [ ] ClassSelector component
- [ ] AdminNav component

### Hooks
- [ ] `useUser()` — Get current user & profile
- [ ] `useBookings()` — Get bookings with realtime updates

### Utils
- [ ] `calculateLateFee()` — Late fee calculation
- [ ] `calculateRefund()` — Refund calculation
- [ ] `formatRupiah()` — Format rupiah
- [ ] `formatDate()` — Format date Indonesia
- [ ] `getWhatsAppLink()` — WhatsApp link generation

---

## 4. Testing Checklist

### Authentication Flow
- [ ] Register dengan email baru
- [ ] Email verification berhasil
- [ ] Login dengan credentials benar
- [ ] Login gagal dengan credentials salah
- [ ] Logout berhasil
- [ ] Protected pages redirect ke login

### User Booking Flow
- [ ] User dapat membuat booking baru
- [ ] Form validation bekerja (required fields, date validation)
- [ ] Photo upload bekerja (max 5MB)
- [ ] Price calculator menampilkan total biaya dengan benar
- [ ] Booking disimpan ke database dengan status `Menunggu`
- [ ] User dapat melihat booking di dashboard
- [ ] User dapat membuka detail booking
- [ ] User dapat membatalkan booking (status Menunggu/Aktif)
- [ ] Cancel reason tersimpan

### Admin Booking Flow
- [ ] Admin dapat melihat semua bookings di dashboard
- [ ] Admin stats (total, menunggu, aktif, selesai) akurat
- [ ] Admin dapat filter bookings by status
- [ ] Admin dapat membuka detail booking
- [ ] Admin dapat confirm booking (Menunggu → Aktif)
- [ ] Admin dapat reject booking dengan alasan
- [ ] Admin dapat complete booking (Aktif → Selesai)
- [ ] Reject reason tersimpan

### Realtime Features
- [ ] Notifikasi realtime saat booking status berubah
- [ ] Booking list terupdate real-time di admin dashboard
- [ ] Laporan kucing realtime update

### Pricing Calculation
- [ ] Normal pricing: (check-out - check-in) × price_per_day
- [ ] Late fee calculation: price × 1.08^N
- [ ] Refund calculation: remaining_days × price × 0.90

### Role-Based Access
- [ ] User tidak dapat akses /admin/*
- [ ] Admin tidak dapat akses user pages (redirect ke /admin/dashboard)
- [ ] User dapat akses user pages
- [ ] Admin dapat akses admin pages
- [ ] Middleware protection bekerja

---

## 5. Before Deployment

### Code Quality
- [ ] No console.error in production (check logs)
- [ ] No hardcoded credentials
- [ ] No `any` types in TypeScript (if using TS)
- [ ] No unused imports
- [ ] ESLint clean
- [ ] No deprecated APIs

### Performance
- [ ] Lazy load images
- [ ] Optimize bundle size
- [ ] Implement pagination for large lists
- [ ] Cache strategy for static assets

### Security
- [ ] All API routes validate input with Zod
- [ ] All API routes check auth/role
- [ ] RLS policies enabled & tested
- [ ] CORS configured correctly
- [ ] No sensitive data in console logs
- [ ] No security headers missing

### Documentation
- [ ] README.md updated
- [ ] RLS_POLICIES.md reviewed
- [ ] Environment variables documented
- [ ] API endpoints documented

---

## 6. Vercel Deployment

### Pre-Deployment
- [ ] Git repo initialized & committed
- [ ] `.env.local` NOT committed (add to .gitignore)
- [ ] `node_modules` NOT committed
- [ ] Build locally successful (`npm run build`)
- [ ] No build errors or warnings

### Vercel Setup
- [ ] Create Vercel account
- [ ] Connect GitHub repo
- [ ] Configure environment variables di Vercel
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
  - [ ] `RESEND_API_KEY`
  - [ ] `CRON_SECRET`
  - [ ] `NEXT_PUBLIC_APP_URL`
  - [ ] `NEXT_PUBLIC_ADMIN_WHATSAPP`
- [ ] Set domain name (custom atau use vercel.app)

### Post-Deployment
- [ ] Test production URL fully
- [ ] Test auth flow
- [ ] Test booking creation
- [ ] Test admin dashboard
- [ ] Check email notifications (if Resend configured)
- [ ] Verify database connections
- [ ] Monitor errors in Vercel logs
- [ ] Setup error tracking (Sentry optional)

---

## 7. Post-Deployment Monitoring

- [ ] Setup database backups
- [ ] Monitor API response times
- [ ] Monitor database queries
- [ ] Setup uptime monitoring
- [ ] Setup error alerts
- [ ] Collect user feedback
- [ ] Plan for scaling

---

## 8. Future Enhancements

Nice-to-have features untuk phase selanjutnya:

- [ ] Payment integration (Stripe/Xendit)
- [ ] Email notifications dengan Resend
- [ ] Admin send cat report with photos
- [ ] Dashboard charts & analytics
- [ ] User review & rating system
- [ ] SMS notifications
- [ ] Mobile app (React Native)
- [ ] Multi-language support
- [ ] Dark mode implementation
- [ ] Advanced filtering & search

---

## ⚠️ Important Notes

1. **Security First**: RLS policies HARUS active sebelum production
2. **Database Backups**: Setup automatic backups di Supabase
3. **Monitoring**: Setup error tracking & monitoring
4. **Testing**: Manual testing HARUS dilakukan di staging
5. **Documentation**: Dokumentasi code HARUS lengkap untuk team
6. **Version Control**: Git commits harus descriptive & organized

---

## 🚀 Ready to Deploy?

Jika semua checklist di atas sudah ✅, project siap untuk production!

```
npm run build    # Build untuk production
npm run start    # Test production build locally
git push         # Push ke GitHub (auto deploy ke Vercel)
```

Selamat! 🎉

