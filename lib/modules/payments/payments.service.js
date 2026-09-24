import { createAdminClient } from "@/lib/supabase/admin";
import { MidtransClient } from "./midtrans.client.js";
import { PaymentsRepository } from "./payments.repository.js";
import { mapMidtransStatusToPaymentStatus } from "./payments.dto.js";

export class PaymentsService {
  /**
   * Create Midtrans Snap Payment Session
   */
  static async createPaymentSession({ supabase, user, bookingId, requestOrigin }) {
    const { data: booking, error: bookingError } = await PaymentsRepository.findBookingForPayment(
      supabase,
      bookingId,
      user.id
    );

    if (bookingError || !booking) {
      throw { status: 404, message: "Pesanan tidak ditemukan atau bukan milik akun Anda." };
    }

    if (booking.payment_status === "Paid") {
      throw { status: 400, message: "Pesanan ini sudah lunas." };
    }

    const finalAmount =
      (booking.estimated_total || 0) -
      (booking.discount_amount || 0) +
      (booking.late_fee_total || 0) -
      (booking.refund_amount || 0);

    if (finalAmount <= 0) {
      throw { status: 400, message: "Total nominal pembayaran tidak valid." };
    }

    const orderId = `${booking.id}-${Date.now()}`;
    const baseUrl =
      requestOrigin ||
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXT_PUBLIC_BASE_URL ||
      "http://localhost:3000";

    const snap = MidtransClient.getSnapClient();

    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: finalAmount,
      },
      custom_field1: booking.id,
      customer_details: {
        first_name: booking.profiles?.full_name || "Pelanggan",
        email: booking.profiles?.email || user.email,
        phone: booking.profiles?.phone || "",
      },
      item_details: [
        {
          id: booking.class,
          price: finalAmount,
          quantity: 1,
          name: `NekoStay: Kelas ${booking.class} (${booking.cat_name})`,
        },
      ],
      callbacks: {
        finish: `${baseUrl}/booking/${bookingId}?payment=finish&order_id=${orderId}`,
        unfinish: `${baseUrl}/booking/${bookingId}?payment=unfinish&order_id=${orderId}`,
        error: `${baseUrl}/booking/${bookingId}?payment=error&order_id=${orderId}`,
      },
    };

    const transaction = await snap.createTransaction(parameter);

    if (!transaction || !transaction.token) {
      throw new Error("Gagal mendapatkan token transaksi dari Midtrans");
    }

    const adminDb = createAdminClient();
    const { error: updateError } = await PaymentsRepository.updatePaymentSession(adminDb, bookingId, {
      token: transaction.token,
      orderId,
    });

    if (updateError) {
      console.error("[Midtrans Payment DB Update Error]:", updateError);
    }

    return {
      token: transaction.token,
      redirectUrl: transaction.redirect_url,
      orderId,
    };
  }

  /**
   * Process incoming Midtrans Webhook Notification
   */
  static async handleWebhookNotification(body) {
    const {
      order_id,
      transaction_id,
      transaction_status,
      status_code,
      gross_amount,
      signature_key,
      fraud_status,
    } = body;

    if (!order_id || !status_code || !gross_amount || !signature_key) {
      throw { status: 400, message: "Field webhook wajib tidak lengkap" };
    }

    const isValidSignature = MidtransClient.verifySignature({
      orderId: order_id,
      statusCode: status_code,
      grossAmount: gross_amount,
      signatureKey: signature_key,
    });

    if (!isValidSignature) {
      console.error("[Midtrans Webhook Security Alert]: Invalid Signature Key mismatch");
      throw { status: 400, message: "Signature key tidak valid" };
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
      const res = await PaymentsRepository.findBookingById(supabaseAdmin, bookingId);
      booking = res.data;
      fetchError = res.error;
    }

    // Fallback tangguh untuk E-Wallet (seperti DANA) yang menggunakan ID transaksi sendiri
    if (!booking) {
      const amountNum = parseFloat(gross_amount);
      const { data: matchedBookings } = await PaymentsRepository.findRecentUnpaidBookings(
        supabaseAdmin,
        5
      );

      if (matchedBookings && matchedBookings.length > 0) {
        const found = matchedBookings.find((b) => {
          const total =
            (b.estimated_total || 0) -
            (b.discount_amount || 0) +
            (b.late_fee_total || 0) -
            (b.refund_amount || 0);
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
      console.error(
        `[Midtrans Webhook]: Booking dengan ID ${bookingId || order_id} tidak ditemukan. Error:`,
        fetchError
      );
      throw { status: 404, message: "Booking tidak ditemukan" };
    }

    if (booking.payment_status === "Paid") {
      return { alreadyPaid: true, paymentStatus: "Paid" };
    }

    const paymentStatus = mapMidtransStatusToPaymentStatus(transaction_status, fraud_status);

    const actualId = order_id || transaction_id;
    const { error: updateError } = await PaymentsRepository.updatePaymentStatus(
      supabaseAdmin,
      bookingId,
      {
        paymentStatus,
        transactionId: actualId,
      }
    );

    if (updateError) {
      throw updateError;
    }

    await this.dispatchPaymentNotification(supabaseAdmin, booking, paymentStatus);

    return { paymentStatus };
  }

  /**
   * Synchronize payment status directly via Midtrans REST API
   */
  static async checkAndSyncStatus({ bookingId, orderId }) {
    const supabaseAdmin = createAdminClient();

    const { data: booking, error: fetchError } = await PaymentsRepository.findBookingById(
      supabaseAdmin,
      bookingId
    );

    if (fetchError || !booking) {
      throw { status: 404, message: "Pesanan tidak ditemukan" };
    }

    if (booking.payment_status === "Paid") {
      return {
        success: true,
        paymentStatus: "Paid",
        alreadyPaid: true,
        changed: false,
      };
    }

    const { ok, status, data: transactionData } = await MidtransClient.queryTransactionStatus(orderId);

    // Midtrans returns HTTP 200 with status_code "404" if transaction not yet initiated
    if (
      transactionData?.status_code === "404" ||
      transactionData?.status_message === "Transaction doesn't exist."
    ) {
      return {
        success: true,
        paymentStatus: booking.payment_status,
        message: "Transaksi belum ditemukan di Midtrans (belum dibayar)",
        changed: false,
      };
    }

    if (!ok) {
      console.error("Midtrans status API error:", transactionData);
      throw { status: 502, message: "Gagal mengecek status transaksi ke Midtrans" };
    }

    const { transaction_status, fraud_status } = transactionData;
    const paymentStatus = mapMidtransStatusToPaymentStatus(transaction_status, fraud_status);

    const isChanged = paymentStatus !== booking.payment_status;

    if (isChanged) {
      const actualId = transactionData.transaction_id || transactionData.order_id || orderId;
      await PaymentsRepository.updatePaymentStatus(supabaseAdmin, bookingId, {
        paymentStatus,
        transactionId: actualId,
      });

      await this.dispatchPaymentNotification(supabaseAdmin, booking, paymentStatus);
    }

    return {
      success: true,
      paymentStatus,
      transactionStatus: transaction_status,
      changed: isChanged,
    };
  }

  /**
   * Helper to dispatch payment status user notifications
   */
  static async dispatchPaymentNotification(supabaseAdmin, booking, paymentStatus) {
    if (paymentStatus === "Unpaid") return;

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

    try {
      await PaymentsRepository.insertPaymentNotification(supabaseAdmin, {
        userId: booking.user_id,
        title,
        message,
        type,
        bookingId: booking.id,
      });
    } catch (notifErr) {
      console.warn("[PaymentsService Notification Warning]:", notifErr.message);
    }
  }
}

