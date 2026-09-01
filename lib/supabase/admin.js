import { createClient } from "@supabase/supabase-js";

/**
 * Creates a Supabase client with the service_role key.
 * This bypasses Row Level Security (RLS) — use ONLY in server-side
 * API routes where the caller has already been verified as admin or system service.
 *
 * @returns {import('@supabase/supabase-js').SupabaseClient}
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error("[createAdminClient Error]: SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL is not set.");
  }

  return createClient(
    url,
    key,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

/**
 * Memverifikasi apakah pemanggil sesi terotentikasi dan memiliki peran Administrator.
 * Standarisasi sesuai SKILL.md Section 12.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @returns {Promise<{ isAdmin: boolean, user: import('@supabase/supabase-js').User | null, profile: Record<string, any> | null }>}
 */
export async function verifyAdmin(supabase) {
  try {
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return { isAdmin: false, user: null, profile: null };
    }

    const { data: profile, error: profileErr } = await supabase
      .from("profiles")
      .select("id, role, full_name, email")
      .eq("id", user.id)
      .single();

    if (profileErr || !profile) {
      return { isAdmin: false, user, profile: null };
    }

    return {
      isAdmin: profile.role === "admin",
      user,
      profile,
    };
  } catch (err) {
    console.error("[verifyAdmin Error]:", err);
    return { isAdmin: false, user: null, profile: null };
  }
}

/**
 * Memverifikasi sesi user yang sedang aktif.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @returns {Promise<{ isAuthenticated: boolean, user: import('@supabase/supabase-js').User | null, profile: Record<string, any> | null }>}
 */
export async function verifyAuthUser(supabase) {
  try {
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return { isAuthenticated: false, user: null, profile: null };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, role, full_name, email")
      .eq("id", user.id)
      .maybeSingle();

    return {
      isAuthenticated: true,
      user,
      profile: profile || null,
    };
  } catch (err) {
    console.error("[verifyAuthUser Error]:", err);
    return { isAuthenticated: false, user: null, profile: null };
  }
}

/**
 * Memverifikasi apakah pengguna saat ini berhak mengakses data booking tertentu
 * (baik sebagai pemilik pesanan maupun sebagai Administrator).
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} bookingId - UUID pesanan
 * @returns {Promise<{ isAllowed: boolean, isOwner: boolean, isAdmin: boolean, user: any, booking: any }>}
 */
export async function verifyBookingAccess(supabase, bookingId) {
  try {
    const { user, profile } = await verifyAuthUser(supabase);
    if (!user) {
      return { isAllowed: false, isOwner: false, isAdmin: false, user: null, booking: null };
    }

    const isAdmin = profile?.role === "admin";

    const { data: booking, error } = await supabase
      .from("bookings")
      .select("*, profiles:user_id (full_name, email, phone)")
      .eq("id", bookingId)
      .maybeSingle();

    if (error || !booking) {
      return { isAllowed: false, isOwner: false, isAdmin, user, booking: null };
    }

    const isOwner = booking.user_id === user.id;
    const isAllowed = isOwner || isAdmin;

    return {
      isAllowed,
      isOwner,
      isAdmin,
      user,
      booking,
    };
  } catch (err) {
    console.error("[verifyBookingAccess Error]:", err);
    return { isAllowed: false, isOwner: false, isAdmin: false, user: null, booking: null };
  }
}
