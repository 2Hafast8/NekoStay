import { createClient } from "@supabase/supabase-js";
import { resolveRemoteJid } from "./jid.js";

// Initialize Supabase admin client for WhatsApp Bot service
function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "Supabase URL or Key is missing in environment variables for WhatsApp bot."
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

// In-memory conversation state cache
// Map: phoneNumber -> { state, data, customerName, lastActive, lastActivityAt, remoteJid }
const conversationStates = new Map();

// Batas waktu inaktivitas obrolan admin sebelum bot otomatis hidup kembali (Default: 1 Jam = 3.600.000 ms)
export const ADMIN_CHAT_INACTIVITY_TIMEOUT_MS =
  Number(process.env.WA_BOT_ADMIN_INACTIVITY_TIMEOUT_MS) || 60 * 60 * 1000;

/**
 * Catat aktivitas obrolan (dari pesan masuk pelanggan ataupun balasan manual admin)
 * untuk me-refresh jendela batas waktu 1 jam inaktivitas.
 */
export function recordConversationActivity(phoneNumber) {
  const cleanPhone = String(phoneNumber || "").replace(/[^0-9]/g, "");
  const session = conversationStates.get(cleanPhone);
  if (session) {
    session.lastActivityAt = Date.now();
    session.lastActive = Date.now();
  }
}

/**
 * Akses sesi percakapan di memori (berguna untuk pemeriksaan & pengujian)
 */
export function getConversationSession(phoneNumber) {
  const cleanPhone = String(phoneNumber || "").replace(/[^0-9]/g, "");
  return conversationStates.get(cleanPhone) || null;
}

/**
 * Atur data sesi percakapan di memori (berguna untuk pengujian & sinkronisasi)
 */
export function setConversationSession(phoneNumber, sessionData) {
  const cleanPhone = String(phoneNumber || "").replace(/[^0-9]/g, "");
  const existing = conversationStates.get(cleanPhone) || {};
  const updated = { ...existing, ...sessionData };
  conversationStates.set(cleanPhone, updated);
  return updated;
}

/**
 * Sapu berkala seluruh sesi obrolan admin yang telah melewati 1 jam tanpa aktivitas chat.
 * Jika ditemukan, bot akan otomatis dihidupkan kembali ke status IDLE.
 */
export async function checkAndExpireInactiveAdminChats(onExpire = null) {
  const now = Date.now();
  const expiredSessions = [];

  for (const [phone, session] of conversationStates.entries()) {
    if (session.state === BOT_FLOW_STATES.CHAT_WITH_ADMIN) {
      const lastTime = session.lastActivityAt || session.lastActive || 0;
      if (now - lastTime >= ADMIN_CHAT_INACTIVITY_TIMEOUT_MS) {
        session.state = BOT_FLOW_STATES.IDLE;
        session.data = {};
        session.lastActivityAt = now;
        expiredSessions.push({ phoneNumber: phone, session });
        if (typeof onExpire === "function") {
          try {
            await onExpire({ phoneNumber: phone, session });
          } catch (err) {
            console.warn(`[onExpire Callback Error for ${phone}]:`, err.message);
          }
        }
      }
    }
  }

  return expiredSessions;
}

export const BOT_FLOW_STATES = {
  IDLE: "idle",
  AWAITING_MAIN_CHOICE: "main_menu",
  AWAITING_SCHEDULE_TYPE: "schedule_menu",
  AWAITING_CLASS_TYPE: "class_menu",
  AWAITING_SCHEDULE_SUBMISSION: "awaiting_schedule_fill",
  AWAITING_CLASS_SUBMISSION: "awaiting_class_fill",
  CHAT_WITH_ADMIN: "chat_with_admin",
  COMPLETED: "completed",
};

/**
 * Fetch available room classes dynamically from database
 */
export async function getRoomClassesFromDB() {
  try {
    const supabase = getSupabaseClient();
    const { data: classes, error } = await supabase
      .from("classes")
      .select("id, name, price_per_day, description")
      .order("price_per_day", { ascending: true });

    if (error) throw error;
    if (classes && classes.length > 0) {
      return classes;
    }
  } catch (err) {
    console.warn(
      "[WhatsApp Bot] Failed to fetch classes from DB, using fallback:",
      err.message
    );
  }

  // Fallback defaults if DB is empty or unreachable
  return [
    { id: "1", name: "Standard Room", price_per_day: 65000 },
    { id: "2", name: "Deluxe Room", price_per_day: 95000 },
    { id: "3", name: "VIP Suite", price_per_day: 150000 },
  ];
}

/**
 * Log message into public.whatsapp_logs table with clean structured customer vs sender separation
 */
export async function logWhatsAppMessage({
  phoneNumber,
  customerPhone,
  customerName,
  senderName,
  senderRole, // 'customer' | 'bot' | 'admin'
  direction, // 'incoming' | 'outgoing'
  messageText,
  messageType = "text",
  flowState = "idle",
  bookingId = null,
  metadata = {},
}) {
  try {
    const supabase = getSupabaseClient();
    const finalPhone = String(customerPhone || phoneNumber || "").replace(/[^0-9]/g, "");
    const finalSenderRole = senderRole || (direction === "outgoing" ? "bot" : "customer");
    const finalCustomerName = customerName || (senderName && senderName !== "NekoStay Bot" ? senderName : "Pelanggan");
    const finalSenderName = senderName || (finalSenderRole === "bot" ? "NekoStay Bot" : finalCustomerName);

    const mergedMetadata = { ...(metadata || {}) };
    if (!mergedMetadata.remote_jid && finalPhone) {
      mergedMetadata.remote_jid = resolveRemoteJid(finalPhone, mergedMetadata);
    }

    const { error } = await supabase.from("whatsapp_logs").insert({
      phone_number: finalPhone,
      customer_phone: finalPhone,
      customer_name: finalCustomerName,
      sender_name: finalSenderName,
      sender_role: finalSenderRole,
      direction,
      message_text: messageText,
      message_type: messageType,
      flow_state: flowState,
      booking_id: bookingId,
      metadata: mergedMetadata,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.warn("[WhatsApp Log Error]:", error.message);
    }
  } catch (err) {
    console.warn("[WhatsApp Log Exception]:", err.message);
  }
}

/**
 * Notify all admins about a completed change request
 */
async function notifyAdmins({ title, message, bookingId = null }) {
  try {
    const supabase = getSupabaseClient();
    const { data: admins, error } = await supabase
      .from("profiles")
      .select("id")
      .eq("role", "admin");

    if (error || !admins || admins.length === 0) return;

    const notifs = admins.map((adm) => ({
      user_id: adm.id,
      title,
      message,
      type: "warning",
      booking_id: bookingId,
      is_read: false,
    }));

    await supabase.from("notifications").insert(notifs);
  } catch (err) {
    console.warn("[WhatsApp Bot] Failed to insert admin notification:", err.message);
  }
}

/**
 * Extract Booking ID UUID from text if present
 */
function extractBookingId(text) {
  const uuidRegex = /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/;
  const match = text.match(uuidRegex);
  return match ? match[0] : null;
}

/**
 * Extract field value from formatted lines (e.g. • ID Booking: 12345)
 */
function extractFieldValue(text, fieldName) {
  const regex = new RegExp(`(?:•|\\*|-)?\\s*${fieldName}\\s*:\\s*([^\\n]+)`, "i");
  const match = text.match(regex);
  return match ? match[1].trim() : null;
}

/**
 * Periksa apakah teks pesan yang dikirim pelanggan merupakan hasil copy-paste
 * dari seluruh teks pesan / menu bot NekoStay.
 */
export function isBotMessageEcho(text) {
  if (!text || typeof text !== "string") return false;
  const lower = text.toLowerCase();

  // 1. Tanda khas header, branding, atau instruksi baku dari bot NekoStay
  const botSignatures = [
    "selamat datang di layanan whatsapp nekostay",
    "layanan whatsapp nekostay care",
    "ada yang bisa kami bantu terkait pesanan penitipan kucing anda?",
    "layanan perubahan jadwal penitipan",
    "layanan perubahan kelas kamar nekostay",
    "layanan terhubung langsung ke admin nekostay",
    "berikut adalah daftar kelas kamar yang saat ini tersedia di nekostay",
    "silakan balas dengan angka pilihan di bawah",
    "silakan balas dengan angka pilihan kelas di atas",
    "ketik angka *1*, *2*, atau *3* untuk memilih layanan",
    "ketik angka 1, 2, atau 3 untuk memilih layanan",
    "ketik angka *1*, *2*, atau *3*",
    "ketik angka *1* atau *2* untuk memilih",
    "ketik angka 1 atau 2 untuk memilih",
    "silakan *salin / copy* teks template di bawah ini",
    "silakan salin / copy teks template di bawah ini",
    "balasan otomatis bot telah dijeda selama sesi aktif",
    "sesi chat admin selesai",
    "pilihan tidak dikenali",
    "pengajuan ubah jadwal anda telah diterima",
    "pengajuan ubah kelas kamar telah diterima",
  ];

  for (const sig of botSignatures) {
    if (lower.includes(sig)) {
      return true;
    }
  }

  // 2. Tanda menu majemuk (memuat opsi ganda sekaligus yang merupakan ciri daftar menu)
  const countMainMenuOptions =
    (lower.includes("ubah jadwal") ? 1 : 0) +
    (lower.includes("ubah kelas kamar") || lower.includes("ubah kelas") ? 1 : 0) +
    (lower.includes("chat dengan admin") ? 1 : 0);
  if (countMainMenuOptions >= 2) {
    return true;
  }

  const countScheduleOptions =
    (lower.includes("memajukan jadwal") ? 1 : 0) +
    (lower.includes("memundurkan jadwal") ? 1 : 0);
  if (countScheduleOptions >= 2) {
    return true;
  }

  return false;
}

/**
 * Periksa apakah pesan template masih memuat placeholder bawaan template bot yang belum diganti oleh user.
 */
export function isUnfilledTemplate(text) {
  if (!text || typeof text !== "string") return false;
  const lower = text.toLowerCase();

  // Pola placeholder default dari template bot
  const placeholderPatterns = [
    "[masukkan id booking anda]",
    "[masukkan id booking",
    "[nama kucing]",
    "[cth:",
    "[alasan singkat perubahan]",
    "[catatan/kebutuhan khusus kucing jika ada]",
    "[catatan tambahan]",
  ];

  for (const pattern of placeholderPatterns) {
    if (lower.includes(pattern)) {
      return true;
    }
  }

  // Cek kurung siku placeholder umum yang belum diganti
  if (/\[(masukkan|nama|cth|alasan|catatan)[^\]]*\]/i.test(text)) {
    return true;
  }

  // Cek nilai field hasil extract
  const extractedBooking = extractFieldValue(text, "ID Booking") || "";
  const extractedCat = extractFieldValue(text, "Nama Kucing") || "";

  if (
    extractedBooking.toLowerCase().includes("masukkan") ||
    extractedBooking.startsWith("[") ||
    extractedCat.toLowerCase().includes("nama kucing") ||
    extractedCat.startsWith("[")
  ) {
    return true;
  }

  return false;
}

/**
 * Core Bot Message Processing State Machine
 * Returns string reply or null
 */
export async function processIncomingWhatsAppMessage({
  phoneNumber,
  senderName,
  messageText,
  remoteJid = null,
}) {
  const cleanPhone = String(phoneNumber || "").replace(/[^0-9]/g, "");
  const trimmed = (messageText || "").trim();
  const lower = trimmed.toLowerCase();
  const effectiveRemoteJid = remoteJid || resolveRemoteJid(cleanPhone);

  let validCustomerName = null;
  if (senderName && senderName !== "NekoStay Bot" && senderName !== "Customer" && senderName !== "Pelanggan") {
    validCustomerName = senderName.trim();
  }

  let userSession = conversationStates.get(cleanPhone);
  if (!userSession) {
    let dbCustomerName = validCustomerName;
    let dbFlowState = BOT_FLOW_STATES.IDLE;
    let lastActivityTime = 0;
    try {
      const supabase = getSupabaseClient();
      const { data: lastLog } = await supabase
        .from("whatsapp_logs")
        .select("customer_name, flow_state, created_at")
        .eq("customer_phone", cleanPhone)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lastLog?.created_at) {
        lastActivityTime = new Date(lastLog.created_at).getTime();
      }

      if (lastLog?.customer_name && !dbCustomerName && lastLog.customer_name !== "NekoStay Bot") {
        dbCustomerName = lastLog.customer_name;
      }
      if (lastLog?.flow_state === BOT_FLOW_STATES.CHAT_WITH_ADMIN) {
        // Cek apakah aktivitas terakhir masih dalam batas waktu 1 jam
        const isStillActive = Date.now() - lastActivityTime < ADMIN_CHAT_INACTIVITY_TIMEOUT_MS;
        if (isStillActive) {
          dbFlowState = BOT_FLOW_STATES.CHAT_WITH_ADMIN;
        } else {
          // Telah lebih dari 1 jam tidak ada aktivitas chat -> bot otomatis kembali aktif
          dbFlowState = BOT_FLOW_STATES.IDLE;
        }
      }
    } catch (err) {
      // ignore
    }

    userSession = {
      state: dbFlowState,
      data: {},
      customerName: dbCustomerName || `Pelanggan ${cleanPhone.slice(-4)}`,
      remoteJid: effectiveRemoteJid,
      lastActive: Date.now(),
      lastActivityAt: lastActivityTime || Date.now(),
    };
    conversationStates.set(cleanPhone, userSession);
  } else {
    if (validCustomerName) {
      userSession.customerName = validCustomerName;
    }
    if (effectiveRemoteJid) {
      userSession.remoteJid = effectiveRemoteJid;
    }

    // Evaluasi batas waktu inaktivitas 1 jam jika sesi sedang dalam mode CHAT_WITH_ADMIN
    if (userSession.state === BOT_FLOW_STATES.CHAT_WITH_ADMIN) {
      const lastActivityTime = userSession.lastActivityAt || userSession.lastActive || 0;
      const inactivityDuration = Date.now() - lastActivityTime;
      if (inactivityDuration >= ADMIN_CHAT_INACTIVITY_TIMEOUT_MS) {
        // Telah melewati 1 jam tanpa aktivitas chat -> bot otomatis hidup kembali
        userSession.state = BOT_FLOW_STATES.IDLE;
        userSession.data = {};
        userSession.lastActivityAt = Date.now();
      }
    }

    userSession.lastActive = Date.now();
  }

  const activeCustomerName = userSession.customerName || "Pelanggan";

  const isScheduleTemplate =
    (lower.includes("format perubahan jadwal") &&
      (lower.includes("id booking") || lower.includes("tanggal check-in") || lower.includes("nama kucing"))) ||
    (lower.includes("id booking") &&
      (lower.includes("memajukan") || lower.includes("memundurkan") || lower.includes("tanggal check-in")));

  const isClassTemplate =
    (lower.includes("format perubahan kelas") &&
      (lower.includes("id booking") || lower.includes("kelas kamar baru") || lower.includes("nama kucing"))) ||
    (lower.includes("id booking") && lower.includes("kelas kamar baru"));

  // Log incoming user message
  await logWhatsAppMessage({
    phoneNumber: cleanPhone,
    customerPhone: cleanPhone,
    customerName: activeCustomerName,
    senderName: activeCustomerName,
    senderRole: "customer",
    direction: "incoming",
    messageText: trimmed,
    messageType: isScheduleTemplate || isClassTemplate ? "template" : "text",
    flowState: userSession.state,
    metadata: {
      remote_jid: userSession.remoteJid || effectiveRemoteJid,
    },
  });

  // Handle Form Template Submissions: SCHEDULE
  if (isScheduleTemplate) {
    if (isUnfilledTemplate(trimmed)) {
      const unfilledReply = `⚠️ *Formulir Belum Diisi dengan Benar*\n\n` +
        `Pesan yang Anda kirimkan masih memuat teks template bot atau placeholder kurung siku (seperti *[Masukkan ID Booking Anda]*).\n\n` +
        `Silakan salin format di bawah ini, *ganti data di dalam tanda kurung siku dengan data Anda*, lalu kirimkan kembali:\n\n` +
        `-----------------------------------\n` +
        `*Format Perubahan Jadwal NekoStay*\n` +
        `• ID Booking: (isi ID Booking Anda)\n` +
        `• Nama Kucing: (isi nama kucing Anda)\n` +
        `• Jenis: Memajukan Jadwal / Memundurkan Jadwal\n` +
        `• Tanggal Check-In Baru: (DD-MM-YYYY)\n` +
        `• Tanggal Check-Out Baru: (DD-MM-YYYY)\n` +
        `• Alasan: (alasan singkat perubahan)\n` +
        `-----------------------------------\n\n` +
        `_Ketik *MENU* untuk kembali ke menu utama._`;

      await logWhatsAppMessage({
        phoneNumber: cleanPhone,
        customerPhone: cleanPhone,
        customerName: activeCustomerName,
        senderName: "NekoStay Bot",
        senderRole: "bot",
        direction: "outgoing",
        messageText: unfilledReply,
        messageType: "text",
        flowState: userSession.state,
      });

      return unfilledReply;
    }

    const rawBookingId = extractFieldValue(trimmed, "ID Booking") || extractBookingId(trimmed);
    const catName = extractFieldValue(trimmed, "Nama Kucing") || "Kucing";
    const changeType = extractFieldValue(trimmed, "Jenis") || "Ubah Jadwal";
    const checkIn = extractFieldValue(trimmed, "Tanggal Check-In Baru") || "-";
    const checkOut = extractFieldValue(trimmed, "Tanggal Check-Out Baru") || "-";
    const reason = extractFieldValue(trimmed, "Alasan") || "-";

    const extractedBookingId = extractBookingId(rawBookingId || trimmed);

    // Notify admins
    await notifyAdmins({
      title: "Pengajuan Ubah Jadwal (WhatsApp)",
      message: `Permintaan ${changeType} diterima dari ${activeCustomerName} (${cleanPhone}) untuk kucing "${catName}". Check-in baru: ${checkIn}, Check-out baru: ${checkOut}. Alasan: ${reason}`,
      bookingId: extractedBookingId,
    });

    const reply = `✅ *Terima Kasih, Kak ${activeCustomerName}! Pengajuan Ubah Jadwal Anda Telah Diterima* 🐾\n\n` +
      `📋 *Rincian Pengajuan:*\n` +
      `• ID Booking: *${rawBookingId || "-"}*\n` +
      `• Nama Kucing: *${catName}*\n` +
      `• Jenis: *${changeType}*\n` +
      `• Check-In Baru: *${checkIn}*\n` +
      `• Check-Out Baru: *${checkOut}*\n` +
      `• Alasan: *${reason}*\n\n` +
      `Admin NekoStay telah menerima notifikasi ini dan akan segera melakukan penyesuaian jadwal secara manual di sistem. Anda akan mendapatkan konfirmasi setelah perubahan diproses. ✨\n\n` +
      `_Ketik *MENU* kapan saja untuk kembali ke menu awal._`;

    userSession.state = BOT_FLOW_STATES.IDLE;
    userSession.data = {};

    await logWhatsAppMessage({
      phoneNumber: cleanPhone,
      customerPhone: cleanPhone,
      customerName: activeCustomerName,
      senderName: "NekoStay Bot",
      senderRole: "bot",
      direction: "outgoing",
      messageText: reply,
      messageType: "text",
      flowState: BOT_FLOW_STATES.COMPLETED,
      bookingId: extractedBookingId || null,
      metadata: {
        changeType: "Jadwal",
        bookingId: extractedBookingId || null,
        rawBookingInput: rawBookingId,
        catName,
      },
    });

    return reply;
  }

  // Handle Form Template Submissions: CLASS
  if (isClassTemplate) {
    if (isUnfilledTemplate(trimmed)) {
      const unfilledReply = `⚠️ *Formulir Belum Diisi dengan Benar*\n\n` +
        `Pesan yang Anda kirimkan masih memuat teks template bot atau placeholder kurung siku (seperti *[Masukkan ID Booking Anda]*).\n\n` +
        `Silakan salin format di bawah ini, *ganti data di dalam tanda kurung siku dengan data Anda*, lalu kirimkan kembali:\n\n` +
        `-----------------------------------\n` +
        `*Format Perubahan Kelas NekoStay*\n` +
        `• ID Booking: (isi ID Booking Anda)\n` +
        `• Nama Kucing: (isi nama kucing Anda)\n` +
        `• Kelas Kamar Baru: (Standard / Deluxe / VIP)\n` +
        `• Catatan Tambahan: (kebutuhan khusus jika ada)\n` +
        `-----------------------------------\n\n` +
        `_Ketik *MENU* untuk kembali ke menu utama._`;

      await logWhatsAppMessage({
        phoneNumber: cleanPhone,
        customerPhone: cleanPhone,
        customerName: activeCustomerName,
        senderName: "NekoStay Bot",
        senderRole: "bot",
        direction: "outgoing",
        messageText: unfilledReply,
        messageType: "text",
        flowState: userSession.state,
      });

      return unfilledReply;
    }

    const rawBookingId = extractFieldValue(trimmed, "ID Booking") || extractBookingId(trimmed);
    const catName = extractFieldValue(trimmed, "Nama Kucing") || "Kucing";
    const newClass = extractFieldValue(trimmed, "Kelas Kamar Baru") || "Kelas Baru";
    const notes = extractFieldValue(trimmed, "Catatan Tambahan") || "-";

    const extractedBookingId = extractBookingId(rawBookingId || trimmed);

    // Notify admins
    await notifyAdmins({
      title: "Pengajuan Ubah Kelas Kamar (WhatsApp)",
      message: `Permintaan ubah kelas ke "${newClass}" diterima dari ${activeCustomerName} (${cleanPhone}) untuk kucing "${catName}". Catatan: ${notes}`,
      bookingId: extractedBookingId,
    });

    const reply = `✅ *Terima Kasih, Kak ${activeCustomerName}! Pengajuan Ubah Kelas Kamar Telah Diterima* 🐾\n\n` +
      `📋 *Rincian Pengajuan:*\n` +
      `• ID Booking: *${rawBookingId || "-"}*\n` +
      `• Nama Kucing: *${catName}*\n` +
      `• Kelas Baru: *${newClass}*\n` +
      `• Catatan: *${notes}*\n\n` +
      `Admin NekoStay telah menerima notifikasi ini dan akan segera memperbarui kelas kamar pesanan Anda secara manual di sistem. ✨\n\n` +
      `_Ketik *MENU* kapan saja untuk kembali ke menu awal._`;

    userSession.state = BOT_FLOW_STATES.IDLE;
    userSession.data = {};

    await logWhatsAppMessage({
      phoneNumber: cleanPhone,
      customerPhone: cleanPhone,
      customerName: activeCustomerName,
      senderName: "NekoStay Bot",
      senderRole: "bot",
      direction: "outgoing",
      messageText: reply,
      messageType: "text",
      flowState: BOT_FLOW_STATES.COMPLETED,
      bookingId: extractedBookingId || null,
      metadata: {
        changeType: "Kelas",
        bookingId: extractedBookingId || null,
        rawBookingInput: rawBookingId,
        catName,
        newClass,
      },
    });

    return reply;
  }

  // Handle Chat With Admin state & Bot reactivation triggers
  const isBotReactivationTrigger =
    lower === "menu" ||
    lower === "bot" ||
    lower === "layanan" ||
    lower === "batal" ||
    lower === "reset" ||
    lower === "help" ||
    lower === "kembali" ||
    lower === "restart" ||
    lower === "mulai" ||
    lower === "1" ||
    lower === "2";

  const isEcho = isBotMessageEcho(trimmed);

  if (userSession.state === BOT_FLOW_STATES.CHAT_WITH_ADMIN) {
    if (isEcho || !isBotReactivationTrigger) {
      // User is currently chatting with Admin and within 1 hour active window.
      // Refresh lastActivityAt because incoming message is valid chat activity.
      userSession.lastActivityAt = Date.now();
      return null;
    }

    // User explicitly typed a trigger keyword or menu number to return to Bot mode
    userSession.state = BOT_FLOW_STATES.IDLE;
    userSession.data = {};
    userSession.lastActivityAt = Date.now();
  }

  // Cegah false selection saat pelanggan menyalin (copy-paste) seluruh pesan / menu bot
  if (isEcho) {
    const isScheduleRelated =
      userSession.state === BOT_FLOW_STATES.AWAITING_SCHEDULE_TYPE ||
      userSession.state === BOT_FLOW_STATES.AWAITING_SCHEDULE_SUBMISSION ||
      lower.includes("layanan perubahan jadwal") ||
      (lower.includes("memajukan jadwal") && lower.includes("memundurkan jadwal"));

    const isClassRelated =
      userSession.state === BOT_FLOW_STATES.AWAITING_CLASS_TYPE ||
      userSession.state === BOT_FLOW_STATES.AWAITING_CLASS_SUBMISSION ||
      lower.includes("layanan perubahan kelas") ||
      lower.includes("daftar kelas kamar") ||
      ((lower.includes("standard") || lower.includes("deluxe") || lower.includes("vip")) && lower.includes("/hari"));

    let echoReply = "";

    if (isScheduleRelated) {
      userSession.state = BOT_FLOW_STATES.AWAITING_SCHEDULE_TYPE;
      echoReply = `⚠️ *Pesan Terdeteksi Hasil Salinan Menu / Teks Bot*\n\n` +
        `Untuk memilih jenis perubahan jadwal, silakan kirimkan *cukup nomor pilihannya saja*:\n\n` +
        `1️⃣ *1* untuk Memajukan Jadwal\n` +
        `2️⃣ *2* untuk Memundurkan Jadwal\n\n` +
        `_Ketik angka *1* atau *2*, atau ketik *MENU* untuk kembali ke menu awal._`;
    } else if (isClassRelated) {
      userSession.state = BOT_FLOW_STATES.AWAITING_CLASS_TYPE;
      echoReply = `⚠️ *Pesan Terdeteksi Hasil Salinan Menu / Teks Bot*\n\n` +
        `Untuk memilih kelas kamar yang diinginkan, silakan kirimkan *cukup nomor urut kelasnya saja*:\n` +
        `(Contoh: ketik *1*, *2*, atau *3* sesuai daftar kelas kamar yang Anda inginkan).\n\n` +
        `_Atau ketik *MENU* untuk kembali ke menu awal._`;
    } else {
      userSession.state = BOT_FLOW_STATES.AWAITING_MAIN_CHOICE;
      echoReply = `⚠️ *Pesan Terdeteksi Hasil Salinan Menu / Teks Bot*\n\n` +
        `Untuk memilih layanan yang Anda inginkan, silakan kirimkan *cukup nomor pilihannya saja*:\n\n` +
        `1️⃣ *1* untuk Ubah Jadwal\n` +
        `2️⃣ *2* untuk Ubah Kelas Kamar\n` +
        `3️⃣ *3* untuk Chat dengan Admin\n\n` +
        `_Ketik angka *1*, *2*, atau *3*, atau ketik *MENU* untuk memuat ulang menu._`;
    }

    await logWhatsAppMessage({
      phoneNumber: cleanPhone,
      customerPhone: cleanPhone,
      customerName: activeCustomerName,
      senderName: "NekoStay Bot",
      senderRole: "bot",
      direction: "outgoing",
      messageText: echoReply,
      messageType: "text",
      flowState: userSession.state,
    });

    return echoReply;
  }

  const isChoice1 =
    lower === "1" ||
    lower === "1️⃣" ||
    lower === "1." ||
    lower === "satu" ||
    /^no(mor)?\s*1$/i.test(trimmed) ||
    /^(mau\s+)?(ubah|ganti|atur)\s+(jadwal|tanggal)/i.test(trimmed) ||
    (trimmed.length <= 25 && (lower === "jadwal" || lower === "ubah jadwal" || lower === "ganti jadwal" || lower === "ubah tanggal"));

  const isChoice2 =
    lower === "2" ||
    lower === "2️⃣" ||
    lower === "2." ||
    lower === "dua" ||
    /^no(mor)?\s*2$/i.test(trimmed) ||
    /^(mau\s+)?(ubah|ganti|pilih)\s+(kelas|kamar|room)/i.test(trimmed) ||
    (trimmed.length <= 25 && (lower === "kelas" || lower === "kamar" || lower === "ubah kelas" || lower === "ubah kamar"));

  const isChoice3 =
    lower === "3" ||
    lower === "3️⃣" ||
    lower === "3." ||
    lower === "tiga" ||
    /^no(mor)?\s*3$/i.test(trimmed) ||
    /^(chat|bicara|hubungi|kontak)\s+(dengan\s+)?(admin|cs|operator)/i.test(trimmed) ||
    lower.includes("admin") ||
    lower.includes("customer service") ||
    lower.includes("operator") ||
    lower.includes("manusia") ||
    (trimmed.length <= 25 && (lower === "cs" || lower === "chat admin"));

  const isDirectChoice = isChoice1 || isChoice2 || isChoice3;

  // Handle Command keywords like "menu", "batal", "reset", "halo", "hi"
  if (
    lower === "menu" ||
    lower === "bot" ||
    lower === "batal" ||
    lower === "reset" ||
    lower === "help" ||
    lower === "layanan" ||
    lower === "restart" ||
    lower === "mulai" ||
    (userSession.state === BOT_FLOW_STATES.IDLE && !isDirectChoice)
  ) {
    userSession.state = BOT_FLOW_STATES.AWAITING_MAIN_CHOICE;
    userSession.data = {};

    const reply = `🐾 *Halo, Kak ${activeCustomerName}! Selamat datang di Layanan WhatsApp NekoStay Care* 🐱\n\n` +
      `Ada yang bisa kami bantu terkait pesanan penitipan kucing Anda? Silakan balas dengan angka pilihan di bawah:\n\n` +
      `1️⃣ *Ubah Jadwal* (Memajukan / Memundurkan tanggal menginap)\n` +
      `2️⃣ *Ubah Kelas Kamar* (Ganti tipe kelas kamar kucing)\n` +
      `3️⃣ *Chat dengan Admin* (Bicara langsung dengan Customer Service / Admin NekoStay)\n\n` +
      `_Ketik angka *1*, *2*, atau *3* untuk memilih layanan._`;

    await logWhatsAppMessage({
      phoneNumber: cleanPhone,
      customerPhone: cleanPhone,
      customerName: activeCustomerName,
      senderName: "NekoStay Bot",
      senderRole: "bot",
      direction: "outgoing",
      messageText: reply,
      messageType: "interactive",
      flowState: BOT_FLOW_STATES.AWAITING_MAIN_CHOICE,
    });

    return reply;
  }

  // Jika sesi IDLE namun pengguna langsung mengirim pilihan (misal: "3" untuk Chat Admin),
  // set status ke AWAITING_MAIN_CHOICE agar diproses langsung oleh handler di bawah
  if (userSession.state === BOT_FLOW_STATES.IDLE && isDirectChoice) {
    userSession.state = BOT_FLOW_STATES.AWAITING_MAIN_CHOICE;
  }

  // State: AWAITING_MAIN_CHOICE
  if (userSession.state === BOT_FLOW_STATES.AWAITING_MAIN_CHOICE) {
    if (isChoice1 && !isChoice2 && !isChoice3) {
      userSession.state = BOT_FLOW_STATES.AWAITING_SCHEDULE_TYPE;

      const reply = `📅 *Layanan Perubahan Jadwal Penitipan*\n\n` +
        `Silakan pilih jenis perubahan jadwal yang Anda inginkan:\n\n` +
        `1️⃣ *Memajukan Jadwal* (Check-in lebih awal dari jadwal semula)\n` +
        `2️⃣ *Memundurkan Jadwal* (Check-in lebih lambat / perpanjang jadwal)\n\n` +
        `_Ketik angka *1* atau *2* untuk memilih._`;

      await logWhatsAppMessage({
        phoneNumber: cleanPhone,
        customerPhone: cleanPhone,
        customerName: activeCustomerName,
        senderName: "NekoStay Bot",
        senderRole: "bot",
        direction: "outgoing",
        messageText: reply,
        messageType: "interactive",
        flowState: BOT_FLOW_STATES.AWAITING_SCHEDULE_TYPE,
      });

      return reply;
    }

    if (isChoice2 && !isChoice1 && !isChoice3) {
      const classes = await getRoomClassesFromDB();
      userSession.state = BOT_FLOW_STATES.AWAITING_CLASS_TYPE;
      userSession.data.availableClasses = classes;

      const numberIcons = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣"];
      let classListText = "";

      classes.forEach((c, idx) => {
        const icon = numberIcons[idx] || `${idx + 1}.`;
        const rate = Number(c.price_per_day || 0).toLocaleString("id-ID");
        classListText += `${icon} *${c.name}* : Rp ${rate}/hari\n`;
      });

      const reply = `🏨 *Layanan Perubahan Kelas Kamar NekoStay*\n\n` +
        `Berikut adalah daftar kelas kamar yang saat ini tersedia di NekoStay:\n\n` +
        classListText +
        `\n_Silakan balas dengan angka pilihan kelas di atas (cth: ketik *1*, *2*, atau *3*) untuk mendapatkan format perubahan kelas._`;

      await logWhatsAppMessage({
        phoneNumber: cleanPhone,
        customerPhone: cleanPhone,
        customerName: activeCustomerName,
        senderName: "NekoStay Bot",
        senderRole: "bot",
        direction: "outgoing",
        messageText: reply,
        messageType: "interactive",
        flowState: BOT_FLOW_STATES.AWAITING_CLASS_TYPE,
      });

      return reply;
    }

    if (isChoice3 && !isChoice1 && !isChoice2) {
      userSession.state = BOT_FLOW_STATES.CHAT_WITH_ADMIN;
      userSession.lastActivityAt = Date.now();
      userSession.data = { switchedAt: Date.now() };

      await notifyAdmins({
        title: "Permintaan Chat Langsung Admin (WhatsApp)",
        message: `Pelanggan ${activeCustomerName} (${cleanPhone}) memilih untuk mengobrol langsung dengan Admin. Bot otomatis dijeda untuk nomor ini.`,
      });

      const reply = `👨‍💼 *Layanan Terhubung Langsung ke Admin NekoStay*\n\n` +
        `Halo, Kak *${activeCustomerName}*! Anda saat ini telah terhubung langsung dengan Admin NekoStay.\n\n` +
        `💬 *Silakan tuliskan pesan, pertanyaan, atau keluhan Anda di sini.* Admin kami akan segera membaca dan membalas langsung chat Anda melalui sistem.\n\n` +
        `💡 _(Balasan otomatis bot telah dijeda selama sesi aktif. Jika tidak ada aktivitas chat selama 1 jam, bot akan otomatis aktif kembali. Ketik *MENU* atau *BOT* jika ingin kembali lebih awal)._`;

      await logWhatsAppMessage({
        phoneNumber: cleanPhone,
        customerPhone: cleanPhone,
        customerName: activeCustomerName,
        senderName: "NekoStay Bot",
        senderRole: "bot",
        direction: "outgoing",
        messageText: reply,
        messageType: "interactive",
        flowState: BOT_FLOW_STATES.CHAT_WITH_ADMIN,
      });

      return reply;
    }

    // Unrecognized input in main choice
    const fallbackReply = `⚠️ *Pilihan tidak dikenali.*\n\n` +
      `Silakan ketik angka:\n` +
      `*1* untuk Ubah Jadwal\n` +
      `*2* untuk Ubah Kelas Kamar\n` +
      `*3* untuk Chat dengan Admin\n\n` +
      `_Atau ketik *MENU* untuk mengulang._`;

    await logWhatsAppMessage({
      phoneNumber: cleanPhone,
      customerPhone: cleanPhone,
      customerName: activeCustomerName,
      senderName: "NekoStay Bot",
      senderRole: "bot",
      direction: "outgoing",
      messageText: fallbackReply,
      messageType: "text",
      flowState: BOT_FLOW_STATES.AWAITING_MAIN_CHOICE,
    });

    return fallbackReply;
  }

  // State: AWAITING_SCHEDULE_TYPE
  if (userSession.state === BOT_FLOW_STATES.AWAITING_SCHEDULE_TYPE) {
    let scheduleType = "Memajukan Jadwal";
    const isSchedule2 =
      lower === "2" ||
      lower === "2️⃣" ||
      lower === "2." ||
      lower === "dua" ||
      /^no(mor)?\s*2$/i.test(trimmed) ||
      (trimmed.length <= 35 && (lower.includes("mundur") || lower.includes("tunda") || lower.includes("lambat")));

    const isSchedule1 =
      lower === "1" ||
      lower === "1️⃣" ||
      lower === "1." ||
      lower === "satu" ||
      /^no(mor)?\s*1$/i.test(trimmed) ||
      (trimmed.length <= 35 && (lower.includes("maju") || lower.includes("awal")));

    if (isSchedule2 && !isSchedule1) {
      scheduleType = "Memundurkan Jadwal";
    } else if (isSchedule1 && !isSchedule2) {
      scheduleType = "Memajukan Jadwal";
    } else {
      const fallback = `⚠️ Silakan pilih *1* (Memajukan Jadwal) atau *2* (Memundurkan Jadwal), atau ketik *MENU*.`;
      await logWhatsAppMessage({
        phoneNumber: cleanPhone,
        customerPhone: cleanPhone,
        customerName: activeCustomerName,
        senderName: "NekoStay Bot",
        senderRole: "bot",
        direction: "outgoing",
        messageText: fallback,
        messageType: "text",
        flowState: BOT_FLOW_STATES.AWAITING_SCHEDULE_TYPE,
      });
      return fallback;
    }

    userSession.state = BOT_FLOW_STATES.AWAITING_SCHEDULE_SUBMISSION;
    userSession.data.scheduleType = scheduleType;

    const sampleDateIn = "10-09-2026";
    const sampleDateOut = "15-09-2026";

    const reply = `📝 *Template Formulir ${scheduleType}*\n\n` +
      `Silakan *SALIN / COPY* teks template di bawah ini, lalu isi datanya dan kirim kembali ke chat ini:\n\n` +
      `-----------------------------------\n` +
      `*Format Perubahan Jadwal NekoStay*\n` +
      `• ID Booking: [Masukkan ID Booking Anda]\n` +
      `• Nama Kucing: [Nama Kucing]\n` +
      `• Jenis: ${scheduleType}\n` +
      `• Tanggal Check-In Baru: [cth: ${sampleDateIn}]\n` +
      `• Tanggal Check-Out Baru: [cth: ${sampleDateOut}]\n` +
      `• Alasan: [Alasan singkat perubahan]\n` +
      `-----------------------------------\n\n` +
      `💡 _Setelah pesan format terkirim, Admin NekoStay akan memproses penyesuaian jadwal secara manual di sistem._`;

    await logWhatsAppMessage({
      phoneNumber: cleanPhone,
      customerPhone: cleanPhone,
      customerName: activeCustomerName,
      senderName: "NekoStay Bot",
      senderRole: "bot",
      direction: "outgoing",
      messageText: reply,
      messageType: "template",
      flowState: BOT_FLOW_STATES.AWAITING_SCHEDULE_SUBMISSION,
    });

    return reply;
  }

  // State: AWAITING_CLASS_TYPE
  if (userSession.state === BOT_FLOW_STATES.AWAITING_CLASS_TYPE) {
    const classes = userSession.data.availableClasses || (await getRoomClassesFromDB());
    let selectedClass = null;

    const cleanNum = trimmed.replace(/[^0-9]/g, "");
    const numIndex = cleanNum && trimmed.length <= 5 ? parseInt(cleanNum, 10) - 1 : -1;

    if (numIndex >= 0 && classes[numIndex]) {
      selectedClass = classes[numIndex];
    } else if (trimmed.length <= 35) {
      selectedClass = classes.find(
        (c) =>
          lower === c.name.toLowerCase() ||
          lower.includes(c.name.toLowerCase()) ||
          (c.name.toLowerCase().includes("standard") && lower.includes("standard")) ||
          (c.name.toLowerCase().includes("deluxe") && lower.includes("deluxe")) ||
          (c.name.toLowerCase().includes("vip") && lower.includes("vip"))
      );
    }

    if (!selectedClass) {
      const fallback = `⚠️ Pilihan kelas kamar tidak valid. Silakan pilih nomor kelas yang sesuai (cth: *1*, *2*, dsb) atau ketik *MENU*.`;
      await logWhatsAppMessage({
        phoneNumber: cleanPhone,
        customerPhone: cleanPhone,
        customerName: activeCustomerName,
        senderName: "NekoStay Bot",
        senderRole: "bot",
        direction: "outgoing",
        messageText: fallback,
        messageType: "text",
        flowState: BOT_FLOW_STATES.AWAITING_CLASS_TYPE,
      });
      return fallback;
    }

    userSession.state = BOT_FLOW_STATES.AWAITING_CLASS_SUBMISSION;
    userSession.data.selectedClass = selectedClass;

    const rate = Number(selectedClass.price_per_day || 0).toLocaleString("id-ID");

    const reply = `📝 *Template Formulir Ubah Kelas Kamar (${selectedClass.name})*\n\n` +
      `Tarif: *Rp ${rate}/hari*\n\n` +
      `Silakan *SALIN / COPY* teks template di bawah ini, lalu isi datanya dan kirim kembali ke chat ini:\n\n` +
      `-----------------------------------\n` +
      `*Format Perubahan Kelas NekoStay*\n` +
      `• ID Booking: [Masukkan ID Booking Anda]\n` +
      `• Nama Kucing: [Nama Kucing]\n` +
      `• Kelas Kamar Baru: ${selectedClass.name}\n` +
      `• Catatan Tambahan: [Catatan/Kebutuhan khusus kucing jika ada]\n` +
      `-----------------------------------\n\n` +
      `💡 _Setelah pesan format terkirim, Admin NekoStay akan memproses penyesuaian kelas kamar pesanan Anda di sistem._`;

    await logWhatsAppMessage({
      phoneNumber: cleanPhone,
      customerPhone: cleanPhone,
      customerName: activeCustomerName,
      senderName: "NekoStay Bot",
      senderRole: "bot",
      direction: "outgoing",
      messageText: reply,
      messageType: "template",
      flowState: BOT_FLOW_STATES.AWAITING_CLASS_SUBMISSION,
    });

    return reply;
  }

  // Generic fallback if none matched
  const genericReply = `🐾 *Halo, Kak ${activeCustomerName}!* Terima kasih telah menghubungi NekoStay Care.\n\n` +
    `Ketik *MENU* untuk melihat opsi layanan atau chat langsung dengan Admin kami.`;

  await logWhatsAppMessage({
    phoneNumber: cleanPhone,
    customerPhone: cleanPhone,
    customerName: activeCustomerName,
    senderName: "NekoStay Bot",
    senderRole: "bot",
    direction: "outgoing",
    messageText: genericReply,
    messageType: "text",
    flowState: BOT_FLOW_STATES.IDLE,
  });

  return genericReply;
}
