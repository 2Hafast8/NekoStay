-- ============================================================
-- NekoStay Production Database Schema & Security RLS
-- Sinkronisasi lengkap seluruh modul NekoStay (Core, Auth, Bookings, Payments, WhatsApp, Reviews, Promos)
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
  referral_code  TEXT UNIQUE,
  referred_by    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  neko_points    INTEGER DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. TABEL: classes (paket kandang kucing)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.classes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT UNIQUE NOT NULL CHECK (name IN ('Basic', 'Standard', 'Premium')),
  price_per_day INTEGER NOT NULL,
  description   TEXT,
  facilities    TEXT[]
);

-- Seed data kelas standar
INSERT INTO public.classes (name, price_per_day, description, facilities)
VALUES
  ('Basic',    50000,  'Kandang standar nyaman bersirkulasi udara baik',
   ARRAY['Kandang standar', 'Makan 2x/hari', 'Air minum steril']),
  ('Standard', 80000,  'Kandang lebih luas dilengkapi area mainan kucing',
   ARRAY['Kandang luas', 'Makan 3x/hari', 'Mainan dasar', 'Pasir wangi']),
  ('Premium',  130000, 'Ruang privat eksklusif ber-AC dengan pemantauan khusus',
   ARRAY['Ruang privat AC', 'Makan teratur premium', 'Grooming harian', 'Layanan dokter hewan siaga'])
ON CONFLICT (name) DO UPDATE 
SET price_per_day = EXCLUDED.price_per_day,
    description = EXCLUDED.description,
    facilities = EXCLUDED.facilities;

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
  class                    TEXT NOT NULL CHECK (class IN ('Basic', 'Standard', 'Premium')),
  price_per_day            INTEGER NOT NULL,
  check_in_date            DATE NOT NULL,
  check_out_date           DATE NOT NULL,
  total_days               INTEGER GENERATED ALWAYS AS (check_out_date - check_in_date) STORED,
  estimated_total          INTEGER GENERATED ALWAYS AS ((check_out_date - check_in_date) * price_per_day) STORED,

  -- Status & Meta
  status                   TEXT NOT NULL DEFAULT 'Menunggu'
                             CHECK (status IN ('Menunggu', 'Aktif', 'Selesai', 'Dibatalkan', 'Antrian')),
  cancel_reason            TEXT,
  reject_reason            TEXT,
  admin_notes              TEXT,
  actual_checkout          DATE,
  late_fee_total           INTEGER DEFAULT 0,
  refund_amount            INTEGER DEFAULT 0,

  -- Diskon & Referral
  discount_amount          INTEGER DEFAULT 0,
  referral_code_used       TEXT,
  referral_owner_id        UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

  -- Pembayaran Online (Midtrans)
  payment_status           TEXT DEFAULT 'Unpaid'
                             CHECK (payment_status IN ('Unpaid', 'Paid', 'Failed', 'Refunded')),
  payment_token            TEXT,
  payment_link_url         TEXT,

  -- Pembayaran Offline (QR Scan di Kasir)
  offline_payment_token    UUID,
  offline_token_used       BOOLEAN DEFAULT FALSE,
  offline_token_created_at TIMESTAMPTZ,

  created_at               TIMESTAMPTZ DEFAULT NOW(),
  updated_at               TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 4. TABEL: cat_reports (laporan harian kondisi kucing)
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
  booking_id  UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
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
-- 7. TABEL: promos (kode diskon & promo)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.promos (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code             TEXT UNIQUE NOT NULL,
  title            TEXT NOT NULL,
  discount_type    TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value   INTEGER NOT NULL,
  max_discount     INTEGER,
  min_spend        INTEGER DEFAULT 0,
  applicable_class TEXT DEFAULT 'all',
  is_active        BOOLEAN DEFAULT TRUE,
  usage_limit      INTEGER,
  used_count       INTEGER DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 8. TABEL: whatsapp_bot_state & whatsapp_logs
-- ============================================================
CREATE TABLE IF NOT EXISTS public.whatsapp_bot_state (
  id              TEXT PRIMARY KEY DEFAULT 'active_session',
  status          TEXT NOT NULL DEFAULT 'disconnected',
  qr_code         TEXT,
  connected_phone TEXT,
  last_heartbeat  TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.whatsapp_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number    TEXT,
  customer_phone  TEXT,
  customer_name   TEXT,
  sender_name     TEXT,
  sender_role     TEXT DEFAULT 'customer',
  direction       TEXT NOT NULL CHECK (direction IN ('incoming', 'outgoing')),
  message_text    TEXT NOT NULL,
  message_type    TEXT DEFAULT 'text',
  flow_state      TEXT DEFAULT 'idle',
  booking_id      UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  metadata        JSONB DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 9. FUNGSI & TRIGGER: update updated_at otomatis
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

-- Trigger untuk generate offline QR token saat booking dikonfirmasi menjadi Aktif
CREATE OR REPLACE FUNCTION public.handle_booking_activation()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'Aktif' AND (OLD.status IS NULL OR OLD.status != 'Aktif') THEN
    IF NEW.offline_payment_token IS NULL THEN
      NEW.offline_payment_token := gen_random_uuid();
      NEW.offline_token_created_at := NOW();
      NEW.offline_token_used := FALSE;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER on_booking_activated
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.handle_booking_activation();

-- ============================================================
-- 10. FUNGSI: handle_new_user (trigger saat user daftar)
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  ref_code TEXT;
  ref_by_id UUID := NULL;
BEGIN
  ref_code := 'NEKO-' || upper(substring(NEW.id::text from 1 for 8));

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
-- 11. FUNGSI HELPER: is_admin() & create_admin_notification()
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
-- 12. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================
ALTER TABLE public.profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cat_reports       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promos            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_bot_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_logs     ENABLE ROW LEVEL SECURITY;

-- ---------- profiles ----------
DROP POLICY IF EXISTS "Profiles are viewable by owner and admin" ON public.profiles;
CREATE POLICY "Profiles are viewable by owner and admin" ON public.profiles FOR SELECT
  USING (auth.uid() = id OR is_admin());

DROP POLICY IF EXISTS "User update profil sendiri" ON public.profiles;
CREATE POLICY "User update profil sendiri" ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- ---------- classes ----------
DROP POLICY IF EXISTS "Semua user lihat kelas" ON public.classes;
CREATE POLICY "Semua user lihat kelas" ON public.classes FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admin kelola kelas" ON public.classes;
CREATE POLICY "Admin kelola kelas" ON public.classes FOR ALL
  USING (is_admin());

-- ---------- bookings ----------
DROP POLICY IF EXISTS "User lihat bookings sendiri" ON public.bookings;
CREATE POLICY "User lihat bookings sendiri" ON public.bookings FOR SELECT
  USING (auth.uid() = user_id OR is_admin());

DROP POLICY IF EXISTS "User buat booking" ON public.bookings;
CREATE POLICY "User buat booking" ON public.bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "User cancel booking sendiri" ON public.bookings;
CREATE POLICY "User cancel booking sendiri" ON public.bookings FOR UPDATE
  USING (auth.uid() = user_id AND status = 'Menunggu');

DROP POLICY IF EXISTS "Admin full control on bookings" ON public.bookings;
CREATE POLICY "Admin full control on bookings" ON public.bookings FOR ALL
  USING (is_admin());

-- ---------- cat_reports ----------
DROP POLICY IF EXISTS "User lihat laporan kucing sendiri" ON public.cat_reports;
CREATE POLICY "User lihat laporan kucing sendiri" ON public.cat_reports FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.bookings
    WHERE bookings.id = cat_reports.booking_id
      AND (bookings.user_id = auth.uid() OR is_admin())
  ));

DROP POLICY IF EXISTS "Admin full control on reports" ON public.cat_reports;
CREATE POLICY "Admin full control on reports" ON public.cat_reports FOR ALL
  USING (is_admin());

-- ---------- notifications ----------
DROP POLICY IF EXISTS "User lihat notifikasi sendiri" ON public.notifications;
CREATE POLICY "User lihat notifikasi sendiri" ON public.notifications FOR SELECT
  USING (auth.uid() = user_id OR is_admin());

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
      WHERE bookings.id = booking_id
        AND bookings.user_id = auth.uid()
        AND bookings.status = 'Selesai'
    )
  );

DROP POLICY IF EXISTS "Admin manage reviews" ON public.reviews;
CREATE POLICY "Admin manage reviews" ON public.reviews FOR ALL
  USING (is_admin());

-- ---------- promos ----------
DROP POLICY IF EXISTS "Public read active promos" ON public.promos;
CREATE POLICY "Public read active promos" ON public.promos FOR SELECT
  USING (is_active = true OR is_admin());

DROP POLICY IF EXISTS "Admin manage promos" ON public.promos;
CREATE POLICY "Admin manage promos" ON public.promos FOR ALL
  USING (is_admin());

-- ---------- whatsapp_bot_state & logs ----------
DROP POLICY IF EXISTS "Admin manage whatsapp state" ON public.whatsapp_bot_state;
CREATE POLICY "Admin manage whatsapp state" ON public.whatsapp_bot_state FOR ALL
  USING (is_admin());

DROP POLICY IF EXISTS "Admin manage whatsapp logs" ON public.whatsapp_logs;
CREATE POLICY "Admin manage whatsapp logs" ON public.whatsapp_logs FOR ALL
  USING (is_admin());
