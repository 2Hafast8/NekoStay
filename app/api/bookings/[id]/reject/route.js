import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { verifyAdmin } from "@/lib/supabase/admin";
import {
  apiSuccess,
  apiError,
  apiUnauthorized,
  apiForbidden,
  apiNotFound,
  apiBadRequest,
  apiValidationError,
} from "@/lib/utils/response";

const rejectSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(5, "Alasan penolakan minimal 5 karakter")
    .max(500, "Alasan penolakan maksimal 500 karakter"),
});

/**
 * POST /api/bookings/[id]/reject
 * Menolak pesanan berstatus 'Menunggu' atau 'Antrian' dengan alasan jelas (Hanya Admin).
 */
export async function POST(request, { params }) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // 1. Verifikasi Admin
    const { isAdmin, user } = await verifyAdmin(supabase);
    if (!user) {
      return apiUnauthorized();
    }
    if (!isAdmin) {
      return apiForbidden("Hanya Administrator yang berhak menolak pesanan.");
    }

    // 2. Parse & Validasi input
    const body = await request.json();
    const validatedData = rejectSchema.parse(body);

    // 3. Ambil data pesanan
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("*, profiles:user_id (full_name, email)")
      .eq("id", id)
      .single();

    if (bookingError || !booking) {
      return apiNotFound("Data booking tidak ditemukan");
    }

    // 4. Cek status
    if (booking.status !== "Menunggu" && booking.status !== "Antrian") {
      return apiBadRequest("Hanya booking dengan status Menunggu atau Antrian yang dapat ditolak");
    }

    // 5. Update status ke Dibatalkan dengan alasan penolakan
    const { error: updateError } = await supabase
      .from("bookings")
      .update({
        status: "Dibatalkan",
        reject_reason: validatedData.reason,
      })
      .eq("id", id);

    if (updateError) {
      console.error("[Reject API Error]:", updateError);
      return apiError("Gagal menolak pesanan", 500);
    }

    // 6. Buat notifikasi in-app untuk pengguna
    try {
      await supabase.from("notifications").insert({
        user_id: booking.user_id,
        title: "Pesanan Penitipan Ditolak",
        message: `Mohon maaf, pesanan penitipan untuk ${booking.cat_name} ditolak. Alasan: ${validatedData.reason}`,
        type: "error",
        booking_id: id,
        is_read: false,
      });
    } catch (notifErr) {
      console.warn("[Reject API Notice] User notification failed:", notifErr.message);
    }

    // 7. Kirim email notifikasi penolakan
    const userEmail = booking.profiles?.email;
    if (userEmail) {
      try {
        const { sendBookingRejected } = await import("@/lib/email/resend");
        await sendBookingRejected(
          userEmail,
          booking.profiles.full_name,
          booking.cat_name,
          booking.id,
          validatedData.reason
        );
      } catch (emailErr) {
        console.warn("[Reject API Email Notice]:", emailErr.message);
      }
    }

    return apiSuccess({ id, status: "Dibatalkan" }, "Booking berhasil ditolak");
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiValidationError(error);
    }

    console.error("[Reject API Exception]:", error);
    return apiError("Gagal memproses penolakan booking", 500);
  }
}
