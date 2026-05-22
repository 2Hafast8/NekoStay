import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { CLASS_PRICES } from "@/lib/utils/pricing";

export async function PUT(request, { params }) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    
    // 1. Auth check
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
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
    
    // 3. Parse body
    const { className, checkInDate, checkOutDate } = await request.json();
    
    if (!className || !checkInDate || !checkOutDate) {
      return NextResponse.json(
        { error: "Semua field harus diisi." },
        { status: 400 }
      );
    }
    
    if (!CLASS_PRICES[className]) {
      return NextResponse.json(
        { error: "Kelas tidak valid." },
        { status: 400 }
      );
    }
    
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    
    if (checkOut <= checkIn) {
      return NextResponse.json(
        { error: "Tanggal Check-Out harus setelah Check-In." },
        { status: 400 }
      );
    }
    
    // 4. Fetch the old booking details with profile info
    const { data: oldBooking, error: fetchError } = await supabase
      .from("bookings")
      .select(`
        *,
        profiles (full_name, email)
      `)
      .eq("id", id)
      .single();

    if (fetchError || !oldBooking) {
      return NextResponse.json(
        { error: "Booking tidak ditemukan." },
        { status: 404 }
      );
    }
    
    const pricePerDay = CLASS_PRICES[className];
    
    // 5. Perform update
    const { data: updatedBooking, error } = await supabase
      .from("bookings")
      .update({
        class: className,
        price_per_day: pricePerDay,
        check_in_date: checkInDate,
        check_out_date: checkOutDate,
      })
      .eq("id", id)
      .select()
      .single();
      
    if (error) {
      console.error("Error updating booking:", error);
      return NextResponse.json(
        { error: "Gagal memperbarui pesanan." },
        { status: 500 }
      );
    }

    // 6. Insert notification for the owner in-app
    await supabase.from("notifications").insert({
      user_id: oldBooking.user_id,
      title: `Detail Pesanan Diperbarui: ${oldBooking.cat_name}`,
      message: `Admin memperbarui detail pesanan ${oldBooking.cat_name}. Kelas: ${className}, Check-In: ${checkInDate}, Check-Out: ${checkOutDate}.`,
      type: "info",
      booking_id: oldBooking.id,
    });

    // 7. Send transactional email via Resend
    const userEmail = oldBooking.profiles?.email;
    if (userEmail) {
      try {
        const { sendBookingEditNotification } = await import("@/lib/email/resend");
        await sendBookingEditNotification(
          userEmail,
          oldBooking.profiles.full_name,
          oldBooking.cat_name,
          oldBooking.id,
          {
            className: oldBooking.class,
            checkIn: oldBooking.check_in_date,
            checkOut: oldBooking.check_out_date,
          },
          {
            className: updatedBooking.class,
            checkIn: updatedBooking.check_in_date,
            checkOut: updatedBooking.check_out_date,
            totalDays: updatedBooking.total_days,
            estimatedTotal: updatedBooking.estimated_total,
          }
        );
      } catch (emailErr) {
        console.warn("[Server Email Warning] Resend edit notification failed:", emailErr.message);
      }
    }
    
    return NextResponse.json({
      success: true,
      booking: updatedBooking,
    });
    
  } catch (err) {
    console.error("API /edit route error:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal." },
      { status: 500 }
    );
  }
}

