import { createClient } from "@/lib/supabase/server";
import crypto from "crypto";
import { verifyAdmin } from "@/lib/supabase/admin";
import {
  apiSuccess,
  apiError,
  apiUnauthorized,
  apiForbidden,
  apiNotFound,
  apiBadRequest,
} from "@/lib/utils/response";

/**
 * POST /api/bookings/[id]/resend-receipt
 * Mengirim ulang bukti pemesanan dengan QR Code ke email user (Hanya Admin).
 */
export async function POST(request, { params }) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // 1. Cek sesi Admin
    const { isAdmin, user } = await verifyAdmin(supabase);
    if (!user) {
      return apiUnauthorized();
    }
    if (!isAdmin) {
      return apiForbidden("Hanya Administrator yang dapat mengirim ulang bukti pemesanan.");
    }

    // 2. Ambil data pesanan
    const { data: booking, error: fetchError } = await supabase
      .from("bookings")
      .select("*, profiles:user_id (full_name, email)")
      .eq("id", id)
      .single();

    if (fetchError || !booking) {
      return apiNotFound("Data pesanan tidak ditemukan.");
    }

    if (booking.status !== "Aktif") {
      return apiBadRequest("Hanya booking dengan status Aktif yang dapat dikirimi ulang bukti pembayaran.");
    }

    // 3. Generate token baru jika belum ada atau sudah digunakan
    let token = booking.offline_payment_token;
    const needsNewToken = !token || booking.offline_token_used;

    if (needsNewToken) {
      token = crypto.randomUUID();
      await supabase
        .from("bookings")
        .update({
          offline_payment_token: token,
          offline_token_created_at: new Date().toISOString(),
          offline_token_used: false,
        })
        .eq("id", id);

      booking.offline_payment_token = token;
    } else {
      await supabase
        .from("bookings")
        .update({
          offline_token_created_at: new Date().toISOString(),
        })
        .eq("id", id);
    }

    // 4. Kirim email dengan lampiran PDF
    const userEmail = booking.profiles?.email;
    if (!userEmail) {
      return apiBadRequest("Email pengguna tidak ditemukan di data profil.");
    }

    const { sendBookingStatusUpdate } = await import("@/lib/email/resend");
    const sendResult = await sendBookingStatusUpdate(
      userEmail,
      booking.profiles.full_name,
      booking.cat_name,
      booking.id,
      "Aktif",
      booking
    );

    if (sendResult && sendResult.success === false) {
      return apiError(
        `Gagal mengirim email: ${sendResult.error?.message || sendResult.error || "Layanan email bermasalah"}`,
        500
      );
    }

    return apiSuccess(
      null,
      `Bukti pemesanan dengan QR Code berhasil dikirim ulang ke ${userEmail}`
    );
  } catch (error) {
    console.error("[Resend Receipt API Exception]:", error);
    return apiError("Gagal mengirim ulang bukti pemesanan", 500);
  }
}
