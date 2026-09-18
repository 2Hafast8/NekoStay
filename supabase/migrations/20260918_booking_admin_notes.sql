-- ============================================================
-- Migration: Add booking_admin_notes table for Multi-Admin Notes & Sticky Alerts
-- Date: 2026-09-18
-- ============================================================

CREATE TABLE IF NOT EXISTS public.booking_admin_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL DEFAULT 'general' 
    CHECK (category IN ('general', 'medical', 'diet', 'behavior', 'shift_handoff', 'urgent')),
  content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_notes_booking_id ON public.booking_admin_notes(booking_id);
CREATE INDEX IF NOT EXISTS idx_admin_notes_pinned ON public.booking_admin_notes(booking_id, is_pinned);

-- Row Level Security (RLS)
ALTER TABLE public.booking_admin_notes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'booking_admin_notes' 
      AND policyname = 'Admins full access to booking admin notes'
  ) THEN
    CREATE POLICY "Admins full access to booking admin notes"
    ON public.booking_admin_notes
    FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
      )
    );
  END IF;
END $$;

