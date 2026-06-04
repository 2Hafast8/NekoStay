import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request, { params }) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // 1. Auth check
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Fetch booking and profile
    const { data: booking, error: bookingErr } = await supabase
      .from("bookings")
      .select("cat_name, user_id")
      .eq("id", id)
      .single();

    if (bookingErr || !booking) {
      return NextResponse.json({ error: "Booking tidak ditemukan." }, { status: 404 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    const ownerName = profile?.full_name || "Pelanggan";
    const catName = booking.cat_name || "Kucing";

    // 3. Create admin notification via RPC
    try {
      await supabase.rpc("create_admin_notification", {
        booking_id_param: id,
        title_param: `Permintaan Perubahan (WA): ${catName}`,
        message_param: `${ownerName} meminta perubahan jadwal/kelas kucing via WhatsApp.`,
        type_param: "info",
      });
    } catch (notifErr) {
      console.warn("[Warning] Admin notification creation for WA request failed:", notifErr.message);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("WA request change error:", err);
    return NextResponse.json({ error: "Gagal memproses permintaan." }, { status: 550 });
  }
}
