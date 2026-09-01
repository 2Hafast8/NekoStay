import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { verifyAdmin } from "@/lib/supabase/admin";
import { editBookingSchema } from "@/lib/validations/booking";
import { CLASS_PRICES } from "@/lib/constants";
import {
  apiSuccess,
  apiError,
  apiUnauthorized,
  apiForbidden,
  apiNotFound,
  apiValidationError,
} from "@/lib/utils/response";

/**
 * PUT /api/bookings/[id]/edit
 * Memperbarui detail tanggal dan kelas kamar pesanan (Hanya Admin).
 */
export async function PUT(request, { params }) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // 1. Verifikasi Admin
    const { isAdmin, user } = await verifyAdmin(supabase);
    if (!user) {
      return apiUnauthorized();
    }
    if (!isAdmin) {
      return apiForbidden("Hanya Administrator yang berhak mengubah detail pesanan.");
    }

    // 2. Parse & Validasi payload
    const body = await request.json();
    const validatedData = editBookingSchema.parse(body);

    const pricePerDay = CLASS_PRICES[validatedData.className];

    // 3. Ambil data lama pesanan
    const { data: oldBooking, error: fetchError } = await supabase
      .from("bookings")
      .select(`
        *,
        profiles:user_id (full_name, email)
      `)
      .eq("id", id)
      .single();

    if (fetchError || !oldBooking) {
      return apiNotFound("Data booking tidak ditemukan");
    }

    // 4. Update pesanan di DB
    const { data: updatedBooking, error: updateError } = await supabase
      .from("bookings")
      .update({
        class: validatedData.className,
        price_per_day: pricePerDay,
        check_in_date: validatedData.checkInDate,
        check_out_date: validatedData.checkOutDate,
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("[Edit API Error]:", updateError);
      return apiError("Gagal memperbarui data pesanan", 500);
    }

    // 5. Notifikasi in-app untuk pemilik kucing
    try {
      await supabase.from("notifications").insert({
        user_id: oldBooking.user_id,
        title: `Detail Pesanan Diperbarui: ${oldBooking.cat_name}`,
        message: `Admin memperbarui detail pesanan ${oldBooking.cat_name}. Kelas: ${validatedData.className}, Check-In: ${validatedData.checkInDate}, Check-Out: ${validatedData.checkOutDate}.`,
        type: "info",
        booking_id: oldBooking.id,
      });
    } catch (notifErr) {
      console.warn("[Edit API Notice] User notification failed:", notifErr.message);
    }

    // 6. Kirim email transaksi
    const userEmail = oldBooking.profiles?.email;
    if (userEmail) {
      try {
        const { sendBookingEditNotification } = await import("@/lib/email/resend");
        await sendBookingEditNotification(
          userEmail,
          oldBooking.profiles.full_name,
          oldBooking.cat_name,
          oldBooking.id,
          {
            className: oldBooking.class,
            checkIn: oldBooking.check_in_date,
            checkOut: oldBooking.check_out_date,
          },
          {
            className: updatedBooking.class,
            checkIn: updatedBooking.check_in_date,
            checkOut: updatedBooking.check_out_date,
            totalDays: updatedBooking.total_days,
            estimatedTotal: updatedBooking.estimated_total,
          }
        );
      } catch (emailErr) {
        console.warn("[Edit API Email Notice]:", emailErr.message);
      }
    }

    return apiSuccess({ booking: updatedBooking }, "Detail pesanan berhasil diperbarui");
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiValidationError(error);
    }

    console.error("[Edit API Exception]:", error);
    return apiError("Gagal memperbarui pesanan", 500);
  }
}
