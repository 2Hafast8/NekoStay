import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { verifyBookingAccess } from "@/lib/supabase/admin";
import { generatePDFBuffer } from "@/lib/email/resend";
import {
  apiError,
  apiUnauthorized,
  apiForbidden,
  apiNotFound,
} from "@/lib/utils/response";

/**
 * GET /api/bookings/[id]/receipt
 * Mengunduh dokumen bukti pemesanan PDF resmi NekoStay.
 * Akses dilindungi: Hanya pemilik pesanan atau Administrator yang diizinkan.
 */
export async function GET(request, { params }) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // 1. Verifikasi hak akses (Pemilik pesanan atau Admin)
    const { isAllowed, user, booking } = await verifyBookingAccess(supabase, id);

    if (!user) {
      return apiUnauthorized("Silakan login untuk mengunduh bukti pemesanan.");
    }

    if (!booking) {
      return apiNotFound("Data pesanan tidak ditemukan.");
    }

    if (!isAllowed) {
      return apiForbidden("Anda tidak memiliki akses untuk mengunduh bukti pemesanan ini.");
    }

    // 2. Generate PDF stream buffer
    const userName = booking.profiles?.full_name || "Pelanggan NekoStay";
    const pdfBuffer = await generatePDFBuffer(booking, userName);

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="Bukti_Pemesanan_${id.substring(0, 8)}.pdf"`,
        "Cache-Control": "private, max-age=1800",
      },
    });
  } catch (error) {
    console.error("[Receipt API Exception]:", error);
    return apiError("Gagal memuat dokumen PDF bukti pemesanan", 500);
  }
}
