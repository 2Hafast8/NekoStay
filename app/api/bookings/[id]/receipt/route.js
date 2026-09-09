import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { generatePDFBuffer } from "@/lib/email/resend";

/**
 * GET /api/bookings/[id]/receipt
 * Mengunduh / menampilkan dokumen bukti pemesanan PDF resmi NekoStay.
 *
 * Catatan Akses:
 * Dokumen ini dapat diakses langsung melalui tautan di email konfirmasi/bukti pemesanan
 * menggunakan UUID pesanan yang unguessable (kemampuan capability URL), sehingga pengguna
 * pada perangkat mobile (Gmail in-app browser, dsb) tidak perlu login terlebih dahulu
 * untuk melihat atau mengunduh tanda terima pemesanan anabul mereka.
 */
export async function GET(request, { params }) {
  try {
    const { id } = await params;

    // 1. Validasi format UUID pemesanan
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!id || !uuidRegex.test(id)) {
      return renderErrorResponse(
        request,
        400,
        "Format ID Pemesanan Tidak Valid",
        "Tautan bukti pemesanan yang Anda buka tidak memiliki format ID pesanan yang benar."
      );
    }

    // 2. Ambil data pesanan via admin client untuk keandalan data (bebas RLS)
    const adminDb = createAdminClient();
    const { data: booking, error: fetchError } = await adminDb
      .from("bookings")
      .select("*, profiles:user_id (full_name, email, phone)")
      .eq("id", id)
      .maybeSingle();

    if (fetchError || !booking) {
      return renderErrorResponse(
        request,
        404,
        "Bukti Pemesanan Tidak Ditemukan",
        "Data pesanan tidak ditemukan atau tautan bukti pemesanan sudah tidak aktif."
      );
    }

    // 3. Opsional: Audit sesi jika pengguna sedang login di browser
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user && user.id !== booking.user_id) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();

        const isAdmin = profile?.role === "admin";
        if (!isAdmin) {
          console.log(
            `[Receipt Access] User ${user.id} accessed receipt for booking ${booking.id} owned by ${booking.user_id}`
          );
        }
      }
    } catch (authAuditErr) {
      // Abaikan kegagalan baca sesi agar tidak mengganggu download PDF dari email
      console.warn("[Receipt Auth Audit Warning]:", authAuditErr.message);
    }

    // 4. Generate PDF buffer
    const userName = booking.profiles?.full_name || "Pelanggan NekoStay";
    const pdfBuffer = await generatePDFBuffer(booking, userName);

    // 5. Konfigurasi nama file dan disposition
    const safeCatName = (booking.cat_name || "NekoStay").replace(
      /[^a-zA-Z0-9_-]/g,
      "_"
    );
    const filename = `Bukti_Pemesanan_${safeCatName}_${id.substring(0, 8)}.pdf`;

    const searchParams = request.nextUrl.searchParams;
    const isDownload = searchParams.get("download") === "true";
    const disposition = isDownload
      ? `attachment; filename="${filename}"`
      : `inline; filename="${filename}"`;

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": disposition,
        "Content-Length": pdfBuffer.length.toString(),
        "Cache-Control": "public, max-age=1800, s-maxage=1800",
      },
    });
  } catch (error) {
    console.error("[Receipt API Exception]:", error);
    return renderErrorResponse(
      request,
      500,
      "Gagal Memuat Bukti Pemesanan",
      "Terjadi kendala saat membuat dokumen PDF. Silakan coba beberapa saat lagi atau hubungi admin."
    );
  }
}

/**
 * Mengembalikan respons error berupa HTML yang ramah bagi tampilan browser mobile,
 * atau JSON jika pemanggil secara eksplisit meminta application/json.
 */
function renderErrorResponse(request, status, title, description) {
  const acceptHeader = request.headers.get("accept") || "";
  const isHtmlRequest =
    acceptHeader.includes("text/html") || !acceptHeader.includes("application/json");

  if (isHtmlRequest) {
    const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - NekoStay</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background-color: #f8fafc; padding: 20px; box-sizing: border-box; }
    .card { background: white; border: 1px solid #e2e8f0; border-radius: 20px; padding: 36px 28px; max-width: 440px; width: 100%; text-align: center; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); }
    .icon { width: 56px; height: 56px; margin: 0 auto 16px; border-radius: 16px; background: #fff7ed; display: flex; align-items: center; justify-content: center; font-size: 28px; }
    h1 { color: #0f172a; font-size: 18px; margin: 0 0 10px; font-weight: 800; }
    p { color: #64748b; font-size: 13px; line-height: 1.6; margin: 0 0 24px; }
    .btn { display: inline-block; background: #ea580c; color: white; text-decoration: none; padding: 12px 24px; border-radius: 12px; font-weight: 700; font-size: 13px; transition: background 0.2s; }
    .btn:hover { background: #c2410c; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">📋</div>
    <h1>${title}</h1>
    <p>${description}</p>
    <a href="https://nekostay.vercel.app" class="btn">Kembali ke NekoStay</a>
  </div>
</body>
</html>`;

    return new NextResponse(html, {
      status,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  return NextResponse.json({ success: false, error: description }, { status });
}
