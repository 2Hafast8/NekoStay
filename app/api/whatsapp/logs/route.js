import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get("phone");
    const days = parseInt(searchParams.get("days") || "7", 10);

    // 1. Cek sesi user & role Admin
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

    // 2. Filter 7 hari terakhir (Strict 7-day cutoff)
    const cutoffDate = new Date(
      Date.now() - days * 24 * 60 * 60 * 1000
    ).toISOString();

    // 3. Jika meminta detail percakapan dari 1 nomor tertentu
    if (phone) {
      const cleanPhone = phone.replace(/[^0-9]/g, "");
      const { data: messages, error } = await supabase
        .from("whatsapp_logs")
        .select("*")
        .eq("phone_number", cleanPhone)
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

    // 4. Jika meminta ringkasan kontak / seluruh log
    const { data: allLogs, error } = await supabase
      .from("whatsapp_logs")
      .select("*")
      .gte("created_at", cutoffDate)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Kelompokkan berdasarkan phone_number untuk daftar kontak
    const contactMap = new Map();

    (allLogs || []).forEach((log) => {
      const p = log.phone_number;
      if (!contactMap.has(p)) {
        contactMap.set(p, {
          phoneNumber: p,
          senderName: log.sender_name || p,
          lastMessage: log.message_text,
          lastMessageDirection: log.direction,
          lastTimestamp: log.created_at,
          lastFlowState: log.flow_state,
          totalMessages: 1,
          unread: log.direction === "incoming",
        });
      } else {
        const c = contactMap.get(p);
        c.totalMessages += 1;
        // Keep the latest senderName if found
        if (log.sender_name && log.sender_name !== "NekoStay Bot" && c.senderName === p) {
          c.senderName = log.sender_name;
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
    console.error("Fetch WhatsApp logs error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal memuat log WhatsApp" },
      { status: 500 }
    );
  }
}
