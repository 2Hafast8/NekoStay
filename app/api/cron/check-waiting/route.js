import { createAdminClient } from "@/lib/supabase/admin";
import { calculateCapacityAndWaitlist } from "@/lib/utils/capacity";
import { getCapacityFullRejectReason } from "@/lib/constants/index";
import { apiSuccess, apiError, apiUnauthorized } from "@/lib/utils/response";

/**
 * GET /api/cron/check-waiting
 * Cron job otomatis yang mengevaluasi pesanan berstatus 'Menunggu' atau 'Antrian'.
 * Jika kamar penuh dan perkiraan bebas terdekat melebihi 3 hari, otomatis ditolak.
 */
export async function GET(request) {
  try {
    // 1. Verifikasi cron authorization secret dari headers
    const authHeader = request.headers.get("authorization");
    const expectedToken = `Bearer ${process.env.CRON_SECRET}`;

    if (!process.env.CRON_SECRET || authHeader !== expectedToken) {
      return apiUnauthorized("Unauthorized cron access.");
    }

    const supabaseAdmin = createAdminClient();

    // 2. Ambil seluruh kelas kamar untuk referensi kapasitas
    const { data: classesData, error: classesErr } = await supabaseAdmin
      .from("classes")
      .select("name, total_cages, maintenance_cages");

    if (classesErr) {
      return apiError("Gagal mengambil data kelas kamar", 500);
    }

    const classMap = new Map();
    (classesData || []).forEach((c) => {
      classMap.set(c.name, {
        totalCages: c.total_cages ?? 10,
        maintenanceCages: c.maintenance_cages ?? 0,
        effectiveCapacity: Math.max(1, (c.total_cages ?? 10) - (c.maintenance_cages ?? 0)),
      });
    });

    // 3. Ambil seluruh pesanan berstatus 'Menunggu' atau 'Antrian'
    const { data: waitingBookings, error: waitingErr } = await supabaseAdmin
      .from("bookings")
      .select(`
        *,
        profiles:user_id (full_name, email)
      `)
      .in("status", ["Menunggu", "Antrian"])
      .order("created_at", { ascending: true });

    if (waitingErr) {
      return apiError("Gagal mengambil data pesanan antrian", 500);
    }

    const rejectedList = [];

    // 4. Evaluasi setiap pesanan waiting terhadap kapasitas kamar
    for (const booking of waitingBookings || []) {
      const classInfo = classMap.get(booking.class) || {
        totalCages: 10,
        maintenanceCages: 0,
        effectiveCapacity: 10,
      };

      const { data: activeOverlap } = await supabaseAdmin
        .from("bookings")
        .select("id, check_in_date, check_out_date, status")
        .eq("class", booking.class)
        .eq("status", "Aktif")
        .lt("check_in_date", booking.check_out_date)
        .gt("check_out_date", booking.check_in_date)
        .order("check_out_date", { ascending: true });

      const capacityResult = calculateCapacityAndWaitlist({
        effectiveCapacity: classInfo.effectiveCapacity,
        totalCages: classInfo.totalCages,
        maintenanceCages: classInfo.maintenanceCages,
        overlappingBookings: activeOverlap || [],
        checkInDate: booking.check_in_date,
        checkOutDate: booking.check_out_date,
        className: booking.class,
      });

      if (capacityResult.isFull && !capacityResult.canWaitlist) {
        const rejectReason =
          capacityResult.rejectReason ||
          getCapacityFullRejectReason(booking.class, capacityResult.daysUntilAvailable);

        const { error: updateErr } = await supabaseAdmin
          .from("bookings")
          .update({
            status: "Dibatalkan",
            reject_reason: rejectReason,
          })
          .eq("id", booking.id);

        if (updateErr) continue;

        try {
          await supabaseAdmin.from("notifications").insert({
            user_id: booking.user_id,
            title: "Pesanan Ditolak Otomatis (Kamar Penuh)",
            message: rejectReason,
            type: "error",
            booking_id: booking.id,
            is_read: false,
          });
        } catch (notifErr) {
          console.warn("[Cron Waiting Notif Notice]:", notifErr.message);
        }

        const userEmail = booking.profiles?.email;
        if (userEmail) {
          try {
            const { sendBookingRejected } = await import("@/lib/email/resend");
            await sendBookingRejected(
              userEmail,
              booking.profiles?.full_name || "Pelanggan",
              booking.cat_name,
              booking.id,
              rejectReason
            );
          } catch (emailErr) {
            console.warn("[Cron Waiting Email Notice]:", emailErr.message);
          }
        }

        rejectedList.push(booking.id);
      }
    }

    return apiSuccess(
      {
        processed: waitingBookings?.length || 0,
        autoRejectedCount: rejectedList.length,
      },
      `Cron check-waiting selesai. ${rejectedList.length} pesanan ditolak otomatis karena kamar penuh > 3 hari.`
    );
  } catch (error) {
    console.error("[Cron Check Waiting Error]:", error);
    return apiError("Gagal menjalankan cron check-waiting", 500);
  }
}

