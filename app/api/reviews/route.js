import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request) {
  try {
    const supabase = await createClient();
    
    // Fetch latest reviews with profile name
    const { data: reviews, error } = await supabase
      .from("reviews")
      .select(`
        id,
        rating,
        review_text,
        created_at,
        profiles (
          full_name
        )
      `)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) throw error;

    return NextResponse.json({ reviews });
  } catch (err) {
    console.error("Fetch reviews error:", err);
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { bookingId, rating, reviewText } = await request.json();

    if (!bookingId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Invalid booking ID or rating (must be 1-5)" }, { status: 400 });
    }

    const supabase = await createClient();

    // Get current authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify booking belongs to this user and is status = 'Selesai'
    const { data: booking, error: bookingErr } = await supabase
      .from("bookings")
      .select("id, status")
      .eq("id", bookingId)
      .eq("user_id", user.id)
      .single();

    if (bookingErr || !booking) {
      return NextResponse.json({ error: "Booking not found or not owned by user" }, { status: 404 });
    }

    if (booking.status !== "Selesai") {
      return NextResponse.json({ error: "Can only review completed stays" }, { status: 400 });
    }

    // Insert review
    const { data: review, error: insertErr } = await supabase
      .from("reviews")
      .insert({
        user_id: user.id,
        booking_id: bookingId,
        rating: parseInt(rating),
        review_text: reviewText?.trim() || "",
      })
      .select()
      .single();

    if (insertErr) {
      // Check for unique constraint violation (already reviewed)
      if (insertErr.code === "23505") {
        return NextResponse.json({ error: "Stay already reviewed" }, { status: 409 });
      }
      throw insertErr;
    }

    // Notify admin about the review
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      const { data: bookingDetails } = await supabase
        .from("bookings")
        .select("cat_name")
        .eq("id", bookingId)
        .single();

      const ownerName = profile?.full_name || "Pelanggan";
      const catName = bookingDetails?.cat_name || "Kucing";

      await supabase.rpc("create_admin_notification", {
        booking_id_param: bookingId,
        title_param: `Review Baru: ${catName}`,
        message_param: `${ownerName} memberikan rating ${rating}/5: "${reviewText?.trim() || ''}"`,
        type_param: "info",
      });
    } catch (notifErr) {
      console.warn('[Warning] Admin notification creation for review failed:', notifErr.message);
    }

    return NextResponse.json({ success: true, review });
  } catch (err) {
    console.error("Submit review error:", err);
    return NextResponse.json({ error: err.message || "Failed to submit review" }, { status: 500 });
  }
}
