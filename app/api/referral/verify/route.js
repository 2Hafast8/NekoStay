import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code")?.trim().toUpperCase();

    if (!code) {
      return NextResponse.json({ valid: false, error: "Code is required" }, { status: 400 });
    }

    const supabase = await createClient();

    // Check if the user is logged in to prevent self-referral
    const { data: { user } } = await supabase.auth.getUser();

    // Query profiles using secure RPC function to bypass RLS safely
    const { data: profiles, error } = await supabase
      .rpc("get_profile_by_referral", { code_param: code });

    const profile = profiles && profiles.length > 0 ? profiles[0] : null;

    if (error || !profile) {
      return NextResponse.json({ valid: false, message: "Referral code not found" });
    }

    if (user && user.id === profile.id) {
      return NextResponse.json({ valid: false, message: "Cannot use your own referral code" });
    }

    return NextResponse.json({ 
      valid: true, 
      message: "Referral code verified!",
      ownerName: profile.full_name,
      ownerId: profile.id
    });
  } catch (err) {
    console.error("Referral verification error:", err);
    return NextResponse.json({ valid: false, error: "Server error" }, { status: 500 });
  }
}
