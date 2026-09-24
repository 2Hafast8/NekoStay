import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { resolveRemoteJid } from "@/lib/modules/whatsapp";

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
      .select("full_name, role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json(
        { error: "Hanya Administrator yang dapat mengirim pesan langsung ke WhatsApp pelanggan." },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { phoneNumber, messageText, customerName } = body;

    if (!messageText || !messageText.trim()) {
      return NextResponse.json(
        { error: "Pesan tidak boleh kosong." },
        { status: 400 }
      );
    }

    if (!phoneNumber) {
      return NextResponse.json(
        { error: "Nomor WhatsApp tujuan diperlukan." },
        { status: 400 }
      );
    }

    let cleanPhone = String(phoneNumber).replace(/[^0-9]/g, "");
    if (cleanPhone.startsWith("0")) {
      cleanPhone = "62" + cleanPhone.slice(1);
    }

    // Heartbeat check bot WhatsApp
    const { data: botState } = await supabase
      .from("whatsapp_bot_state")
      .select("*")
      .eq("id", "active_session")
      .maybeSingle();

    const lastHeartbeatTime = botState?.last_heartbeat
      ? new Date(botState.last_heartbeat).getTime()
      : 0;
    const isAlive = Date.now() - lastHeartbeatTime < 45000;
    const isConnected = isAlive && botState?.status === "connected";

    if (!isConnected) {
      const reason = !isAlive
        ? "Bot WhatsApp sedang offline (tidak ada detak jantung). Silakan jalankan 'Start-WhatsApp-Bot.vbs' atau 'npm run wa:bot' di PC admin."
        : botState?.status === "qr_ready"
        ? "WhatsApp belum dihubungkan (menunggu scan QR Code). Silakan buka menu 'Status & Sambungkan WhatsApp' lalu pindai QR Code di HP Anda."
        : "Bot WhatsApp sedang menghubungkan. Silakan tunggu beberapa saat.";

      return NextResponse.json(
        {
          error: reason,
          status: botState?.status || "disconnected",
        },
        { status: 503 }
      );
    }

    const senderName = profile?.full_name || "Admin NekoStay";
    const remoteJid = body.remoteJid || resolveRemoteJid(cleanPhone);

    const { data: insertedLog, error: insertError } = await supabase
      .from("whatsapp_logs")
      .insert({
        phone_number: cleanPhone,
        customer_phone: cleanPhone,
        customer_name: customerName || `Pelanggan ${cleanPhone.slice(-4)}`,
        sender_name: senderName,
        sender_role: "admin",
        direction: "outgoing",
        message_text: messageText.trim(),
        message_type: "text",
        flow_state: "admin_manual_reply",
        metadata: {
          status: "pending",
          sent_by_user_id: user.id,
          created_via: "web_admin_chat",
          remote_jid: remoteJid,
        },
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error("[WhatsApp Send Route] DB Insert Error:", insertError);
      throw new Error("Gagal menyimpan pesan ke database");
    }

    return NextResponse.json({
      success: true,
      message: "Pesan berhasil dikirim dan sedang diantarkan ke WhatsApp pelanggan.",
      log: insertedLog,
    });
  } catch (error) {
    console.error("[WhatsApp Send Route] Unexpected Error:", error);
    return NextResponse.json(
      { error: "Gagal mengirim pesan WhatsApp." },
      { status: 500 }
    );
  }
}

