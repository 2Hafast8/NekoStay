import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import pino from "pino";
import qrcode from "qrcode";
import { createClient } from "@supabase/supabase-js";
import baileys, {
  makeWASocket as namedMakeWASocket,
  useMultiFileAuthState as initMultiFileAuthState,
  Browsers,
  DisconnectReason,
  fetchLatestBaileysVersion,
} from "@whiskeysockets/baileys";
import {
  processIncomingWhatsAppMessage,
  recordConversationActivity,
  checkAndExpireInactiveAdminChats,
  resolveRemoteJid,
} from "../lib/modules/whatsapp/index.js";

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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const AUTH_FOLDER = path.resolve(__dirname, "../auth_info_baileys");
const ADMIN_PHONE = (process.env.NEXT_PUBLIC_ADMIN_WHATSAPP || "6282371986344").replace(/[^0-9]/g, "");

function cleanAuthFolder() {
  try {
    if (fs.existsSync(AUTH_FOLDER)) {
      fs.rmSync(AUTH_FOLDER, { recursive: true, force: true });
    }
  } catch (e) {
    console.warn("Clean auth folder warning:", e.message);
  }
}

import net from "net";

// Enforce single-instance lock across the operating system
const LOCK_PORT = 48123;
const lockServer = net.createServer();

lockServer.once("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error("\n=======================================================");
    console.error("⚠️  BOT WHATSAPP SUDAH BERJALAN DI BACKGROUND!");
    console.error(`Proses bot lain sudah aktif pada port ${LOCK_PORT}.`);
    console.error("Instance duplikat ini langsung ditutup untuk mencegah konflik loop terputus-tersambung.");
    console.error("=======================================================\n");
    process.exit(0);
  } else {
    console.warn("[Lock Warning]", err.message);
  }
});

lockServer.listen(LOCK_PORT, "127.0.0.1");

let activeSock = null;
let heartbeatTimer = null;
let outboxPollInterval = null;
let outboxChannel = null;
let commandChannel = null;
let currentQrCode = null;
let lastHandledDisconnectReq = null;
let isSocketConnected = false;

// Helper to sync state to Supabase for the web UI on Vercel
async function updateCloudBotState(patch) {
  try {
    await supabase.from("whatsapp_bot_state").upsert({
      id: "active_session",
      ...patch,
      updated_at: new Date().toISOString(),
      last_heartbeat: new Date().toISOString(),
    });
  } catch (err) {
    console.warn("[Cloud Sync Error]", err.message);
  }
}

async function startWhatsAppBot() {
  console.log("\n=======================================================");
  console.log("🐱 NEKOSTAY WHATSAPP AUTO-REPLY BOT (Baileys)");
  console.log(`📱 Nomor Admin Target: +${ADMIN_PHONE}`);
  console.log("☁️  Sinkronisasi Cloud Realtime ke Vercel: AKTIF");
  console.log("=======================================================\n");

  await updateCloudBotState({
    status: "connecting",
    qr_code: null,
    connected_phone: ADMIN_PHONE,
  });

  if (!fs.existsSync(AUTH_FOLDER)) {
    fs.mkdirSync(AUTH_FOLDER, { recursive: true });
  }

  const { state, saveCreds } = await initMultiFileAuthState(AUTH_FOLDER);
  const { version, isLatest } = await fetchLatestBaileysVersion().catch(() => ({
    version: [2, 3000, 1015901307],
    isLatest: false,
  }));

  console.log(`[Bot] Baileys Version: ${version.join(".")} (Latest: ${isLatest})`);
  console.log(`[Bot] Auth Session Folder: ${AUTH_FOLDER}\n`);

  if (activeSock) {
    try {
      activeSock.end(undefined);
      activeSock.ev?.removeAllListeners?.();
    } catch (e) {}
    activeSock = null;
  }

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

  activeSock = sock;
  sock.ev.on("creds.update", saveCreds);

  // Heartbeat interval to keep state and heartbeat alive in cloud
  if (heartbeatTimer) clearInterval(heartbeatTimer);
  heartbeatTimer = setInterval(async () => {
    try {
      const isConnected = isSocketConnected && Boolean(sock?.user || sock?.authState?.creds?.me);
      const currentStatus = isConnected
        ? "connected"
        : currentQrCode
        ? "qr_ready"
        : "connecting";

      const connectedNumber = isConnected
        ? (sock?.user?.id?.replace(/:.*/, "").replace(/@.*/, "") ||
           sock?.authState?.creds?.me?.id?.replace(/:.*/, "").replace(/@.*/, "") ||
           ADMIN_PHONE)
        : ADMIN_PHONE;

      await updateCloudBotState({
        status: currentStatus,
        connected_phone: connectedNumber,
        ...(currentStatus === "qr_ready" && currentQrCode ? { qr_code: currentQrCode } : {}),
      });

      // Cek sesi chat admin yang melewati batas inaktivitas 1 jam
      await checkAndExpireInactiveAdminChats(async ({ phoneNumber, session }) => {
        console.log(`⏱️ [Auto Reactivate] Sesi chat admin untuk ${phoneNumber} telah idle 1 jam. Bot diaktifkan kembali.`);
        const remoteJid = session.remoteJid || resolveRemoteJid(phoneNumber);
        const closeNotice = `⏰ *Sesi Chat Admin Selesai*\n\n` +
          `Halo, Kak *${session.customerName || "Pelanggan"}*! Karena tidak ada aktivitas percakapan selama 1 jam terakhir, sesi obrolan langsung dengan Admin telah selesai dan bot NekoStay Care otomatis aktif kembali. 🐾\n\n` +
          `Ketik *MENU* kapan saja jika Anda membutuhkan bantuan lainnya. Terima kasih! ✨`;

        try {
          if (sock && isSocketConnected) {
            await sock.sendMessage(remoteJid, { text: closeNotice });
            console.log(`📤 [Notifikasi Timeout 1 Jam Terkirim] Ke ${remoteJid}`);
          }
          await supabase.from("whatsapp_logs").insert({
            phone_number: phoneNumber,
            customer_phone: phoneNumber,
            customer_name: session.customerName || "Pelanggan",
            sender_name: "NekoStay Bot",
            sender_role: "bot",
            direction: "outgoing",
            message_text: closeNotice,
            message_type: "text",
            flow_state: "idle",
            metadata: { reason: "1_hour_inactivity_auto_reactivation", remote_jid: remoteJid },
            created_at: new Date().toISOString(),
          });
        } catch (err) {
          console.warn(`[Auto Reactivate Send Error]:`, err.message);
        }
      });
    } catch (hbErr) {
      console.warn("[Heartbeat Warning]", hbErr.message);
    }
  }, 15000);

  const dispatchedMessageIds = new Set();

  async function dispatchOutboundAdminMessage(logRecord) {
    if (!logRecord || !logRecord.id) return;
    if (dispatchedMessageIds.has(logRecord.id)) return;

    if (!sock || !isSocketConnected) {
      console.log(`⏳ [Bot] Menunda pengiriman pesan admin #${logRecord.id} karena bot belum terhubung.`);
      return;
    }

    dispatchedMessageIds.add(logRecord.id);

    try {
      const targetPhone = String(logRecord.customer_phone || logRecord.phone_number || "").trim();
      if (!targetPhone) {
        dispatchedMessageIds.delete(logRecord.id);
        return;
      }

      recordConversationActivity(targetPhone);

      const remoteJid = resolveRemoteJid(targetPhone, logRecord.metadata);

      console.log(`\n💬 [Mengirim Pesan Balasan Admin Web] Ke: ${remoteJid}`);
      console.log(`   Pesan: "${logRecord.message_text}"`);

      if (!remoteJid.endsWith("@lid")) {
        try {
          await sock.sendPresenceUpdate("composing", remoteJid);
        } catch (e) {}
      }
      await new Promise((res) => setTimeout(res, 500));

      await sock.sendMessage(remoteJid, { text: logRecord.message_text });

      if (!remoteJid.endsWith("@lid")) {
        try {
          await sock.sendPresenceUpdate("paused", remoteJid);
        } catch (e) {}
      }
      console.log(`✅ [Sukses] Pesan Admin Terkirim ke WhatsApp ${remoteJid}`);

      await supabase
        .from("whatsapp_logs")
        .update({
          metadata: {
            ...(logRecord.metadata || {}),
            status: "delivered",
            delivered_at: new Date().toISOString(),
            remote_jid: remoteJid,
          },
        })
        .eq("id", logRecord.id);
    } catch (err) {
      console.error(`❌ [Gagal Kirim Pesan Admin]:`, err.message);
      await supabase
        .from("whatsapp_logs")
        .update({
          metadata: {
            ...(logRecord.metadata || {}),
            status: "failed",
            delivery_error: err.message,
          },
        })
        .eq("id", logRecord.id);
    } finally {
      setTimeout(() => dispatchedMessageIds.delete(logRecord.id), 20000);
    }
  }

  async function checkPendingAdminMessages() {
    if (!sock || !isSocketConnected) return;
    try {
      const { data: pending, error } = await supabase
        .from("whatsapp_logs")
        .select("*")
        .eq("direction", "outgoing")
        .eq("sender_role", "admin")
        .contains("metadata", { status: "pending" })
        .order("created_at", { ascending: true })
        .limit(5);

      if (error || !pending || pending.length === 0) return;

      for (const msg of pending) {
        await dispatchOutboundAdminMessage(msg);
      }
    } catch (err) {
      // ignore
    }
  }

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log("\n📲 [SCAN QR CODE] Silakan scan QR berikut dengan WhatsApp Anda (+62 823 7198 6344):");
      try {
        const qrTerminal = await qrcode.toString(qr, { type: "terminal", small: true });
        console.log(qrTerminal);

        // Generate Data URL for Vercel Web UI
        const qrDataUrl = await qrcode.toDataURL(qr, {
          width: 360,
          margin: 2,
          color: { dark: "#0f172a", light: "#ffffff" },
        });

        // Sync QR code to Supabase so deployed website on Vercel displays it instantly!
        currentQrCode = qrDataUrl;
        await updateCloudBotState({
          status: "qr_ready",
          qr_code: qrDataUrl,
          connected_phone: ADMIN_PHONE,
        });
      } catch (err) {
        console.log("Raw QR String:", qr);
      }
      console.log("👉 Buka WhatsApp di HP Anda > Perangkat Tertaut > Tautkan Perangkat\n");
      console.log("🌐 Atau buka website NekoStay di browser untuk scan langsung di layar website!\n");
    }

    if (connection === "close") {
      isSocketConnected = false;
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const isLoggedOut = statusCode === DisconnectReason.loggedOut || statusCode === 401;
      const isReplaced = statusCode === DisconnectReason.connectionReplaced || statusCode === 440;

      console.log(
        `⚠️ [Bot] Koneksi terputus (Status Code: ${statusCode}). Sesi Logout: ${isLoggedOut}. Digantikan Sesi Lain: ${isReplaced}`
      );

      currentQrCode = null;
      await updateCloudBotState({
        status: "disconnected",
        qr_code: null,
      });

      if (heartbeatTimer) clearInterval(heartbeatTimer);
      if (outboxPollInterval) clearInterval(outboxPollInterval);
      if (outboxChannel) supabase.removeChannel(outboxChannel);
      if (commandChannel) supabase.removeChannel(commandChannel);

      if (isReplaced) {
        console.warn("\n=======================================================");
        console.warn("⚠️  [Bot] Sesi WhatsApp dibuka di tempat/perangkat lain (Connection Replaced / 440).");
        console.warn("Bot dihentikan untuk menghindari konflik perebutan koneksi ganda.");
        console.warn("Jalankan kembali bot saat Anda ingin menggunakan nomor ini di sistem.");
        console.warn("=======================================================\n");
        process.exit(0);
      } else if (isLoggedOut) {
        console.log("🔄 [Bot] Sesi lama kadaluarsa / logout (401). Membersihkan auth folder dan membuat QR Code baru...");
        cleanAuthFolder();
        setTimeout(() => {
          startWhatsAppBot();
        }, 2000);
      } else {
        console.log("🔄 [Bot] Koneksi terputus sementara. Mencoba menghubungkan kembali dalam 5 detik...");
        setTimeout(() => {
          startWhatsAppBot();
        }, 5000);
      }
    } else if (connection === "open") {
      isSocketConnected = true;
      currentQrCode = null;
      const connectedNumber =
        sock.user?.id?.replace(/:.*/, "").replace(/@.*/, "") || ADMIN_PHONE;

      console.log("✅ [Bot] WhatsApp NekoStay Care BERHASIL TERHUBUNG & SIAP!");
      console.log(`🤖 Nomor Aktif: +${connectedNumber}`);
      console.log("🤖 Menunggu pesan masuk dari pelanggan...\n");

      await updateCloudBotState({
        status: "connected",
        qr_code: null,
        connected_phone: connectedNumber,
      });

      // Start Outbound Admin Message Dispatcher
      checkPendingAdminMessages();
      if (outboxPollInterval) clearInterval(outboxPollInterval);
      outboxPollInterval = setInterval(checkPendingAdminMessages, 3500);

      if (outboxChannel) supabase.removeChannel(outboxChannel);
      outboxChannel = supabase
        .channel(`whatsapp-bot-outbox-${Date.now()}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "whatsapp_logs",
          },
          async (payload) => {
            const row = payload.new;
            if (
              row &&
              row.direction === "outgoing" &&
              row.sender_role === "admin" &&
              row.metadata?.status === "pending"
            ) {
              await dispatchOutboundAdminMessage(row);
            }
          }
        )
        .subscribe();

      // Listen for disconnect instructions from Web Admin
      if (commandChannel) supabase.removeChannel(commandChannel);
      commandChannel = supabase
        .channel(`whatsapp-bot-cmd-${Date.now()}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "whatsapp_bot_state",
          },
          async (payload) => {
            const row = payload.new;
            if (row && row.id === "active_session") {
              if (
                row.disconnect_requested_at &&
                row.disconnect_requested_at !== lastHandledDisconnectReq
              ) {
                lastHandledDisconnectReq = row.disconnect_requested_at;
                console.log("\n🛑 [Bot] Menerima instruksi putuskan koneksi dari Web Admin.");
                if (heartbeatTimer) clearInterval(heartbeatTimer);
                if (outboxPollInterval) clearInterval(outboxPollInterval);
                if (activeSock) {
                  try {
                    await activeSock.logout().catch(() => {});
                    activeSock.end(undefined);
                  } catch (e) {}
                }
                process.exit(0);
              }
            }
          }
        )
        .subscribe();
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
      const senderPhone = remoteJid.replace("@s.whatsapp.net", "").replace("@lid", "");
      const senderName = msg.pushName || senderPhone;

      const messageText =
        msg.message?.conversation ||
        msg.message?.extendedTextMessage?.text ||
        msg.message?.imageMessage?.caption ||
        msg.message?.buttonsResponseMessage?.selectedButtonId ||
        msg.message?.listResponseMessage?.singleSelectReply?.selectedRowId ||
        "";

      if (!messageText.trim()) continue;

      console.log(`\n📩 [Pesan Masuk] Dari: ${senderName} (${senderPhone}) [${remoteJid}]`);
      console.log(`   Isi: "${messageText.trim()}"`);

      try {
        const replyText = await processIncomingWhatsAppMessage({
          phoneNumber: senderPhone,
          senderName,
          messageText: messageText.trim(),
          remoteJid,
        });

        if (replyText) {
          if (!remoteJid.endsWith("@lid")) {
            try {
              await sock.sendPresenceUpdate("composing", remoteJid);
            } catch (e) {}
          }
          await new Promise((res) => setTimeout(res, 800));
          await sock.sendMessage(remoteJid, { text: replyText });
          console.log(`📤 [Balasan Terkirim] Ke ${remoteJid}`);
        } else {
          console.log(`💬 [Mode Chat Admin Langsung] Pesan dari ${senderName} (${senderPhone}) dicatat untuk admin web (tanpa auto-reply bot).`);
        }
      } catch (procErr) {
        console.error(`❌ [Bot Error] Gagal memproses pesan dari ${senderPhone}:`, procErr);
      } finally {
        if (!remoteJid.endsWith("@lid")) {
          try {
            await sock.sendPresenceUpdate("paused", remoteJid);
          } catch (e) {}
        }
      }
    }
  });
}

// Graceful shutdown handling
const handleShutdown = async () => {
  console.log("\n[Bot] Mematikan bot WhatsApp & memperbarui status cloud ke disconnected...");
  try {
    await updateCloudBotState({
      status: "disconnected",
      qr_code: null,
    });
  } catch (err) {
    console.warn("[Shutdown error]", err.message);
  }
  process.exit(0);
};

process.on("SIGINT", handleShutdown);
process.on("SIGTERM", handleShutdown);

// Start the bot
startWhatsAppBot().catch((err) => {
  console.error("Fatal error starting WhatsApp Bot:", err);
});
