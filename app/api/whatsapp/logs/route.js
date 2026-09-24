import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { resolveRemoteJid } from "@/lib/modules/whatsapp";

export async function GET(request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get("phone");
    const days = parseInt(searchParams.get("days") || "7", 10);

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
        { error: "Hanya Administrator yang dapat mengakses log WhatsApp" },
        { status: 403 }
      );
    }

    // Filter batas riwayat log (default 7 hari)
    const cutoffDate = new Date(
      Date.now() - days * 24 * 60 * 60 * 1000
    ).toISOString();

    if (phone) {
      const cleanPhone = phone.replace(/[^0-9]/g, "");
      const { data: messages, error } = await supabase
        .from("whatsapp_logs")
        .select("*")
        .or(`customer_phone.eq.${cleanPhone},phone_number.eq.${cleanPhone}`)
        .gte("created_at", cutoffDate)
        .order("created_at", { ascending: true });

      if (error) throw error;

      return NextResponse.json({
        success: true,
        phone: cleanPhone,
        cutoffDate,
        totalMessages: messages?.length || 0,
        messages: messages || [],
      });
    }

    const { data: allLogs, error } = await supabase
      .from("whatsapp_logs")
      .select("*")
      .gte("created_at", cutoffDate)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Kelompokkan percakapan berdasarkan customer_phone
    const contactMap = new Map();

    (allLogs || []).forEach((log) => {
      const p = String(log.customer_phone || log.phone_number || "").replace(/[^0-9]/g, "");
      if (!p) return;

      const logCustomerName =
        (log.customer_name && log.customer_name !== "NekoStay Bot" && log.customer_name !== "Customer")
          ? log.customer_name
          : (log.sender_role === "customer" && log.sender_name && log.sender_name !== "NekoStay Bot")
          ? log.sender_name
          : null;

      const logRemoteJid =
        log.metadata?.remote_jid ||
        resolveRemoteJid(p, log.metadata);

      if (!contactMap.has(p)) {
        contactMap.set(p, {
          phoneNumber: p,
          remoteJid: logRemoteJid,
          senderName: logCustomerName || `Pelanggan ${p.slice(-4)}`,
          lastMessage: log.message_text,
          lastMessageDirection: log.direction,
          lastSenderRole: log.sender_role || (log.direction === "outgoing" ? "bot" : "customer"),
          lastTimestamp: log.created_at,
          lastFlowState: log.flow_state,
          totalMessages: 1,
          unread: log.direction === "incoming",
        });
      } else {
        const c = contactMap.get(p);
        c.totalMessages += 1;
        if (!c.remoteJid && logRemoteJid) {
          c.remoteJid = logRemoteJid;
        }
        // Prioritise real customer name over fallback
        if (logCustomerName && (!c.senderName || c.senderName.startsWith("Pelanggan "))) {
          c.senderName = logCustomerName;
        }
      }
    });

    const contacts = Array.from(contactMap.values());

    return NextResponse.json({
      success: true,
      cutoffDate,
      days,
      totalContacts: contacts.length,
      totalLogs: allLogs?.length || 0,
      contacts,
      recentLogs: (allLogs || []).slice(0, 50),
    });
  } catch (error) {
    console.error("[Fetch WhatsApp Logs Error]:", error);
    return NextResponse.json(
      { error: "Gagal memuat riwayat log WhatsApp" },
      { status: 500 }
    );
  }
}
