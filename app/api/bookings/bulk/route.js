import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { verifyAdmin } from "@/lib/supabase/admin";
import { bulkActionSchema } from "@/lib/validations/booking";
import {
  apiSuccess,
  apiError,
  apiUnauthorized,
  apiForbidden,
  apiBadRequest,
  apiValidationError,
} from "@/lib/utils/response";

/**
 * POST /api/bookings/bulk
 * Menyetujui atau menolak pesanan secara massal (Hanya Admin).
 */
export async function POST(request) {
  try {
    const supabase = await createClient();

    // 1. Verifikasi Admin
    const { isAdmin, user } = await verifyAdmin(supabase);
    if (!user) {
      return apiUnauthorized();
    }
    if (!isAdmin) {
      return apiForbidden("Hanya Administrator yang berhak memproses tindakan massal.");
    }

    // 2. Parse & Validasi payload
    const body = await request.json();
    const { ids, action, rejectReason } = bulkActionSchema.parse(body);

    // 3. Ambil data pesanan
    const { data: bookings, error: bookingsError } = await supabase
      .from("bookings")
      .select("*, profiles:user_id (full_name, email)")
      .in("id", ids);

    if (bookingsError) {
      console.error("[Bulk API Error]:", bookingsError);
      return apiError("Gagal mengambil data pesanan", 500);
    }

    const validBookings = bookings.filter((b) => b.status === "Menunggu" || b.status === "Antrian");
    if (validBookings.length === 0) {
      return apiBadRequest("Tidak ada pesanan berstatus Menunggu/Antrian yang dapat diproses.");
    }

    const validIds = validBookings.map((b) => b.id);
    let processedCount = 0;

    if (action === "approve") {
      // Bulk update ke Aktif
      const { error: updateError } = await supabase
        .from("bookings")
        .update({ status: "Aktif" })
        .in("id", validIds);

      if (updateError) {
        console.error("[Bulk API Error]:", updateError);
        return apiError("Gagal memperbarui status pesanan", 500);
      }

      // Re-fetch untuk token QR
      const { data: updatedBookings } = await supabase
        .from("bookings")
        .select("*, profiles:user_id (full_name, email)")
        .in("id", validIds);

      for (const booking of updatedBookings || validBookings) {
        // Notifikasi in-app
        try {
          await supabase.from("notifications").insert({
            user_id: booking.user_id,
            title: "Pesanan Penitipan Disetujui",
            message: `Kabar baik! Penitipan untuk ${booking.cat_name} telah aktif. Silakan bawa kucing Anda ke pengantaran.`,
            type: "success",
            booking_id: booking.id,
          });
        } catch (notifErr) {
          console.warn("[Bulk API Notice] User notif failed:", notifErr.message);
        }

        // Kirim email konfirmasi
        const userEmail = booking.profiles?.email;
        if (userEmail) {
          try {
            const { sendBookingStatusUpdate } = await import("@/lib/email/resend");
            await sendBookingStatusUpdate(
              userEmail,
              booking.profiles.full_name,
              booking.cat_name,
              booking.id,
              "Aktif",
              booking
            );
          } catch (emailErr) {
            console.warn("[Bulk API Email Notice]:", emailErr.message);
          }
        }
        processedCount++;
      }
    } else if (action === "reject") {
      const reason = rejectReason || "Ditolak oleh admin";

      const { error: updateError } = await supabase
        .from("bookings")
        .update({
          status: "Dibatalkan",
          reject_reason: reason,
        })
        .in("id", validIds);

      if (updateError) {
        console.error("[Bulk API Error]:", updateError);
        return apiError("Gagal memperbarui status penolakan pesanan", 500);
      }

      for (const booking of validBookings) {
        try {
          await supabase.from("notifications").insert({
            user_id: booking.user_id,
            title: "Pesanan Penitipan Ditolak",
            message: `Mohon maaf, pesanan penitipan ${booking.cat_name} ditolak dengan alasan: ${reason}`,
            type: "error",
            booking_id: booking.id,
          });
        } catch (notifErr) {
          console.warn("[Bulk API Notice] User notif failed:", notifErr.message);
        }

        const userEmail = booking.profiles?.email;
        if (userEmail) {
          try {
            const { sendBookingStatusUpdate } = await import("@/lib/email/resend");
            await sendBookingStatusUpdate(
              userEmail,
              booking.profiles.full_name,
              booking.cat_name,
              booking.id,
              "Dibatalkan",
              reason
            );
          } catch (emailErr) {
            console.warn("[Bulk API Email Notice]:", emailErr.message);
          }
        }
        processedCount++;
      }
    }

    return apiSuccess(
      { processed: processedCount },
      `Berhasil memproses ${processedCount} pesanan secara massal.`
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiValidationError(error);
    }

    console.error("[Bulk API Exception]:", error);
    return apiError("Gagal memproses tindakan massal pesanan", 500);
  }
}
