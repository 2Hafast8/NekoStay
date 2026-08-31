import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { processIncomingWhatsAppMessage } from "@/lib/whatsapp/bot-service";

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
        { error: "Hanya Administrator yang dapat menggunakan fitur simulasi chat" },
        { status: 403 }
      );
    }

    // 2. Parse payload
    const body = await request.json();
    const {
      phoneNumber = "6281234567890",
      senderName = "Pelanggan NekoStay",
      messageText,
    } = body;

    if (!messageText || !messageText.trim()) {
      return NextResponse.json(
        { error: "Pesan tidak boleh kosong" },
        { status: 400 }
      );
    }

    // 3. Proses via core bot engine
    const reply = await processIncomingWhatsAppMessage({
      phoneNumber,
      senderName,
      messageText: messageText.trim(),
    });

    return NextResponse.json({
      success: true,
      sender: {
        phoneNumber,
        senderName,
        message: messageText.trim(),
      },
      botReply: reply,
    });
  } catch (error) {
    console.error("WhatsApp Simulate Error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal memproses simulasi WhatsApp" },
      { status: 500 }
    );
  }
}
