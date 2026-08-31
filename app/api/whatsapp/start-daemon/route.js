import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";

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
        { error: "Hanya Administrator yang dapat mengaktifkan bot WhatsApp" },
        { status: 403 }
      );
    }

    // 2. Jalankan script bot WhatsApp di background secara detached
    const scriptPath = path.resolve(process.cwd(), "scripts/whatsapp-bot.mjs");

    if (fs.existsSync(scriptPath)) {
      const child = spawn(process.execPath, [scriptPath], {
        detached: true,
        stdio: "ignore",
        cwd: process.cwd(),
      });
      child.unref();

      // Update state di Supabase
      await supabase.from("whatsapp_bot_state").upsert({
        id: "active_session",
        status: "connecting",
        updated_at: new Date().toISOString(),
      });

      return NextResponse.json({
        success: true,
        message: "Bot WhatsApp berhasil diaktifkan di latar belakang!",
      });
    } else {
      return NextResponse.json(
        { error: "Script bot tidak ditemukan" },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error("Start daemon error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal mengaktifkan bot di latar belakang" },
      { status: 500 }
    );
  }
}
