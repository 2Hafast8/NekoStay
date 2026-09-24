/**
 * Payments Repository
 * Encapsulates Supabase queries for payment tracking and bookings transactions.
 */
export class PaymentsRepository {
  /**
   * Find booking for creating payment session
   */
  static async findBookingForPayment(supabase, bookingId, userId) {
    return await supabase
      .from("bookings")
      .select("*, profiles:user_id (full_name, email, phone)")
      .eq("id", bookingId)
      .eq("user_id", userId)
      .single();
  }

  /**
   * Save generated Midtrans Snap payment token and order reference
   */
  static async updatePaymentSession(supabaseAdmin, bookingId, { token, orderId }) {
    return await supabaseAdmin
      .from("bookings")
      .update({
        payment_token: token,
        payment_link_url: orderId,
      })
      .eq("id", bookingId);
  }

  /**
   * Find booking by ID for webhook or status verification
   */
  static async findBookingById(supabaseAdmin, bookingId) {
    return await supabaseAdmin
      .from("bookings")
      .select("id, user_id, cat_name, payment_status")
      .eq("id", bookingId)
      .maybeSingle();
  }

  /**
   * Fallback for E-Wallets (such as DANA) matching by amount
   */
  static async findRecentUnpaidBookings(supabaseAdmin, limit = 5) {
    return await supabaseAdmin
      .from("bookings")
      .select(
        "id, user_id, cat_name, payment_status, estimated_total, discount_amount, late_fee_total, refund_amount"
      )
      .eq("payment_status", "Unpaid")
      .order("updated_at", { ascending: false })
      .limit(limit);
  }

  /**
   * Update payment status and optional transaction reference
   */
  static async updatePaymentStatus(supabaseAdmin, bookingId, { paymentStatus, transactionId }) {
    const updatePayload = { payment_status: paymentStatus };
    if (transactionId) {
      updatePayload.payment_link_url = transactionId;
    }
    return await supabaseAdmin
      .from("bookings")
      .update(updatePayload)
      .eq("id", bookingId);
  }

  /**
   * Insert user notification for payment status updates
   */
  static async insertPaymentNotification(supabaseAdmin, { userId, title, message, type, bookingId }) {
    return await supabaseAdmin
      .from("notifications")
      .insert({
        user_id: userId,
        title,
        message,
        type,
        booking_id: bookingId,
        is_read: false,
      });
  }
}

