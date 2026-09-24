import { PaymentsService } from "@/lib/modules/payments/payments.service";
import { apiSuccess, apiError, apiBadRequest, apiNotFound } from "@/lib/utils/response";

/**
 * POST /api/payments/webhook
 * Controller: Handle asynchronous HTTP POST callback from Midtrans server
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const result = await PaymentsService.handleWebhookNotification(body);

    if (result.alreadyPaid) {
      return apiSuccess({ alreadyPaid: true }, "Pesanan sudah berstatus lunas");
    }

    return apiSuccess({ paymentStatus: result.paymentStatus }, "Webhook Midtrans berhasil diproses");
  } catch (error) {
    if (error.status === 400) return apiBadRequest(error.message);
    if (error.status === 404) return apiNotFound(error.message);

    console.error("[Midtrans Webhook Controller Exception]:", error);
    return apiError(error.message || "Internal Server Error", error.status || 500);
  }
}
