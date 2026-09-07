import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, "../.env");

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const idx = trimmed.indexOf("=");
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim();
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function stopBot() {
  console.log("\n🛑 [NekoStay] Menghentikan bot WhatsApp di latar belakang...");

  try {
    // 1. Matikan proses node whatsapp-bot.mjs di Windows
    if (process.platform === "win32") {
      try {
        const psCmd = `Get-CimInstance Win32_Process -Filter "name = 'node.exe'" | Where-Object { $_.CommandLine -like "*whatsapp-bot.mjs*" } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }`;
        execSync(`powershell -NoProfile -Command "${psCmd}"`, { stdio: "ignore" });
      } catch (err) {
        // Ignore if no process found
      }
    }

    // 2. Perbarui state di Supabase ke disconnected
    await supabase.from("whatsapp_bot_state").upsert({
      id: "active_session",
      status: "disconnected",
      qr_code: null,
      updated_at: new Date().toISOString(),
      last_heartbeat: new Date().toISOString(),
    });

    console.log("✅ Bot WhatsApp berhasil dihentikan dan status disetel ke disconnected.");
  } catch (error) {
    console.error("Gagal menghentikan bot:", error.message);
  }
}

stopBot();

