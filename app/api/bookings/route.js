import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { bookingFormSchema } from "@/lib/validations/booking";
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

    // 1. Cek sesi pengguna
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return apiUnauthorized();
    }

    // 2. Parse & Validasi data masukan
    const body = await request.json();
    const validatedData = bookingFormSchema.parse(body);

    // 3. Ambil profil pengguna
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return apiNotFound("Profil pengguna tidak ditemukan");
    }

    // 4. Ambil tarif kelas kamar
    const { data: classData, error: classError } = await supabase
      .from("classes")
      .select("price_per_day")
      .eq("name", validatedData.class)
      .single();

    if (classError || !classData) {
      return apiNotFound("Kelas kamar tidak ditemukan");
    }

    // 5. Kalkulasi durasi dan estimasi biaya
    const checkInDate = new Date(validatedData.check_in_date);
    const checkOutDate = new Date(validatedData.check_out_date);
    const totalDays = Math.floor(
      (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (totalDays <= 0) {
      return apiBadRequest("Tanggal keluar harus setelah tanggal masuk");
    }

    const estimatedTotal = totalDays * classData.price_per_day;

    // 6. Simpan pesanan ke database Supabase
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
        status: validatedData.status || "Menunggu",
        discount_amount: validatedData.discount_amount || 0,
      })
      .select()
      .single();

    if (bookingError) {
      console.error("[Booking API Error]:", bookingError);
      return apiError("Gagal menyimpan data pesanan", 500);
    }

    const isWaitlist = booking.status === "Antrian";

    // 7. Notifikasi in-app untuk pengguna
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

    // 8. Notifikasi in-app untuk admin via RPC
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

    // 9. Kirim email konfirmasi ke email pengguna
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
