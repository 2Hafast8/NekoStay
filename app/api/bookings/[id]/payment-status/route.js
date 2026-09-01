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
 * PATCH /api/bookings/[id]/payment-status
 * Memperbarui status pembayaran pesanan (Hanya Admin).
 */
export async function PATCH(request, { params }) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // 1. Cek sesi user & role (Hanya admin)
    const { isAdmin, user } = await verifyAdmin(supabase);
    if (!user) {
      return apiUnauthorized();
    }
    if (!isAdmin) {
      return apiForbidden("Hanya Administrator yang diizinkan mengubah status pembayaran.");
    }

    // 2. Parse payload
    const body = await request.json();
    const paymentStatus = body.paymentStatus || body.payment_status;
    const validStatuses = ["Unpaid", "Paid", "Failed", "Refunded"];

    if (!paymentStatus || !validStatuses.includes(paymentStatus)) {
      return apiBadRequest(`Status pembayaran tidak valid. Pilihan: ${validStatuses.join(", ")}`);
    }

    // 3. Ambil data booking saat ini
    const { data: booking, error: fetchError } = await supabase
      .from("bookings")
      .select("*, profiles:user_id (full_name, email)")
      .eq("id", id)
      .single();

    if (fetchError || !booking) {
      return apiNotFound("Data pesanan tidak ditemukan.");
    }

    // 4. Update status pembayaran & sinkronisasi token offline jika ada
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

    // 5. Kirim notifikasi in-app ke pemilik kucing
    const statusLabels = {
      Unpaid: "Belum Dibayar",
      Paid: "Lunas",
      Failed: "Gagal",
      Refunded: "Dikembalikan",
    };

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
