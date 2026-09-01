import { createClient } from "@/lib/supabase/server";
import { createAdminClient, verifyAdmin } from "@/lib/supabase/admin";
import { z } from "zod";
import { scanOfflineSchema } from "@/lib/validations/booking";
import {
  apiSuccess,
  apiError,
  apiUnauthorized,
  apiForbidden,
  apiNotFound,
  apiBadRequest,
  apiValidationError,
} from "@/lib/utils/response";

/**
 * POST /api/payments/scan-offline
 * Verifikasi pemindaian token QR pembayaran offline saat check-in di kasir.
 * Keamanan: Hanya Administrator / Operator Kasir terotentikasi yang diizinkan.
 */
export async function POST(request) {
  try {
    const supabase = await createClient();

    // 1. Verifikasi Admin / Kasir terotentikasi
    const { isAdmin, user } = await verifyAdmin(supabase);
    if (!user) {
      return apiUnauthorized("Autentikasi diperlukan untuk memindai bukti pembayaran.");
    }
    if (!isAdmin) {
      return apiForbidden("Hanya Administrator atau Kasir yang berhak memvalidasi pembayaran offline.");
    }

    // 2. Parse & Validasi payload
    const body = await request.json();
    const { token } = scanOfflineSchema.parse(body);

    // 3. Inisialisasi Admin DB Client
    const adminDb = createAdminClient();

    // 4. Cari data booking berdasarkan token offline
    const { data: booking, error: fetchError } = await adminDb
      .from("bookings")
      .select("*, profiles:user_id (full_name, email)")
      .eq("offline_payment_token", token)
      .single();

    if (fetchError || !booking) {
      return apiNotFound("Kode QR tidak dikenali atau salah.");
    }

    // 5. Cek one-time use
    if (booking.offline_token_used) {
      return apiBadRequest(
        "Kode QR sudah pernah digunakan sebelumnya. Pembayaran untuk pesanan ini telah selesai."
      );
    }

    // 6. Cek batas waktu berlaku 24 jam
    const createdTime = new Date(booking.offline_token_created_at).getTime();
    const currentTime = Date.now();
    const diffHours = (currentTime - createdTime) / (1000 * 60 * 60);

    if (diffHours > 24) {
      return apiBadRequest(
        "Kode QR telah kedaluwarsa. Masa berlaku kode QR bukti pemesanan hanya 24 jam dari waktu pembuatan."
      );
    }

    // 7. Update status pembayaran ke Paid dan tandai token telah terpakai
    const { error: updateError } = await adminDb
      .from("bookings")
      .update({
        payment_status: "Paid",
        offline_token_used: true,
      })
      .eq("id", booking.id);

    if (updateError) {
      console.error("[Scan Offline API Error]:", updateError);
      return apiError("Gagal memperbarui status pembayaran di database", 500);
    }

    // 8. Kirim notifikasi in-app ke pengguna
    try {
      await adminDb.from("notifications").insert({
        user_id: booking.user_id,
        title: "Pembayaran Offline Berhasil",
        message: `Terima kasih! Pembayaran offline (di tempat) untuk penitipan ${booking.cat_name} telah kami terima dan diverifikasi.`,
        type: "success",
        booking_id: booking.id,
        is_read: false,
      });
    } catch (notifErr) {
      console.warn("[Scan Offline Notice] Notification failed:", notifErr.message);
    }

    const finalTotal =
      (booking.estimated_total || 0) -
      (booking.discount_amount || 0) +
      (booking.late_fee_total || 0) -
      (booking.refund_amount || 0);

    return apiSuccess(
      {
        booking: {
          id: booking.id,
          catName: booking.cat_name,
          customerName: booking.profiles?.full_name || "Pelanggan",
          amount: finalTotal,
        },
      },
      "Pembayaran offline berhasil diproses dan diverifikasi"
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiValidationError(error);
    }

    console.error("[Scan Offline API Exception]:", error);
    return apiError("Gagal memproses verifikasi scan pembayaran offline", 500);
  }
}
