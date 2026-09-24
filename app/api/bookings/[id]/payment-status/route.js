import { createClient } from "@/lib/supabase/server";
import { verifyAdmin } from "@/lib/supabase/admin";
import { emergencyPaymentStatusSchema } from "@/lib/modules/bookings/bookings.dto";
import { BookingsService } from "@/lib/modules/bookings/bookings.service";
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
 * Controller: Update emergency payment status (Admin Only)
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

    const result = await BookingsService.updateEmergencyPaymentStatus(supabase, {
      bookingId: id,
      adminUser: user,
      paymentStatus,
      reason,
    });

    return apiSuccess(
      { booking: result.updatedBooking },
      `Status pembayaran berhasil diubah menjadi "${result.statusLabel}"`
    );
  } catch (error) {
    if (error.status === 404) return apiNotFound(error.message);
    if (error.status === 400) return apiBadRequest(error.message);
    console.error("[Payment Status Controller Exception]:", error);
    return apiError(error.message || "Gagal memperbarui status pembayaran", error.status || 500);
  }
}
