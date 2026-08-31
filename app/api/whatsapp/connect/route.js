import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { waManager } from "@/lib/whatsapp/baileys-manager";

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

    // 2. Parse body
    const body = await request.json().catch(() => ({}));
    const {
      method = "qr",
      phoneNumber = process.env.NEXT_PUBLIC_ADMIN_WHATSAPP || "6282371986344",
    } = body;

    // 3. Sambungkan WhatsApp via Baileys Manager
    const statusData = await waManager.connect({
      method,
      phoneNumber,
    });

    return NextResponse.json({
      success: true,
      ...statusData,
    });
  } catch (error) {
    console.error("WhatsApp connect route error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal memulai koneksi WhatsApp" },
      { status: 500 }
    );
  }
}
