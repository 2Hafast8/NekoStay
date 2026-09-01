# Supabase RLS Policies Setup — NekoStay

> Dokumentasi lengkap Row Level Security (RLS) policies untuk seluruh tabel pada database Supabase platform **NekoStay**.

---

## 🗄️ Tabel & Kebijakan RLS

### 1. Tabel `profiles`
* **RLS Enabled**: `ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;`
* **SELECT**: `auth.uid() = id OR is_admin()` (User melihat profil sendiri, Admin melihat semua).
* **UPDATE**: `auth.uid() = id` (User hanya dapat mengedit profil miliknya).

### 2. Tabel `classes`
* **RLS Enabled**: `ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;`
* **SELECT**: `true` (Publik / semua user dapat melihat daftar kelas kamar & harga).
* **ALL (Insert/Update/Delete)**: `is_admin()` (Hanya Admin yang dapat mengubah tarif/fasilitas kelas).

### 3. Tabel `bookings`
* **RLS Enabled**: `ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;`
* **SELECT**: `auth.uid() = user_id OR is_admin()` (Isolasi data pesanan per user).
* **INSERT**: `auth.uid() = user_id` (User hanya dapat membuat pesanan atas namanya sendiri).
* **UPDATE**: `auth.uid() = user_id AND status = 'Menunggu'` (User hanya dapat membatalkan pesanan jika belum diproses admin).
* **ALL**: `is_admin()` (Admin memiliki kendali penuh untuk konfirmasi, penolakan, perubahan detail, dan penyelesaian).

### 4. Tabel `cat_reports`
* **RLS Enabled**: `ALTER TABLE public.cat_reports ENABLE ROW LEVEL SECURITY;`
* **SELECT**: User yang memiliki pesanan terkait (`bookings.user_id = auth.uid()`) atau Admin.
* **ALL**: `is_admin()` (Hanya Admin yang dapat membuat dan mengubah laporan harian).

### 5. Tabel `notifications`
* **RLS Enabled**: `ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;`
* **SELECT**: `auth.uid() = user_id OR is_admin()` (User hanya menerima notifikasi miliknya).
* **UPDATE**: `auth.uid() = user_id` (Untuk menandai notifikasi telah dibaca `is_read = true`).
* **INSERT**: `true` (Diizinkan untuk trigger internal dan RPC).

### 6. Tabel `reviews`
* **RLS Enabled**: `ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;`
* **SELECT**: `true` (Publik dapat melihat ulasan pelanggan).
* **INSERT**: `auth.uid() = user_id AND EXISTS (booking_id status = 'Selesai')` (Hanya untuk pesanan selesai).
* **ALL**: `is_admin()` (Admin dapat membalas dan mengelola ulasan).

### 7. Tabel `promos`
* **RLS Enabled**: `ALTER TABLE public.promos ENABLE ROW LEVEL SECURITY;`
* **SELECT**: `is_active = true OR is_admin()` (User melihat promo aktif).
* **ALL**: `is_admin()` (Admin membuat dan mengelola voucher promo).

### 8. Tabel `whatsapp_bot_state` & `whatsapp_logs`
* **RLS Enabled**: `ALTER TABLE public.whatsapp_bot_state ENABLE ROW LEVEL SECURITY;` & `ALTER TABLE public.whatsapp_logs ENABLE ROW LEVEL SECURITY;`
* **ALL**: `is_admin()` (Hanya Admin yang dapat melihat live status bot dan riwayat chat log).

---

## ⚡ Database Triggers & Helper Functions

1. **`is_admin()`**:
   ```sql
   CREATE OR REPLACE FUNCTION public.is_admin()
   RETURNS BOOLEAN AS $$
   BEGIN
     RETURN EXISTS (
       SELECT 1 FROM public.profiles
       WHERE id = auth.uid() AND role = 'admin'
     );
   END;
   $$ LANGUAGE plpgsql SECURITY DEFINER;
   ```

2. **`on_booking_activated`**:
   Otomatis menghasilkan UUID `offline_payment_token` saat pesanan dikonfirmasi menjadi `'Aktif'` untuk keperluan pemindaian QR Code di kasir.
