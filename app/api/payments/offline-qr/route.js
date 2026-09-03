import { createClient } from "@/lib/supabase/server";
import { createAdminClient, verifyBookingAccess } from "@/lib/supabase/admin";
import { offlineQrSchema } from "@/lib/validations/booking";
import {
  apiSuccess,
  apiBadRequest,
  apiNotFound,
  apiUnauthorized,
  apiForbidden,
  apiError,
} from "@/lib/utils/response";
import crypto from "crypto";
import qrcode from "qrcode";

/**
 * POST /api/payments/offline-qr
 * Menghasilkan token QR offline dan data URL gambar QR Code untuk ditampilkan langsung di web.
 * Akses: Pemilik pesanan (Customer) atau Administrator.
 */
export async function POST(request) {
  try {
    const supabase = await createClient();

    // 1. Cek sesi otentikasi user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return apiUnauthorized("Silakan masuk terlebih dahulu.");
    }

    // 2. Parse & Validasi payload
    const body = await request.json();
    const { bookingId, sendEmail } = offlineQrSchema.parse(body);

    // 3. Verifikasi hak akses (Customer pemilik pesanan atau Admin)
    const { hasAccess, booking: existingBooking, isAdmin } =
      await verifyBookingAccess(supabase, bookingId);

    if (!hasAccess || !existingBooking) {
      return apiForbidden("Anda tidak memiliki akses ke pesanan ini.");
    }

    if (existingBooking.status === "Dibatalkan") {
      return apiBadRequest("Pesanan ini telah dibatalkan dan tidak dapat diproses.");
    }

    if (existingBooking.payment_status === "Paid") {
      return apiBadRequest("Pesanan ini sudah lunas. Pembayaran offline tidak diperlukan.");
    }

    const adminDb = createAdminClient();

    // 4. Periksa apakah token saat ini masih aktif dan belum terpakai (< 24 jam)
    let token = existingBooking.offline_payment_token;
    const isUsed = existingBooking.offline_token_used;
    const createdAt = existingBooking.offline_token_created_at
      ? new Date(existingBooking.offline_token_created_at).getTime()
      : 0;
    const isExpired = Date.now() - createdAt > 24 * 60 * 60 * 1000;

    let tokenCreatedAt = new Date().toISOString();

    if (!token || isUsed || isExpired) {
      // Buat token UUID baru
      token = crypto.randomUUID();
      const { error: updateErr } = await adminDb
        .from("bookings")
        .update({
          offline_payment_token: token,
          offline_token_created_at: tokenCreatedAt,
          offline_token_used: false,
        })
        .eq("id", bookingId);

      if (updateErr) {
        console.error("[Offline QR] Gagal memperbarui token:", updateErr);
        return apiError("Gagal memperbarui token pembayaran offline di database", 500);
      }
    } else {
      // Perpanjang masa berlaku token aktif 24 jam dari sekarang
      await adminDb
        .from("bookings")
        .update({ offline_token_created_at: tokenCreatedAt })
        .eq("id", bookingId);
    }

    // 5. Buat URL pemindaian untuk scanner kasir / kamera smartphone
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      request.headers.get("origin") ||
      "http://localhost:3000";
    const qrUrl = `${appUrl}/scan-verify?token=${token}`;

    // 6. Generate QR Code Data URL (PNG Base64) beresolusi tajam
    const qrDataUrl = await qrcode.toDataURL(qrUrl, {
      margin: 2,
      width: 320,
      color: {
        dark: "#18181b",
        light: "#ffffff",
      },
    });

    // 7. Kirim tanda terima email di background jika diminta (non-blocking)
    if (sendEmail) {
      const userEmail = existingBooking.profiles?.email;
      if (userEmail) {
        import("@/lib/email/resend")
          .then(({ sendBookingStatusUpdate }) => {
            sendBookingStatusUpdate(
              userEmail,
              existingBooking.profiles.full_name || "Pelanggan",
              existingBooking.cat_name,
              existingBooking.id,
              existingBooking.status || "Aktif",
              { ...existingBooking, offline_payment_token: token }
            ).catch((emailErr) => {
              console.warn("[Offline QR] Gagal mengirim email latar belakang:", emailErr.message);
            });
          })
          .catch((e) => console.warn("[Offline QR] Resend import failed:", e.message));
      }
    }

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    return apiSuccess(
      {
        token,
        qrDataUrl,
        qrUrl,
        offline_token_created_at: tokenCreatedAt,
        expiresAt,
        expiresInHours: 24,
      },
      "Kode QR pembayaran offline berhasil dibuat dan siap dipindai"
    );
  } catch (error) {
    console.error("[Offline QR API Exception]:", error);
    if (error.name === "ZodError") {
      return apiBadRequest("Data permintaan tidak valid", error.errors);
    }
    return apiError(error.message || "Gagal memproses kode QR pembayaran offline", 500);
  }
}

