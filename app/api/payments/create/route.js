import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { paymentCreateSchema } from "@/lib/modules/payments/payments.dto";
import { PaymentsService } from "@/lib/modules/payments/payments.service";
import {
  apiSuccess,
  apiError,
  apiUnauthorized,
  apiNotFound,
  apiBadRequest,
  apiValidationError,
} from "@/lib/utils/response";

/**
 * POST /api/payments/create
 * Controller: Create Midtrans Snap payment session
 */
export async function POST(request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return apiUnauthorized();
    }

    const body = await request.json();
    const { bookingId } = paymentCreateSchema.parse(body);

    const requestOrigin = request.headers.get("origin") || request.nextUrl?.origin;

    const result = await PaymentsService.createPaymentSession({
      supabase,
      user,
      bookingId,
      requestOrigin,
    });

    return apiSuccess(result, "Sesi pembayaran berhasil dibuat");
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiValidationError(error);
    }
    if (error.status === 404) return apiNotFound(error.message);
    if (error.status === 400) return apiBadRequest(error.message);

    console.error("[Payments Create Controller Exception]:", error);
    return apiError(error.message || "Gagal memproses pembayaran online", error.status || 500);
  }
}
