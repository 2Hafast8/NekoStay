import midtransClient from "midtrans-client";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";
import { paymentCreateSchema } from "@/lib/validations/booking";
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
 * Membuat sesi transaksi Midtrans Snap untuk pembayaran online pesanan.
 */
export async function POST(request) {
  try {
    const supabase = await createClient();

    // 1. Cek sesi user
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return apiUnauthorized();
    }

    // 2. Parse & Validasi payload
    const body = await request.json();
    const { bookingId } = paymentCreateSchema.parse(body);

    // 3. Ambil detail booking dan profil
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("*, profiles:user_id (full_name, email, phone)")
      .eq("id", bookingId)
      .eq("user_id", user.id)
      .single();

    if (bookingError || !booking) {
      return apiNotFound("Pesanan tidak ditemukan atau bukan milik akun Anda.");
    }

    // 4. Cek status lunas
    if (booking.payment_status === "Paid") {
      return apiBadRequest("Pesanan ini sudah lunas.");
    }

    // 5. Inisialisasi Midtrans Snap Client
    const serverKey = process.env.MIDTRANS_SERVER_KEY || "";
    const isProduction = process.env.MIDTRANS_IS_PRODUCTION === "true";

    const snap = new midtransClient.Snap({
      isProduction,
      serverKey,
      clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "",
    });

    // 6. Hitung nominal pembayaran akhir
    const finalAmount =
      (booking.estimated_total || 0) -
      (booking.discount_amount || 0) +
      (booking.late_fee_total || 0) -
      (booking.refund_amount || 0);

    if (finalAmount <= 0) {
      return apiBadRequest("Total nominal pembayaran tidak valid.");
    }

    const orderId = `${booking.id}-${Date.now()}`;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    // 7. Siapkan parameter Midtrans Snap
    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: finalAmount,
      },
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

    // 8. Buat transaksi Snap di Midtrans
    const transaction = await snap.createTransaction(parameter);

    if (!transaction || !transaction.token) {
      throw new Error("Gagal mendapatkan token transaksi dari Midtrans");
    }

    // 9. Simpan token ke database Supabase via Admin Client
    const adminDb = createAdminClient();
    const { error: updateError } = await adminDb
      .from("bookings")
      .update({
        payment_token: transaction.token,
        payment_link_url: orderId,
      })
      .eq("id", bookingId);

    if (updateError) {
      console.error("[Midtrans Payment DB Update Error]:", updateError);
    }

    return apiSuccess(
      {
        token: transaction.token,
        redirectUrl: transaction.redirect_url,
        orderId,
      },
      "Sesi pembayaran berhasil dibuat"
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiValidationError(error);
    }

    console.error("[Midtrans Create Payment Exception]:", error);
    return apiError(error.message || "Gagal memproses pembayaran online", 500);
  }
}
