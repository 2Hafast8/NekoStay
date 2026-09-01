import { createHash } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { apiSuccess, apiError, apiBadRequest, apiNotFound } from "@/lib/utils/response";

/**
 * POST /api/payments/webhook
 * Menerima callback HTTP POST dari webhook server Midtrans secara asinkron.
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      order_id,
      transaction_status,
      status_code,
      gross_amount,
      signature_key,
    } = body;

    if (!order_id || !status_code || !gross_amount || !signature_key) {
      return apiBadRequest("Field webhook wajib tidak lengkap");
    }

    // 1. Verifikasi Signature Key Midtrans untuk keamanan
    // signature_key = SHA512(order_id + status_code + gross_amount + server_key)
    const serverKey = process.env.MIDTRANS_SERVER_KEY || "";
    const signatureSource = `${order_id}${status_code}${gross_amount}${serverKey}`;
    const computedSignature = createHash("sha512").update(signatureSource).digest("hex");

    if (computedSignature !== signature_key) {
      console.error("[Midtrans Webhook Security Alert]: Invalid Signature Key mismatch");
      return apiBadRequest("Signature key tidak valid");
    }

    // 2. Ekstrak Booking ID dari order_id (36 karakter UUID)
    const bookingId = order_id.substring(0, 36);

    // 3. Supabase Admin Client
    const supabaseAdmin = createAdminClient();

    // 4. Periksa apakah booking valid
    const { data: booking, error: fetchError } = await supabaseAdmin
      .from("bookings")
      .select("*, profiles(full_name)")
      .eq("id", bookingId)
      .single();

    if (fetchError || !booking) {
      console.error(`[Midtrans Webhook]: Booking dengan ID ${bookingId} tidak ditemukan.`);
      return apiNotFound("Booking tidak ditemukan");
    }

    // 5. Tentukan status pembayaran baru
    let paymentStatus = "Unpaid";
    if (transaction_status === "capture" || transaction_status === "settlement") {
      paymentStatus = "Paid";
    } else if (
      transaction_status === "deny" ||
      transaction_status === "cancel" ||
      transaction_status === "expire"
    ) {
      paymentStatus = "Failed";
    } else if (transaction_status === "pending") {
      paymentStatus = "Unpaid";
    } else if (transaction_status === "refund") {
      paymentStatus = "Refunded";
    }

    // 6. Update status pembayaran di database
    const { error: updateError } = await supabaseAdmin
      .from("bookings")
      .update({ payment_status: paymentStatus })
      .eq("id", bookingId);

    if (updateError) {
      throw updateError;
    }

    // 7. Masukkan notifikasi in-app untuk pengguna
    let title = "";
    let message = "";
    let type = "info";

    if (paymentStatus === "Paid") {
      title = "Pembayaran Online Berhasil";
      message = `Pembayaran online untuk penitipan ${booking.cat_name} telah berhasil kami terima. Terima kasih!`;
      type = "success";
    } else if (paymentStatus === "Failed") {
      title = "Pembayaran Online Gagal";
      message = `Pembayaran online untuk penitipan ${booking.cat_name} gagal atau kedaluwarsa. Silakan coba lagi.`;
      type = "error";
    } else if (paymentStatus === "Refunded") {
      title = "Pembayaran Di-refund";
      message = `Pembayaran untuk penitipan ${booking.cat_name} telah berhasil di-refund.`;
      type = "info";
    }

    if (paymentStatus !== "Unpaid") {
      const { error: notifError } = await supabaseAdmin
        .from("notifications")
        .insert({
          user_id: booking.user_id,
          title,
          message,
          type,
          booking_id: bookingId,
          is_read: false,
        });

      if (notifError) {
        console.warn("[Midtrans Webhook Notice] Notification insert failed:", notifError.message);
      }
    }

    return apiSuccess({ paymentStatus }, "Webhook Midtrans berhasil diproses");
  } catch (error) {
    console.error("[Midtrans Webhook Exception]:", error);
    return apiError(error.message || "Internal Server Error", 500);
  }
}
