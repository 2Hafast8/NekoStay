import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { cancelBookingSchema } from "@/lib/validations/booking";
import {
  apiSuccess,
  apiError,
  apiUnauthorized,
  apiNotFound,
  apiBadRequest,
  apiValidationError,
} from "@/lib/utils/response";

/**
 * POST /api/bookings/[id]/cancel
 * Membatalkan pesanan yang berstatus 'Menunggu' oleh pemilik pesanan.
 */
export async function POST(request, { params }) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // 1. Cek sesi pengguna
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return apiUnauthorized();
    }

    // 2. Parse & Validasi body
    const body = await request.json();
    const validatedData = cancelBookingSchema.parse(body);

    // 3. Ambil data pesanan dan verifikasi kepemilikan
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("id, status, cat_name, user_id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (bookingError || !booking) {
      return apiNotFound("Booking tidak ditemukan atau bukan milik Anda");
    }

    // 4. Cek status: User hanya dapat membatalkan pesanan berstatus 'Menunggu'
    if (booking.status !== "Menunggu") {
      return apiBadRequest(
        `Pesanan ini telah diproses (Status: ${booking.status}) dan tidak dapat dibatalkan secara langsung.`
      );
    }

    // 5. Update atomic database
    const { data: updatedBooking, error: updateError } = await supabase
      .from("bookings")
      .update({
        status: "Dibatalkan",
        cancel_reason: validatedData.reason,
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .eq("status", "Menunggu")
      .select()
      .maybeSingle();

    if (updateError) {
      console.error("[Cancel API Error]:", updateError);
      return apiError("Gagal membatalkan pesanan", 500);
    }

    if (!updatedBooking) {
      return apiBadRequest(
        "Status pesanan telah berubah saat proses pembatalan. Pembatalan tidak dapat dilanjutkan."
      );
    }

    // 6. Kirim notifikasi ke Admin
    try {
      const { data: admins } = await supabase
        .from("profiles")
        .select("id")
        .eq("role", "admin");

      if (admins && admins.length > 0) {
        const notificationsToInsert = admins.map((admin) => ({
          user_id: admin.id,
          title: "Pesanan Dibatalkan User",
          message: `Booking untuk kucing ${booking.cat_name} telah dibatalkan oleh pemilik. Alasan: ${validatedData.reason}`,
          type: "warning",
          booking_id: id,
          is_read: false,
        }));

        await supabase.from("notifications").insert(notificationsToInsert);
      }
    } catch (notifErr) {
      console.warn("[Cancel API Warning] Admin notification failed:", notifErr.message);
    }

    return apiSuccess({ id: updatedBooking.id }, "Booking berhasil dibatalkan");
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiValidationError(error);
    }

    console.error("[Cancel API Exception]:", error);
    return apiError("Gagal membatalkan booking", 500);
  }
}
