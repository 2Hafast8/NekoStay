import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { processIncomingWhatsAppMessage } from "@/lib/whatsapp/bot-service";

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
        { error: "Hanya Administrator yang dapat menggunakan fitur simulasi chat" },
        { status: 403 }
      );
    }

    const body = await request.json();
    let {
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

    if (!senderName || senderName === "NekoStay Bot") {
      senderName = "Pelanggan NekoStay";
    }

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
    console.error("[WhatsApp Simulate Error]:", error);
    return NextResponse.json(
      { error: "Gagal memproses simulasi pesan WhatsApp" },
      { status: 500 }
    );
  }
}
