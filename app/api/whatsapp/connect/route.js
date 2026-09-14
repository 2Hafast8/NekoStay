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
        { error: "Hanya Administrator yang dapat menyambungkan WhatsApp" },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const phoneNumber = body.phoneNumber || process.env.NEXT_PUBLIC_ADMIN_WHATSAPP || "6282371986344";

    const { data: botState } = await supabase
      .from("whatsapp_bot_state")
      .select("*")
      .eq("id", "active_session")
      .maybeSingle();

    // Heartbeat check: Bot Baileys mengirim heartbeat setiap 15 detik saat aktif.
    // Jika heartbeat terakhir sudah lebih dari 45 detik, berarti proses bot offline.
    const lastHeartbeatTime = botState?.last_heartbeat ? new Date(botState.last_heartbeat).getTime() : 0;
    const isAlive = (Date.now() - lastHeartbeatTime) < 45000;

    const status = isAlive ? (botState?.status || "disconnected") : "disconnected";
    const qrCode = isAlive ? (botState?.qr_code || null) : null;
    const connectedPhone = isAlive ? (botState?.connected_phone || null) : null;

    // Sinkronkan database jika proses bot offline tapi status database masih tertinggal
    if (!isAlive && (botState?.status === "connected" || botState?.status === "qr_ready")) {
      await supabase
        .from("whatsapp_bot_state")
        .update({
          status: "disconnected",
          qr_code: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", "active_session");
    }

    return NextResponse.json({
      success: true,
      status,
      qrCode,
      connectedPhone: connectedPhone || phoneNumber,
      isAlive,
    });
  } catch (error) {
    console.error("WhatsApp connect route error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal memulai koneksi WhatsApp" },
      { status: 500 }
    );
  }
}
