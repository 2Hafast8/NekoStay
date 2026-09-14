import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const supabase = await createClient();

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
        { error: "Hanya Administrator yang dapat memutuskan koneksi WhatsApp" },
        { status: 403 }
      );
    }

    await supabase.from("whatsapp_bot_state").upsert({
      id: "active_session",
      status: "disconnected",
      qr_code: null,
      disconnect_requested_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "Koneksi WhatsApp berhasil diputuskan",
    });
  } catch (error) {
    console.error("WhatsApp disconnect route error:", error);
    return NextResponse.json(
      { error: "Gagal memutuskan koneksi WhatsApp" },
      { status: 500 }
    );
  }
}
