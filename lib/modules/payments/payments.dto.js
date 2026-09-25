import { z } from "zod";
export { paymentCreateSchema } from "../../validations/booking.js";

export const paymentCheckStatusSchema = z.object({
  bookingId: z.string().uuid("ID booking harus berupa UUID valid"),
  orderId: z.string().min(1, "Order ID wajib diisi untuk pengecekan status"),
});

/**
 * Maps Midtrans transaction_status & fraud_status to NekoStay's payment_status
 */
export function mapMidtransStatusToPaymentStatus(transactionStatus, fraudStatus) {
  if (transactionStatus === "capture") {
    return fraudStatus === "accept" || fraudStatus === undefined ? "Paid" : "Failed";
  }
  if (transactionStatus === "settlement") {
    return "Paid";
  }
  if (
    transactionStatus === "deny" ||
    transactionStatus === "cancel" ||
    transactionStatus === "expire"
  ) {
    return "Failed";
  }
  if (transactionStatus === "pending") {
    return "Unpaid";
  }
  if (transactionStatus === "refund" || transactionStatus === "partial_refund") {
    return "Refunded";
  }
  return "Unpaid";
}

