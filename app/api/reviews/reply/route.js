import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendReviewReply } from "@/lib/email/resend";

export async function POST(request) {
  try {
    const { bookingId, replyText } = await request.json();

    if (!bookingId || !replyText?.trim()) {
      return NextResponse.json({ error: "Booking ID dan balasan harus diisi." }, { status: 400 });
    }

    const supabase = await createClient();

    // 1. Auth check
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Admin role check
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 3. Fetch review with booking details and user profile
    const { data: review, error: reviewErr } = await supabase
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
      .eq("booking_id", bookingId)
      .single();

    if (reviewErr || !review) {
      return NextResponse.json({ error: "Review tidak ditemukan untuk pesanan ini." }, { status: 404 });
    }

    // 4. Update the reply_text in DB
    const { error: updateErr } = await supabase
      .from("reviews")
      .update({ reply_text: replyText.trim() })
      .eq("booking_id", bookingId);

    if (updateErr) throw updateErr;

    // 5. Send Email via Resend
    const ownerEmail = review.bookings?.profiles?.email;
    const ownerName = review.bookings?.profiles?.full_name || "Pemilik Kucing";
    const catName = review.bookings?.cat_name || "Kucing";
    const reviewText = review.review_text;

    if (ownerEmail) {
      try {
        await sendReviewReply(ownerEmail, ownerName, catName, reviewText, replyText.trim());
      } catch (emailErr) {
        console.warn("[Server Email Warning] Resend review reply failed:", emailErr.message);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Submit reply review error:", err);
    return NextResponse.json({ error: err.message || "Gagal mengirim balasan." }, { status: 500 });
  }
}
