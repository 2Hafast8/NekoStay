import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPasswordChangedNotification } from "@/lib/email/resend";

export async function POST(request) {
  try {
    const adminDb = createAdminClient();
    let userId = null;
    let userEmail = null;

    // 1. Try token from Authorization header
    const authHeader = request.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "");
      const { data: authData } = await adminDb.auth.getUser(token);
      if (authData?.user) {
        userId = authData.user.id;
        userEmail = authData.user.email;
      }
    }

    // 2. Fallback to server cookie session
    if (!userId) {
      try {
        const supabase = await createClient();
        const { data: authData } = await supabase.auth.getUser();
        if (authData?.user) {
          userId = authData.user.id;
          userEmail = authData.user.email;
        }
      } catch (cookieErr) {
        console.warn("[Notice] Cookie auth fallback skipped:", cookieErr.message);
      }
    }

    // 3. Fallback to payload body
    const body = await request.json().catch(() => ({}));
    if (!userId && body.userId) {
      userId = body.userId;
      userEmail = body.email || null;
    }

    if (!userId) {
      return NextResponse.json({ error: "User identity not found" }, { status: 401 });
    }

    // Fetch user profile for full_name and email fallback
    const { data: profile } = await adminDb
      .from("profiles")
      .select("full_name, email")
      .eq("id", userId)
      .single();

    const userName = profile?.full_name || "Pengguna NekoStay";
    const targetEmail = userEmail || profile?.email;

    // 1. Insert in-app notification into DB immediately
    await adminDb.from("notifications").insert({
      user_id: userId,
      title: "Password Berhasil Diubah 🔒",
      message: "Password akun NekoStay Anda telah berhasil diperbarui. Email pemberitahuan keamanan telah dikirimkan ke Gmail Anda.",
      type: "success",
    });

    // 2. Send email in background (non-blocking with 4s timeout)
    if (targetEmail) {
      Promise.race([
        sendPasswordChangedNotification(targetEmail, userName),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Email timeout")), 4000))
      ]).catch((emailErr) => {
        console.warn("[Warning] Password change email error/timeout:", emailErr.message);
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Notify password changed error:", err);
    return NextResponse.json(
      { error: err.message || "Gagal membuat notifikasi." },
      { status: 500 }
    );
  }
}
