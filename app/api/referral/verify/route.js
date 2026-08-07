import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code")?.trim().toUpperCase();

    if (!code) {
      return NextResponse.json({ valid: false, error: "Kode referral wajib diisi" }, { status: 400 });
    }

    const supabase = await createClient();
    const adminDb = createAdminClient();

    // Check if the user is logged in
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      // 1. Check if user has ALREADY used a referral code in any previous booking
      const { data: existingUsage, error: checkErr } = await adminDb
        .from("bookings")
        .select("id, referral_code_used")
        .eq("user_id", user.id)
        .not("referral_code_used", "is", null)
        .limit(1);

      if (!checkErr && existingUsage && existingUsage.length > 0) {
        return NextResponse.json({
          valid: false,
          message: "Anda sudah pernah menggunakan kode referral sebelumnya. Kode referral hanya dapat digunakan 1 kali per pengguna."
        });
      }
    }

    // 2. Query profile by referral code using adminDb to avoid RLS lookup issues
    const { data: profiles, error } = await adminDb
      .from("profiles")
      .select("id, full_name, referral_code")
      .ilike("referral_code", code)
      .limit(1);

    const profile = profiles && profiles.length > 0 ? profiles[0] : null;

    if (error || !profile) {
      return NextResponse.json({ valid: false, message: "Kode referral tidak ditemukan" });
    }

    if (user && user.id === profile.id) {
      return NextResponse.json({ valid: false, message: "Tidak dapat menggunakan kode referral milik Anda sendiri" });
    }

    return NextResponse.json({ 
      valid: true, 
      message: "Kode referral valid!",
      ownerName: profile.full_name,
      ownerId: profile.id
    });
  } catch (err) {
    console.error("Referral verification error:", err);
    return NextResponse.json({ valid: false, error: "Terjadi kesalahan pada server" }, { status: 500 });
  }
}
