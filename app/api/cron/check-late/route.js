import { createAdminClient } from "@/lib/supabase/admin";
import { calculateLateFee } from "@/lib/utils/pricing";
import { sendLateWarning } from "@/lib/email/resend";
import { apiSuccess, apiError, apiUnauthorized } from "@/lib/utils/response";

/**
 * GET /api/cron/check-late
 * Cron job harian yang memeriksa pesanan aktif melewati tanggal check-out,
 * menghitung akumulasi denda 8% harian, memperbarui DB, dan mengirimkan notifikasi.
 */
export async function GET(request) {
  try {
    // 1. Verifikasi cron authorization secret dari headers
    const authHeader = request.headers.get("authorization");
    const expectedToken = `Bearer ${process.env.CRON_SECRET}`;

    if (!process.env.CRON_SECRET || authHeader !== expectedToken) {
      return apiUnauthorized("Unauthorized cron access.");
    }

    // 2. Inisialisasi Supabase Admin Client
    const supabaseAdmin = createAdminClient();

    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    // 3. Ambil seluruh pesanan aktif yang tanggal check-out nya sudah lewat
    const { data: lateBookings, error: fetchError } = await supabaseAdmin
      .from("bookings")
      .select(`
        *,
        profiles:user_id (email, full_name)
      `)
      .eq("status", "Aktif")
      .lt("check_out_date", todayStr);

    if (fetchError) {
      console.error("[Cron Fetch Error]:", fetchError);
      return apiError("Gagal mengambil data pesanan terlambat", 500);
    }

    console.log(`[Cron] Ditemukan ${lateBookings?.length || 0} pesanan terlambat.`);

    let processedCount = 0;

    for (const booking of lateBookings || []) {
      const scheduledCheckout = new Date(booking.check_out_date);

      // Hitung denda keterlambatan akumulatif 8% per hari
      const { totalFee, breakdown } = calculateLateFee(
        booking.price_per_day,
        scheduledCheckout,
        today
      );

      if (breakdown.length === 0) continue;

      const lateDaysCount = breakdown.length;
      const todayFee = breakdown[breakdown.length - 1]?.fee || 0;

      // Update late_fee_total di database
      const { error: updateError } = await supabaseAdmin
        .from("bookings")
        .update({ late_fee_total: totalFee })
        .eq("id", booking.id);

      if (updateError) {
        console.error(`[Cron Error] Gagal update booking ${booking.id}:`, updateError.message);
        continue;
      }

      // Kirim email peringatan jika ada email
      const userEmail = booking.profiles?.email;
      if (userEmail) {
        try {
          await sendLateWarning(
            userEmail,
            booking.cat_name,
            lateDaysCount,
            todayFee
          );
        } catch (emailErr) {
          console.warn(`[Cron Notice] Email failed for booking ${booking.id}:`, emailErr.message);
        }
      }

      // Kirim notifikasi in-app (hindari duplikasi di hari yang sama)
      const { data: existingNotification } = await supabaseAdmin
        .from("notifications")
        .select("id")
        .eq("booking_id", booking.id)
        .eq("title", "Peringatan Keterlambatan")
        .gte("created_at", todayStr)
        .limit(1);

      if (!existingNotification || existingNotification.length === 0) {
        await supabaseAdmin.from("notifications").insert({
          user_id: booking.user_id,
          title: "Peringatan Keterlambatan",
          message: `Kucing Anda (${booking.cat_name}) belum diambil. Denda keterlambatan hari ini: Rp ${todayFee.toLocaleString("id-ID")}`,
          type: "warning",
          booking_id: booking.id,
        });
      }

      processedCount++;
    }

    return apiSuccess(
      { processed: processedCount },
      "Pemeriksaan keterlambatan harian selesai"
    );
  } catch (error) {
    console.error("[Cron Exception]:", error);
    return apiError("Gagal memproses cron keterlambatan", 500);
  }
}
