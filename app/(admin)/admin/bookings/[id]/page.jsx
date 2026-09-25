"use client";

import { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Cat,
  Calendar,
  Layers,
  ArrowLeft,
  Send,
  PhoneCall,
  AlertCircle,
  CheckCircle2,
  HeartPulse,
  FileText,
  Plus,
  Edit3,
  X,
  Star,
  ChevronDown,
  Wallet,
  Check,
  Mail,
  Copy,
  User,
  Utensils,
  Baby,
  Sparkles,
  ExternalLink,
  MessageCircle,
  ShieldCheck,
  Tag,
  Clock,
  ChevronRight,
  Info,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { BookingStatus } from "@/components/booking/BookingStatus";
import { ImageUpload } from "@/components/shared/ImageUpload";
import { GsapDataLoader } from "@/components/shared/GsapDataLoader";
import { GsapTextButton } from "@/components/shared/GsapTextButton";
import { useAutoDismiss } from "@/hooks/useAutoDismiss";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { formatDate } from "@/lib/utils/dates";
import { formatRupiah } from "@/lib/utils/format";
import { toast } from "sonner";
import { AdminBookingStickyAlert } from "@/components/admin/AdminBookingStickyAlert";
import { AdminBookingNotesTimeline } from "@/components/admin/AdminBookingNotesTimeline";
import { EmergencyPaymentModal } from "@/components/admin/EmergencyPaymentModal";
import { UserErrorAlert } from "@/components/shared/UserErrorAlert";

export default function AdminBookingDetailPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const [booking, setBooking] = useState(null);
  const [reports, setReports] = useState([]);
  const [availableClasses, setAvailableClasses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [copiedId, setCopiedId] = useState(false);

  // Review States
  const [review, setReview] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [replySuccess, setReplySuccess] = useState(null);

  // Report Form States
  const [healthStatus, setHealthStatus] = useState("Sehat");
  const [reportPhoto, setReportPhoto] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(null);

  // Edit Form States
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editClass, setEditClass] = useState("");
  const [editCheckIn, setEditCheckIn] = useState("");
  const [editCheckOut, setEditCheckOut] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Admin Notes States (Multi-admin activity feed & sticky alerts)
  const [adminNotesList, setAdminNotesList] = useState([]);
  const [isNotesActionLoading, setIsNotesActionLoading] = useState(false);

  // Payment Status States
  const [isUpdatingPayment, setIsUpdatingPayment] = useState(false);
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [targetPaymentStatus, setTargetPaymentStatus] = useState(null);

  // Resend Receipt States
  const [isResendingReceipt, setIsResendingReceipt] = useState(false);
  const [resendReceiptMsg, setResendReceiptMsg] = useState(null);

  // Auto-dismiss alert notifications after 3 seconds
  useAutoDismiss(errorMsg, setErrorMsg);
  useAutoDismiss(replySuccess, setReplySuccess);
  useAutoDismiss(reportSuccess, setReportSuccess);
  useAutoDismiss(resendReceiptMsg, setResendReceiptMsg);

  const supabase = createClient();

  const loadBookingDetails = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select(
          `
          *,
          profiles:user_id (id, full_name, phone, email)
        `,
        )
        .eq("id", id)
        .single();

      if (error) throw error;
      setBooking(data);
      setEditClass(data.class);
      setEditCheckIn(data.check_in_date);
      setEditCheckOut(data.check_out_date);

      // Fetch dynamic room classes
      const { data: classList } = await supabase
        .from("classes")
        .select("*")
        .order("price_per_day", { ascending: true });

      if (classList && classList.length > 0) {
        setAvailableClasses(classList);
      }

      // Fetch reports
      const { data: reportsData } = await supabase
        .from("cat_reports")
        .select("*")
        .eq("booking_id", id)
        .order("report_date", { ascending: false });

      if (reportsData) {
        setReports(reportsData);
      }

      // Fetch admin notes
      const { data: notesData } = await supabase
        .from("booking_admin_notes")
        .select("*, profiles:admin_id(id, full_name, role)")
        .eq("booking_id", id)
        .order("created_at", { ascending: false });

      if (notesData) {
        setAdminNotesList(notesData);
      }

      // Fetch review
      const { data: reviewData } = await supabase
        .from("reviews")
        .select("*")
        .eq("booking_id", id)
        .maybeSingle();

      if (reviewData) {
        setReview(reviewData);
        setReplyText(reviewData.reply_text || "");
      }
    } catch (err) {
      console.error("Error fetching admin booking details:", err);
      setErrorMsg("Gagal memuat detail pesanan.");
    } finally {
      setIsLoading(false);
    }
  }, [id, supabase]);

  useEffect(() => {
    loadBookingDetails();

    if (!id) return;

    let debounceTimer = null;
    const triggerDebouncedReload = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        loadBookingDetails();
      }, 300);
    };

    const channelId = `admin-booking-detail-realtime-${id}-${Math.random().toString(36).substring(7)}`;
    const channel = supabase
      .channel(channelId)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookings", filter: `id=eq.${id}` },
        () => {
          triggerDebouncedReload();
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "cat_reports", filter: `booking_id=eq.${id}` },
        () => {
          triggerDebouncedReload();
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reviews", filter: `booking_id=eq.${id}` },
        () => {
          triggerDebouncedReload();
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "booking_admin_notes", filter: `booking_id=eq.${id}` },
        () => {
          triggerDebouncedReload();
        },
      )
      .subscribe();

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
    };
  }, [id, loadBookingDetails, supabase]);

  // Handle 1-click copy booking ID
  const handleCopyId = () => {
    if (!booking?.id) return;
    navigator.clipboard.writeText(booking.id);
    setCopiedId(true);
    toast.success("ID Pesanan disalin ke clipboard!");
    setTimeout(() => setCopiedId(false), 2000);
  };

  // Handle reply submission
  const handleReplySubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setReplySuccess(null);
    setIsSubmittingReply(true);

    try {
      const response = await fetch(`/api/reviews/reply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookingId: id,
          replyText,
        }),
      });

      const resData = await response.json();
      if (!response.ok) throw new Error(resData.error || "Gagal mengirim balasan.");

      setReplySuccess("Balasan ulasan berhasil dikirim via email dan disimpan!");
      toast.success("Balasan ulasan berhasil dikirim via email!");

      // Reload reviews
      const { data: updatedReview } = await supabase
        .from("reviews")
        .select("*")
        .eq("booking_id", id)
        .maybeSingle();

      if (updatedReview) {
        setReview(updatedReview);
      }
    } catch (err) {
      console.error("Error replying to review:", err);
      setErrorMsg(err.message || "Gagal membalas ulasan.");
      toast.error(err.message || "Gagal membalas ulasan.");
    } finally {
      setIsSubmittingReply(false);
    }
  };

  // Handle report submission
  const handleAddReport = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setReportSuccess(null);
    setIsSubmittingReport(true);

    try {
      const response = await fetch(`/api/bookings/${id}/report`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          healthStatus,
          photoUrl: reportPhoto || null,
          notes: notes || null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Gagal menyimpan laporan harian.");
      }

      setReportSuccess(
        "Laporan kondisi kucing berhasil ditambahkan dan pemilik telah dinotifikasi!",
      );
      toast.success("Laporan harian berhasil dikirim ke pemilik!");
      // Reset form
      setNotes("");
      setReportPhoto("");
      loadBookingDetails();
    } catch (err) {
      setErrorMsg(err.message || "Gagal menyimpan laporan harian.");
      toast.error(err.message || "Gagal menyimpan laporan harian.");
    } finally {
      setIsSubmittingReport(false);
    }
  };

  // Handle edit submission
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSavingEdit(true);

    try {
      const response = await fetch(`/api/bookings/${id}/edit`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          className: editClass,
          checkInDate: editCheckIn,
          checkOutDate: editCheckOut,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      toast.success("Perubahan data pesanan berhasil disimpan!");
      setIsEditOpen(false);
      loadBookingDetails();
    } catch (err) {
      setErrorMsg(err.message || "Gagal menyimpan perubahan pesanan.");
      toast.error(err.message || "Gagal menyimpan perubahan.");
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Multi-Admin Notes Handlers (Option 5: Sticky Alert Banner + Activity Feed)
  const handleCreateAdminNote = async ({ category, content, isPinned }) => {
    setIsNotesActionLoading(true);
    try {
      const res = await fetch(`/api/bookings/${id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, content, is_pinned: isPinned }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan catatan.");

      toast.success("Catatan admin berhasil ditambahkan!");
      await loadBookingDetails();
    } catch (err) {
      toast.error(err.message || "Gagal menyimpan catatan.");
    } finally {
      setIsNotesActionLoading(false);
    }
  };

  const handleTogglePinNote = async (noteId, currentPin) => {
    setIsNotesActionLoading(true);
    try {
      const res = await fetch(`/api/bookings/${id}/notes/${noteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_pinned: !currentPin }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengubah status sematan.");

      toast.success(!currentPin ? "Catatan disematkan ke banner kritis!" : "Sematan catatan dilepas.");
      await loadBookingDetails();
    } catch (err) {
      toast.error(err.message || "Gagal mengubah status sematan.");
    } finally {
      setIsNotesActionLoading(false);
    }
  };

  const handleDeleteAdminNote = async (noteId) => {
    setIsNotesActionLoading(true);
    try {
      const res = await fetch(`/api/bookings/${id}/notes/${noteId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menghapus catatan.");

      toast.success("Catatan admin berhasil dihapus.");
      await loadBookingDetails();
    } catch (err) {
      toast.error(err.message || "Gagal menghapus catatan.");
    } finally {
      setIsNotesActionLoading(false);
    }
  };


  // Open emergency payment modal
  const handleOpenEmergencyPaymentModal = (newStatus) => {
    if (booking.payment_status === newStatus) return;
    setTargetPaymentStatus(newStatus);
    setIsEmergencyModalOpen(true);
  };

  // Handle payment status toggle with reason
  const handlePaymentStatusChange = async (reason) => {
    if (!targetPaymentStatus || booking.payment_status === targetPaymentStatus) return;
    setIsUpdatingPayment(true);
    try {
      const res = await fetch(`/api/bookings/${id}/payment-status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentStatus: targetPaymentStatus,
          reason,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal mengubah status pembayaran");
      }
      const labelMap = {
        Paid: "Lunas",
        Unpaid: "Belum Dibayar",
        Failed: "Gagal",
        Refunded: "Dikembalikan",
      };
      toast.success(`Status pembayaran berhasil diubah ke ${labelMap[targetPaymentStatus] || targetPaymentStatus}!`);
      setIsEmergencyModalOpen(false);
      setTargetPaymentStatus(null);
      loadBookingDetails();
    } catch (err) {
      setErrorMsg(err.message);
      toast.error(err.message || "Gagal mengubah status pembayaran.");
    } finally {
      setIsUpdatingPayment(false);
    }
  };

  // Handle resend receipt
  const handleResendReceipt = async () => {
    setIsResendingReceipt(true);
    setResendReceiptMsg(null);
    try {
      const res = await fetch(`/api/bookings/${id}/resend-receipt`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengirim ulang bukti pesanan");
      setResendReceiptMsg({ type: "success", text: data.message });
      toast.success("Bukti PDF & QR berhasil dikirim ulang ke email pemilik!");
    } catch (err) {
      setResendReceiptMsg({ type: "error", text: err.message });
      toast.error(err.message || "Gagal mengirim ulang bukti pesanan.");
    } finally {
      setIsResendingReceipt(false);
    }
  };

  if (isLoading) {
    return <GsapDataLoader type="detail" message="Memuat detail pesanan..." />;
  }

  if (!booking) {
    return (
      <div className="text-center py-20 max-w-md mx-auto space-y-4">
        <div className="p-4 bg-rose-500/10 text-rose-600 rounded-2xl w-fit mx-auto border border-rose-500/20">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-black text-foreground">
          Pesanan Tidak Ditemukan
        </h3>
        <p className="text-sm text-muted-foreground">
          ID pesanan tidak terdaftar atau telah dihapus dari sistem.
        </p>
        <div className="pt-2">
          <Link
            href="/admin/bookings"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-xs font-bold rounded-xl shadow-md shadow-primary/10 hover:bg-primary/95 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Semua Pesanan</span>
          </Link>
        </div>
      </div>
    );
  }

  const cleanPhone = booking.profiles?.phone ? booking.profiles.phone.replace(/[^0-9]/g, "") : "";
  const waUrl = cleanPhone ? `https://wa.me/${cleanPhone.startsWith("0") ? "62" + cleanPhone.slice(1) : cleanPhone}` : null;

  const pinnedNote = adminNotesList.find((n) => n.is_pinned) || null;

  const finalTotal =
    (booking.estimated_total || 0) -
    (booking.discount_amount || 0) +
    (booking.late_fee_total || 0) -
    (booking.refund_amount || 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8 pb-12">
      {/* Top Breadcrumb Bar */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/admin/bookings"
          className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-all group"
        >
          <div className="w-7 h-7 rounded-xl bg-card border border-border/80 flex items-center justify-center group-hover:border-primary/50 group-hover:text-primary transition-all shadow-2xs">
            <ArrowLeft className="w-3.5 h-3.5" />
          </div>
          <span>Kembali ke Semua Pesanan</span>
        </Link>
        <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
          <span>Detail Pesanan</span>
          <ChevronRight className="w-3 h-3 text-muted-foreground/50" />
          <span className="font-mono font-bold text-foreground">#{booking.id.slice(0, 8)}...</span>
        </span>
      </div>


      {/* Hero Header Control Bar */}
      <div className="bg-card border border-border/80 p-6 sm:p-7 rounded-3xl shadow-xs relative overflow-hidden">
        {/* Soft gradient aura */}
        <div className="absolute -top-16 -right-16 w-56 h-56 bg-primary/10 rounded-full blur-3xl pointer-events-none -z-0" />
        <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-secondary/30 rounded-full blur-3xl pointer-events-none -z-0" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left info */}
          <div className="flex items-start sm:items-center gap-4.5">
            <div className="p-4 bg-primary/10 text-primary rounded-2xl border border-primary/20 shadow-xs shrink-0">
              <Cat className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                  {booking.cat_name}
                </h1>
                <BookingStatus status={booking.status} />

                {/* Payment Status Pill */}
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold border ${
                    booking.payment_status === "Paid"
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                      : booking.payment_status === "Failed"
                        ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                        : booking.payment_status === "Refunded"
                          ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                          : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      booking.payment_status === "Paid"
                        ? "bg-emerald-500"
                        : booking.payment_status === "Failed"
                          ? "bg-rose-500"
                          : booking.payment_status === "Refunded"
                            ? "bg-blue-500"
                            : "bg-amber-500"
                    }`}
                  />
                  <span>
                    {booking.payment_status === "Paid"
                      ? "Lunas"
                      : booking.payment_status === "Failed"
                        ? "Gagal"
                        : booking.payment_status === "Refunded"
                          ? "Dikembalikan"
                          : "Belum Dibayar"}
                  </span>
                </span>
              </div>

              {/* Booking ID & Owner Links */}
              <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
                <button
                  type="button"
                  onClick={handleCopyId}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/60 hover:bg-muted text-foreground border border-border/60 transition-all font-mono font-bold cursor-pointer group"
                  title="Salin ID Pesanan"
                >
                  <span>#{booking.id}</span>
                  {copiedId ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                  )}
                </button>

                <span className="hidden sm:inline text-border">•</span>

                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="font-semibold text-foreground">
                    {booking.profiles?.full_name || "Pelanggan"}
                  </span>
                </div>

                {waUrl && (
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline font-bold transition-all bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp Pemilik</span>
                    <ExternalLink className="w-3 h-3 ml-0.5 opacity-70" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            {(booking.status === "Menunggu" || booking.status === "Aktif") && (
              <button
                type="button"
                onClick={() => setIsEditOpen(true)}
                className="px-4 py-2.5 bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 transition-all rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <Edit3 className="w-4 h-4" />
                <span>Edit Pesanan</span>
              </button>
            )}

            {booking.status === "Aktif" && (
              <button
                type="button"
                disabled={isResendingReceipt}
                onClick={handleResendReceipt}
                className="px-4 py-2.5 bg-card hover:bg-muted/80 border border-border text-foreground transition-all rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
              >
                <Mail className="w-4 h-4 text-primary" />
                <span>{isResendingReceipt ? "Mengirim..." : "Kirim Ulang Bukti PDF & QR"}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Global Alerts */}
      <UserErrorAlert error={errorMsg} onDismiss={() => setErrorMsg(null)} className="mb-4" />

      {reportSuccess && (
        <div className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-2xl p-4 text-xs font-bold flex items-center gap-2.5 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
          <span>{reportSuccess}</span>
        </div>
      )}

      {resendReceiptMsg && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2.5 border animate-in fade-in duration-200 ${
            resendReceiptMsg.type === "success"
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
              : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
          }`}
        >
          {resendReceiptMsg.type === "success" ? (
            <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
          ) : (
            <AlertCircle className="w-4.5 h-4.5 text-rose-500 shrink-0" />
          )}
          <span>{resendReceiptMsg.text}</span>
        </div>
      )}

      {/* Layer 1: Sticky Alert Banner (Option 5) */}
      <AdminBookingStickyAlert
        pinnedNote={pinnedNote}
        onUnpin={() => pinnedNote && handleTogglePinNote(pinnedNote.id, true)}
        onOpenCreateModal={() => {
          const feedEl = document.getElementById("admin-notes-feed-section");
          if (feedEl) feedEl.scrollIntoView({ behavior: "smooth" });
        }}
        isActionLoading={isNotesActionLoading}
      />

      {/* Two-Column Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-start">
        {/* Left Side (2 cols on lg) */}
        <div className="lg:col-span-2 space-y-6 sm:space-y-8">
          {/* 1. Cat & Owner Profile Card */}
          <div className="bg-card border border-border/80 p-6 sm:p-7 rounded-3xl shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-border/60 pb-4">
              <h3 className="text-base font-extrabold text-foreground flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <Cat className="w-4.5 h-4.5" />
                </div>
                <div>
                  <span>Profil Anabul & Kontak Pemilik</span>
                  <p className="text-xs font-medium text-muted-foreground mt-0.5">
                    Data lengkap anabul serta jalur komunikasi pemilik
                  </p>
                </div>
              </h3>
            </div>

            {/* Photo Banner if Available */}
            {booking.cat_photo_url && (
              <div className="relative aspect-video sm:aspect-21/9 w-full rounded-2xl overflow-hidden border border-border/80 shadow-xs group">
                <img
                  src={booking.cat_photo_url}
                  alt={`Foto ${booking.cat_name}`}
                  className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute bottom-3 right-3 px-3 py-1 bg-background/80 backdrop-blur-md rounded-xl text-[11px] font-bold text-foreground border border-border/60">
                  Foto Resmi Anabul
                </div>
              </div>
            )}

            {/* Information Grid Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Owner Info */}
              <div className="p-4 bg-muted/30 border border-border/60 rounded-2xl space-y-1.5">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="font-semibold uppercase tracking-wider text-[10px]">Pemilik (Owner)</span>
                  <User className="w-3.5 h-3.5 text-primary" />
                </div>
                <p className="text-sm font-extrabold text-foreground">
                  {booking.profiles?.full_name || "Tidak ada data"}
                </p>
                {booking.profiles?.email && (
                  <p className="text-[11px] text-muted-foreground truncate">
                    {booking.profiles.email}
                  </p>
                )}
                {booking.profiles?.phone && (
                  <div className="pt-1">
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-primary hover:underline font-bold"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>{booking.profiles.phone}</span>
                    </a>
                  </div>
                )}
              </div>

              {/* Cat Gender */}
              <div className="p-4 bg-muted/30 border border-border/60 rounded-2xl space-y-1.5">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="font-semibold uppercase tracking-wider text-[10px]">Jenis Kelamin</span>
                  <Tag className="w-3.5 h-3.5 text-primary" />
                </div>
                <p className="text-sm font-extrabold text-foreground">
                  {booking.cat_gender}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {booking.cat_gender === "Jantan" ? "Mpus Jantan" : "Mpus Betina"}
                </p>
              </div>

              {/* Cat Age */}
              <div className="p-4 bg-muted/30 border border-border/60 rounded-2xl space-y-1.5">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="font-semibold uppercase tracking-wider text-[10px]">Usia Kucing</span>
                  <Clock className="w-3.5 h-3.5 text-primary" />
                </div>
                <p className="text-sm font-extrabold text-foreground">
                  {booking.cat_age}
                </p>
                <p className="text-[11px] text-muted-foreground">Perkiraan usia anabul</p>
              </div>

              {/* Health Status */}
              <div className="p-4 bg-muted/30 border border-border/60 rounded-2xl space-y-1.5">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="font-semibold uppercase tracking-wider text-[10px]">Kondisi Kesehatan Awal</span>
                  <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                </div>
                <p className="text-sm font-extrabold text-foreground">
                  {booking.cat_health_status}
                </p>
                <p className="text-[11px] text-muted-foreground">Status saat pendaftaran check-in</p>
              </div>

              {/* Favorite Food */}
              <div className="p-4 bg-muted/30 border border-border/60 rounded-2xl space-y-1.5">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="font-semibold uppercase tracking-wider text-[10px]">Makanan Terfavorit</span>
                  <Utensils className="w-3.5 h-3.5 text-primary" />
                </div>
                <p className="text-sm font-extrabold text-foreground">
                  {booking.cat_favorite_food || "Tidak ada preferensi khusus"}
                </p>
                <p className="text-[11px] text-muted-foreground">Preferensi makanan harian</p>
              </div>

              {/* Pregnancy Status */}
              <div className="p-4 bg-muted/30 border border-border/60 rounded-2xl space-y-1.5">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="font-semibold uppercase tracking-wider text-[10px]">Kondisi Hamil</span>
                  <Baby className="w-3.5 h-3.5 text-primary" />
                </div>
                <p
                  className={`text-sm font-extrabold ${
                    booking.cat_is_pregnant ? "text-rose-600 dark:text-rose-400" : "text-foreground"
                  }`}
                >
                  {booking.cat_is_pregnant ? "Sedang Hamil" : "Tidak Hamil"}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {booking.cat_is_pregnant ? "Perlu perhatian ekstra perawatan" : "Kondisi normal"}
                </p>
              </div>
            </div>

            {/* Owner Special Notes */}
            <div className="space-y-2 pt-1">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                Catatan Khusus dari Pemilik
              </span>
              {booking.cat_notes ? (
                <div className="p-4 bg-muted/20 border border-border/80 rounded-2xl text-xs font-medium text-foreground leading-relaxed">
                  &quot;{booking.cat_notes}&quot;
                </div>
              ) : (
                <div className="p-3 bg-muted/10 border border-border/40 rounded-xl text-xs text-muted-foreground italic">
                  Tidak ada catatan khusus dari pemilik.
                </div>
              )}
            </div>
          </div>

          {/* 2. Daily Health Report Form (Only if Aktif) */}
          {booking.status === "Aktif" && (
            <div className="bg-card border border-border/80 p-6 sm:p-7 rounded-3xl shadow-xs space-y-6">
              <div className="border-b border-border/60 pb-4">
                <h3 className="text-base font-extrabold text-foreground flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-primary/10 text-primary">
                    <Plus className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <span>Tambah Laporan Harian Kucing</span>
                    <p className="text-xs font-medium text-muted-foreground mt-0.5">
                      Catatan dan foto akan langsung dapat dipantau oleh pemilik di portal user
                    </p>
                  </div>
                </h3>
              </div>

              <form onSubmit={handleAddReport} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                    Status Kesehatan Terkini
                  </label>
                  <select
                    value={healthStatus}
                    onChange={(e) => setHealthStatus(e.target.value)}
                    className="w-full px-4 py-3 bg-muted/30 border border-border/80 rounded-xl text-sm focus:outline-hidden focus:border-primary text-foreground font-medium transition-all"
                  >
                    <option value="Sehat">Sehat (Aktif & Bugar)</option>
                    <option value="Kurang Fit">Kurang Fit (Perlu Pemantauan)</option>
                    <option value="Perlu Perhatian">Perlu Perhatian Khusus (Pemeriksaan Lanjut)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                    Catatan Aktivitas / Kondisi Harian
                  </label>
                  <textarea
                    required
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder="Contoh: Nafsu makan sangat baik, aktif bermain bola benang. Sudah dimandikan & dibersihkan telinga..."
                    className="w-full px-4 py-3 bg-muted/30 border border-border/80 rounded-xl text-sm focus:outline-hidden focus:border-primary text-foreground font-medium transition-all leading-relaxed"
                  />
                </div>

                <div className="space-y-1.5">
                  <ImageUpload
                    value={reportPhoto}
                    onChange={(url) => setReportPhoto(url)}
                    onUpload={(url) => setReportPhoto(url)}
                    defaultValue={reportPhoto}
                    label="Foto Anabul Hari Ini (Opsional)"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <GsapTextButton
                    type="submit"
                    isLoading={isSubmittingReport}
                    idleText="Kirim Laporan Harian"
                    loadingText="Menyimpan..."
                    successText="Laporan Terkirim!"
                    icon={<Send className="w-4 h-4" />}
                    className="px-6 py-3 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/95 transition-all shadow-md shadow-primary/10 cursor-pointer disabled:opacity-50"
                  />
                </div>
              </form>
            </div>
          )}

          {/* 3. Past Reports Timeline */}
          <div className="bg-card border border-border/80 p-6 sm:p-7 rounded-3xl shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-border/60 pb-4">
              <h3 className="text-base font-extrabold text-foreground flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <HeartPulse className="w-4.5 h-4.5" />
                </div>
                <div>
                  <span>Riwayat Kondisi Kucing</span>
                  <p className="text-xs font-medium text-muted-foreground mt-0.5">
                    Log rekam medis dan update harian selama masa inap
                  </p>
                </div>
              </h3>
              <span className="px-3 py-1 bg-muted rounded-full text-xs font-bold text-muted-foreground">
                {reports.length} Laporan
              </span>
            </div>

            {reports.length === 0 ? (
              <div className="text-center py-10 space-y-2">
                <HeartPulse className="w-8 h-8 text-muted-foreground/40 mx-auto" />
                <p className="text-xs font-medium text-muted-foreground">
                  Belum ada laporan kondisi harian yang dibuat untuk pesanan ini.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {reports.map((report) => (
                  <div
                    key={report.id}
                    className="p-5 border border-border/80 rounded-2xl space-y-3 bg-muted/10 hover:border-primary/30 transition-all shadow-2xs"
                  >
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <span className="text-xs font-bold text-muted-foreground flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-primary" />
                        <span>{formatDate(report.report_date, "long")}</span>
                      </span>
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-extrabold rounded-full border ${
                          report.health_status === "Sehat"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                            : report.health_status === "Kurang Fit"
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                              : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            report.health_status === "Sehat"
                              ? "bg-emerald-500"
                              : report.health_status === "Kurang Fit"
                                ? "bg-amber-500"
                                : "bg-rose-500"
                          }`}
                        />
                        {report.health_status}
                      </span>
                    </div>

                    {report.photo_url && (
                      <div className="relative aspect-video max-w-md rounded-xl overflow-hidden border border-border/60 shadow-2xs">
                        <img
                          src={report.photo_url}
                          alt="Foto Kondisi Kucing"
                          className="object-cover w-full h-full"
                        />
                      </div>
                    )}

                    {report.notes && (
                      <p className="text-xs text-foreground bg-card p-3.5 rounded-xl border border-border/60 leading-relaxed font-medium">
                        {report.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 4. Customer Review & Admin Reply Thread (Only if Selesai) */}
          {booking.status === "Selesai" && (
            <div className="bg-card border border-border/80 p-6 sm:p-7 rounded-3xl shadow-xs space-y-6">
              <div className="flex items-center justify-between border-b border-border/60 pb-4">
                <h3 className="text-base font-extrabold text-foreground flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                    <Star className="w-4.5 h-4.5 fill-amber-500" />
                  </div>
                  <div>
                    <span>Ulasan & Rating Pelanggan</span>
                    <p className="text-xs font-medium text-muted-foreground mt-0.5">
                      Feedback pengalaman penitipan dari pemilik kucing
                    </p>
                  </div>
                </h3>
              </div>

              {!review ? (
                <div className="text-center py-10 space-y-2">
                  <Star className="w-8 h-8 text-muted-foreground/30 mx-auto" />
                  <p className="text-xs font-medium text-muted-foreground">
                    Pelanggan belum memberikan ulasan untuk pesanan ini.
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="p-5 border border-border/80 rounded-2xl space-y-3 bg-muted/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${
                              star <= review.rating
                                ? "text-amber-500 fill-amber-500"
                                : "text-muted-foreground/30"
                            }`}
                          />
                        ))}
                        <span className="text-xs font-bold text-foreground ml-1.5">
                          {review.rating}.0 / 5.0
                        </span>
                      </div>
                      <span className="text-[11px] text-muted-foreground">
                        {new Date(review.created_at).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>

                    {review.review_text ? (
                      <p className="text-xs text-foreground bg-card p-3.5 rounded-xl border border-border/60 font-medium leading-relaxed">
                        &quot;{review.review_text}&quot;
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">
                        Tidak ada ulasan tertulis.
                      </p>
                    )}

                    {/* Existing Replies List */}
                    {review.reply_text && (
                      <div className="space-y-2.5 pt-3 border-t border-border/50">
                        {review.reply_text.split("\n---\n").map((rText, rIdx) => (
                          <div
                            key={rIdx}
                            className="bg-amber-500/5 dark:bg-amber-500/[0.03] border border-amber-500/20 p-3.5 rounded-xl space-y-1"
                          >
                            <span className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
                              Balasan Admin #{rIdx + 1}
                            </span>
                            <p className="text-xs text-foreground dark:text-zinc-300 leading-relaxed font-medium">
                              {rText}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Reply Form / Max indicator */}
                  {(() => {
                    const replyCount = review.reply_text
                      ? review.reply_text.split("\n---\n").length
                      : 0;

                    if (replyCount >= 3) {
                      return (
                        <div className="p-3.5 bg-muted/40 border border-border rounded-xl text-xs font-bold text-muted-foreground text-center">
                          Ulasan ini sudah dibalas maksimal (3/3 kali).
                        </div>
                      );
                    }

                    return (
                      <form onSubmit={handleReplySubmit} className="space-y-3 pt-1">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                          Balas Ulasan (Kirim via Email) | Balasan #{replyCount + 1}/3
                        </label>
                        <textarea
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Tulis balasan apresiasi atau tanggapan ke pelanggan..."
                          rows={3}
                          className="w-full text-xs p-3.5 border border-border/80 rounded-xl focus:outline-hidden focus:border-primary bg-muted/20 text-foreground font-medium transition-all leading-relaxed"
                          required
                        />

                        <div className="flex justify-end">
                          <button
                            type="submit"
                            disabled={isSubmittingReply}
                            className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-md shadow-primary/10"
                          >
                            <span>{isSubmittingReply ? "Mengirim..." : "Kirim Balasan"}</span>
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </form>
                    );
                  })()}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Side (1 col on lg) */}
        <div className="space-y-6 sm:space-y-8">
          {/* 1. Stay Schedule Journey Card */}
          <div className="bg-card border border-border/80 p-6 sm:p-7 rounded-3xl shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h3 className="text-xs font-extrabold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                <span>Jadwal Penitipan</span>
              </h3>
              <span className="text-xs font-extrabold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
                {booking.total_days} Hari
              </span>
            </div>

            {/* Room Class Banner */}
            <div className="p-3.5 rounded-2xl bg-secondary/40 border border-border/60 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase block">
                    Kelas Kamar
                  </span>
                  <span className="text-sm font-extrabold text-foreground">
                    {booking.class}
                  </span>
                </div>
              </div>
              <span className="text-xs font-bold text-muted-foreground font-mono">
                {formatRupiah(booking.price_per_day || Math.round(booking.estimated_total / (booking.total_days || 1)))}/hari
              </span>
            </div>

            {/* Visual Stay Journey */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center gap-3 p-3 bg-muted/20 border border-border/50 rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase block">
                    Check-In (Masuk)
                  </span>
                  <span className="text-xs font-extrabold text-foreground">
                    {formatDate(booking.check_in_date)}
                  </span>
                </div>
              </div>

              <div className="flex justify-center -my-1">
                <div className="px-3 py-1 bg-muted rounded-full text-[10px] font-bold text-muted-foreground border border-border/60 flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-primary" />
                  <span>Durasi: {booking.total_days} Hari Menginap</span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-muted/20 border border-border/50 rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase block">
                    Check-Out (Keluar)
                  </span>
                  <span className="text-xs font-extrabold text-foreground">
                    {formatDate(booking.check_out_date)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Billing Breakdown & Payment Status Hub */}
          <div className="bg-card border border-border/80 p-6 sm:p-7 rounded-3xl shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h3 className="text-xs font-extrabold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Wallet className="w-4 h-4 text-primary" />
                <span>Rincian Biaya & Pembayaran</span>
              </h3>
            </div>

            {/* Payment Status Dropdown Bar */}
            <div className="p-3.5 bg-muted/30 border border-border/60 rounded-2xl flex items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase block tracking-wider">
                  Status Pembayaran
                </span>
                <span
                  className={`text-xs font-black ${
                    booking.payment_status === "Paid"
                      ? "text-emerald-600 dark:text-emerald-400"
                      : booking.payment_status === "Failed"
                        ? "text-rose-600 dark:text-rose-400"
                        : booking.payment_status === "Refunded"
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-amber-600 dark:text-amber-400"
                  }`}
                >
                  {booking.payment_status === "Paid"
                    ? "Lunas"
                    : booking.payment_status === "Failed"
                      ? "Gagal"
                      : booking.payment_status === "Refunded"
                        ? "Dikembalikan"
                        : "Belum Dibayar"}
                </span>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger
                  disabled={isUpdatingPayment}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-card hover:bg-muted border border-border rounded-xl text-xs font-bold text-foreground transition-all cursor-pointer disabled:opacity-50 shadow-2xs"
                >
                  <span>{isUpdatingPayment ? "Menyimpan..." : "Ubah Status"}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                </DropdownMenuTrigger>
                <DropdownMenuContent side="bottom" align="end" sideOffset={6} className="w-44">
                  {[
                    { value: "Unpaid", label: "Belum Dibayar", color: "text-amber-600 dark:text-amber-400" },
                    { value: "Paid", label: "Lunas", color: "text-emerald-600 dark:text-emerald-400" },
                    { value: "Failed", label: "Gagal", color: "text-rose-600 dark:text-rose-400" },
                    { value: "Refunded", label: "Dikembalikan", color: "text-blue-600 dark:text-blue-400" },
                  ].map((opt) => (
                    <DropdownMenuItem
                      key={opt.value}
                      onClick={() => handleOpenEmergencyPaymentModal(opt.value)}
                      className={`flex items-center justify-between cursor-pointer ${
                        booking.payment_status === opt.value ? `${opt.color} font-extrabold` : ""
                      }`}
                    >
                      <span>{opt.label}</span>
                      {booking.payment_status === opt.value && <Check className="w-3.5 h-3.5 shrink-0" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Itemized Rows */}
            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center text-muted-foreground">
                <span>Biaya Kamar ({booking.total_days} hari)</span>
                <span className="font-bold text-foreground font-mono">
                  {formatRupiah(booking.estimated_total)}
                </span>
              </div>

              {booking.referral_code_used && (
                <div className="flex justify-between items-center text-emerald-600 font-medium">
                  <span className="flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    <span>Diskon Referral ({booking.referral_code_used})</span>
                  </span>
                  <span>Diterapkan</span>
                </div>
              )}

              {booking.promo_code_used && (
                <div className="flex justify-between items-center text-violet-600 font-medium">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>Promo ({booking.promo_code_used})</span>
                  </span>
                  <span>Diterapkan</span>
                </div>
              )}

              {booking.discount_amount > 0 && (
                <div className="flex justify-between items-center text-emerald-600 font-bold">
                  <span>Potongan Diskon</span>
                  <span className="font-mono">-{formatRupiah(booking.discount_amount)}</span>
                </div>
              )}

              {booking.points_used > 0 && (
                <div className="flex justify-between items-center text-amber-600 font-bold">
                  <span>Poin Neko ({booking.points_used} Poin)</span>
                  <span className="font-mono">-{formatRupiah(booking.points_used * 100)}</span>
                </div>
              )}

              {booking.late_fee_total > 0 && (
                <div className="flex justify-between items-center text-rose-600 font-bold">
                  <span>Denda Terlambat</span>
                  <span className="font-mono">+{formatRupiah(booking.late_fee_total)}</span>
                </div>
              )}

              {booking.refund_amount > 0 && (
                <div className="flex justify-between items-center text-blue-600 font-bold">
                  <span>Refund Ambil Cepat</span>
                  <span className="font-mono">-{formatRupiah(booking.refund_amount)}</span>
                </div>
              )}

              <div className="pt-3 border-t border-border/60 flex justify-between items-baseline">
                <span className="text-sm font-extrabold text-foreground">Total Tagihan</span>
                <span className="text-xl font-black text-emerald-600 font-mono">
                  {formatRupiah(finalTotal)}
                </span>
              </div>
            </div>
          </div>

          {/* 3. Internal Admin Notes Activity Feed (Option 5) */}
          <div id="admin-notes-feed-section">
            <AdminBookingNotesTimeline
              notes={adminNotesList}
              onCreateNote={handleCreateAdminNote}
              onTogglePinNote={handleTogglePinNote}
              onDeleteNote={handleDeleteAdminNote}
              isActionLoading={isNotesActionLoading}
            />
          </div>
        </div>
      </div>


      {/* Edit Booking Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-xs transition-opacity"
            onClick={() => setIsEditOpen(false)}
          />
          <div className="relative w-full max-w-md bg-card border border-border/80 p-6 sm:p-7 rounded-3xl shadow-xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border/60 pb-4">
              <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <Edit3 className="w-4.5 h-4.5" />
                </div>
                <span>Edit Data Pesanan</span>
              </h3>
              <button
                onClick={() => setIsEditOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1.5 rounded-xl hover:bg-muted transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                  Kelas Kamar
                </label>
                <select
                  value={editClass}
                  onChange={(e) => setEditClass(e.target.value)}
                  className="w-full px-4 py-3 bg-muted/30 border border-border/80 rounded-xl text-sm focus:outline-hidden focus:border-primary text-foreground font-medium transition-all"
                >
                  {availableClasses.length > 0 ? (
                    availableClasses.map((cls) => (
                      <option key={cls.id || cls.name} value={cls.name}>
                        {cls.name} ({formatRupiah(cls.price_per_day)}/hari)
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="Basic">Basic (Rp 45.000/hari)</option>
                      <option value="Standard">Standard (Rp 80.000/hari)</option>
                      <option value="Premium">Premium (Rp 125.000/hari)</option>
                    </>
                  )}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                  Tanggal Check-In
                </label>
                <input
                  type="date"
                  value={editCheckIn}
                  onChange={(e) => setEditCheckIn(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-muted/30 border border-border/80 rounded-xl text-sm focus:outline-hidden focus:border-primary text-foreground font-medium transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                  Tanggal Check-Out
                </label>
                <input
                  type="date"
                  value={editCheckOut}
                  onChange={(e) => setEditCheckOut(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-muted/30 border border-border/80 rounded-xl text-sm focus:outline-hidden focus:border-primary text-foreground font-medium transition-all"
                />
              </div>

              <div className="pt-3 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/95 transition-all shadow-md shadow-primary/10 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSavingEdit ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Emergency Payment Status Modal */}
      <EmergencyPaymentModal
        isOpen={isEmergencyModalOpen}
        onClose={() => {
          setIsEmergencyModalOpen(false);
          setTargetPaymentStatus(null);
        }}
        onConfirm={handlePaymentStatusChange}
        booking={booking}
        targetStatus={targetPaymentStatus}
        isSubmitting={isUpdatingPayment}
      />
    </div>
  );
}
