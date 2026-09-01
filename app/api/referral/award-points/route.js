import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";
import { awardPointsSchema } from "@/lib/validations/booking";
import {
  apiSuccess,
  apiError,
  apiUnauthorized,
  apiForbidden,
  apiNotFound,
  apiBadRequest,
  apiValidationError,
} from "@/lib/utils/response";

/**
 * POST /api/referral/award-points
 * Memberikan poin reward referral secara aman ke akun pemilik kode referral.
 */
export async function POST(request) {
  try {
    const supabase = await createClient();

    // 1. Verifikasi user terotentikasi
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return apiUnauthorized();
    }

    // 2. Parse & Validasi payload
    const body = await request.json();
    const { ownerId, bookingId, points } = awardPointsSchema.parse(body);

    const adminDb = createAdminClient();

    // 3. Verifikasi booking ada dan mencocokkan data
    const { data: booking, error: bookingErr } = await adminDb
      .from("bookings")
      .select("id, user_id, referral_owner_id, referral_code_used")
      .eq("id", bookingId)
      .single();

    if (bookingErr || !booking) {
      return apiNotFound("Data booking tidak ditemukan.");
    }

    // Keamanan: Pastikan pemanggil adalah pemilik pesanan atau admin
    const { data: profileCaller } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const isAuthorized = booking.user_id === user.id || profileCaller?.role === "admin";
    if (!isAuthorized) {
      return apiForbidden("Anda tidak berhak memicu pemberian poin untuk pesanan ini.");
    }

    if (booking.referral_owner_id && booking.referral_owner_id !== ownerId) {
      return apiBadRequest("ID pemilik referral tidak sesuai dengan data pesanan.");
    }

    // 4. Tambahkan neko_points ke profil penerima
    const { data: profile, error: profileErr } = await adminDb
      .from("profiles")
      .select("neko_points, full_name")
      .eq("id", ownerId)
      .single();

    if (profileErr || !profile) {
      return apiNotFound("Profil pemilik referral tidak ditemukan.");
    }

    const newPoints = (profile.neko_points || 0) + points;

    const { error: updateErr } = await adminDb
      .from("profiles")
      .update({ neko_points: newPoints })
      .eq("id", ownerId);

    if (updateErr) {
      console.error("[Award Points Error]:", updateErr);
      return apiError("Gagal memperbarui poin referral.", 500);
    }

    // 5. Kirim notifikasi in-app ke pemilik referral
    try {
      await adminDb.from("notifications").insert({
        user_id: ownerId,
        title: "Poin Neko Diterima! 🎉",
        message: `Selamat! Anda mendapatkan ${points} Poin Neko karena kode referral Anda digunakan dalam pemesanan baru.`,
        type: "success",
        booking_id: bookingId,
        is_read: false,
      });
    } catch (notifErr) {
      console.warn("[Award Points Notice] Notification failed:", notifErr.message);
    }

    return apiSuccess({ newPoints }, "Poin referral berhasil ditambahkan");
  } catch (err) {
    if (err instanceof z.ZodError) {
      return apiValidationError(err);
    }

    console.error("[Award Points Exception]:", err);
    return apiError("Gagal memproses penambahan poin referral", 500);
  }
}
