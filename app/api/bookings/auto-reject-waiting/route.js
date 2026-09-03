import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { calculateCapacityAndWaitlist } from "@/lib/utils/capacity";
import { getCapacityFullRejectReason } from "@/lib/constants/index";
import { apiSuccess, apiError, apiUnauthorized } from "@/lib/utils/response";

/**
 * POST /api/bookings/auto-reject-waiting
 * Memeriksa seluruh pesanan berstatus 'Menunggu' atau 'Antrian'.
 * Jika kapasitas kamar kelas penuh dan perkiraan ketersediaan terdekat > 3 hari,
 * maka sistem secara otomatis menolak pesanan tersebut dengan template alasan kamar penuh.
 */
export async function POST(request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Verifikasi otentikasi (admin atau internal)
    if (!user) {
      return apiUnauthorized();
    }

    const supabaseAdmin = createAdminClient();

    // 1. Ambil seluruh kelas kamar untuk referensi kapasitas
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

    // 2. Ambil seluruh pesanan yang berstatus 'Menunggu' atau 'Antrian'
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

    // 3. Evaluasi setiap pesanan waiting terhadap kapasitas kamar
    for (const booking of waitingBookings || []) {
      const classInfo = classMap.get(booking.class) || {
        totalCages: 10,
        maintenanceCages: 0,
        effectiveCapacity: 10,
      };

      // Ambil seluruh pesanan aktif yang overlapping pada rentang waktu ini
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

      // Jika kamar penuh dan waktu tunggu ketersediaan melebihi 3 hari -> OTOMATIS DITOLAK
      if (capacityResult.isFull && !capacityResult.canWaitlist) {
        const rejectReason =
          capacityResult.rejectReason ||
          getCapacityFullRejectReason(booking.class, capacityResult.daysUntilAvailable);

        // Update status booking ke Dibatalkan dengan reject_reason
        const { error: updateErr } = await supabaseAdmin
          .from("bookings")
          .update({
            status: "Dibatalkan",
            reject_reason: rejectReason,
          })
          .eq("id", booking.id);

        if (updateErr) {
          console.error(`[Auto-Reject] Gagal update booking ${booking.id}:`, updateErr.message);
          continue;
        }

        // Kirim notifikasi in-app ke pengguna
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
          console.warn("[Auto-Reject] Notif error:", notifErr.message);
        }

        // Kirim email notifikasi penolakan
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
            console.warn("[Auto-Reject] Email error:", emailErr.message);
          }
        }

        rejectedList.push({
          id: booking.id,
          catName: booking.cat_name,
          class: booking.class,
          daysUntilAvailable: capacityResult.daysUntilAvailable,
          rejectReason,
        });
      }
    }

    return apiSuccess(
      {
        processedCount: waitingBookings?.length || 0,
        rejectedCount: rejectedList.length,
        rejected: rejectedList,
      },
      `Berhasil mengevaluasi ${waitingBookings?.length || 0} pesanan. ${rejectedList.length} pesanan otomatis ditolak karena kamar penuh (> 3 hari).`
    );
  } catch (error) {
    console.error("[Auto-Reject API Error]:", error);
    return apiError("Gagal menjalankan evaluasi otomatis antrian kamar", 500);
  }
}

