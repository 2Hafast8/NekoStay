import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request) {
  try {
    const { ownerId, bookingId, points } = await request.json();

    if (!ownerId || !bookingId || !points) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify the caller is authenticated
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Use admin client to bypass RLS for point updates
    const adminDb = createAdminClient();

    // Verify the booking exists and has the referral_owner_id matching
    const { data: booking, error: bookingErr } = await adminDb
      .from("bookings")
      .select("id, referral_owner_id, referral_code_used")
      .eq("id", bookingId)
      .single();

    if (bookingErr || !booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    if (booking.referral_owner_id !== ownerId) {
      return NextResponse.json(
        { error: "Owner ID mismatch" },
        { status: 400 }
      );
    }

    // Increment neko_points on the referral owner's profile
    const { data: profile, error: profileErr } = await adminDb
      .from("profiles")
      .select("neko_points")
      .eq("id", ownerId)
      .single();

    if (profileErr || !profile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    const newPoints = (profile.neko_points || 0) + points;

    const { error: updateErr } = await adminDb
      .from("profiles")
      .update({ neko_points: newPoints })
      .eq("id", ownerId);

    if (updateErr) throw updateErr;

    // Send notification to the referral owner
    try {
      await adminDb.from("notifications").insert({
        user_id: ownerId,
        title: "Poin Neko Diterima! 🎉",
        message: `Anda mendapatkan ${points} Poin Neko karena kode referral Anda digunakan dalam pemesanan baru.`,
        type: "success",
        booking_id: bookingId,
      });
    } catch (notifErr) {
      console.warn("[Warning] Notification for points failed:", notifErr.message);
    }

    return NextResponse.json({
      success: true,
      newPoints,
    });
  } catch (err) {
    console.error("Award points error:", err);
    return NextResponse.json(
      { error: err.message || "Gagal memberikan poin." },
      { status: 500 }
    );
  }
}
