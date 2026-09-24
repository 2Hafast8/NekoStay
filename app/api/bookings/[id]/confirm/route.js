import { createClient } from "@/lib/supabase/server";
import { verifyAdmin } from "@/lib/supabase/admin";
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
 * POST /api/bookings/[id]/confirm
 * Controller: Confirm booking status from 'Menunggu' or 'Antrian' to 'Aktif' (Admin Only)
 */
export async function POST(request, { params }) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    const { isAdmin, user } = await verifyAdmin(supabase);
    if (!user) {
      return apiUnauthorized();
    }
    if (!isAdmin) {
      return apiForbidden("Hanya Administrator yang berhak mengonfirmasi pesanan.");
    }

    const result = await BookingsService.confirmBooking(supabase, { bookingId: id });

    return apiSuccess(result, "Booking berhasil dikonfirmasi");
  } catch (error) {
    if (error.status === 404) return apiNotFound(error.message);
    if (error.status === 400) return apiBadRequest(error.message);
    console.error("[Confirm Controller Exception]:", error);
    return apiError(error.message || "Gagal mengkonfirmasi booking", error.status || 500);
  }
}
