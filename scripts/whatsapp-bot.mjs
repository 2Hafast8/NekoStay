import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import pino from "pino";
import qrcode from "qrcode";
import baileys, {
  makeWASocket as namedMakeWASocket,
  useMultiFileAuthState,
  Browsers,
  DisconnectReason,
  fetchLatestBaileysVersion,
} from "lily-baileys";
import { processIncomingWhatsAppMessage } from "../lib/whatsapp/bot-service.js";

const makeWASocket = namedMakeWASocket || baileys?.makeWASocket || baileys?.default || baileys;

// Load .env file automatically
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

const AUTH_FOLDER = path.resolve(__dirname, "../auth_info_baileys");
const ADMIN_PHONE = (process.env.NEXT_PUBLIC_ADMIN_WHATSAPP || "6282371986344").replace(/[^0-9]/g, "");

async function startWhatsAppBot() {
  console.log("\n=======================================================");
  console.log("🐱 NEKOSTAY WHATSAPP AUTO-REPLY BOT (lily-baileys)");
  console.log(`📱 Nomor Admin Target: +${ADMIN_PHONE}`);
  console.log("=======================================================\n");

  const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER);
  const { version, isLatest } = await fetchLatestBaileysVersion().catch(() => ({
    version: [2, 3000, 1015901307],
    isLatest: false,
  }));

  console.log(`[Bot] Baileys Version: ${version.join(".")} (Latest: ${isLatest})`);
  console.log(`[Bot] Auth Session Folder: ${AUTH_FOLDER}\n`);

  const logger = pino({ level: "silent" });

  const sock = makeWASocket({
    version,
    auth: state,
    logger,
    printQRInTerminal: false,
    defaultQueryTimeoutMs: 60000,
    connectTimeoutMs: 60000,
    browser: Browsers.ubuntu("Chrome"),
    syncFullHistory: false,
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log("\n📲 [SCAN QR CODE] Silakan scan QR berikut dengan WhatsApp Anda (+62 823 7198 6344):");
      try {
        const qrString = await qrcode.toString(qr, { type: "terminal", small: true });
        console.log(qrString);
      } catch (err) {
        console.log("Raw QR String:", qr);
      }
      console.log("👉 Buka WhatsApp di HP Anda > Perangkat Tertaut > Tautkan Perangkat\n");
    }

    if (connection === "close") {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      console.log(
        `⚠️ [Bot] Koneksi terputus (Status Code: ${statusCode}). Mencoba reconnect: ${shouldReconnect}`
      );

      if (shouldReconnect) {
        setTimeout(() => {
          startWhatsAppBot();
        }, 5000);
      } else {
        console.log("❌ [Bot] Sesi telah logout. Silakan hubungkan kembali.");
      }
    } else if (connection === "open") {
      console.log("✅ [Bot] WhatsApp NekoStay Care BERHASIL TERHUBUNG & SIAP!");
      console.log(`🤖 Nomor Aktif: +${ADMIN_PHONE}`);
      console.log("🤖 Menunggu pesan masuk dari pelanggan...\n");
    }
  });

  // Handle incoming messages
  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;

    for (const msg of messages) {
      if (
        !msg.message ||
        msg.key.remoteJid === "status@broadcast" ||
        msg.key.fromMe ||
        msg.key.remoteJid?.endsWith("@g.us")
      ) {
        continue;
      }

      const remoteJid = msg.key.remoteJid;
      const senderPhone = remoteJid.replace("@s.whatsapp.net", "");
      const senderName = msg.pushName || senderPhone;

      const messageText =
        msg.message?.conversation ||
        msg.message?.extendedTextMessage?.text ||
        msg.message?.imageMessage?.caption ||
        msg.message?.buttonsResponseMessage?.selectedButtonId ||
        msg.message?.listResponseMessage?.singleSelectReply?.selectedRowId ||
        "";

      if (!messageText.trim()) continue;

      console.log(`\n📩 [Pesan Masuk] Dari: ${senderName} (${senderPhone})`);
      console.log(`   Isi: "${messageText.trim()}"`);

      try {
        await sock.sendPresenceUpdate("composing", remoteJid);
        const replyText = await processIncomingWhatsAppMessage({
          phoneNumber: senderPhone,
          senderName,
          messageText: messageText.trim(),
        });

        if (replyText) {
          await new Promise((res) => setTimeout(res, 800));
          await sock.sendMessage(remoteJid, { text: replyText }, { quoted: msg });
          console.log(`📤 [Balasan Terkirim] Ke ${senderPhone}`);
        }
      } catch (procErr) {
        console.error(`❌ [Bot Error] Gagal memproses pesan dari ${senderPhone}:`, procErr);
      } finally {
        await sock.sendPresenceUpdate("paused", remoteJid);
      }
    }
  });
}

// Start the bot
startWhatsAppBot().catch((err) => {
  console.error("Fatal error starting WhatsApp Bot:", err);
});
