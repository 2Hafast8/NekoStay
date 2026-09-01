import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { verifyAdmin } from "@/lib/supabase/admin";
import { catReportSchema } from "@/lib/validations/booking";
import { sendCatReport } from "@/lib/email/resend";
import { formatDate } from "@/lib/utils/dates";
import {
  apiSuccess,
  apiError,
  apiUnauthorized,
  apiForbidden,
  apiNotFound,
  apiValidationError,
} from "@/lib/utils/response";

/**
 * POST /api/bookings/[id]/report
 * Menyimpan laporan harian kondisi kucing dan mengirim notifikasi + email (Hanya Admin).
 */
export async function POST(request, { params }) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // 1. Verifikasi Admin
    const { isAdmin, user } = await verifyAdmin(supabase);
    if (!user) {
      return apiUnauthorized();
    }
    if (!isAdmin) {
      return apiForbidden("Hanya Administrator yang berhak membuat laporan harian kucing.");
    }

    // 2. Parse & Validasi input
    const body = await request.json();
    const validatedData = catReportSchema.parse(body);

    // 3. Ambil data pesanan
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select(`
        *,
        profiles:user_id (full_name, phone, email)
      `)
      .eq("id", id)
      .single();

    if (bookingError || !booking) {
      return apiNotFound("Data booking tidak ditemukan");
    }

    const todayStr = new Date().toISOString().split("T")[0];

    // 4. Simpan catatan laporan
    const { data: report, error: reportError } = await supabase
      .from("cat_reports")
      .insert({
        booking_id: id,
        admin_id: user.id,
        health_status: validatedData.healthStatus,
        photo_url: validatedData.photoUrl || null,
        notes: validatedData.notes || null,
        report_date: todayStr,
      })
      .select()
      .single();

    if (reportError) {
      console.error("[Report API Error]:", reportError);
      return apiError("Gagal menyimpan laporan harian", 500);
    }

    // 5. Notifikasi in-app untuk pengguna
    try {
      await supabase.from("notifications").insert({
        user_id: booking.user_id,
        title: `Laporan Kondisi Baru: ${booking.cat_name}`,
        message: `Kondisi kucing Anda hari ini: ${validatedData.healthStatus}. Catatan: ${validatedData.notes || "Kondisi stabil."}`,
        type: validatedData.healthStatus === "Sehat" ? "success" : validatedData.healthStatus === "Kurang Fit" ? "warning" : "error",
        booking_id: booking.id,
      });
    } catch (notifErr) {
      console.warn("[Report API Notice] User notification failed:", notifErr.message);
    }

    // 6. Kirim email transaksi laporan kucing via Resend
    const userEmail = booking.profiles?.email;
    if (userEmail) {
      try {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
        await sendCatReport(userEmail, {
          catName: booking.cat_name,
          ownerName: booking.profiles.full_name,
          healthStatus: validatedData.healthStatus,
          notes: validatedData.notes || undefined,
          photoUrl: validatedData.photoUrl || undefined,
          reportDate: formatDate(todayStr, "long"),
          bookingUrl: `${appUrl}/booking/${booking.id}`,
        });
      } catch (emailErr) {
        console.warn("[Report API Email Notice]:", emailErr.message);
      }
    }

    return apiSuccess({ report }, "Laporan berhasil disimpan dan notifikasi telah terkirim", 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiValidationError(error);
    }

    console.error("[Report API Exception]:", error);
    return apiError("Gagal memproses laporan kondisi kucing", 500);
  }
}
