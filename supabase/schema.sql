-- NekoStay Database Schema
-- Paste this script into the Supabase SQL Editor

-- 1. Create profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT NOT NULL,
  phone       TEXT,
  email       TEXT,
  role        TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create bookings table
CREATE TABLE IF NOT EXISTS public.bookings (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

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
  admin_notes         TEXT,
  actual_checkout     DATE,
  late_fee_total      INTEGER DEFAULT 0,
  refund_amount       INTEGER DEFAULT 0,

  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create cat_reports table
CREATE TABLE IF NOT EXISTS public.cat_reports (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id      UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  admin_id        UUID NOT NULL REFERENCES public.profiles(id),

  health_status   TEXT NOT NULL CHECK (health_status IN ('Sehat', 'Kurang Fit', 'Perlu Perhatian')),
  photo_url       TEXT,
  notes           TEXT,
  report_date     DATE NOT NULL DEFAULT CURRENT_DATE,

  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  message     TEXT NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('info', 'warning', 'success', 'error')),
  is_read     BOOLEAN DEFAULT FALSE,
  booking_id  UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create classes table
CREATE TABLE IF NOT EXISTS public.classes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL CHECK (name IN ('Basic', 'Standard', 'Premium')),
  price_per_day INTEGER NOT NULL,
  description   TEXT,
  facilities    TEXT[]
);

-- Seed initial classes if empty
INSERT INTO public.classes (name, price_per_day, description, facilities)
VALUES
('Basic',    50000,  'Kandang standar nyaman bersirkulasi udara baik', ARRAY['Kandang standar', 'Makan 2x/hari', 'Air minum steril']),
('Standard', 80000,  'Kandang lebih luas dilengkapi area mainan kucing', ARRAY['Kandang luas', 'Makan 3x/hari', 'Mainan dasar', 'Pasir wangi']),
('Premium',  130000, 'Ruang privat eksklusif ber-AC dengan pemantauan khusus', ARRAY['Ruang privat AC', 'Makan teratur premium', 'Grooming harian', 'Layanan dokter hewan siaga'])
ON CONFLICT DO NOTHING;

-- 6. Trigger to automatically update updated_at on bookings
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 7. Trigger to automatically create a profile record upon user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Tamu Neko'),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    NEW.email,
    CASE 
      WHEN NEW.email IN ('admin@nekostay.com', 'fast281811@gmail.com') THEN 'admin'
      ELSE 'user'
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 8. Helper Function to Avoid RLS Recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Row Level Security Policies
ALTER TABLE public.profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cat_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes    ENABLE ROW LEVEL SECURITY;

-- Class Policies
CREATE POLICY "Public read classes" ON public.classes FOR SELECT USING (true);
CREATE POLICY "Admin kelola kelas" ON public.classes FOR ALL USING (public.is_admin());

-- Profile Policies
CREATE POLICY "Profiles are viewable by owner and admin" ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Profiles can be updated by owner" ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "User insert profil sendiri" ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Booking Policies
CREATE POLICY "User view own bookings" ON public.bookings FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "User create bookings" ON public.bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "User cancel own booking when waiting" ON public.bookings FOR UPDATE
  USING (auth.uid() = user_id AND status IN ('Menunggu', 'Aktif'))
  WITH CHECK (auth.uid() = user_id AND status = 'Dibatalkan');

CREATE POLICY "Admin full control on bookings" ON public.bookings FOR ALL
  USING (public.is_admin());

-- Cat Reports Policies
CREATE POLICY "Users can view reports for their bookings" ON public.cat_reports FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.bookings 
    WHERE bookings.id = cat_reports.booking_id AND (bookings.user_id = auth.uid() OR public.is_admin())
  ));

CREATE POLICY "Admin full control on reports" ON public.cat_reports FOR ALL
  USING (public.is_admin());

-- Notifications Policies
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admin create notifications" ON public.notifications FOR INSERT
  WITH CHECK (true);

-- ============================================================
-- 10. CRON AUTOMATION — Supabase pg_cron (Opsional)
--    Menghitung denda & kirim notifikasi harian otomatis
-- ============================================================

-- Fungsi untuk memeriksa & mengupdate keterlambatan pemesanan
CREATE OR REPLACE FUNCTION public.check_late_bookings()
RETURNS VOID AS $$
DECLARE
  r RECORD;
  late_days INT;
  total_fee INT;
  fee INT;
  i INT;
  today_date DATE := CURRENT_DATE;
BEGIN
  FOR r IN 
    SELECT id, user_id, price_per_day, check_out_date, cat_name
    FROM public.bookings
    WHERE status = 'Aktif' AND check_out_date < today_date
  LOOP
    -- 1. Hitung jumlah hari terlambat
    late_days := today_date - r.check_out_date;
    
    -- 2. Hitung akumulasi denda (8% kenaikan harian)
    total_fee := 0;
    FOR i IN 1..late_days LOOP
      fee := floor(r.price_per_day * power(1.08, i));
      total_fee := total_fee + fee;
    END LOOP;
    
    -- 3. Update denda di tabel bookings
    UPDATE public.bookings
    SET late_fee_total = total_fee
    WHERE id = r.id;
    
    -- 4. Kirim notifikasi in-app untuk pengguna
    -- Cek jika notifikasi untuk hari ini sudah dikirim agar tidak duplikat
    IF NOT EXISTS (
      SELECT 1 FROM public.notifications 
      WHERE booking_id = r.id 
        AND title = 'Peringatan Keterlambatan' 
        AND created_at::DATE = today_date
    ) THEN
      INSERT INTO public.notifications (user_id, title, message, type, booking_id)
      VALUES (
        r.user_id,
        'Peringatan Keterlambatan',
        'Kucing Anda (' || r.cat_name || ') sudah melewati batas waktu penjemputan. Akumulasi denda saat ini: Rp ' || to_char(total_fee, 'FM999,999,999'),
        'warning',
        r.id
      );
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cara mengaktifkan PG_CRON di Supabase:
-- 1. Masuk ke Supabase Dashboard -> Database -> Extensions -> Cari & aktifkan "pg_cron".
-- 2. Jalankan perintah SQL di bawah untuk menjadwalkan pemeriksaan harian:
--
-- SELECT cron.schedule(
--   'check-late-bookings-daily', -- nama tugas
--   '0 0 * * *',                  -- cron schedule (setiap hari jam 00:00 UTC / 07:00 WIB)
--   'SELECT public.check_late_bookings();'
-- );


-- Fungsi untuk pembersihan data pesanan usang secara otomatis
CREATE OR REPLACE FUNCTION public.cleanup_old_bookings()
RETURNS VOID AS $$
BEGIN
  -- 1. Hapus pesanan berstatus 'Selesai' yang sudah lebih dari 2 jam
  DELETE FROM public.bookings
  WHERE status = 'Selesai' 
    AND updated_at < NOW() - INTERVAL '2 hours';

  -- 2. Hapus pesanan berstatus 'Dibatalkan' yang sudah lebih dari 1 hari (24 jam)
  DELETE FROM public.bookings
  WHERE status = 'Dibatalkan' 
    AND updated_at < NOW() - INTERVAL '1 day';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Untuk mengaktifkan cron pembersihan di Supabase:
-- SELECT cron.schedule(
--   'cleanup-old-bookings-hourly', -- nama tugas
--   '0 * * * *',                   -- cron schedule (setiap 1 jam)
--   'SELECT public.cleanup_old_bookings();'
-- );


