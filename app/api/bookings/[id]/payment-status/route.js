import { createClient } from "@/lib/supabase/server";
import { verifyAdmin } from "@/lib/supabase/admin";
import { emergencyPaymentStatusSchema } from "@/lib/validations/booking";
import {
  apiSuccess,
  apiError,
  apiUnauthorized,
  apiForbidden,
  apiNotFound,
  apiBadRequest,
} from "@/lib/utils/response";

/**
 * PATCH /api/bookings/[id]/payment-status
 * Memperbarui status pembayaran pesanan secara manual (Hanya Admin / Situasi Darurat).
 */
export async function PATCH(request, { params }) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    const { isAdmin, user } = await verifyAdmin(supabase);
    if (!user) {
      return apiUnauthorized();
    }
    if (!isAdmin) {
      return apiForbidden("Hanya Administrator yang diizinkan mengubah status pembayaran.");
    }

    const body = await request.json();
    const parsed = emergencyPaymentStatusSchema.safeParse({
      paymentStatus: body.paymentStatus || body.payment_status,
      reason: body.reason,
    });

    if (!parsed.success) {
      return apiBadRequest(
        parsed.error.issues[0]?.message || "Validasi status pembayaran atau alasan darurat tidak valid."
      );
    }

    const { paymentStatus, reason } = parsed.data;

    const { data: booking, error: fetchError } = await supabase
      .from("bookings")
      .select("*, profiles:user_id (full_name, email)")
      .eq("id", id)
      .single();

    if (fetchError || !booking) {
      return apiNotFound("Data pesanan tidak ditemukan.");
    }

    // Sinkronisasi status pemakaian token offline jika status pembayaran diubah
    const updateData = { payment_status: paymentStatus };

    if (paymentStatus === "Paid" && booking.offline_payment_token) {
      updateData.offline_token_used = true;
    } else if (paymentStatus === "Unpaid" && booking.offline_payment_token) {
      updateData.offline_token_used = false;
    }

    const { data: updatedBooking, error: updateError } = await supabase
      .from("bookings")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("[Update Payment Status Error]:", updateError);
      return apiError("Gagal memperbarui status pembayaran", 500);
    }

    const statusLabels = {
      Unpaid: "Belum Dibayar",
      Paid: "Lunas",
      Failed: "Gagal",
      Refunded: "Dikembalikan",
    };

    // Catat riwayat audit darurat ke booking_admin_notes
    try {
      const previousStatusLabel = statusLabels[booking.payment_status] || booking.payment_status;
      const newStatusLabel = statusLabels[paymentStatus] || paymentStatus;

      await supabase.from("booking_admin_notes").insert({
        booking_id: id,
        admin_id: user.id,
        category: "urgent",
        content: `[PERUBAHAN MANUAL DARURAT]: Status pembayaran diubah dari "${previousStatusLabel}" ke "${newStatusLabel}".\nAlasan verifikasi: ${reason}`,
        is_pinned: true,
      });
    } catch (noteErr) {
      console.warn("[Payment Status Audit Note Warning]:", noteErr.message);
    }

    try {
      await supabase.from("notifications").insert({
        user_id: booking.user_id,
        title: "Status Pembayaran Diperbarui",
        message: `Status pembayaran untuk penitipan ${booking.cat_name} telah diperbarui menjadi "${statusLabels[paymentStatus]}" oleh admin.`,
        type: paymentStatus === "Paid" ? "success" : "info",
        booking_id: booking.id,
        is_read: false,
      });
    } catch (notifErr) {
      console.warn("[Payment Status Notice] Notification failed:", notifErr.message);
    }

    return apiSuccess(
      { booking: updatedBooking },
      `Status pembayaran berhasil diubah menjadi "${statusLabels[paymentStatus]}"`
    );
  } catch (error) {
    console.error("[Payment Status Exception]:", error);
    return apiError("Gagal memperbarui status pembayaran", 500);
  }
}
