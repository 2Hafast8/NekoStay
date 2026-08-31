"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/hooks/useLanguage";
import {
  MessageSquare,
  Search,
  RefreshCw,
  Phone,
  Clock,
  Send,
  ExternalLink,
  Bot,
  User,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Info,
  Copy,
  Check,
  QrCode,
  X,
  Smartphone,
  LogOut,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";

export default function AdminWhatsAppLogsPage() {
  const { t, language } = useLanguage();
  const [contacts, setContacts] = useState([]);
  const [selectedPhone, setSelectedPhone] = useState(null);
  const [messages, setMessages] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoadingContacts, setIsLoadingContacts] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simText, setSimText] = useState("");
  const [copiedId, setCopiedId] = useState(null);

  // Connection State & Modal
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [waStatus, setWaStatus] = useState("disconnected"); // 'disconnected' | 'connecting' | 'qr_ready' | 'connected'
  const [qrCodeUrl, setQrCodeUrl] = useState(null);
  const [targetPhone, setTargetPhone] = useState("6282371986344");
  const [connectedPhone, setConnectedPhone] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const messagesEndRef = useRef(null);
  const statusPollingRef = useRef(null);
  const supabase = createClient();

  // 1. Check WA Connection Status
  const checkStatus = async () => {
    try {
      const res = await fetch("/api/whatsapp/status");
      const data = await res.json();
      if (data.success) {
        setWaStatus(data.status);
        setQrCodeUrl(data.qrCode);
        setConnectedPhone(data.connectedPhone);
        if (data.adminPhoneConfigured) {
          setTargetPhone(data.adminPhoneConfigured);
        }
      }
    } catch (err) {
      console.warn("Check WA status error:", err);
    }
  };

  // 2. Start Web Connection (QR Code)
  const handleStartConnect = async () => {
    try {
      setIsConnecting(true);
      const res = await fetch("/api/whatsapp/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: targetPhone,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setWaStatus(data.status);
        setQrCodeUrl(data.qrCode);
        setConnectedPhone(data.connectedPhone);
      } else {
        toast.error(data.error || "Gagal memulai koneksi");
      }
    } catch (err) {
      toast.error(err.message || "Gagal memulai koneksi");
    } finally {
      setIsConnecting(false);
    }
  };

  // 3. Disconnect WA
  const handleDisconnect = async () => {
    try {
      setIsDisconnecting(true);
      const res = await fetch("/api/whatsapp/disconnect", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setWaStatus("disconnected");
        setQrCodeUrl(null);
        setConnectedPhone(null);
        toast.success("Koneksi WhatsApp berhasil diputuskan");
      }
    } catch (err) {
      toast.error(err.message || "Gagal memutuskan koneksi");
    } finally {
      setIsDisconnecting(false);
    }
  };

  // 4. Fetch Contact List (7-day aggregated)
  const fetchContacts = async (preserveSelected = true) => {
    try {
      setIsLoadingContacts(true);
      const res = await fetch("/api/whatsapp/logs?days=7");
      const data = await res.json();

      if (data.success && data.contacts) {
        setContacts(data.contacts);
        // Auto-select first contact if none selected
        if (!selectedPhone && data.contacts.length > 0) {
          setSelectedPhone(data.contacts[0].phoneNumber);
        } else if (preserveSelected && selectedPhone) {
          const stillExists = data.contacts.find((c) => c.phoneNumber === selectedPhone);
          if (!stillExists && data.contacts.length > 0) {
            setSelectedPhone(data.contacts[0].phoneNumber);
          }
        }
      }
    } catch (err) {
      console.error("Fetch contacts error:", err);
      toast.error("Gagal memuat daftar kontak WhatsApp");
    } finally {
      setIsLoadingContacts(false);
    }
  };

  // 5. Fetch Messages for Selected Phone
  const fetchMessagesForPhone = async (phone) => {
    if (!phone) return;
    try {
      setIsLoadingMessages(true);
      const res = await fetch(`/api/whatsapp/logs?phone=${phone}&days=7`);
      const data = await res.json();

      if (data.success && data.messages) {
        setMessages(data.messages);
      }
    } catch (err) {
      console.error("Fetch messages error:", err);
      toast.error("Gagal memuat riwayat pesan WhatsApp");
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchContacts(false);
    checkStatus();
  }, []);

  // Polling status when modal is open or when connecting
  useEffect(() => {
    if (isConnectModalOpen || waStatus === "connecting" || waStatus === "qr_ready") {
      statusPollingRef.current = setInterval(() => {
        checkStatus();
      }, 2500);
    } else {
      if (statusPollingRef.current) clearInterval(statusPollingRef.current);
    }

    return () => {
      if (statusPollingRef.current) clearInterval(statusPollingRef.current);
    };
  }, [isConnectModalOpen, waStatus]);

  // When selectedPhone changes, fetch its messages
  useEffect(() => {
    if (selectedPhone) {
      fetchMessagesForPhone(selectedPhone);
    }
  }, [selectedPhone]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 6. Supabase Realtime Subscription for Live WhatsApp Logs
  useEffect(() => {
    const channel = supabase
      .channel("admin-whatsapp-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "whatsapp_logs" },
        (payload) => {
          const newRow = payload.new;
          if (!newRow) return;

          // If message belongs to selected contact, append
          if (selectedPhone && newRow.phone_number === selectedPhone) {
            setMessages((prev) => [...prev, newRow]);
          }

          // Update contacts list preview
          setContacts((prev) => {
            const copy = [...prev];
            const idx = copy.findIndex((c) => c.phoneNumber === newRow.phone_number);
            if (idx >= 0) {
              copy[idx] = {
                ...copy[idx],
                lastMessage: newRow.message_text,
                lastMessageDirection: newRow.direction,
                lastTimestamp: newRow.created_at,
                lastFlowState: newRow.flow_state,
                totalMessages: (copy[idx].totalMessages || 0) + 1,
              };
              const [updated] = copy.splice(idx, 1);
              return [updated, ...copy];
            } else {
              return [
                {
                  phoneNumber: newRow.phone_number,
                  senderName: newRow.sender_name || newRow.phone_number,
                  lastMessage: newRow.message_text,
                  lastMessageDirection: newRow.direction,
                  lastTimestamp: newRow.created_at,
                  lastFlowState: newRow.flow_state,
                  totalMessages: 1,
                },
                ...copy,
              ];
            }
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedPhone, supabase]);

  // 7. Handle Simulation Message Send
  const handleSendSimulation = async (e) => {
    e.preventDefault();
    if (!simText.trim() || !selectedPhone) return;

    const currentContact = contacts.find((c) => c.phoneNumber === selectedPhone);
    const senderName = currentContact?.senderName || "Pelanggan NekoStay";

    try {
      setIsSimulating(true);
      const res = await fetch("/api/whatsapp/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: selectedPhone,
          senderName,
          messageText: simText.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Simulasi gagal");

      setSimText("");
      toast.success("Pesan simulasi terkirim & dibalas oleh bot!");
      fetchMessagesForPhone(selectedPhone);
    } catch (err) {
      toast.error(err.message || "Gagal mengirim simulasi");
    } finally {
      setIsSimulating(false);
    }
  };

  // Helper formatting
  const formatPhoneNumber = (num) => {
    if (!num) return "-";
    const clean = String(num).replace(/[^0-9]/g, "");
    if (clean.startsWith("62")) {
      return `+62 ${clean.slice(2, 5)}-${clean.slice(5, 9)}-${clean.slice(9)}`;
    }
    return clean;
  };

  const formatRelativeTime = (isoString) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHr / 24);

    if (diffMin < 1) return "Baru saja";
    if (diffMin < 60) return `${diffMin} mnt lalu`;
    if (diffHr < 24) return `${diffHr} jam lalu`;
    if (diffDays === 1) return "Kemarin";
    if (diffDays < 7) return `${diffDays} hari lalu`;
    return date.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
  };

  const formatTimeOnly = (isoString) => {
    if (!isoString) return "";
    return new Date(isoString).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getFlowBadge = (state) => {
    switch (state) {
      case "main_menu":
        return { label: "Menu Utama", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" };
      case "schedule_menu":
      case "awaiting_schedule_fill":
        return { label: "Ubah Jadwal", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" };
      case "class_menu":
      case "awaiting_class_fill":
        return { label: "Ubah Kelas", color: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20" };
      case "completed":
        return { label: "Pengajuan Selesai", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" };
      default:
        return { label: "Aktif", color: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20" };
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("ID Booking disalin ke clipboard!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredContacts = contacts.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.phoneNumber.includes(q) ||
      (c.senderName && c.senderName.toLowerCase().includes(q)) ||
      (c.lastMessage && c.lastMessage.toLowerCase().includes(q))
    );
  });

  const selectedContact = contacts.find((c) => c.phoneNumber === selectedPhone);

  const groupedMessages = messages.reduce((groups, msg) => {
    const dateStr = new Date(msg.created_at).toLocaleDateString("id-ID", {
      dateStyle: "full",
    });
    if (!groups[dateStr]) groups[dateStr] = [];
    groups[dateStr].push(msg);
    return groups;
  }, {});

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card dark:bg-zinc-900 border border-border dark:border-zinc-800/80 p-5 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 shrink-0">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/20">
                WHATSAPP CARE LOGS
              </span>
              <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3 text-emerald-500" /> 7 Hari Terakhir
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-foreground dark:text-zinc-50 tracking-tight mt-0.5">
              Log Percakapan & Bot WhatsApp
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Live WA Connection Status Button */}
          <button
            onClick={() => {
              setIsConnectModalOpen(true);
              if (waStatus === "disconnected") {
                handleStartConnect();
              }
            }}
            className={cn(
              "flex items-center gap-2 px-3.5 py-2 text-xs font-extrabold rounded-xl transition-all shadow-sm border cursor-pointer",
              waStatus === "connected"
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                : waStatus === "connecting" || waStatus === "qr_ready"
                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20 animate-pulse"
                : "bg-primary text-white border-primary hover:bg-primary/90 shadow-primary/20"
            )}
          >
            {waStatus === "connected" ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>WA Terhubung ({formatPhoneNumber(connectedPhone || targetPhone)})</span>
              </>
            ) : waStatus === "qr_ready" ? (
              <>
                <QrCode className="w-4 h-4" />
                <span>Scan QR WhatsApp...</span>
              </>
            ) : (
              <>
                <QrCode className="w-4 h-4" />
                <span>Sambungkan WhatsApp Web</span>
              </>
            )}
          </button>

          <button
            onClick={() => {
              fetchContacts(true);
              if (selectedPhone) fetchMessagesForPhone(selectedPhone);
              checkStatus();
              toast.success("Data diperbarui");
            }}
            className="flex items-center gap-2 px-3.5 py-2 border border-border dark:border-zinc-800 hover:bg-muted text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", (isLoadingContacts || isLoadingMessages) && "animate-spin text-primary")} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Main Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[640px] h-[calc(100vh-14rem)]">
        {/* Left Column: Contacts List */}
        <div className="lg:col-span-4 xl:col-span-4 bg-card dark:bg-zinc-900 border border-border dark:border-zinc-800/80 rounded-2xl flex flex-col overflow-hidden shadow-sm">
          <div className="p-4 border-b border-border dark:border-zinc-800 space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Cari nomor atau nama..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-muted/60 dark:bg-zinc-950 border border-border dark:border-zinc-800 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all placeholder:text-muted-foreground"
              />
            </div>
            <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground px-1">
              <span>{filteredContacts.length} Kontak Aktif</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-extrabold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Sync
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-border/60 dark:divide-zinc-800/60 no-scrollbar">
            {isLoadingContacts ? (
              <div className="p-8 text-center space-y-2">
                <RefreshCw className="w-6 h-6 animate-spin text-primary mx-auto" />
                <p className="text-xs text-muted-foreground font-medium">Memuat kontak...</p>
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <MessageSquare className="w-8 h-8 text-muted-foreground/40 mx-auto" />
                <p className="text-xs font-bold text-foreground dark:text-zinc-300">Tidak ada percakapan</p>
                <p className="text-[11px] text-muted-foreground">Belum ada chat masuk dalam 7 hari terakhir.</p>
              </div>
            ) : (
              filteredContacts.map((c) => {
                const isSelected = c.phoneNumber === selectedPhone;
                const badge = getFlowBadge(c.lastFlowState);

                return (
                  <button
                    key={c.phoneNumber}
                    onClick={() => setSelectedPhone(c.phoneNumber)}
                    className={cn(
                      "w-full text-left p-4 transition-all duration-200 flex items-start gap-3.5 group cursor-pointer relative",
                      isSelected
                        ? "bg-primary/10 dark:bg-primary/15 border-l-4 border-primary"
                        : "hover:bg-muted/50 dark:hover:bg-zinc-800/50"
                    )}
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 font-black text-sm">
                      <User className="w-5 h-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <h4 className="text-xs font-extrabold text-foreground dark:text-zinc-100 truncate">
                          {c.senderName || formatPhoneNumber(c.phoneNumber)}
                        </h4>
                        <span className="text-[10px] text-muted-foreground shrink-0 font-medium">
                          {formatRelativeTime(c.lastTimestamp)}
                        </span>
                      </div>

                      <p className="text-[11px] font-semibold text-muted-foreground truncate mb-1.5">
                        {formatPhoneNumber(c.phoneNumber)}
                      </p>

                      <p className="text-[11px] text-muted-foreground/80 dark:text-zinc-400 line-clamp-1 break-all">
                        {c.lastMessageDirection === "outgoing" && (
                          <span className="text-primary font-bold mr-1">Bot:</span>
                        )}
                        {c.lastMessage || "Membuka obrolan..."}
                      </p>

                      <div className="flex items-center gap-1.5 mt-2">
                        <span className={cn("text-[9px] font-bold px-2 py-0.5 rounded-md border", badge.color)}>
                          {badge.label}
                        </span>
                        <span className="text-[9px] font-semibold text-muted-foreground/70 bg-muted dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                          {c.totalMessages} pesan
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Detailed Conversation History */}
        <div className="lg:col-span-8 xl:col-span-8 bg-card dark:bg-zinc-900 border border-border dark:border-zinc-800/80 rounded-2xl flex flex-col overflow-hidden shadow-sm">
          {selectedContact ? (
            <>
              {/* Chat Panel Header */}
              <div className="p-4 border-b border-border dark:border-zinc-800 flex items-center justify-between gap-4 bg-muted/20 dark:bg-zinc-950/40">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white shrink-0 font-black shadow-md shadow-emerald-500/20">
                    <User className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-extrabold text-foreground dark:text-zinc-50 truncate">
                        {selectedContact.senderName}
                      </h3>
                      <span className="w-2 h-2 rounded-full bg-emerald-500" title="Online / Aktif" />
                    </div>
                    <p className="text-xs font-semibold text-muted-foreground">
                      {formatPhoneNumber(selectedContact.phoneNumber)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={`https://wa.me/${selectedContact.phoneNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Buka di WhatsApp</span>
                    <ExternalLink className="w-3 h-3 opacity-80" />
                  </a>
                </div>
              </div>

              {/* 7-Day Info Banner */}
              <div className="bg-amber-500/10 dark:bg-amber-500/15 border-b border-amber-500/20 px-4 py-2 flex items-center justify-between text-[11px] text-amber-700 dark:text-amber-400 font-semibold">
                <div className="flex items-center gap-2">
                  <Info className="w-3.5 h-3.5 shrink-0" />
                  <span>Menampilkan log percakapan <strong>7 hari terakhir</strong>.</span>
                </div>
                <span>{messages.length} Pesan</span>
              </div>

              {/* Messages Scroll Area */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 no-scrollbar bg-slate-50/50 dark:bg-zinc-950/50">
                {isLoadingMessages ? (
                  <div className="flex items-center justify-center h-full">
                    <RefreshCw className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center space-y-2 py-12">
                    <MessageSquare className="w-10 h-10 text-muted-foreground/30" />
                    <p className="text-sm font-bold text-foreground">Belum ada riwayat pesan</p>
                    <p className="text-xs text-muted-foreground">Pesan yang dikirim atau diterima akan muncul di sini.</p>
                  </div>
                ) : (
                  Object.entries(groupedMessages).map(([dateLabel, msgs]) => (
                    <div key={dateLabel} className="space-y-4">
                      {/* Date Divider */}
                      <div className="flex items-center justify-center my-4">
                        <span className="px-3 py-1 bg-muted dark:bg-zinc-800 text-[10px] font-bold text-muted-foreground rounded-full border border-border dark:border-zinc-700 shadow-2xs">
                          {dateLabel}
                        </span>
                      </div>

                      {/* Message Bubbles */}
                      {msgs.map((m) => {
                        const isOutgoing = m.direction === "outgoing";
                        const metadata = m.metadata || {};
                        const bookingId = metadata.bookingId || (m.message_text.match(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/) || [])[0];

                        return (
                          <div
                            key={m.id}
                            className={cn(
                              "flex flex-col max-w-[85%] sm:max-w-[75%]",
                              isOutgoing ? "ml-auto items-end" : "mr-auto items-start"
                            )}
                          >
                            {/* Sender Label */}
                            <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px] font-bold text-muted-foreground">
                              {isOutgoing ? (
                                <>
                                  <Bot className="w-3 h-3 text-primary" />
                                  <span className="text-primary font-extrabold">NekoStay Bot</span>
                                </>
                              ) : (
                                <>
                                  <User className="w-3 h-3 text-emerald-500" />
                                  <span>{m.sender_name || "Pelanggan"}</span>
                                </>
                              )}
                              <span>•</span>
                              <span>{formatTimeOnly(m.created_at)}</span>
                            </div>

                            {/* Message Bubble Card */}
                            <div
                              className={cn(
                                "p-3.5 sm:p-4 rounded-2xl text-xs sm:text-[13px] leading-relaxed shadow-xs whitespace-pre-line break-words border",
                                isOutgoing
                                  ? "bg-primary/10 dark:bg-primary/15 border-primary/20 text-foreground dark:text-zinc-100 rounded-tr-xs"
                                  : "bg-white dark:bg-zinc-900 border-border dark:border-zinc-800 text-foreground dark:text-zinc-100 rounded-tl-xs"
                              )}
                            >
                              {m.message_text}

                              {/* Recognized Booking Action Box */}
                              {bookingId && (
                                <div className="mt-3.5 pt-3 border-t border-border/80 dark:border-zinc-800 bg-muted/40 dark:bg-zinc-950/60 p-3 rounded-xl space-y-2">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-[10px] font-black text-primary uppercase tracking-wider flex items-center gap-1">
                                      <Sparkles className="w-3 h-3" /> Terdeteksi ID Booking
                                    </span>
                                    <button
                                      onClick={() => copyToClipboard(bookingId, m.id)}
                                      className="text-[10px] font-bold text-muted-foreground hover:text-foreground flex items-center gap-1 bg-background px-2 py-0.5 rounded border border-border cursor-pointer"
                                    >
                                      {copiedId === m.id ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                                      {copiedId === m.id ? "Tersalin" : "Salin ID"}
                                    </button>
                                  </div>

                                  <p className="text-[11px] font-mono font-bold text-foreground dark:text-zinc-200 bg-background dark:bg-zinc-900 p-1.5 rounded border border-border/60 truncate">
                                    {bookingId}
                                  </p>

                                  <div className="flex items-center gap-2 pt-1">
                                    <Link
                                      href={`/admin/bookings/${bookingId}`}
                                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-primary hover:bg-primary/90 text-white text-xs font-bold rounded-xl transition-all shadow-sm shadow-primary/20"
                                    >
                                      <span>📝 Kelola / Edit Booking</span>
                                      <ArrowRight className="w-3.5 h-3.5" />
                                    </Link>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Bot Simulation Footer */}
              <div className="p-3.5 bg-card dark:bg-zinc-900 border-t border-border dark:border-zinc-800">
                <form onSubmit={handleSendSimulation} className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder={`Ketik pesan simulasi untuk menguji respon bot WhatsApp (cth: "1", "menu", format ubah)...`}
                      value={simText}
                      onChange={(e) => setSimText(e.target.value)}
                      disabled={isSimulating}
                      className="w-full pl-4 pr-10 py-2.5 bg-muted/60 dark:bg-zinc-950 border border-border dark:border-zinc-800 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all placeholder:text-muted-foreground"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Bot className="w-4 h-4 text-primary/60" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSimulating || !simText.trim()}
                    className="px-4 py-2.5 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-sm shadow-primary/20 shrink-0 cursor-pointer"
                  >
                    {isSimulating ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    <span>Simulasi Kirim</span>
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
              <div className="w-16 h-16 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <MessageSquare className="w-8 h-8" />
              </div>
              <h3 className="text-base font-extrabold text-foreground">Pilih Kontak WhatsApp</h3>
              <p className="text-xs text-muted-foreground max-w-sm">
                Pilih nomor dari daftar di sebelah kiri untuk melihat seluruh riwayat chat 7 hari terakhir dan mengelola pengajuan perubahan dari pelanggan.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* WHATSAPP WEB CONNECTION MODAL (SCAN QR CODE) */}
      {isConnectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-card dark:bg-zinc-900 border border-border dark:border-zinc-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-border dark:border-zinc-800 flex items-center justify-between bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-foreground">Koneksi WhatsApp Web</h3>
                  <p className="text-xs text-muted-foreground">Tautkan nomor +62 823 7198 6344</p>
                </div>
              </div>
              <button
                onClick={() => setIsConnectModalOpen(false)}
                className="w-8 h-8 rounded-xl hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6">
              {waStatus === "connected" ? (
                /* Connected State */
                <div className="text-center space-y-4 py-4">
                  <div className="w-16 h-16 bg-emerald-500/10 border-2 border-emerald-500 rounded-full flex items-center justify-center text-emerald-500 mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-foreground">WhatsApp Berhasil Terhubung!</h4>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold mt-1">
                      Nomor Aktif: {formatPhoneNumber(connectedPhone || targetPhone)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2 max-w-xs mx-auto">
                      Bot auto-reply NekoStay saat ini aktif dan siap membalas pesan pelanggan secara otomatis.
                    </p>
                  </div>

                  <div className="pt-4 flex justify-center gap-3">
                    <button
                      onClick={handleDisconnect}
                      disabled={isDisconnecting}
                      className="px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>{isDisconnecting ? "Memutuskan..." : "Putuskan Koneksi"}</span>
                    </button>
                    <button
                      onClick={() => setIsConnectModalOpen(false)}
                      className="px-5 py-2.5 bg-primary text-white text-xs font-bold rounded-xl shadow-md shadow-primary/20 cursor-pointer"
                    >
                      Tutup
                    </button>
                  </div>
                </div>
              ) : (
                /* QR Code Scanner View */
                <div className="space-y-5 text-center">
                  <div className="w-68 h-68 mx-auto bg-white p-3 rounded-2xl border-2 border-emerald-500/40 shadow-md flex items-center justify-center relative">
                    {qrCodeUrl ? (
                      <img
                        src={qrCodeUrl}
                        alt="WhatsApp Web QR Code"
                        className="w-full h-full object-contain rounded-lg"
                      />
                    ) : (
                      <div className="space-y-2 text-center">
                        <RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto" />
                        <p className="text-xs font-bold text-zinc-600">Menghasilkan QR Code...</p>
                      </div>
                    )}
                  </div>

                  <div className="bg-muted/40 dark:bg-zinc-950/60 p-4 rounded-2xl border border-border text-left space-y-2 text-xs">
                    <p className="font-extrabold text-foreground">Langkah-langkah di HP Anda (+62 823 7198 6344):</p>
                    <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                      <li>Buka aplikasi <strong>WhatsApp</strong> di HP Anda</li>
                      <li>Tekan menu <strong>Titik Tiga (⋮)</strong> atau <strong>Pengaturan</strong></li>
                      <li>Pilih <strong>Perangkat Tertaut</strong> &gt; <strong>Tautkan Perangkat</strong></li>
                      <li>Arahkan kamera HP ke QR Code di atas</li>
                    </ol>
                  </div>

                  <button
                    onClick={handleStartConnect}
                    disabled={isConnecting}
                    className="px-4 py-2 border border-border hover:bg-muted text-xs font-bold rounded-xl transition-all inline-flex items-center gap-2 cursor-pointer"
                  >
                    <RefreshCw className={cn("w-3.5 h-3.5", isConnecting && "animate-spin text-primary")} />
                    <span>Muat Ulang QR Code Baru</span>
                  </button>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-border dark:border-zinc-800 bg-muted/20 flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5 font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-500" /> End-to-End Encrypted
              </span>
              <button
                onClick={() => setIsConnectModalOpen(false)}
                className="px-4 py-1.5 border border-border hover:bg-muted font-bold rounded-xl transition-all cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
