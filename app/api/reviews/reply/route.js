import { createClient } from "@/lib/supabase/server";
import { createAdminClient, verifyAdmin } from "@/lib/supabase/admin";
import { z } from "zod";
import { sendReviewReply } from "@/lib/email/resend";
import {
  apiSuccess,
  apiError,
  apiUnauthorized,
  apiForbidden,
  apiNotFound,
  apiBadRequest,
  apiValidationError,
} from "@/lib/utils/response";

const replySchema = z.object({
  bookingId: z.string().uuid("ID booking tidak valid"),
  replyText: z.string().trim().min(2, "Balasan minimal 2 karakter").max(2000, "Balasan maksimal 2000 karakter"),
});

/**
 * POST /api/reviews/reply
 * Membalas ulasan pelanggan dan mengirimkan notifikasi email (Hanya Admin).
 */
export async function POST(request) {
  try {
    const supabase = await createClient();

    // 1. Verifikasi Admin
    const { isAdmin, user } = await verifyAdmin(supabase);
    if (!user) {
      return apiUnauthorized();
    }
    if (!isAdmin) {
      return apiForbidden("Hanya Administrator yang berhak membalas ulasan.");
    }

    // 2. Parse & Validasi payload
    const body = await request.json();
    const validated = replySchema.parse(body);

    const adminDb = createAdminClient();

    // 3. Ambil data ulasan + booking + profil
    const { data: review, error: reviewErr } = await adminDb
      .from("reviews")
      .select(`
        *,
        bookings (
          id,
          cat_name,
          user_id,
          profiles:user_id (
            email,
            full_name
          )
        )
      `)
      .eq("booking_id", validated.bookingId)
      .single();

    if (reviewErr || !review) {
      return apiNotFound("Review tidak ditemukan untuk pesanan ini.");
    }

    const existingReplies = review.reply_text ? review.reply_text.split("\n---\n") : [];
    if (existingReplies.length >= 3) {
      return apiBadRequest("Ulasan ini sudah dibalas maksimal 3 kali.");
    }

    const newReplyText = review.reply_text
      ? `${review.reply_text}\n---\n${validated.replyText}`
      : validated.replyText;

    // 4. Update reply_text di database
    const { data: updateData, error: updateErr } = await adminDb
      .from("reviews")
      .update({
        reply_text: newReplyText,
      })
      .eq("booking_id", validated.bookingId)
      .select();

    if (updateErr || !updateData || updateData.length === 0) {
      console.error("[Review Reply Error]:", updateErr);
      return apiError("Gagal menyimpan balasan ke database.", 500);
    }

    // 5. Kirim email balasan ke pemilik kucing
    const ownerEmail = review.bookings?.profiles?.email;
    const ownerName = review.bookings?.profiles?.full_name || "Pemilik Kucing";
    const catName = review.bookings?.cat_name || "Kucing";
    const reviewText = review.review_text;

    if (ownerEmail) {
      try {
        await sendReviewReply(ownerEmail, ownerName, catName, reviewText, validated.replyText);
      } catch (emailErr) {
        console.warn("[Review Reply Email Warning]:", emailErr.message);
      }
    }

    return apiSuccess(null, "Balasan ulasan berhasil dikirim");
  } catch (err) {
    if (err instanceof z.ZodError) {
      return apiValidationError(err);
    }

    console.error("[Submit Reply Review Exception]:", err);
    return apiError("Gagal mengirim balasan ulasan", 500);
  }
}
