-- Advanced Features & Enhancement Migration for NekoStay

-- 1. Create reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  booking_id  UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  rating      INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_booking_review UNIQUE (booking_id)
);

-- RLS for reviews
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Public can view reviews
CREATE POLICY "Public read reviews" ON public.reviews FOR SELECT USING (true);

-- User can insert reviews for their own completed bookings
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

-- 2. Modify profiles & bookings for referral program
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES public.profiles(id);
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS discount_amount INTEGER DEFAULT 0;

-- Populate existing profiles with referral codes
UPDATE public.profiles 
SET referral_code = 'NEKO-' || upper(substring(id::text from 1 for 8))
WHERE referral_code IS NULL;

-- 3. Update handle_new_user function to include referral code generation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  ref_code TEXT;
  ref_by_id UUID := NULL;
BEGIN
  -- Generate unique referral code from UUID
  ref_code := 'NEKO-' || upper(substring(NEW.id::text from 1 for 8));
  
  -- Check if referred by code is supplied in metadata
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
