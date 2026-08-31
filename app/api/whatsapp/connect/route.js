import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request) {
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
        { error: "Hanya Administrator yang dapat menyambungkan WhatsApp" },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const phoneNumber = body.phoneNumber || process.env.NEXT_PUBLIC_ADMIN_WHATSAPP || "6282371986344";

    // 2. Fetch current bot state from Supabase
    const { data: botState } = await supabase
      .from("whatsapp_bot_state")
      .select("*")
      .eq("id", "active_session")
      .maybeSingle();

    return NextResponse.json({
      success: true,
      status: botState?.status || "disconnected",
      qrCode: botState?.qr_code || null,
      connectedPhone: botState?.connected_phone || phoneNumber,
    });
  } catch (error) {
    console.error("WhatsApp connect route error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal memulai koneksi WhatsApp" },
      { status: 500 }
    );
  }
}
