import { createClient } from "@/lib/supabase/server";
import { verifyBookingAccess } from "@/lib/supabase/admin";
import {
  apiSuccess,
  apiError,
  apiUnauthorized,
  apiForbidden,
  apiNotFound,
} from "@/lib/utils/response";

/**
 * POST /api/bookings/[id]/wa-request-change
 * Mengirim notifikasi internal ke Admin saat user mengajukan perubahan via WhatsApp.
 */
export async function POST(request, { params }) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // 1. Verifikasi hak akses (Pemilik pesanan atau Admin)
    const { isAllowed, user, booking } = await verifyBookingAccess(supabase, id);

    if (!user) {
      return apiUnauthorized();
    }

    if (!booking) {
      return apiNotFound("Data booking tidak ditemukan.");
    }

    if (!isAllowed) {
      return apiForbidden("Anda tidak memiliki izin untuk pesanan ini.");
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    const ownerName = profile?.full_name || "Pelanggan";
    const catName = booking.cat_name || "Kucing";

    // 2. Buat notifikasi admin via RPC
    try {
      await supabase.rpc("create_admin_notification", {
        booking_id_param: id,
        title_param: `Permintaan Perubahan (WA): ${catName}`,
        message_param: `${ownerName} meminta perubahan jadwal/kelas kucing via WhatsApp.`,
        type_param: "info",
      });
    } catch (notifErr) {
      console.warn("[WA Request Change Notice] Admin notification failed:", notifErr.message);
    }

    return apiSuccess(null, "Permintaan perubahan berhasil dikirim ke Admin");
  } catch (err) {
    console.error("[WA Request Change Exception]:", err);
    return apiError("Gagal memproses permintaan perubahan", 500);
  }
}
