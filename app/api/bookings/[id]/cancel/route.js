import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { cancelBookingSchema } from "@/lib/modules/bookings/bookings.dto";
import { BookingsService } from "@/lib/modules/bookings/bookings.service";
import {
  apiSuccess,
  apiError,
  apiUnauthorized,
  apiNotFound,
  apiBadRequest,
  apiValidationError,
} from "@/lib/utils/response";

/**
 * POST /api/bookings/[id]/cancel
 * Controller: Cancel booking by owner (Customer Only)
 */
export async function POST(request, { params }) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return apiUnauthorized();
    }

    const body = await request.json();
    const validatedData = cancelBookingSchema.parse(body);

    const result = await BookingsService.cancelBooking(supabase, {
      bookingId: id,
      userId: user.id,
      reason: validatedData.reason,
    });

    return apiSuccess({ id: result.id }, "Booking berhasil dibatalkan");
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiValidationError(error);
    }
    if (error.status === 404) return apiNotFound(error.message);
    if (error.status === 400) return apiBadRequest(error.message);

    console.error("[Cancel Controller Exception]:", error);
    return apiError(error.message || "Gagal membatalkan booking", error.status || 500);
  }
}
