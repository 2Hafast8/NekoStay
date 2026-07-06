-- ============================================================
-- NekoStay Database Schema
-- Sinkronisasi lengkap dengan Supabase (per 2026-06-05)
-- Paste script ini ke Supabase SQL Editor untuk setup fresh
-- ============================================================

-- ============================================================
-- 1. TABEL: profiles (extends auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id             UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name      TEXT NOT NULL,
  phone          TEXT,
  email          TEXT,
  role           TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  referral_code  TEXT UNIQUE,
  referred_by    UUID REFERENCES public.profiles(id)
);

-- ============================================================
-- 2. TABEL: classes (paket kandang)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.classes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL CHECK (name IN ('Basic', 'Standard', 'Premium')),
  price_per_day INTEGER NOT NULL,
  description   TEXT,
  facilities    TEXT[]
);

-- Seed data kelas (jalankan sekali)
INSERT INTO public.classes (name, price_per_day, description, facilities)
VALUES
  ('Basic',    50000,  'Kandang standar nyaman bersirkulasi udara baik',
   ARRAY['Kandang standar', 'Makan 2x/hari', 'Air minum steril']),
  ('Standard', 80000,  'Kandang lebih luas dilengkapi area mainan kucing',
   ARRAY['Kandang luas', 'Makan 3x/hari', 'Mainan dasar', 'Pasir wangi']),
  ('Premium',  130000, 'Ruang privat eksklusif ber-AC dengan pemantauan khusus',
   ARRAY['Ruang privat AC', 'Makan teratur premium', 'Grooming harian', 'Layanan dokter hewan siaga'])
ON CONFLICT DO NOTHING;

-- ============================================================
-- 3. TABEL: bookings (pesanan penitipan)
-- ============================================================
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

  -- Diskon & Referral
  discount_amount     INTEGER DEFAULT 0,

  -- Pembayaran (Midtrans)
  payment_status      TEXT DEFAULT 'Unpaid'
                        CHECK (payment_status IN ('Unpaid', 'Paid', 'Failed', 'Refunded')),
  payment_token       TEXT,
  payment_link_url    TEXT,

  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 4. TABEL: cat_reports (laporan harian kucing)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.cat_reports (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id     UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  admin_id       UUID NOT NULL REFERENCES public.profiles(id),

  health_status  TEXT NOT NULL CHECK (health_status IN ('Sehat', 'Kurang Fit', 'Perlu Perhatian')),
  photo_url      TEXT,
  notes          TEXT,
  report_date    DATE NOT NULL DEFAULT CURRENT_DATE,

  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 5. TABEL: notifications (notifikasi in-app)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  message     TEXT NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('info', 'warning', 'success', 'error')),
  is_read     BOOLEAN DEFAULT FALSE,
  booking_id  UUID REFERENCES public.bookings(id),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 6. TABEL: reviews (ulasan pesanan selesai)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.reviews (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  booking_id   UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  rating       INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text  TEXT,
  reply_text   TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_booking_review UNIQUE (booking_id)
);

-- ============================================================
-- 7. FUNGSI & TRIGGER: update updated_at otomatis
-- ============================================================
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

-- ============================================================
-- 8. FUNGSI: handle_new_user (trigger saat user daftar)
--    - Generate kode referral unik
--    - Daftarkan referred_by jika ada kode di metadata
--    - Set role admin jika email termasuk whitelist
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  ref_code TEXT;
  ref_by_id UUID := NULL;
BEGIN
  -- Generate kode referral unik dari UUID user baru
  ref_code := 'NEKO-' || upper(substring(NEW.id::text from 1 for 8));

  -- Cek apakah user didaftarkan via kode referral orang lain
  IF NEW.raw_user_meta_data->>'referred_by_code' IS NOT NULL THEN
    SELECT id INTO ref_by_id FROM public.profiles
    WHERE referral_code = NEW.raw_user_meta_data->>'referred_by_code';
  END IF;

  INSERT INTO public.profiles (id, full_name, phone, email, role, referral_code, referred_by)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Tamu Neko'),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    NEW.email,
    CASE
      WHEN NEW.email IN ('admin@nekostay.com', 'fast281811@gmail.com') THEN 'admin'
      ELSE 'user'
    END,
    ref_code,
    ref_by_id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 9. FUNGSI HELPER: is_admin()
--    Digunakan di RLS untuk menghindari rekursi
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 10. FUNGSI: create_admin_notification()
--     Kirim notifikasi ke semua akun admin
-- ============================================================
CREATE OR REPLACE FUNCTION public.create_admin_notification(
  booking_id_param UUID,
  title_param      TEXT,
  message_param    TEXT,
  type_param       TEXT
)
RETURNS VOID AS $$
DECLARE
  admin_id_val UUID;
BEGIN
  FOR admin_id_val IN
    SELECT id FROM public.profiles WHERE role = 'admin'
  LOOP
    INSERT INTO public.notifications (user_id, title, message, type, booking_id, is_read)
    VALUES (admin_id_val, title_param, message_param, type_param, booking_id_param, false);
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 11. FUNGSI: get_profile_by_referral()
--     Query profil berdasarkan kode referral (bypass RLS)
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_profile_by_referral(code_param TEXT)
RETURNS TABLE (id UUID, full_name TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.full_name
  FROM public.profiles p
  WHERE p.referral_code = code_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 12. FUNGSI: check_late_bookings()
--     Cron harian — hitung denda keterlambatan & kirim notifikasi
-- ============================================================
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
  -- Cari semua pesanan aktif yang tanggal check-out nya sudah lewat
  FOR r IN
    SELECT id, user_id, price_per_day, check_out_date, cat_name
    FROM public.bookings
    WHERE status = 'Aktif' AND check_out_date < today_date
  LOOP
    -- 1. Hitung selisih hari terlambat
    late_days := today_date - r.check_out_date;

    -- 2. Hitung akumulasi denda (kenaikan harian 8% kumulatif)
    total_fee := 0;
    FOR i IN 1..late_days LOOP
      fee := floor(r.price_per_day * power(1.08, i));
      total_fee := total_fee + fee;
    END LOOP;

    -- 3. Update nominal denda di kolom bookings.late_fee_total
    UPDATE public.bookings
    SET late_fee_total = total_fee
    WHERE id = r.id;

    -- 4. Kirim notifikasi in-app (hanya sekali per hari)
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



-- ============================================================
-- 14. ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE public.profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cat_reports   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews       ENABLE ROW LEVEL SECURITY;

-- ---------- profiles ----------
CREATE POLICY "Profiles are viewable by owner and admin" ON public.profiles FOR SELECT
  USING (auth.uid() = id OR is_admin());

CREATE POLICY "User lihat profil sendiri" ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "User insert profil sendiri" ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "User update profil sendiri" ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- ---------- classes ----------
CREATE POLICY "Semua user lihat kelas" ON public.classes FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admin kelola kelas" ON public.classes FOR ALL
  USING (is_admin());

-- ---------- bookings ----------
CREATE POLICY "User lihat bookings sendiri" ON public.bookings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "User buat booking" ON public.bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "User cancel booking sendiri" ON public.bookings FOR UPDATE
  USING (auth.uid() = user_id AND status = 'Menunggu');

CREATE POLICY "User cancel own booking when waiting" ON public.bookings FOR UPDATE
  USING (auth.uid() = user_id AND status IN ('Menunggu', 'Aktif'))
  WITH CHECK (auth.uid() = user_id AND status = 'Dibatalkan');

CREATE POLICY "Admin full control on bookings" ON public.bookings FOR ALL
  USING (is_admin());

-- ---------- cat_reports ----------
CREATE POLICY "User lihat laporan kucing sendiri" ON public.cat_reports FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.bookings
    WHERE bookings.id = cat_reports.booking_id
      AND bookings.user_id = auth.uid()
  ));

CREATE POLICY "Admin full control on reports" ON public.cat_reports FOR ALL
  USING (is_admin());

-- ---------- notifications ----------
CREATE POLICY "User lihat notifikasi sendiri" ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "User update notifikasi sendiri" ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admin create notifications" ON public.notifications FOR INSERT
  WITH CHECK (true);

-- ---------- reviews ----------
CREATE POLICY "Public read reviews" ON public.reviews FOR SELECT
  USING (true);

CREATE POLICY "User create review for completed booking" ON public.reviews FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.bookings
      WHERE bookings.id = booking_id
        AND bookings.user_id = auth.uid()
        AND bookings.status = 'Selesai'
    )
  );

-- ============================================================
-- 15. CRON JOBS (aktifkan pg_cron di Supabase Extensions)
-- ============================================================
-- Aktifkan extension pg_cron di:
--   Dashboard → Database → Extensions → pg_cron

-- Jadwalkan pemeriksaan keterlambatan setiap hari jam 00:00 UTC (07:00 WIB):
-- SELECT cron.schedule(
--   'check-late-bookings-daily',
--   '0 0 * * *',
--   'SELECT public.check_late_bookings();'
-- );


