-- ============================================================
-- NekoStay Production Database Schema & Security RLS
-- Sinkronisasi langsung 1:1 dengan basis data Supabase Live
-- ============================================================

-- Ekstensi yang dibutuhkan
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- ============================================================
-- 1. TABEL: profiles (extends auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id             UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name      TEXT NOT NULL,
  phone          TEXT,
  email          TEXT,
  role           TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  referral_code  TEXT UNIQUE,
  referred_by    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  neko_points    INTEGER NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. TABEL: classes (paket kandang kucing & kapasitas)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.classes (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name               TEXT NOT NULL,
  price_per_day      INTEGER NOT NULL,
  description        TEXT,
  facilities         TEXT[],
  image_url          TEXT,
  total_cages        INTEGER DEFAULT 10,
  maintenance_cages  INTEGER DEFAULT 0
);

-- Seed data kelas standar (dengan gambar & kuota kandang)
INSERT INTO public.classes (name, price_per_day, description, facilities, total_cages, maintenance_cages)
VALUES
  ('Basic',    45000,  'Kandang standar dengan fasilitas dasar, cocok untuk penitipan singkat.',
   ARRAY['Kandang standar', 'Makan 2x/hari', 'Air minum'], 10, 0),
  ('Standard', 80000,  'Kandang luas dengan area bermain dan perawatan harian.',
   ARRAY['Kandang luas', 'Makan 3x/hari', 'Mainan kucing', 'Grooming dasar', 'Update via WhatsApp'], 10, 0),
  ('Premium',  130000, 'Kamar privat ber-AC dengan fasilitas lengkap dan pemantauan kamera 24 jam.',
   ARRAY['Kamar privat AC', 'Makan 3x/hari premium', 'Playground khusus', 'Grooming lengkap', 'Laporan foto & video harian', 'Layanan dokter hewan siaga'], 10, 0)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 3. TABEL: bookings (pesanan penitipan)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.bookings (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Data Kucing
  cat_name                 TEXT NOT NULL,
  cat_gender               TEXT NOT NULL CHECK (cat_gender IN ('Jantan', 'Betina')),
  cat_age                  TEXT NOT NULL,
  cat_health_status        TEXT NOT NULL CHECK (cat_health_status IN ('Sehat', 'Sakit', 'Dalam Pengobatan')),
  cat_favorite_food        TEXT,
  cat_is_pregnant          BOOLEAN DEFAULT FALSE,
  cat_notes                TEXT,
  cat_photo_url            TEXT,

  -- Data Pemesanan
  class                    TEXT NOT NULL,
  price_per_day            INTEGER NOT NULL,
  check_in_date            DATE NOT NULL,
  check_out_date           DATE NOT NULL,
  total_days               INTEGER GENERATED ALWAYS AS (check_out_date - check_in_date) STORED,
  estimated_total          INTEGER GENERATED ALWAYS AS ((check_out_date - check_in_date) * price_per_day) STORED,

  -- Status & Alasan
  status                   TEXT NOT NULL DEFAULT 'Menunggu'
                             CHECK (status IN ('Menunggu', 'Aktif', 'Selesai', 'Dibatalkan', 'Antrian')),
  cancel_reason            TEXT,
  reject_reason            TEXT,
  actual_checkout          DATE,
  late_fee_total           INTEGER DEFAULT 0,
  refund_amount            INTEGER DEFAULT 0,
  admin_notes              TEXT,

  -- Pembayaran Online (Midtrans)
  payment_status           TEXT DEFAULT 'Unpaid'
                             CHECK (payment_status IN ('Unpaid', 'Paid', 'Failed', 'Refunded')),
  payment_token            TEXT,
  payment_link_url         TEXT,

  -- Diskon, Referral & Poin Loyalti
  discount_amount          INTEGER DEFAULT 0,
  referral_code_used       TEXT,
  referral_owner_id        UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  points_used              INTEGER NOT NULL DEFAULT 0,
  promo_code_used          TEXT,
  promo_amount             INTEGER DEFAULT 0,

  -- Pembayaran Offline (Token QR Kasir)
  offline_payment_token    TEXT,
  offline_token_created_at TIMESTAMPTZ,
  offline_token_used       BOOLEAN DEFAULT FALSE,

  created_at               TIMESTAMPTZ DEFAULT NOW(),
  updated_at               TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 4. TABEL: booking_admin_notes (catatan multi-admin & sticky alert)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.booking_admin_notes (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id     UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  admin_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category       TEXT NOT NULL DEFAULT 'general'
                   CHECK (category IN ('general', 'medical', 'diet', 'behavior', 'shift_handoff', 'urgent')),
  content        TEXT NOT NULL,
  is_pinned      BOOLEAN DEFAULT FALSE,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_notes_booking_id ON public.booking_admin_notes(booking_id);
CREATE INDEX IF NOT EXISTS idx_admin_notes_pinned ON public.booking_admin_notes(booking_id, is_pinned);

-- ============================================================
-- 5. TABEL: cat_reports (laporan harian kondisi kucing)
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
-- 6. TABEL: notifications (notifikasi in-app)
-- ============================================================
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

-- ============================================================
-- 7. TABEL: reviews (ulasan pesanan selesai)
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
-- 8. TABEL: landing_settings (konfigurasi CMS landing page)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.landing_settings (
  id         VARCHAR PRIMARY KEY,
  content    JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 9. TABEL: promos (kode promo & voucher diskon)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.promos (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code             TEXT UNIQUE NOT NULL,
  title            TEXT NOT NULL,
  discount_type    TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value   INTEGER NOT NULL,
  min_spend        INTEGER NOT NULL DEFAULT 0,
  max_discount     INTEGER,
  applicable_class TEXT NOT NULL DEFAULT 'all',
  usage_limit      INTEGER,
  used_count       INTEGER NOT NULL DEFAULT 0,
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 10. TABEL: whatsapp_bot_state, whatsapp_logs & whatsapp_sessions
-- ============================================================
CREATE TABLE IF NOT EXISTS public.whatsapp_bot_state (
  id                      TEXT PRIMARY KEY DEFAULT 'active_session',
  status                  TEXT NOT NULL DEFAULT 'disconnected',
  qr_code                 TEXT,
  connected_phone         TEXT,
  last_heartbeat          TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW(),
  disconnect_requested_at TIMESTAMPTZ
);

INSERT INTO public.whatsapp_bot_state (id, status)
VALUES ('active_session', 'disconnected')
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.whatsapp_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number    TEXT NOT NULL,
  customer_phone  TEXT,
  customer_name   TEXT,
  sender_name     TEXT,
  sender_role     TEXT,
  direction       TEXT NOT NULL CHECK (direction IN ('incoming', 'outgoing')),
  message_text    TEXT NOT NULL,
  message_type    TEXT NOT NULL DEFAULT 'text',
  flow_state      TEXT DEFAULT 'idle',
  booking_id      UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  metadata        JSONB DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_created ON public.whatsapp_logs USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_created_at ON public.whatsapp_logs USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_customer_phone ON public.whatsapp_logs USING btree (customer_phone, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_phone ON public.whatsapp_logs USING btree (phone_number, created_at DESC);

CREATE TABLE IF NOT EXISTS public.whatsapp_sessions (
  key_id       TEXT PRIMARY KEY,
  session_data JSONB NOT NULL,
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 11. FUNGSI STORED PROCEDURES & TRIGGERS
-- ============================================================

-- A. Auto-update updated_at timestamp
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

-- B. Generate offline payment token saat booking diubah statusnya menjadi Aktif
CREATE OR REPLACE FUNCTION public.generate_offline_token()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'Aktif' AND (OLD.status IS DISTINCT FROM 'Aktif') AND (NEW.offline_payment_token IS NULL) THEN
    NEW.offline_payment_token := gen_random_uuid()::text;
    NEW.offline_token_created_at := NOW();
    NEW.offline_token_used := FALSE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trg_generate_offline_token
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.generate_offline_token();

-- C. Registrasi user baru otomatis ke tabel profiles (dengan kode referral)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  ref_code TEXT;
  ref_by_id UUID := NULL;
BEGIN
  -- Generate kode referral unik dari UUID user
  ref_code := 'NEKO-' || upper(substring(NEW.id::text from 1 for 8));

  -- Cek jika terdapat kode referral pada metadata pendaftaran
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

-- D. Helper: Cek apakah user saat ini adalah admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- E. Helper: Buat notifikasi broadcast ke seluruh admin
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
    VALUES (admin_id_val, title_param, message_param, type_param, booking_id_param, FALSE);
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- F. RPC: Ambil profil pemilik kode referral
CREATE OR REPLACE FUNCTION public.get_profile_by_referral(code_param TEXT)
RETURNS TABLE (id UUID, full_name TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.full_name
  FROM public.profiles p
  WHERE p.referral_code = code_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- G. RPC: Tingkatkan penghitung pemakaian promo secara atomik
CREATE OR REPLACE FUNCTION public.increment_promo_used_count(promo_code_param TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.promos
  SET used_count = used_count + 1
  WHERE code = promo_code_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- H. Stored Procedure: Pengecekan denda keterlambatan penjemputan kucing harian
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
  -- Cari semua pesanan aktif yang tanggal check-out nya sudah lewat dibanding hari ini
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
    
    -- 4. Kirim notifikasi in-app ke pemilik kucing jika belum dikirim hari ini
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
-- 12. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================
ALTER TABLE public.profiles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_admin_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cat_reports         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landing_settings    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promos              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_bot_state   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_logs       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_sessions   ENABLE ROW LEVEL SECURITY;

-- ---------- profiles ----------
DROP POLICY IF EXISTS "Profiles are viewable by owner and admin" ON public.profiles;
CREATE POLICY "Profiles are viewable by owner and admin" ON public.profiles FOR SELECT
  USING ((auth.uid() = id) OR is_admin());

DROP POLICY IF EXISTS "User lihat profil sendiri" ON public.profiles;
CREATE POLICY "User lihat profil sendiri" ON public.profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "User insert profil sendiri" ON public.profiles;
CREATE POLICY "User insert profil sendiri" ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "User update profil sendiri" ON public.profiles;
CREATE POLICY "User update profil sendiri" ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- ---------- classes ----------
DROP POLICY IF EXISTS "Allow public read classes" ON public.classes;
CREATE POLICY "Allow public read classes" ON public.classes FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admin kelola kelas" ON public.classes;
CREATE POLICY "Admin kelola kelas" ON public.classes FOR ALL
  USING (is_admin());

-- ---------- bookings ----------
DROP POLICY IF EXISTS "Admin full control on bookings" ON public.bookings;
CREATE POLICY "Admin full control on bookings" ON public.bookings FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS "User lihat bookings sendiri" ON public.bookings;
CREATE POLICY "User lihat bookings sendiri" ON public.bookings FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "User buat booking" ON public.bookings;
CREATE POLICY "User buat booking" ON public.bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "User cancel booking sendiri" ON public.bookings;
CREATE POLICY "User cancel booking sendiri" ON public.bookings FOR UPDATE
  USING (auth.uid() = user_id AND status = 'Menunggu');

DROP POLICY IF EXISTS "User cancel own booking when waiting" ON public.bookings;
CREATE POLICY "User cancel own booking when waiting" ON public.bookings FOR UPDATE
  USING (auth.uid() = user_id AND status IN ('Menunggu', 'Aktif'))
  WITH CHECK (auth.uid() = user_id AND status = 'Dibatalkan');

-- ---------- booking_admin_notes ----------
DROP POLICY IF EXISTS "Admins full access to booking admin notes" ON public.booking_admin_notes;
CREATE POLICY "Admins full access to booking admin notes" ON public.booking_admin_notes FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- ---------- cat_reports ----------
DROP POLICY IF EXISTS "User lihat laporan kucing sendiri" ON public.cat_reports;
CREATE POLICY "User lihat laporan kucing sendiri" ON public.cat_reports FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.bookings
    WHERE bookings.id = cat_reports.booking_id
      AND bookings.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Admin full control on reports" ON public.cat_reports;
CREATE POLICY "Admin full control on reports" ON public.cat_reports FOR ALL
  USING (is_admin());

-- ---------- notifications ----------
DROP POLICY IF EXISTS "User lihat notifikasi sendiri" ON public.notifications;
CREATE POLICY "User lihat notifikasi sendiri" ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "User update notifikasi sendiri" ON public.notifications;
CREATE POLICY "User update notifikasi sendiri" ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admin create notifications" ON public.notifications;
CREATE POLICY "Admin create notifications" ON public.notifications FOR INSERT
  WITH CHECK (true);

-- ---------- reviews ----------
DROP POLICY IF EXISTS "Public read reviews" ON public.reviews;
CREATE POLICY "Public read reviews" ON public.reviews FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "User create review for completed booking" ON public.reviews;
CREATE POLICY "User create review for completed booking" ON public.reviews FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.bookings
      WHERE bookings.id = reviews.booking_id
        AND bookings.user_id = auth.uid()
        AND bookings.status = 'Selesai'
    )
  );

-- ---------- landing_settings ----------
DROP POLICY IF EXISTS "Allow public read landing_settings" ON public.landing_settings;
CREATE POLICY "Allow public read landing_settings" ON public.landing_settings FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow admin full access landing_settings" ON public.landing_settings;
CREATE POLICY "Allow admin full access landing_settings" ON public.landing_settings FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- ---------- promos ----------
DROP POLICY IF EXISTS "Allow read active promos" ON public.promos;
CREATE POLICY "Allow read active promos" ON public.promos FOR SELECT
  USING (is_active = true OR (auth.uid() IS NOT NULL AND EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')));

DROP POLICY IF EXISTS "Allow admin manage promos" ON public.promos;
CREATE POLICY "Allow admin manage promos" ON public.promos FOR ALL
  USING ((auth.uid() IS NOT NULL) AND (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')))
  WITH CHECK ((auth.uid() IS NOT NULL) AND (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')));

-- ---------- whatsapp_bot_state, whatsapp_logs & whatsapp_sessions ----------
DROP POLICY IF EXISTS "Allow all for whatsapp_bot_state" ON public.whatsapp_bot_state;
CREATE POLICY "Allow all for whatsapp_bot_state" ON public.whatsapp_bot_state FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read/write whatsapp_logs" ON public.whatsapp_logs;
CREATE POLICY "Allow public read/write whatsapp_logs" ON public.whatsapp_logs FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for whatsapp_sessions" ON public.whatsapp_sessions;
CREATE POLICY "Allow all for whatsapp_sessions" ON public.whatsapp_sessions FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- 13. PG_CRON SCHEDULE
-- ============================================================
-- Jadwal cron harian otomatis via pg_cron (setiap pukul 00:00 UTC)
-- Menjalankan check_late_bookings() untuk mengkalkulasi denda & mengirim notifikasi
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule(
      'daily-late-fee-check',
      '0 0 * * *',
      'SELECT public.check_late_bookings();'
    );
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    NULL;
END $$;

