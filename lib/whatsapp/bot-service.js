import { createClient } from "@supabase/supabase-js";

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
// Map: phoneNumber -> { state, data, customerName, lastActive }
const conversationStates = new Map();

export const BOT_FLOW_STATES = {
  IDLE: "idle",
  AWAITING_MAIN_CHOICE: "main_menu",
  AWAITING_SCHEDULE_TYPE: "schedule_menu",
  AWAITING_CLASS_TYPE: "class_menu",
  AWAITING_SCHEDULE_SUBMISSION: "awaiting_schedule_fill",
  AWAITING_CLASS_SUBMISSION: "awaiting_class_fill",
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
      metadata,
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
 * Core Bot Message Processing State Machine
 * Returns string reply or null
 */
export async function processIncomingWhatsAppMessage({
  phoneNumber,
  senderName,
  messageText,
}) {
  const cleanPhone = String(phoneNumber || "").replace(/[^0-9]/g, "");
  const trimmed = (messageText || "").trim();
  const lower = trimmed.toLowerCase();

  // 1. Resolve real customer display name
  let validCustomerName = null;
  if (senderName && senderName !== "NekoStay Bot" && senderName !== "Customer" && senderName !== "Pelanggan") {
    validCustomerName = senderName.trim();
  }

  // 2. Get or initialize user session
  let userSession = conversationStates.get(cleanPhone);
  if (!userSession) {
    // Try to lookup recent name from DB if not in memory
    let dbCustomerName = validCustomerName;
    if (!dbCustomerName) {
      try {
        const supabase = getSupabaseClient();
        const { data: lastLog } = await supabase
          .from("whatsapp_logs")
          .select("customer_name")
          .eq("customer_phone", cleanPhone)
          .not("customer_name", "is", null)
          .neq("customer_name", "NekoStay Bot")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (lastLog?.customer_name) {
          dbCustomerName = lastLog.customer_name;
        }
      } catch (err) {
        // ignore
      }
    }

    userSession = {
      state: BOT_FLOW_STATES.IDLE,
      data: {},
      customerName: dbCustomerName || `Pelanggan ${cleanPhone.slice(-4)}`,
      lastActive: Date.now(),
    };
    conversationStates.set(cleanPhone, userSession);
  } else {
    if (validCustomerName) {
      userSession.customerName = validCustomerName;
    }
    userSession.lastActive = Date.now();
  }

  const activeCustomerName = userSession.customerName || "Pelanggan";

  // 3. Check if user is submitting a completed template form directly
  const isScheduleTemplate =
    lower.includes("format perubahan jadwal") ||
    (lower.includes("id booking") &&
      (lower.includes("memajukan") || lower.includes("memundurkan") || lower.includes("tanggal check-in")));

  const isClassTemplate =
    lower.includes("format perubahan kelas") ||
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
  });

  // Handle Form Template Submissions: SCHEDULE
  if (isScheduleTemplate) {
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
        bookingId: extractedBookingId || rawBookingId,
        catName,
      },
    });

    return reply;
  }

  // Handle Form Template Submissions: CLASS
  if (isClassTemplate) {
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
        bookingId: extractedBookingId || rawBookingId,
        catName,
        newClass,
      },
    });

    return reply;
  }

  // Handle Command keywords like "menu", "batal", "reset", "halo", "hi"
  if (
    lower === "menu" ||
    lower === "batal" ||
    lower === "reset" ||
    lower === "help" ||
    userSession.state === BOT_FLOW_STATES.IDLE
  ) {
    userSession.state = BOT_FLOW_STATES.AWAITING_MAIN_CHOICE;
    userSession.data = {};

    const reply = `🐾 *Halo, Kak ${activeCustomerName}! Selamat datang di Layanan WhatsApp NekoStay Care* 🐱\n\n` +
      `Ada yang bisa kami bantu terkait pesanan penitipan kucing Anda? Silakan balas dengan angka pilihan di bawah:\n\n` +
      `1️⃣ *Ubah Jadwal* (Memajukan / Memundurkan tanggal menginap)\n` +
      `2️⃣ *Ubah Kelas Kamar* (Ganti tipe kelas kamar kucing)\n\n` +
      `_Ketik angka *1* atau *2* untuk memilih layanan._`;

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

  // State: AWAITING_MAIN_CHOICE
  if (userSession.state === BOT_FLOW_STATES.AWAITING_MAIN_CHOICE) {
    if (lower === "1" || lower.includes("jadwal") || lower.includes("tanggal")) {
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

    if (lower === "2" || lower.includes("kelas") || lower.includes("kamar") || lower.includes("room")) {
      const classes = await getRoomClassesFromDB();
      userSession.state = BOT_FLOW_STATES.AWAITING_CLASS_TYPE;
      userSession.data.availableClasses = classes;

      const numberIcons = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣"];
      let classListText = "";

      classes.forEach((c, idx) => {
        const icon = numberIcons[idx] || `${idx + 1}.`;
        const rate = Number(c.price_per_day || 0).toLocaleString("id-ID");
        classListText += `${icon} *${c.name}* — Rp ${rate}/hari\n`;
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

    // Unrecognized input in main choice
    const fallbackReply = `⚠️ *Pilihan tidak dikenali.*\n\n` +
      `Silakan ketik angka:\n` +
      `*1* untuk Ubah Jadwal\n` +
      `*2* untuk Ubah Kelas Kamar\n\n` +
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
    if (lower === "2" || lower.includes("mundur") || lower.includes("tunda") || lower.includes("lambat")) {
      scheduleType = "Memundurkan Jadwal";
    } else if (lower === "1" || lower.includes("maju") || lower.includes("awal")) {
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

    const numIndex = parseInt(trimmed, 10) - 1;
    if (!isNaN(numIndex) && classes[numIndex]) {
      selectedClass = classes[numIndex];
    } else {
      selectedClass = classes.find(
        (c) =>
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
    `Ketik *MENU* untuk melihat opsi perubahan jadwal atau kelas kamar kucing Anda.`;

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
