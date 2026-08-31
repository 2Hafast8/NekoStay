import path from "path";
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
import { processIncomingWhatsAppMessage } from "./bot-service.js";

const makeWASocket = namedMakeWASocket || baileys?.makeWASocket || baileys?.default || baileys;
const AUTH_FOLDER = path.resolve(process.cwd(), "auth_info_baileys");

class WhatsAppManager {
  constructor() {
    this.sock = null;
    this.status = "disconnected"; // 'disconnected' | 'connecting' | 'qr_ready' | 'connected'
    this.qrCodeDataUrl = null;
    this.connectedPhone = null;
    this.lastError = null;
    this.isInitializing = false;
  }

  getStatus() {
    return {
      status: this.status,
      qrCode: this.qrCodeDataUrl,
      connectedPhone: this.connectedPhone,
      lastError: this.lastError,
      registered: !!this.sock?.authState?.creds?.registered,
    };
  }

  async connect() {
    if (this.status === "connected" && this.sock?.authState?.creds?.registered) {
      return this.getStatus();
    }

    if (this.isInitializing) {
      return this.getStatus();
    }

    this.isInitializing = true;
    this.status = "connecting";
    this.lastError = null;
    this.qrCodeDataUrl = null;

    try {
      if (!fs.existsSync(AUTH_FOLDER)) {
        fs.mkdirSync(AUTH_FOLDER, { recursive: true });
      }

      const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER);
      const { version } = await fetchLatestBaileysVersion().catch(() => ({
        version: [2, 3000, 1015901307],
      }));

      const logger = pino({ level: "silent" });

      this.sock = makeWASocket({
        version,
        auth: state,
        logger,
        printQRInTerminal: false,
        browser: Browsers.ubuntu("Chrome"),
        defaultQueryTimeoutMs: 60000,
        connectTimeoutMs: 60000,
        syncFullHistory: false,
      });

      this.sock.ev.on("creds.update", saveCreds);

      this.sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          try {
            this.qrCodeDataUrl = await qrcode.toDataURL(qr, {
              width: 360,
              margin: 2,
              color: { dark: "#0f172a", light: "#ffffff" },
            });
            this.status = "qr_ready";
          } catch (qrErr) {
            console.warn("[WhatsApp Web] QR generation error:", qrErr);
          }
        }

        if (connection === "open") {
          this.status = "connected";
          this.qrCodeDataUrl = null;
          this.connectedPhone =
            this.sock.user?.id?.replace(/:.*/, "").replace(/@.*/, "") ||
            process.env.NEXT_PUBLIC_ADMIN_WHATSAPP ||
            "6282371986344";
          console.log(`✅ [WhatsApp Web] Terhubung sebagai +${this.connectedPhone}`);
        } else if (connection === "close") {
          const statusCode = lastDisconnect?.error?.output?.statusCode;
          const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
          this.status = "disconnected";
          this.connectedPhone = null;

          if (shouldReconnect) {
            console.log(`[WhatsApp Web] Koneksi terputus (${statusCode}), mencoba reconnect...`);
          } else {
            console.log("[WhatsApp Web] Logged out. Session cleared.");
            this.clearSession();
          }
        }
      });

      // Handle incoming messages
      this.sock.ev.on("messages.upsert", async ({ messages, type }) => {
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

          try {
            await this.sock.sendPresenceUpdate("composing", remoteJid);
            const replyText = await processIncomingWhatsAppMessage({
              phoneNumber: senderPhone,
              senderName,
              messageText: messageText.trim(),
            });

            if (replyText) {
              await new Promise((res) => setTimeout(res, 800));
              await this.sock.sendMessage(remoteJid, { text: replyText }, { quoted: msg });
            }
          } catch (procErr) {
            console.error("[WhatsApp Web] Error processing message:", procErr);
          } finally {
            await this.sock.sendPresenceUpdate("paused", remoteJid);
          }
        }
      });
    } catch (err) {
      this.status = "disconnected";
      this.lastError = err.message;
      console.error("[WhatsApp Web] Connect error:", err);
    } finally {
      this.isInitializing = false;
    }

    return this.getStatus();
  }

  async disconnect() {
    try {
      if (this.sock) {
        await this.sock.logout().catch(() => {});
        this.sock.end(undefined);
        this.sock = null;
      }
    } catch (err) {
      console.warn("[WhatsApp Web] Logout error:", err);
    } finally {
      this.clearSession();
      this.status = "disconnected";
      this.qrCodeDataUrl = null;
      this.connectedPhone = null;
    }
    return { success: true };
  }

  clearSession() {
    try {
      if (fs.existsSync(AUTH_FOLDER)) {
        fs.rmSync(AUTH_FOLDER, { recursive: true, force: true });
        fs.mkdirSync(AUTH_FOLDER, { recursive: true });
      }
    } catch (err) {
      console.warn("[WhatsApp Web] Clear session error:", err);
    }
  }
}

// Singleton instance on globalThis
if (!globalThis._baileysWhatsAppManager) {
  globalThis._baileysWhatsAppManager = new WhatsAppManager();
}

export const waManager = globalThis._baileysWhatsAppManager;
