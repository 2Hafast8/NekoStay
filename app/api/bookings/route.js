import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { bookingFormSchema } from "@/lib/validations/booking";
import { calculateCapacityAndWaitlist } from "@/lib/modules/pricing";
import {
  apiSuccess,
  apiError,
  apiUnauthorized,
  apiNotFound,
  apiBadRequest,
  apiValidationError,
} from "@/lib/utils/response";

/**
 * POST /api/bookings
 * Membuat pesanan penitipan kucing baru oleh pengguna yang telah login.
 */
export async function POST(request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return apiUnauthorized();
    }

    const body = await request.json();
    const validatedData = bookingFormSchema.parse(body);

    const [profileRes, classRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", user.id)
        .single(),
      supabase
        .from("classes")
        .select("price_per_day, total_cages, maintenance_cages")
        .eq("name", validatedData.class)
        .single(),
    ]);

    const { data: profile, error: profileError } = profileRes;
    if (profileError || !profile) {
      return apiNotFound("Profil pengguna tidak ditemukan");
    }

    const { data: classData, error: classError } = classRes;
    if (classError || !classData) {
      return apiNotFound("Kelas kamar tidak ditemukan");
    }

    const checkInDate = new Date(validatedData.check_in_date);
    const checkOutDate = new Date(validatedData.check_out_date);
    const totalDays = Math.floor(
      (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (totalDays <= 0) {
      return apiBadRequest("Tanggal keluar harus setelah tanggal masuk");
    }

    const estimatedTotal = totalDays * classData.price_per_day;

    // Evaluasi kapasitas kandang dan toleransi batas antrian (maksimal 3 hari)
    const totalCages = classData.total_cages ?? 10;
    const maintenanceCages = classData.maintenance_cages ?? 0;
    const effectiveCapacity = Math.max(1, totalCages - maintenanceCages);

    const { data: overlappingBookings } = await supabase
      .from("bookings")
      .select("id, check_in_date, check_out_date, status")
      .eq("class", validatedData.class)
      .in("status", ["Menunggu", "Aktif", "Antrian"])
      .lt("check_in_date", validatedData.check_out_date)
      .gt("check_out_date", validatedData.check_in_date)
      .order("check_out_date", { ascending: true });

    const capacityResult = calculateCapacityAndWaitlist({
      effectiveCapacity,
      totalCages,
      maintenanceCages,
      overlappingBookings: overlappingBookings || [],
      checkInDate: validatedData.check_in_date,
      checkOutDate: validatedData.check_out_date,
      className: validatedData.class,
    });

    if (capacityResult.isFull && !capacityResult.canWaitlist) {
      // Waktu tunggu melebihi toleransi maksimal 3 hari -> Otomatis Ditolak
      return apiBadRequest(
        capacityResult.rejectReason ||
          `Mohon maaf, pemesanan ditolak otomatis karena seluruh kamar kelas ${validatedData.class} penuh dan tidak tersedia ruang kosong dalam batas maksimal waktu 3 hari.`
      );
    }

    // Jika kelas penuh tapi tanggal kosong masih dalam toleransi <= 3 hari, alihkan ke status Antrian
    const initialStatus = capacityResult.isFull
      ? "Antrian"
      : validatedData.status || "Menunggu";

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        user_id: user.id,
        cat_name: validatedData.cat_name,
        cat_gender: validatedData.cat_gender,
        cat_age: validatedData.cat_age,
        cat_health_status: validatedData.cat_health_status,
        cat_favorite_food: validatedData.cat_favorite_food || null,
        cat_is_pregnant: validatedData.cat_is_pregnant || false,
        cat_notes: validatedData.cat_notes || null,
        cat_photo_url: validatedData.cat_photo_url || null,
        class: validatedData.class,
        price_per_day: classData.price_per_day,
        check_in_date: validatedData.check_in_date,
        check_out_date: validatedData.check_out_date,
        status: initialStatus,
        discount_amount: validatedData.discount_amount || 0,
      })
      .select()
      .single();

    if (bookingError) {
      console.error("[Booking API Error]:", bookingError);
      return apiError("Gagal menyimpan data pesanan", 500);
    }

    const isWaitlist = booking.status === "Antrian";

    try {
      await supabase.from("notifications").insert({
        user_id: user.id,
        title: isWaitlist
          ? `Pesanan ${validatedData.cat_name} Dalam Antrian`
          : `Pesanan Penitipan ${validatedData.cat_name} Dibuat`,
        message: isWaitlist
          ? `Kandang kelas ${validatedData.class} sedang penuh. Pesanan Anda berada dalam daftar antrian dan menunggu konfirmasi admin.`
          : `Pesanan Anda telah diterima. Menunggu konfirmasi admin.`,
        type: isWaitlist ? "warning" : "info",
        booking_id: booking.id,
      });
    } catch (notifErr) {
      console.warn("[Booking API Notice] User notification failed:", notifErr.message);
    }

    try {
      await supabase.rpc("create_admin_notification", {
        booking_id_param: booking.id,
        title_param: isWaitlist
          ? `Antrian Baru: ${validatedData.cat_name}`
          : `Pesanan Baru: ${validatedData.cat_name}`,
        message_param: isWaitlist
          ? `${profile.full_name} membuat pesanan antrian (kandang ${validatedData.class} penuh).`
          : `${profile.full_name} mengirim pesanan penitipan kucing.`,
        type_param: isWaitlist ? "warning" : "info",
      });
    } catch (notifErr) {
      console.warn("[Booking API Notice] Admin notification failed:", notifErr.message);
    }

    if (profile.email) {
      try {
        const { sendBookingConfirmation } = await import("@/lib/email/resend");
        const checkInFormatted = checkInDate.toLocaleDateString("id-ID", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
        const checkOutFormatted = checkOutDate.toLocaleDateString("id-ID", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });

        await sendBookingConfirmation(
          profile.email,
          profile.full_name,
          validatedData.cat_name,
          booking.id,
          checkInFormatted,
          checkOutFormatted,
          validatedData.class,
          estimatedTotal
        );
      } catch (emailErr) {
        console.warn("[Booking API Email Notice]:", emailErr.message);
      }
    }

    return apiSuccess(
      {
        booking: {
          id: booking.id,
          cat_name: booking.cat_name,
          status: booking.status,
          total_days: totalDays,
          estimated_total: estimatedTotal,
        },
      },
      "Booking berhasil dibuat",
      201
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiValidationError(error);
    }

    console.error("[Booking API Exception]:", error);
    return apiError("Gagal memproses pesanan booking", 500);
  }
}
