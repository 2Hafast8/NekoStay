import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { reviewSchema } from "@/lib/validations/booking";
import {
  apiSuccess,
  apiError,
  apiUnauthorized,
  apiNotFound,
  apiBadRequest,
  apiValidationError,
} from "@/lib/utils/response";

/**
 * GET /api/reviews
 * Mengambil daftar ulasan publik terbaru.
 */
export async function GET() {
  try {
    const supabase = await createClient();

    const { data: reviews, error } = await supabase
      .from("reviews")
      .select(`
        id,
        rating,
        review_text,
        reply_text,
        created_at,
        profiles (
          full_name
        )
      `)
      .order("created_at", { ascending: false })
      .limit(15);

    if (error) throw error;

    return apiSuccess({ reviews });
  } catch (err) {
    console.error("[Fetch Reviews API Error]:", err);
    return apiError("Gagal mengambil data ulasan", 500);
  }
}

/**
 * POST /api/reviews
 * Mengirim ulasan pesanan yang telah selesai oleh pemiliknya.
 */
export async function POST(request) {
  try {
    const supabase = await createClient();

    // 1. Cek sesi user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return apiUnauthorized();
    }

    // 2. Parse & Validasi payload
    const body = await request.json();
    const validated = reviewSchema.parse(body);

    // 3. Verifikasi pesanan milik user dan berstatus Selesai
    const { data: booking, error: bookingErr } = await supabase
      .from("bookings")
      .select("id, status, cat_name")
      .eq("id", validated.bookingId)
      .eq("user_id", user.id)
      .single();

    if (bookingErr || !booking) {
      return apiNotFound("Pesanan tidak ditemukan atau bukan milik Anda.");
    }

    if (booking.status !== "Selesai") {
      return apiBadRequest("Hanya pesanan yang sudah selesai ('Selesai') yang dapat diulas.");
    }

    // 4. Simpan ulasan ke DB
    const { data: review, error: insertErr } = await supabase
      .from("reviews")
      .insert({
        user_id: user.id,
        booking_id: validated.bookingId,
        rating: validated.rating,
        review_text: validated.reviewText,
      })
      .select()
      .single();

    if (insertErr) {
      if (insertErr.code === "23505") {
        return apiBadRequest("Pesanan ini sudah pernah Anda beri ulasan sebelumnya.");
      }
      throw insertErr;
    }

    // 5. Notifikasi ke Admin via RPC
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      const ownerName = profile?.full_name || "Pelanggan";
      const catName = booking?.cat_name || "Kucing";

      await supabase.rpc("create_admin_notification", {
        booking_id_param: validated.bookingId,
        title_param: `Review Baru: ${catName}`,
        message_param: `${ownerName} memberikan rating ${validated.rating}/5: "${validated.reviewText}"`,
        type_param: "info",
      });
    } catch (notifErr) {
      console.warn("[Review API Notice] Admin notification failed:", notifErr.message);
    }

    return apiSuccess({ review }, "Ulasan berhasil dikirim", 201);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return apiValidationError(err);
    }

    console.error("[Submit Review Exception]:", err);
    return apiError("Gagal mengirim ulasan", 500);
  }
}
