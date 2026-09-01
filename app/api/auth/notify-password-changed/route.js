import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPasswordChangedNotification } from "@/lib/email/resend";
import {
  apiSuccess,
  apiError,
  apiUnauthorized,
} from "@/lib/utils/response";

/**
 * POST /api/auth/notify-password-changed
 * Mengirim notifikasi in-app dan email keamanan saat kata sandi pengguna diperbarui.
 * Keamanan: Memerlukan sesi pengguna aktif terverifikasi.
 */
export async function POST(request) {
  try {
    const adminDb = createAdminClient();
    let userId = null;
    let userEmail = null;

    // 1. Cek token dari header Authorization
    const authHeader = request.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "");
      const { data: authData } = await adminDb.auth.getUser(token);
      if (authData?.user) {
        userId = authData.user.id;
        userEmail = authData.user.email;
      }
    }

    // 2. Fallback ke cookie session server
    if (!userId) {
      try {
        const supabase = await createClient();
        const { data: authData } = await supabase.auth.getUser();
        if (authData?.user) {
          userId = authData.user.id;
          userEmail = authData.user.email;
        }
      } catch (cookieErr) {
        console.warn("[Notice] Cookie auth check skipped:", cookieErr.message);
      }
    }

    // Jika tidak ada sesi aktif, tolak request
    if (!userId) {
      return apiUnauthorized("Sesi pengguna tidak valid.");
    }

    // 3. Ambil data profil pengguna
    const { data: profile } = await adminDb
      .from("profiles")
      .select("full_name, email")
      .eq("id", userId)
      .single();

    const userName = profile?.full_name || "Pengguna NekoStay";
    const targetEmail = userEmail || profile?.email;

    // 4. Masukkan notifikasi in-app
    await adminDb.from("notifications").insert({
      user_id: userId,
      title: "Password Berhasil Diubah 🔒",
      message: "Password akun NekoStay Anda telah berhasil diperbarui. Email pemberitahuan keamanan telah dikirimkan.",
      type: "success",
      is_read: false,
    });

    // 5. Kirim email notifikasi keamanan (non-blocking dengan timeout 4s)
    if (targetEmail) {
      Promise.race([
        sendPasswordChangedNotification(targetEmail, userName),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Email timeout")), 4000)),
      ]).catch((emailErr) => {
        console.warn("[Password Change Email Notice]:", emailErr.message);
      });
    }

    return apiSuccess(null, "Notifikasi keamanan password berhasil dikirim");
  } catch (err) {
    console.error("[Notify Password Changed Exception]:", err);
    return apiError("Gagal mengirim notifikasi keamanan password", 500);
  }
}
