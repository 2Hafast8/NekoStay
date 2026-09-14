import { createClient } from "@/lib/supabase/server";
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
 * POST /api/bookings/[id]/confirm
 * Mengkonfirmasi pesanan berstatus 'Menunggu' menjadi 'Aktif' (Hanya Admin).
 */
export async function POST(request, { params }) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    const { isAdmin, user } = await verifyAdmin(supabase);
    if (!user) {
      return apiUnauthorized();
    }
    if (!isAdmin) {
      return apiForbidden("Hanya Administrator yang berhak mengonfirmasi pesanan.");
    }

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("id, status, cat_name, user_id")
      .eq("id", id)
      .single();

    if (bookingError || !booking) {
      return apiNotFound("Data booking tidak ditemukan");
    }

    if (booking.status !== "Menunggu" && booking.status !== "Antrian") {
      return apiBadRequest("Hanya booking dengan status Menunggu atau Antrian yang dapat dikonfirmasi");
    }

    // Database trigger secara otomatis men-generate offline_payment_token saat status menjadi Aktif
    const { error: updateError } = await supabase
      .from("bookings")
      .update({ status: "Aktif" })
      .eq("id", id);

    if (updateError) {
      console.error("[Confirm API Error]:", updateError);
      return apiError("Gagal memperbarui status booking", 500);
    }

    const { data: updatedBooking } = await supabase
      .from("bookings")
      .select("*, profiles:user_id (full_name, email)")
      .eq("id", id)
      .single();

    try {
      await supabase.from("notifications").insert({
        user_id: booking.user_id,
        title: "Pesanan Penitipan Dikonfirmasi!",
        message: `Pesanan penitipan untuk kucing ${booking.cat_name} telah dikonfirmasi dan aktif. Silakan antar kucing Anda sesuai jadwal.`,
        type: "success",
        booking_id: id,
        is_read: false,
      });
    } catch (notifErr) {
      console.warn("[Confirm API Notice] User notification failed:", notifErr.message);
    }

    const userEmail = updatedBooking?.profiles?.email;
    if (userEmail && updatedBooking) {
      try {
        const { sendBookingStatusUpdate } = await import("@/lib/email/resend");
        await sendBookingStatusUpdate(
          userEmail,
          updatedBooking.profiles.full_name,
          updatedBooking.cat_name,
          updatedBooking.id,
          "Aktif",
          updatedBooking
        );
      } catch (emailErr) {
        console.warn("[Confirm API Email Notice]:", emailErr.message);
      }
    }

    return apiSuccess({ id, status: "Aktif" }, "Booking berhasil dikonfirmasi");
  } catch (error) {
    console.error("[Confirm API Exception]:", error);
    return apiError("Gagal mengkonfirmasi booking", 500);
  }
}
