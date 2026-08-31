import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { waManager } from "@/lib/whatsapp/baileys-manager";

export async function GET(request) {
  try {
    const supabase = await createClient();

    // 1. Cek sesi admin
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json(
        { error: "Hanya Administrator yang dapat melihat status WhatsApp" },
        { status: 403 }
      );
    }

    // 2. Ambil status terkini dari WhatsApp Manager
    const statusData = waManager.getStatus();

    return NextResponse.json({
      success: true,
      ...statusData,
      adminPhoneConfigured: process.env.NEXT_PUBLIC_ADMIN_WHATSAPP || "6282371986344",
    });
  } catch (error) {
    console.error("WhatsApp status route error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal mendapatkan status WhatsApp" },
      { status: 500 }
    );
  }
}
