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
      fraud_status,
    } = body;

    if (!order_id || !status_code || !gross_amount || !signature_key) {
      return apiBadRequest("Field webhook wajib tidak lengkap");
    }

    // Midtrans SHA512 HMAC signature: SHA512(order_id + status_code + gross_amount + server_key)
    const serverKey = process.env.MIDTRANS_SERVER_KEY || "";
    const signatureSource = `${order_id}${status_code}${gross_amount}${serverKey}`;
    const computedSignature = createHash("sha512").update(signatureSource).digest("hex");

    if (computedSignature !== signature_key) {
      console.error("[Midtrans Webhook Security Alert]: Invalid Signature Key mismatch");
      return apiBadRequest("Signature key tidak valid");
    }

    let bookingId = body.custom_field1 || null;

    if (!bookingId && order_id) {
      if (order_id.length > 36 && order_id[36] === "-") {
        bookingId = order_id.substring(0, 36);
      } else if (order_id.length === 36 && order_id.includes("-")) {
        bookingId = order_id;
      }
    }

    const supabaseAdmin = createAdminClient();

    let booking = null;
    let fetchError = null;

    if (bookingId) {
      const res = await supabaseAdmin
        .from("bookings")
        .select("id, user_id, cat_name, payment_status")
        .eq("id", bookingId)
        .maybeSingle();
      booking = res.data;
      fetchError = res.error;
    }

    // Fallback tangguh untuk E-Wallet (seperti DANA) yang menggunakan ID transaksi sendiri
    if (!booking) {
      const amountNum = parseFloat(gross_amount);
      const { data: matchedBookings } = await supabaseAdmin
        .from("bookings")
        .select("id, user_id, cat_name, payment_status, estimated_total, discount_amount, late_fee_total, refund_amount")
        .eq("payment_status", "Unpaid")
        .order("updated_at", { ascending: false })
        .limit(5);

      if (matchedBookings && matchedBookings.length > 0) {
        const found = matchedBookings.find((b) => {
          const total = (b.estimated_total || 0) - (b.discount_amount || 0) + (b.late_fee_total || 0) - (b.refund_amount || 0);
          return Math.abs(total - amountNum) < 1;
        });
        if (found) {
          booking = found;
          bookingId = found.id;
          fetchError = null;
        }
      }
    }

    if (fetchError || !booking) {
      console.error(`[Midtrans Webhook]: Booking dengan ID ${bookingId || order_id} tidak ditemukan. Error:`, fetchError);
      return apiNotFound("Booking tidak ditemukan");
    }

    if (booking.payment_status === "Paid") {
      return apiSuccess({ alreadyPaid: true }, "Pesanan sudah berstatus lunas");
    }

    let paymentStatus = "Unpaid";
    if (transaction_status === "capture") {
      paymentStatus = fraud_status === "challenge" ? "Unpaid" : "Paid";
    } else if (transaction_status === "settlement") {
      paymentStatus = "Paid";
    } else if (
      transaction_status === "deny" ||
      transaction_status === "cancel" ||
      transaction_status === "expire"
    ) {
      paymentStatus = "Failed";
    } else if (transaction_status === "pending") {
      paymentStatus = "Unpaid";
    } else if (transaction_status === "refund" || transaction_status === "partial_refund") {
      paymentStatus = "Refunded";
    }

    const updatePayload = { payment_status: paymentStatus };
    if (order_id || transaction_id) {
      updatePayload.payment_link_url = order_id || transaction_id;
    }

    const { error: updateError } = await supabaseAdmin
      .from("bookings")
      .update(updatePayload)
      .eq("id", bookingId);

    if (updateError) {
      throw updateError;
    }

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
