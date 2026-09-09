"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Link from "next/link";

import {
  CalendarRange,
  Sparkles,
  Check,
  X,
  LogOut,
  ShieldCheck,
  RefreshCcw,
  AlertTriangle,
  Download,
  Search,
  ChevronLeft,
  ChevronRight,
  Info,
  ChevronDown,
  SlidersHorizontal,
  Wallet,
  LayoutGrid,
  List,
  Zap,
  Building2,
  HeartPulse,
  Clock,
  ArrowRight,
  MessageCircle,
  RotateCcw,
  CheckCircle2,
  Cat,
  Calendar,
  DollarSign,
  AlertCircle,
  Eye,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { BookingStatus } from "@/components/booking/BookingStatus";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { toast } from "sonner";
import { formatRupiah } from "@/lib/utils/format";
import { formatDate } from "@/lib/utils/dates";
import { getCheckoutCalculation } from "@/lib/utils/pricing";
import { useLanguage } from "@/hooks/useLanguage";
import { useGsapReveal } from "@/hooks/useGsapReveal";
import { GsapDataLoader } from "@/components/shared/GsapDataLoader";
import { GsapTextButton } from "@/components/shared/GsapTextButton";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

// Helper for WhatsApp link
function getWhatsAppUrl(phone, catName, ownerName) {
  if (!phone) return null;
  const clean = phone.replace(/[^0-9]/g, "");
  const normalized = clean.startsWith("0")
    ? "62" + clean.slice(1)
    : clean.startsWith("62")
    ? clean
    : clean;
  const text = encodeURIComponent(
    `Halo Kak ${ownerName || "Pelanggan"}, terkait pesanan penitipan untuk kucing kesayangan Anda (${catName || "NekoStay"})...`
  );
  return `https://wa.me/${normalized}?text=${text}`;
}

// Room Class Badge Component
function RoomClassBadge({ roomClass }) {
  const normalized = (roomClass || "").toLowerCase();
  let badgeStyles = "bg-muted text-foreground border-border";

  if (normalized.includes("basic")) {
    badgeStyles =
      "bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700";
  } else if (normalized.includes("standard")) {
    badgeStyles =
      "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900";
  } else if (normalized.includes("premium") || normalized.includes("vip")) {
    badgeStyles =
      "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900";
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${badgeStyles}`}
    >
      {roomClass}
    </span>
  );
}

// Payment Status Dropdown Component
function PaymentStatusDropdown({ booking, onUpdated }) {
  const [isUpdating, setIsUpdating] = useState(false);

  const statusConfig = {
    Paid: {
      label: "Lunas",
      className:
        "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60",
    },
    Unpaid: {
      label: "Belum Dibayar",
      className:
        "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60",
    },
    Failed: {
      label: "Gagal",
      className:
        "bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60",
    },
    Refunded: {
      label: "Dikembalikan",
      className:
        "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800/60",
    },
  };

  const current = statusConfig[booking.payment_status] || statusConfig.Unpaid;

  const handleUpdate = async (newStatus) => {
    if (newStatus === booking.payment_status || isUpdating) return;
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/bookings/${booking.id}/payment-status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentStatus: newStatus }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal mengubah status pembayaran");
      }
      toast.success("Status pembayaran berhasil diperbarui");
      onUpdated();
    } catch (err) {
      toast.error(
        err.message || "Terjadi kesalahan saat memperbarui status pembayaran"
      );
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={isUpdating}
        className="focus:outline-hidden cursor-pointer disabled:opacity-60"
        title="Klik untuk ubah status pembayaran"
      >
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full border transition-all hover:opacity-90 shadow-2xs ${current.className}`}
        >
          <Wallet className="w-3 h-3" />
          <span>{current.label}</span>
          <ChevronDown className="w-3 h-3 opacity-60 ml-0.5" />
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-44 p-1.5">
        <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
          Ubah Status Bayar
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {[
          { value: "Paid", label: "Lunas" },
          { value: "Unpaid", label: "Belum Dibayar" },
          { value: "Failed", label: "Gagal" },
          { value: "Refunded", label: "Dikembalikan" },
        ].map((opt) => (
          <DropdownMenuItem
            key={opt.value}
            onClick={() => handleUpdate(opt.value)}
            className={`text-xs font-semibold cursor-pointer ${
              booking.payment_status === opt.value
                ? "text-primary dark:text-primary font-bold bg-primary/5"
                : ""
            }`}
          >
            {booking.payment_status === opt.value ? (
              <Check className="w-3.5 h-3.5 mr-1.5 text-primary shrink-0" />
            ) : (
              <span className="w-3.5 h-3.5 mr-1.5 shrink-0" />
            )}
            {opt.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function AdminBookingsPage() {
  const { language, t } = useLanguage();
  const containerRef = useRef(null);

  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [activeTab, setActiveTab] = useState("Semua");
  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filter & Pagination States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClass, setSelectedClass] = useState("Semua");
  const [availableClasses, setAvailableClasses] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isBulkLoading, setIsBulkLoading] = useState(false);
  const [bulkRejectReason, setBulkRejectReason] = useState("");
  const [isBulkRejectOpen, setIsBulkRejectOpen] = useState(false);
  const [viewMode, setViewMode] = useState("table"); // 'table' | 'grid'
  const itemsPerPage = 10;

  // Monthly / Yearly filter states (defaults to current month and year)
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(
    String(currentDate.getMonth() + 1)
  ); // "1"-"12" or "all"
  const [selectedYear, setSelectedYear] = useState(
    String(currentDate.getFullYear())
  ); // e.g. "2026" or "all"

  useGsapReveal(
    containerRef,
    { selector: ".anim-item", y: 20, stagger: 0.04, duration: 0.45 },
    [filteredBookings, currentPage, activeTab]
  );

  useEffect(() => {
    if (selectedYear === "all") {
      setSelectedMonth("all");
    }
  }, [selectedYear]);

  // Dialog States
  const [selectedBooking, setSelectedBooking] = useState(null);
  // Reject Dialog
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);
  const [isAutoRejecting, setIsAutoRejecting] = useState(false);
  const [isAutoRejectConfirmOpen, setIsAutoRejectConfirmOpen] = useState(false);

  // Approve Dialog
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  // Checkout Dialog
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutCalc, setCheckoutCalc] = useState(null);
  const [refundPercentage, setRefundPercentage] = useState(90);

  const supabase = createClient();

  // Load finance settings & available room classes
  useEffect(() => {
    async function loadInitialMetadata() {
      try {
        const { data: finData } = await supabase
          .from("landing_settings")
          .select("content")
          .eq("id", "finance_settings")
          .maybeSingle();

        if (finData?.content?.refund_percentage != null) {
          setRefundPercentage(Number(finData.content.refund_percentage) || 90);
        }

        const { data: classData } = await supabase
          .from("classes")
          .select("name")
          .order("price_per_day", { ascending: true });

        if (classData && classData.length > 0) {
          setAvailableClasses(classData.map((c) => c.name));
        }
      } catch (err) {
        console.error("Error loading initial metadata:", err);
      }
    }
    loadInitialMetadata();
  }, [supabase]);

  const fetchAllBookings = useCallback(async () => {
    setIsLoading(true);
    try {
      let query = supabase.from("bookings").select(`
          *,
          profiles:user_id (full_name, phone)
        `);

      if (selectedMonth !== "all" && selectedYear !== "all") {
        const monthNum = parseInt(selectedMonth, 10);
        const yearNum = parseInt(selectedYear, 10);
        const monthStr = String(monthNum).padStart(2, "0");
        const startOfMonth = `${yearNum}-${monthStr}-01T00:00:00.000Z`;

        let nextMonth = monthNum + 1;
        let nextYear = yearNum;
        if (nextMonth > 12) {
          nextMonth = 1;
          nextYear += 1;
        }
        const nextMonthStr = String(nextMonth).padStart(2, "0");
        const endOfMonth = `${nextYear}-${nextMonthStr}-01T00:00:00.000Z`;

        query = query.gte("created_at", startOfMonth).lt("created_at", endOfMonth);
      } else if (selectedYear !== "all") {
        const yearNum = parseInt(selectedYear, 10);
        const startOfYear = `${yearNum}-01-01T00:00:00.000Z`;
        const endOfYear = `${yearNum + 1}-01-01T00:00:00.000Z`;
        query = query.gte("created_at", startOfYear).lt("created_at", endOfYear);
      }

      const { data, error } = await query.order("created_at", {
        ascending: false,
      });

      if (error) throw error;
      setBookings(data || []);
      setFilteredBookings(data || []);
    } catch (err) {
      console.error("Error fetching bookings:", err);
    } finally {
      setIsLoading(false);
    }
  }, [supabase, selectedMonth, selectedYear]);

  useEffect(() => {
    fetchAllBookings();

    // Supabase Realtime WebSocket Subscription
    let debounceTimer = null;
    const triggerDebouncedReload = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        fetchAllBookings();
      }, 400);
    };

    const channelId = `admin-bookings-realtime-${Math.random()
      .toString(36)
      .substring(7)}`;
    const channel = supabase
      .channel(channelId)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookings" },
        () => {
          triggerDebouncedReload();
        }
      )
      .subscribe();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchAllBookings();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchAllBookings, supabase]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Filter application
  useEffect(() => {
    let temp = [...bookings];

    // 1. Filter by Status (activeTab)
    if (activeTab !== "Semua") {
      temp = temp.filter((b) => b.status === activeTab);
    }

    // 2. Filter by Room Class
    if (selectedClass !== "Semua") {
      temp = temp.filter((b) => b.class === selectedClass);
    }

    // 3. Filter by Search Query
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      temp = temp.filter(
        (b) =>
          b.cat_name.toLowerCase().includes(q) ||
          (b.profiles?.full_name &&
            b.profiles.full_name.toLowerCase().includes(q))
      );
    }

    setFilteredBookings(temp);
  }, [activeTab, selectedClass, searchQuery, bookings]);

  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds([]); // Clear selection when filters change
  }, [activeTab, searchQuery, selectedClass]);

  // Executive KPI stats calculation
  const stats = useMemo(() => {
    const total = bookings.length;
    const pending = bookings.filter((b) => b.status === "Menunggu").length;
    const queue = bookings.filter((b) => b.status === "Antrian").length;
    const active = bookings.filter((b) => b.status === "Aktif").length;
    const completed = bookings.filter((b) => b.status === "Selesai").length;
    const cancelled = bookings.filter((b) => b.status === "Dibatalkan").length;
    const revenue = bookings
      .filter((b) => b.status === "Aktif" || b.status === "Selesai")
      .reduce((sum, b) => sum + (b.estimated_total || 0), 0);

    return { total, pending, queue, active, completed, cancelled, revenue };
  }, [bookings]);

  // Reset all filters to default
  const isFiltersActive =
    searchQuery !== "" ||
    selectedClass !== "Semua" ||
    selectedMonth !== String(currentDate.getMonth() + 1) ||
    selectedYear !== String(currentDate.getFullYear()) ||
    activeTab !== "Semua";

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedClass("Semua");
    setSelectedMonth(String(currentDate.getMonth() + 1));
    setSelectedYear(String(currentDate.getFullYear()));
    setActiveTab("Semua");
    toast.info("Filter telah direset ke bulan saat ini.");
  };

  const handleExportPDF = async () => {
    if (!filteredBookings || filteredBookings.length === 0) {
      toast.error("Tidak ada data untuk diekspor.");
      return;
    }

    try {
      const { jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");

      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      // Title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(234, 88, 12); // Brand orange
      doc.text("NekoStay", 14, 15);

      // Sub-brand Title
      doc.setFont("helvetica", "normal");
      doc.setFontSize(14);
      doc.setTextColor(71, 85, 105);
      doc.text("Laporan Pesanan Penitipan Kucing", 14, 22);

      // Metadata lines on the right side
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(
        `Tanggal Cetak: ${new Date().toLocaleDateString("id-ID")}`,
        283,
        14,
        { align: "right" }
      );
      doc.text(`Status Filter: ${activeTab}`, 283, 19, { align: "right" });

      const monthNames = [
        "Januari",
        "Februari",
        "Maret",
        "April",
        "Mei",
        "Juni",
        "Juli",
        "Agustus",
        "September",
        "Oktober",
        "November",
        "Desember",
      ];
      const filterPeriodText =
        selectedYear === "all"
          ? "Semua Waktu"
          : selectedMonth === "all"
          ? `Tahun ${selectedYear}`
          : `${monthNames[parseInt(selectedMonth, 10) - 1]} ${selectedYear}`;
      doc.text(`Periode: ${filterPeriodText}`, 283, 24, { align: "right" });

      // Solid accent line
      doc.setDrawColor(234, 88, 12);
      doc.setLineWidth(0.8);
      doc.line(14, 28, 283, 28);

      // Summary Container background
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(14, 33, 269, 14, 2, 2, "F");

      // Summary Content
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(30, 41, 59);
      doc.text("RINGKASAN LAPORAN:", 20, 42);

      doc.setFont("helvetica", "normal");
      doc.text("Total Pesanan: ", 75, 42);
      doc.setFont("helvetica", "bold");
      doc.text(`${filteredBookings.length}`, 102, 42);

      // Sum estimated_total
      const totalEst = filteredBookings.reduce(
        (sum, b) => sum + (b.estimated_total || 0),
        0
      );
      doc.setFont("helvetica", "normal");
      doc.text("Total Estimasi Pendapatan: ", 130, 42);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(234, 88, 12);
      const formattedRevenue = new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
      }).format(totalEst);
      doc.text(formattedRevenue, 182, 42);

      // Reset text color
      doc.setTextColor(51, 65, 85);

      const tableHeaders = [
        [
          "No",
          "Nama Kucing",
          "Pemilik",
          "Kelas Room",
          "Check-In",
          "Check-Out",
          "Durasi",
          "Total Biaya",
          "Status",
          "Pembayaran",
        ],
      ];

      const tableRows = filteredBookings.map((b, index) => [
        index + 1,
        b.cat_name,
        b.profiles?.full_name || "Tanpa Nama",
        b.class,
        formatDate(b.check_in_date),
        formatDate(b.check_out_date),
        `${b.total_days} Hari`,
        new Intl.NumberFormat("id-ID", {
          style: "currency",
          currency: "IDR",
          maximumFractionDigits: 0,
        }).format(b.estimated_total || 0),
        b.status,
        b.payment_status === "Paid"
          ? "Lunas"
          : b.payment_status === "Failed"
          ? "Gagal"
          : b.payment_status === "Refunded"
          ? "Refund"
          : "Belum Bayar",
      ]);

      autoTable(doc, {
        head: tableHeaders,
        body: tableRows,
        startY: 53,
        theme: "striped",
        headStyles: {
          fillColor: [234, 88, 12],
          textColor: 255,
          fontStyle: "bold",
          fontSize: 9,
          halign: "center",
        },
        bodyStyles: {
          fontSize: 8,
          textColor: [51, 65, 85],
        },
        columnStyles: {
          0: { halign: "center", cellWidth: 10 },
          1: { fontStyle: "bold" },
          4: { halign: "center" },
          5: { halign: "center" },
          6: { halign: "center" },
          7: { halign: "right", fontStyle: "bold" },
          8: { halign: "center" },
          9: { halign: "center" },
        },
        styles: {
          font: "helvetica",
          cellPadding: 3,
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
      });

      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);

        doc.text("Dicetak otomatis melalui Panel Admin NekoStay", 14, 200);
        doc.text(`Halaman ${i} dari ${pageCount}`, 283, 200, {
          align: "right",
        });
      }

      const sanitizeName = (str) => str.replace(/[^a-z0-9]/gi, "_");
      doc.save(
        `Laporan_Pesanan_NekoStay_${sanitizeName(
          activeTab
        )}_${selectedYear}_${selectedMonth}.pdf`
      );
      toast.success("Laporan PDF berhasil diunduh.");
    } catch (error) {
      console.error("Gagal mengekspor PDF:", error);
      toast.error("Terjadi kesalahan saat memproses ekspor PDF.");
    }
  };

  // Process Approval
  const handleApprove = async () => {
    if (!selectedBooking) return;
    setIsApproving(true);

    try {
      const { error } = await supabase
        .from("bookings")
        .update({ status: "Aktif" })
        .eq("id", selectedBooking.id);

      if (error) throw error;

      await supabase.from("notifications").insert({
        user_id: selectedBooking.user_id,
        title: "Pesanan Penitipan Disetujui",
        message: `Kabar baik! Penitipan untuk ${selectedBooking.cat_name} telah aktif. Silakan bawa kucing Anda ke pengantaran.`,
        type: "success",
        booking_id: selectedBooking.id,
      });

      toast.success(`Pesanan untuk ${selectedBooking.cat_name} telah disetujui!`);
      setIsApproveOpen(false);
      fetchAllBookings();
    } catch (err) {
      console.error("Error approving booking:", err);
      toast.error("Gagal menyetujui pesanan.");
    } finally {
      setIsApproving(false);
    }
  };

  // Process Rejection
  const handleReject = async () => {
    if (!selectedBooking || !rejectReason.trim()) return;
    setIsRejecting(true);

    try {
      const { error } = await supabase
        .from("bookings")
        .update({
          status: "Dibatalkan",
          reject_reason: rejectReason,
        })
        .eq("id", selectedBooking.id);

      if (error) throw error;

      await supabase.from("notifications").insert({
        user_id: selectedBooking.user_id,
        title: "Pesanan Penitipan Ditolak",
        message: `Mohon maaf, pesanan penitipan ${selectedBooking.cat_name} ditolak dengan alasan: ${rejectReason}`,
        type: "error",
        booking_id: selectedBooking.id,
      });

      toast.info(`Pesanan untuk ${selectedBooking.cat_name} telah ditolak.`);
      setIsRejectOpen(false);
      setRejectReason("");
      fetchAllBookings();
    } catch (err) {
      console.error("Error rejecting booking:", err);
      toast.error("Gagal menolak pesanan.");
    } finally {
      setIsRejecting(false);
    }
  };

  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) return;
    setIsBulkLoading(true);
    try {
      const res = await fetch("/api/bookings/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds, action: "approve" }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      toast.success(result.message || "Berhasil menyetujui pesanan terpilih.");
      setSelectedIds([]);
      fetchAllBookings();
    } catch (err) {
      console.error("Bulk approve error:", err);
      toast.error(err.message || "Gagal menyetujui pesanan terpilih.");
    } finally {
      setIsBulkLoading(false);
    }
  };

  const handleBulkReject = async () => {
    if (selectedIds.length === 0 || !bulkRejectReason.trim()) return;
    setIsBulkLoading(true);
    try {
      const res = await fetch("/api/bookings/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: selectedIds,
          action: "reject",
          rejectReason: bulkRejectReason,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      toast.success(result.message || "Berhasil menolak pesanan.");
      setSelectedIds([]);
      setBulkRejectReason("");
      setIsBulkRejectOpen(false);
      fetchAllBookings();
    } catch (err) {
      console.error("Bulk reject error:", err);
      toast.error(err.message || "Gagal menolak pesanan terpilih.");
    } finally {
      setIsBulkLoading(false);
    }
  };

  const handleAutoRejectWaiting = async () => {
    setIsAutoRejecting(true);
    try {
      const res = await fetch("/api/bookings/auto-reject-waiting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengevaluasi antrian");
      toast.success(
        data.message ||
          `Evaluasi selesai: ${data.data?.rejectedCount || 0} pesanan ditolak otomatis.`
      );
      fetchAllBookings();
    } catch (err) {
      toast.error(err.message || "Gagal mengevaluasi antrian kamar");
    } finally {
      setIsAutoRejecting(false);
      setIsAutoRejectConfirmOpen(false);
    }
  };

  // Open Checkout and calculate on-the-fly values
  const openCheckoutModal = (booking) => {
    setSelectedBooking(booking);
    const today = new Date();
    const calc = getCheckoutCalculation(booking, today, refundPercentage);
    setCheckoutCalc(calc);
    setIsCheckoutOpen(true);
  };

  // Process Checkout Completion
  const handleCheckout = async () => {
    if (!selectedBooking || !checkoutCalc) return;
    setIsCheckingOut(true);

    try {
      const { error } = await supabase
        .from("bookings")
        .update({
          status: "Selesai",
          actual_checkout: checkoutCalc.actualCheckoutDate
            .toISOString()
            .split("T")[0],
          late_fee_total: checkoutCalc.lateFee,
          refund_amount: checkoutCalc.refund,
        })
        .eq("id", selectedBooking.id);

      if (error) throw error;

      await supabase.from("notifications").insert({
        user_id: selectedBooking.user_id,
        title: "Kucing Selesai Dititipkan",
        message: `Terima kasih! Penitipan ${selectedBooking.cat_name} telah selesai. Mpus sudah berhasil check-out. ${checkoutCalc.notes}`,
        type: "success",
        booking_id: selectedBooking.id,
      });

      toast.success(`Check-out untuk ${selectedBooking.cat_name} selesai!`);
      setIsCheckoutOpen(false);
      fetchAllBookings();
    } catch (err) {
      console.error("Error checking out booking:", err);
      toast.error("Gagal memproses check-out.");
    } finally {
      setIsCheckingOut(false);
    }
  };

  // Pagination calculations
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const paginatedBookings = filteredBookings.slice(
    startIdx,
    startIdx + itemsPerPage
  );

  // Get pending bookings on current page for "select all" functionality
  const pagePendingBookings = paginatedBookings.filter(
    (b) => b.status === "Menunggu"
  );
  const isAllPagePendingSelected =
    pagePendingBookings.length > 0 &&
    pagePendingBookings.every((b) => selectedIds.includes(b.id));

  // Handle selecting individual row
  const handleSelectRow = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
    );
  };

  // Handle selecting all pending bookings on current page
  const handleSelectAllPagePending = () => {
    if (isAllPagePendingSelected) {
      setSelectedIds((prev) =>
        prev.filter((id) => !pagePendingBookings.some((b) => b.id === id))
      );
    } else {
      const pendingIds = pagePendingBookings.map((b) => b.id);
      setSelectedIds((prev) => {
        const newIds = [...prev];
        pendingIds.forEach((id) => {
          if (!newIds.includes(id)) {
            newIds.push(id);
          }
        });
        return newIds;
      });
    }
  };

  if (!isMounted) {
    return (
      <div className="space-y-8 animate-pulse p-4 sm:p-6 bg-background min-h-screen">
        <div className="h-8 bg-muted rounded-xl w-48 mb-4" />
        <div className="h-6 bg-muted rounded-xl w-96 mb-8" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-card border border-border rounded-3xl" />
          ))}
        </div>
        <div className="h-64 bg-card border border-border rounded-3xl" />
      </div>
    );
  }

  // Formatting period label
  const monthNames = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];
  const activePeriodLabel =
    selectedYear === "all"
      ? "Semua Waktu"
      : selectedMonth === "all"
      ? `Tahun ${selectedYear}`
      : `${monthNames[parseInt(selectedMonth, 10) - 1]} ${selectedYear}`;

  return (
    <div ref={containerRef} className="space-y-7">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 anim-item">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-extrabold tracking-wide border border-rose-500/20 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
            <span>MANAJEMEN RESERVASI</span>
            <span className="w-1 h-1 rounded-full bg-rose-400" />
            <span className="font-semibold text-[11px] opacity-90">
              {activePeriodLabel}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            Semua Pesanan Penitipan
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-2xl">
            Kelola persetujuan reservasi, pantau kucing yang sedang aktif menginap,
            hubungi pemilik langsung via WhatsApp, dan lakukan kalkulasi check-out.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => setIsAutoRejectConfirmOpen(true)}
            disabled={isAutoRejecting}
            className="px-3.5 py-2.5 bg-rose-500/10 hover:bg-rose-500/15 text-rose-600 dark:text-rose-400 rounded-xl transition-all cursor-pointer flex items-center gap-2 border border-rose-500/25 disabled:opacity-50 shadow-2xs group"
            title="Periksa & Tolak Otomatis Antrian Kamar Penuh (>3 Hari)"
          >
            <Zap className="w-4 h-4 text-rose-500 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold whitespace-nowrap">
              {isAutoRejecting ? "Mengevaluasi..." : "Cek Antrian (>3 Hari)"}
            </span>
          </button>

          <button
            onClick={handleExportPDF}
            className="px-3.5 py-2.5 bg-muted/60 hover:bg-muted text-foreground border border-border rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-2xs hover:shadow-xs"
            title="Ekspor Laporan PDF"
          >
            <Download className="w-4 h-4 text-muted-foreground" />
            <span className="hidden sm:inline text-xs font-bold">Ekspor PDF</span>
          </button>

          <button
            onClick={fetchAllBookings}
            className="p-2.5 bg-muted/60 hover:bg-muted text-foreground border border-border rounded-xl transition-all cursor-pointer shadow-2xs hover:shadow-xs"
            title="Perbarui Data (Refresh)"
          >
            <RefreshCcw
              className={`w-4 h-4 text-muted-foreground ${
                isLoading ? "animate-spin text-primary" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {/* Executive KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 anim-item">
        {/* Card 1: Total Bookings */}
        <div
          onClick={() => setActiveTab("Semua")}
          className={`p-4 sm:p-5 rounded-3xl border transition-all cursor-pointer select-none bg-card hover:shadow-md ${
            activeTab === "Semua"
              ? "border-blue-500/60 ring-2 ring-blue-500/20 shadow-xs"
              : "border-border hover:border-border/80"
          }`}
        >
          <div className="flex items-center justify-between gap-3 mb-3">
            <span className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
              Total Pesanan
            </span>
            <div className="w-9 h-9 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20">
              <CalendarRange className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              {stats.total}
            </div>
            <p className="text-[11px] font-medium text-muted-foreground truncate">
              Periode: {activePeriodLabel}
            </p>
          </div>
        </div>

        {/* Card 2: Pending Approvals */}
        <div
          onClick={() => setActiveTab("Menunggu")}
          className={`p-4 sm:p-5 rounded-3xl border transition-all cursor-pointer select-none bg-card hover:shadow-md ${
            activeTab === "Menunggu"
              ? "border-amber-500/60 ring-2 ring-amber-500/20 shadow-xs"
              : "border-border hover:border-border/80"
          }`}
        >
          <div className="flex items-center justify-between gap-3 mb-3">
            <span className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
              Menunggu Review
            </span>
            <div className="w-9 h-9 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 tracking-tight">
                {stats.pending}
              </span>
              {stats.queue > 0 && (
                <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                  +{stats.queue} Antrian
                </span>
              )}
            </div>
            <p className="text-[11px] font-medium text-muted-foreground">
              {stats.pending > 0
                ? "Perlu segera ditinjau"
                : "Semua reservasi telah diproses"}
            </p>
          </div>
        </div>

        {/* Card 3: Active Cats */}
        <div
          onClick={() => setActiveTab("Aktif")}
          className={`p-4 sm:p-5 rounded-3xl border transition-all cursor-pointer select-none bg-card hover:shadow-md ${
            activeTab === "Aktif"
              ? "border-emerald-500/60 ring-2 ring-emerald-500/20 shadow-xs"
              : "border-border hover:border-border/80"
          }`}
        >
          <div className="flex items-center justify-between gap-3 mb-3">
            <span className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
              Sedang Menginap
            </span>
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
              {stats.active}
            </div>
            <p className="text-[11px] font-medium text-muted-foreground">
              Kucing berada di kamar penitipan
            </p>
          </div>
        </div>

        {/* Card 4: Revenue & Completed */}
        <div
          onClick={() => setActiveTab("Selesai")}
          className={`p-4 sm:p-5 rounded-3xl border transition-all cursor-pointer select-none bg-card hover:shadow-md ${
            activeTab === "Selesai"
              ? "border-orange-500/60 ring-2 ring-orange-500/20 shadow-xs"
              : "border-border hover:border-border/80"
          }`}
        >
          <div className="flex items-center justify-between gap-3 mb-3">
            <span className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
              Estimasi Omset
            </span>
            <div className="w-9 h-9 rounded-2xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center border border-orange-500/20">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-xl sm:text-2xl font-black text-foreground tracking-tight truncate">
              {formatRupiah(stats.revenue)}
            </div>
            <p className="text-[11px] font-medium text-muted-foreground">
              {stats.completed} pesanan telah selesai
            </p>
          </div>
        </div>
      </div>

      {/* Tabs & View Switcher Bar */}
      <div className="flex items-center justify-between gap-4 border-b border-border/80 pb-px overflow-x-auto no-scrollbar anim-item">
        {/* Status Tabs */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {[
            { id: "Semua", label: "Semua", count: stats.total },
            { id: "Menunggu", label: "Menunggu", count: stats.pending },
            { id: "Antrian", label: "Antrian", count: stats.queue },
            { id: "Aktif", label: "Aktif", count: stats.active },
            { id: "Selesai", label: "Selesai", count: stats.completed },
            { id: "Dibatalkan", label: "Dibatalkan", count: stats.cancelled },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3 px-1 text-xs sm:text-sm font-extrabold transition-all relative cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-2 py-0.5 text-[10px] rounded-full font-black transition-colors ${
                    isActive
                      ? "bg-primary/15 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {tab.count}
                </span>
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full shadow-xs" />
                )}
              </button>
            );
          })}
        </div>

        {/* Table / Grid Switcher */}
        <div className="flex items-center gap-1 p-1 bg-muted/60 border border-border rounded-2xl shrink-0 self-center mb-2">
          <button
            type="button"
            onClick={() => setViewMode("table")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === "table"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
            title="Tampilan Tabel"
          >
            <List className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tabel</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === "grid"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
            title="Tampilan Grid Kartu"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Grid</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-card border border-border p-4 rounded-3xl shadow-xs space-y-3 anim-item">
        <div className="flex flex-col lg:flex-row gap-3 justify-between items-stretch lg:items-center">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Cari nama kucing atau pemilik..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-9 py-2.5 bg-muted/40 hover:bg-muted/60 border border-border rounded-2xl text-xs focus:outline-hidden focus:border-primary/60 text-foreground font-medium transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                title="Hapus pencarian"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filters Group */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground font-bold mr-1">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filter:</span>
            </div>

            {/* Year Dropdown */}
            {(() => {
              const yearOptions = [
                { value: "all", label: "Semua Tahun" },
                { value: "2024", label: "2024" },
                { value: "2025", label: "2025" },
                { value: "2026", label: "2026" },
                { value: "2027", label: "2027" },
                { value: "2028", label: "2028" },
              ];
              const currentYearLabel =
                yearOptions.find((o) => o.value === selectedYear)?.label ??
                selectedYear;
              return (
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center gap-2 px-3 py-2 bg-muted/40 hover:bg-muted border border-border rounded-xl text-xs font-semibold text-foreground transition-all min-w-[110px] justify-between cursor-pointer">
                    <span className="text-muted-foreground font-normal">
                      Tahun:
                    </span>
                    <span className="font-bold">{currentYearLabel}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground ml-1 shrink-0" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    side="bottom"
                    align="start"
                    sideOffset={6}
                    className="p-1"
                  >
                    <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                      Pilih Tahun
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {yearOptions.map((opt) => (
                      <DropdownMenuItem
                        key={opt.value}
                        onClick={() => setSelectedYear(opt.value)}
                        className={`text-xs font-semibold cursor-pointer ${
                          selectedYear === opt.value
                            ? "text-primary font-bold bg-primary/5"
                            : ""
                        }`}
                      >
                        {selectedYear === opt.value ? (
                          <Check className="w-3.5 h-3.5 mr-1.5 text-primary shrink-0" />
                        ) : (
                          <span className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                        )}
                        {opt.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              );
            })()}

            {/* Month Dropdown */}
            {(() => {
              const monthOptions = [
                { value: "all", label: "Semua Bulan" },
                { value: "1", label: "Januari" },
                { value: "2", label: "Februari" },
                { value: "3", label: "Maret" },
                { value: "4", label: "April" },
                { value: "5", label: "Mei" },
                { value: "6", label: "Juni" },
                { value: "7", label: "Juli" },
                { value: "8", label: "Agustus" },
                { value: "9", label: "September" },
                { value: "10", label: "Oktober" },
                { value: "11", label: "November" },
                { value: "12", label: "Desember" },
              ];
              const currentMonthLabel =
                monthOptions.find((o) => o.value === selectedMonth)?.label ??
                selectedMonth;
              const isDisabled = selectedYear === "all";
              return (
                <DropdownMenu>
                  <DropdownMenuTrigger
                    disabled={isDisabled}
                    className={`flex items-center gap-2 px-3 py-2 bg-muted/40 hover:bg-muted border border-border rounded-xl text-xs font-semibold text-foreground transition-all min-w-[130px] justify-between cursor-pointer ${
                      isDisabled
                        ? "opacity-40 cursor-not-allowed pointer-events-none"
                        : ""
                    }`}
                  >
                    <span className="text-muted-foreground font-normal">
                      Bulan:
                    </span>
                    <span className="font-bold">{currentMonthLabel}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground ml-1 shrink-0" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    side="bottom"
                    align="start"
                    sideOffset={6}
                    className="p-1"
                  >
                    <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                      Pilih Bulan
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {monthOptions.map((opt) => (
                      <DropdownMenuItem
                        key={opt.value}
                        onClick={() => setSelectedMonth(opt.value)}
                        className={`text-xs font-semibold cursor-pointer ${
                          selectedMonth === opt.value
                            ? "text-primary font-bold bg-primary/5"
                            : ""
                        }`}
                      >
                        {selectedMonth === opt.value ? (
                          <Check className="w-3.5 h-3.5 mr-1.5 text-primary shrink-0" />
                        ) : (
                          <span className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                        )}
                        {opt.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              );
            })()}

            {/* Room Class Dropdown */}
            {(() => {
              const allClasses =
                availableClasses.length > 0
                  ? ["Semua", ...availableClasses]
                  : ["Semua", "Basic", "Standard", "Premium"];
              return (
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center gap-2 px-3 py-2 bg-muted/40 hover:bg-muted border border-border rounded-xl text-xs font-semibold text-foreground transition-all min-w-[120px] justify-between cursor-pointer">
                    <span className="text-muted-foreground font-normal">
                      Kelas:
                    </span>
                    <span className="font-bold">{selectedClass}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground ml-1 shrink-0" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    side="bottom"
                    align="start"
                    sideOffset={6}
                    className="p-1"
                  >
                    <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                      Pilih Kelas Room
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {allClasses.map((cls) => (
                      <DropdownMenuItem
                        key={cls}
                        onClick={() => setSelectedClass(cls)}
                        className={`text-xs font-semibold cursor-pointer ${
                          selectedClass === cls
                            ? "text-primary font-bold bg-primary/5"
                            : ""
                        }`}
                      >
                        {selectedClass === cls ? (
                          <Check className="w-3.5 h-3.5 mr-1.5 text-primary shrink-0" />
                        ) : (
                          <span className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                        )}
                        {cls}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              );
            })()}

            {/* Reset Filters Button */}
            {isFiltersActive && (
              <button
                onClick={handleResetFilters}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground bg-muted/30 hover:bg-muted border border-border transition-all cursor-pointer"
                title="Reset semua pencarian & filter"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter results info banner */}
        <div className="flex items-center justify-between text-xs text-muted-foreground font-medium pt-1 border-t border-border/50">
          <span>
            Menampilkan{" "}
            <strong className="text-foreground font-bold">
              {filteredBookings.length}
            </strong>{" "}
            pesanan dari total{" "}
            <strong className="text-foreground font-bold">{bookings.length}</strong>
          </span>
          {pagePendingBookings.length > 0 && (
            <button
              onClick={handleSelectAllPagePending}
              className="text-primary hover:underline font-bold cursor-pointer text-xs"
            >
              {isAllPagePendingSelected
                ? "Batal Pilih Menunggu"
                : `Pilih Semua Menunggu (${pagePendingBookings.length})`}
            </button>
          )}
        </div>
      </div>

      {/* Main Content: Table or Grid */}
      {isLoading ? (
        <GsapDataLoader
          type={viewMode === "grid" ? "cards" : "table"}
          message="Memuat daftar pemesanan..."
          rows={5}
        />
      ) : filteredBookings.length === 0 ? (
        <div className="text-center py-20 bg-card border border-border border-dashed rounded-3xl p-8 max-w-xl mx-auto space-y-3">
          <div className="w-14 h-14 mx-auto rounded-3xl bg-muted/60 flex items-center justify-center text-muted-foreground">
            <CalendarRange className="w-7 h-7" />
          </div>
          <h3 className="text-base font-extrabold text-foreground">
            Tidak Ada Pesanan Ditemukan
          </h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Tidak ada reservasi yang sesuai dengan status &quot;{activeTab}&quot; atau
            kata kunci pencarian saat ini.
          </p>
          {isFiltersActive && (
            <button
              onClick={handleResetFilters}
              className="mt-2 px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:bg-primary/90 transition-all cursor-pointer inline-flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filter & Pencarian</span>
            </button>
          )}
        </div>
      ) : (
        <>
          {viewMode === "grid" ? (
            /* ================= GRID CARD VIEW ================= */
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                {paginatedBookings.map((b) => {
                  const waUrl = getWhatsAppUrl(
                    b.profiles?.phone,
                    b.cat_name,
                    b.profiles?.full_name
                  );

                  return (
                    <div
                      key={b.id}
                      className={`bg-card border rounded-3xl p-5 space-y-4 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between anim-item ${
                        selectedIds.includes(b.id)
                          ? "border-primary ring-1 ring-primary/40 bg-primary/2"
                          : "border-border hover:border-border/80"
                      }`}
                    >
                      <div className="space-y-3.5">
                        {/* Header card: Cat info + Status */}
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex items-center gap-2.5 overflow-hidden">
                            {b.status === "Menunggu" ? (
                              <input
                                type="checkbox"
                                checked={selectedIds.includes(b.id)}
                                onChange={() => handleSelectRow(b.id)}
                                className="w-4.5 h-4.5 rounded-md border-border accent-primary shrink-0 cursor-pointer"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0 border border-orange-500/20">
                                <Cat className="w-4 h-4" />
                              </div>
                            )}

                            <div className="truncate">
                              <h3 className="font-extrabold text-foreground text-sm truncate flex items-center gap-1.5">
                                <span>{b.cat_name}</span>
                              </h3>
                              <p className="text-[11px] text-muted-foreground truncate">
                                {b.cat_gender} • {b.cat_age}
                              </p>
                            </div>
                          </div>

                          <BookingStatus status={b.status} />
                        </div>

                        {/* Owner Information & WhatsApp Shortcut */}
                        <div className="p-2.5 bg-muted/30 border border-border/60 rounded-2xl flex items-center justify-between gap-2">
                          <div className="truncate">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                              Pemilik:
                            </span>
                            <span className="text-xs font-bold text-foreground truncate block">
                              {b.profiles?.full_name || "Tamu Neko"}
                            </span>
                          </div>
                          {waUrl && (
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl transition-all shrink-0 border border-emerald-500/20"
                              title="Chat Pemilik via WhatsApp"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </a>
                          )}
                        </div>

                        {/* Room & Schedule breakdown */}
                        <div className="space-y-2 border-t border-b border-border/60 py-3 text-xs text-muted-foreground">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] uppercase font-bold text-muted-foreground">
                              Kelas:
                            </span>
                            <RoomClassBadge roomClass={b.class} />
                          </div>

                          <div className="flex justify-between items-center">
                            <span className="text-[10px] uppercase font-bold text-muted-foreground">
                              Jadwal:
                            </span>
                            <span className="font-semibold text-foreground text-[11px]">
                              {formatDate(b.check_in_date)} -{" "}
                              {formatDate(b.check_out_date)}
                            </span>
                          </div>

                          <div className="flex justify-between items-center">
                            <span className="text-[10px] uppercase font-bold text-muted-foreground">
                              Durasi:
                            </span>
                            <span className="font-bold text-foreground bg-muted px-2 py-0.5 rounded-md text-[11px]">
                              {b.total_days} Hari
                            </span>
                          </div>

                          <div className="flex justify-between items-center pt-1">
                            <span className="text-[10px] uppercase font-bold text-muted-foreground">
                              Status Bayar:
                            </span>
                            <PaymentStatusDropdown
                              booking={b}
                              onUpdated={fetchAllBookings}
                            />
                          </div>

                          <div className="flex justify-between items-baseline pt-2 border-t border-border/40">
                            <span className="text-[10px] uppercase font-bold text-muted-foreground">
                              Total Biaya:
                            </span>
                            <div className="text-right">
                              <span className="font-black text-foreground text-sm">
                                {formatRupiah(b.estimated_total)}
                              </span>
                              {b.discount_amount > 0 && (
                                <span className="block text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                                  Hemat {formatRupiah(b.discount_amount)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-1.5 pt-1">
                        <Link
                          href={`/admin/bookings/${b.id}`}
                          className="px-3 py-2 border border-border hover:bg-muted text-xs font-bold rounded-xl transition-all text-center flex-1 text-foreground"
                        >
                          Detail
                        </Link>

                        {b.status === "Menunggu" && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedBooking(b);
                                setIsApproveOpen(true);
                              }}
                              className="px-3 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:bg-primary/90 transition-all cursor-pointer flex items-center justify-center gap-1 flex-1 shadow-2xs"
                              title="Setujui Penitipan"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Setujui</span>
                            </button>
                            <button
                              onClick={() => {
                                setSelectedBooking(b);
                                setIsRejectOpen(true);
                              }}
                              className="p-2 border border-rose-200 dark:border-rose-900/60 text-rose-600 bg-rose-500/5 hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer"
                              title="Tolak Penitipan"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}

                        {b.status === "Aktif" && (
                          <button
                            onClick={() => openCheckoutModal(b)}
                            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 flex-1 shadow-2xs"
                            title="Proses Check-Out Kucing"
                          >
                            <LogOut className="w-3.5 h-3.5" />
                            <span>Check-Out</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* ================= TABLE VIEW ================= */
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block bg-card border border-border rounded-3xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="bg-muted/40 border-b border-border text-muted-foreground text-xs font-bold">
                        <th className="p-4 sm:p-5 w-12 text-center">
                          <input
                            type="checkbox"
                            checked={isAllPagePendingSelected}
                            onChange={handleSelectAllPagePending}
                            disabled={pagePendingBookings.length === 0}
                            className="w-4 h-4 rounded-md border-border cursor-pointer accent-primary disabled:opacity-40"
                            title="Pilih semua pesanan menunggu pada halaman ini"
                          />
                        </th>
                        <th className="p-4 sm:p-5">Kucing & Pemilik</th>
                        <th className="p-4 sm:p-5">Kelas Room</th>
                        <th className="p-4 sm:p-5">Jadwal Menginap</th>
                        <th className="p-4 sm:p-5">Total Biaya</th>
                        <th className="p-4 sm:p-5">Status Reservasi</th>
                        <th className="p-4 sm:p-5">Status Pembayaran</th>
                        <th className="p-4 sm:p-5 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {paginatedBookings.map((b) => {
                        const waUrl = getWhatsAppUrl(
                          b.profiles?.phone,
                          b.cat_name,
                          b.profiles?.full_name
                        );

                        return (
                          <tr
                            key={b.id}
                            className={`hover:bg-muted/30 transition-colors anim-item ${
                              selectedIds.includes(b.id) ? "bg-primary/5" : ""
                            }`}
                          >
                            {/* Checkbox column */}
                            <td className="p-4 sm:p-5 text-center">
                              {b.status === "Menunggu" ? (
                                <input
                                  type="checkbox"
                                  checked={selectedIds.includes(b.id)}
                                  onChange={() => handleSelectRow(b.id)}
                                  className="w-4 h-4 rounded-md border-border cursor-pointer accent-primary"
                                />
                              ) : (
                                <span className="text-muted-foreground/30 text-xs font-bold">
                                  •
                                </span>
                              )}
                            </td>

                            {/* Cat & Owner Info */}
                            <td className="p-4 sm:p-5">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-2xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0 border border-orange-500/20">
                                  <Cat className="w-4.5 h-4.5" />
                                </div>
                                <div>
                                  <div className="font-extrabold text-foreground flex items-center gap-2">
                                    <span>{b.cat_name}</span>
                                    <span className="text-[11px] font-normal text-muted-foreground">
                                      ({b.cat_gender}, {b.cat_age})
                                    </span>
                                  </div>
                                  <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                                    <span>
                                      {b.profiles?.full_name || "Tamu Neko"}
                                    </span>
                                    {b.profiles?.phone && (
                                      <>
                                        <span className="opacity-40">•</span>
                                        <span>{b.profiles.phone}</span>
                                      </>
                                    )}
                                    {waUrl && (
                                      <a
                                        href={waUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 p-0.5"
                                        title="Hubungi via WhatsApp"
                                      >
                                        <MessageCircle className="w-3.5 h-3.5 inline" />
                                      </a>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Room Class */}
                            <td className="p-4 sm:p-5">
                              <div className="space-y-1">
                                <RoomClassBadge roomClass={b.class} />
                                <div className="text-[11px] text-muted-foreground font-medium">
                                  {formatRupiah(b.price_per_day)}/hari
                                </div>
                              </div>
                            </td>

                            {/* Schedule & Duration */}
                            <td className="p-4 sm:p-5">
                              <div className="space-y-1">
                                <div className="font-semibold text-foreground text-xs flex items-center gap-1.5">
                                  <span>{formatDate(b.check_in_date)}</span>
                                  <ArrowRight className="w-3 h-3 text-muted-foreground" />
                                  <span>{formatDate(b.check_out_date)}</span>
                                </div>
                                <div className="text-[11px] text-muted-foreground font-bold">
                                  {b.total_days} Hari
                                </div>
                              </div>
                            </td>

                            {/* Total Cost */}
                            <td className="p-4 sm:p-5">
                              <div className="font-black text-foreground text-sm">
                                {formatRupiah(b.estimated_total)}
                              </div>
                              {b.discount_amount > 0 && (
                                <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                                  Diskon: -{formatRupiah(b.discount_amount)}
                                </div>
                              )}
                            </td>

                            {/* Booking Status */}
                            <td className="p-4 sm:p-5">
                              <BookingStatus status={b.status} />
                            </td>

                            {/* Payment Status Dropdown */}
                            <td className="p-4 sm:p-5">
                              <PaymentStatusDropdown
                                booking={b}
                                onUpdated={fetchAllBookings}
                              />
                            </td>

                            {/* Action Buttons */}
                            <td className="p-4 sm:p-5 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Link
                                  href={`/admin/bookings/${b.id}`}
                                  className="px-3 py-1.5 border border-border hover:bg-muted text-xs font-bold rounded-xl transition-all text-foreground"
                                >
                                  Detail
                                </Link>

                                {b.status === "Menunggu" && (
                                  <>
                                    <button
                                      onClick={() => {
                                        setSelectedBooking(b);
                                        setIsApproveOpen(true);
                                      }}
                                      className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:bg-primary/90 transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                      <span>Setujui</span>
                                    </button>
                                    <button
                                      onClick={() => {
                                        setSelectedBooking(b);
                                        setIsRejectOpen(true);
                                      }}
                                      className="px-3 py-1.5 border border-rose-200 dark:border-rose-900/60 hover:border-rose-300 text-rose-600 bg-rose-500/5 hover:bg-rose-500/10 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                      <span>Tolak</span>
                                    </button>
                                  </>
                                )}

                                {b.status === "Aktif" && (
                                  <button
                                    onClick={() => openCheckoutModal(b)}
                                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                                  >
                                    <LogOut className="w-3.5 h-3.5" />
                                    <span>Check-Out</span>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile Card View Fallback */}
              <div className="space-y-4 md:hidden">
                {paginatedBookings.map((b) => {
                  const waUrl = getWhatsAppUrl(
                    b.profiles?.phone,
                    b.cat_name,
                    b.profiles?.full_name
                  );

                  return (
                    <div
                      key={`m-${b.id}`}
                      className="bg-card border border-border rounded-3xl p-5 space-y-4 shadow-2xs anim-item"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-2xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0 border border-orange-500/20">
                            <Cat className="w-4.5 h-4.5" />
                          </div>
                          <div>
                            <h3 className="font-extrabold text-foreground text-sm">
                              {b.cat_name}
                            </h3>
                            <p className="text-[11px] text-muted-foreground">
                              {b.cat_gender} • {b.cat_age}
                            </p>
                          </div>
                        </div>
                        <BookingStatus status={b.status} />
                      </div>

                      {/* Owner & WhatsApp */}
                      <div className="p-2.5 bg-muted/30 border border-border/60 rounded-2xl flex items-center justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                            Pemilik:
                          </span>
                          <span className="text-xs font-bold text-foreground">
                            {b.profiles?.full_name || "Tamu Neko"}
                          </span>
                        </div>
                        {waUrl && (
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-500/20"
                            title="Chat Pemilik via WhatsApp"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </a>
                        )}
                      </div>

                      {/* Details */}
                      <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground border-t border-b border-border/60 py-3">
                        <div>
                          <span className="text-[10px] block font-bold uppercase text-muted-foreground">
                            Kelas Room
                          </span>
                          <RoomClassBadge roomClass={b.class} />
                        </div>
                        <div>
                          <span className="text-[10px] block font-bold uppercase text-muted-foreground">
                            Durasi
                          </span>
                          <span className="font-bold text-foreground">
                            {b.total_days} Hari
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] block font-bold uppercase text-muted-foreground">
                            Jadwal
                          </span>
                          <span className="font-medium text-foreground text-[11px]">
                            {formatDate(b.check_in_date)} -{" "}
                            {formatDate(b.check_out_date)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] block font-bold uppercase text-muted-foreground">
                            Total Biaya
                          </span>
                          <span className="font-black text-foreground text-sm">
                            {formatRupiah(b.estimated_total)}
                          </span>
                        </div>
                        <div className="col-span-2 pt-1 flex justify-between items-center border-t border-border/40">
                          <span className="text-[10px] font-bold uppercase text-muted-foreground">
                            Status Bayar:
                          </span>
                          <PaymentStatusDropdown
                            booking={b}
                            onUpdated={fetchAllBookings}
                          />
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/bookings/${b.id}`}
                          className="px-4 py-2 border border-border hover:bg-muted text-xs font-bold rounded-xl text-center flex-1 text-foreground"
                        >
                          Detail
                        </Link>

                        {b.status === "Menunggu" && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedBooking(b);
                                setIsApproveOpen(true);
                              }}
                              className="px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:bg-primary/90 flex-1 flex items-center justify-center gap-1"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Setujui</span>
                            </button>
                            <button
                              onClick={() => {
                                setSelectedBooking(b);
                                setIsRejectOpen(true);
                              }}
                              className="p-2 border border-rose-200 dark:border-rose-900/60 text-rose-600 bg-rose-500/5 rounded-xl"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}

                        {b.status === "Aktif" && (
                          <button
                            onClick={() => openCheckoutModal(b)}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex-1 flex items-center justify-center gap-1"
                          >
                            <LogOut className="w-3.5 h-3.5" />
                            <span>Check-Out</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-4 flex-wrap bg-card border border-border px-5 py-4 rounded-2xl anim-item">
          <p className="text-xs text-muted-foreground font-semibold">
            Menampilkan{" "}
            <span className="text-foreground font-bold">
              {Math.min(
                filteredBookings.length,
                (currentPage - 1) * itemsPerPage + 1
              )}
            </span>{" "}
            -{" "}
            <span className="text-foreground font-bold">
              {Math.min(filteredBookings.length, currentPage * itemsPerPage)}
            </span>{" "}
            dari{" "}
            <span className="text-foreground font-bold">
              {filteredBookings.length}
            </span>{" "}
            pesanan
          </p>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 border border-border rounded-xl hover:bg-muted/80 disabled:opacity-40 transition-colors cursor-pointer text-muted-foreground hover:text-foreground"
              title="Halaman Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  currentPage === page
                    ? "bg-primary text-primary-foreground"
                    : "border border-border hover:bg-muted/80 text-muted-foreground hover:text-foreground"
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className="p-2 border border-border rounded-xl hover:bg-muted/80 disabled:opacity-40 transition-colors cursor-pointer text-muted-foreground hover:text-foreground"
              title="Halaman Berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ================= MODALS & DIALOGS ================= */}

      {/* APPROVE DIALOG */}
      <ConfirmDialog
        isOpen={isApproveOpen}
        title="Setujui Penitipan Kucing?"
        description={`Apakah Anda yakin ingin menyetujui pemesanan untuk kucing "${selectedBooking?.cat_name}"? Status akan berubah menjadi Aktif dan notifikasi konfirmasi akan dikirim ke pemilik.`}
        confirmText="Ya, Setujui"
        cancelText="Kembali"
        isLoading={isApproving}
        onConfirm={handleApprove}
        onCancel={() => setIsApproveOpen(false)}
      />

      {/* REJECT DIALOG */}
      <ConfirmDialog
        isOpen={isRejectOpen}
        title="Tolak Pemesanan Penitipan?"
        description={`Berikan alasan penolakan pemesanan untuk kucing "${selectedBooking?.cat_name}". Alasan ini akan dikirim via notifikasi sistem dan email kepada pemilik.`}
        confirmText="Tolak Booking"
        cancelText="Kembali"
        variant="danger"
        isLoading={isRejecting}
        onConfirm={handleReject}
        onCancel={() => setIsRejectOpen(false)}
      >
        <div className="mt-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
              Alasan Penolakan
            </label>
            <span className="text-[10px] text-muted-foreground font-semibold">
              Template Cepat:
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() =>
                setRejectReason(
                  `Mohon maaf, pemesanan tidak dapat diterima karena seluruh kamar/ruang kelas ${
                    selectedBooking?.class || "ini"
                  } telah penuh dan tidak tersedia ruang kosong dalam batas maksimal waktu 3 hari.`
                )
              }
              className="px-2.5 py-1 text-[11px] rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-semibold transition-colors cursor-pointer border border-rose-500/20"
            >
              <span className="inline-flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" />
                <span>Kamar Penuh (&gt; 3 Hari)</span>
              </span>
            </button>
            <button
              type="button"
              onClick={() =>
                setRejectReason(
                  `Mohon maaf, pemesanan penitipan untuk kucing ${
                    selectedBooking?.cat_name || "Anda"
                  } belum dapat kami setujui karena persyaratan riwayat vaksinasi dan kesehatan belum terpenuhi.`
                )
              }
              className="px-2.5 py-1 text-[11px] rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground font-semibold transition-colors cursor-pointer border border-border"
            >
              <span className="inline-flex items-center gap-1.5">
                <HeartPulse className="w-3.5 h-3.5" />
                <span>Riwayat Kesehatan</span>
              </span>
            </button>
            <button
              type="button"
              onClick={() =>
                setRejectReason(
                  `Mohon maaf, seluruh slot penitipan pada rentang tanggal yang Anda pilih telah terisi penuh. Silakan pilih rentang tanggal alternatif.`
                )
              }
              className="px-2.5 py-1 text-[11px] rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground font-semibold transition-colors cursor-pointer border border-border"
            >
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>Jadwal Penuh</span>
              </span>
            </button>
          </div>

          <textarea
            required
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Tulis alasan penolakan di sini..."
            rows={3}
            className="w-full px-3.5 py-2.5 bg-muted/40 border border-border rounded-xl text-xs focus:outline-hidden focus:border-primary/50 text-foreground font-medium transition-all"
          />
        </div>
      </ConfirmDialog>

      {/* CHECKOUT CALCULATOR DIALOG */}
      {isCheckoutOpen && checkoutCalc && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-xs"
            onClick={() => setIsCheckoutOpen(false)}
          />

          <div className="relative w-full max-w-lg bg-card border border-border p-6 sm:p-8 rounded-3xl shadow-2xl space-y-6 animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-bold text-foreground border-b border-border pb-3 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              <span>
                Kalkulasi Tagihan Check-Out ({selectedBooking.cat_name})
              </span>
            </h3>

            <div className="space-y-3.5 text-xs sm:text-sm">
              <div className="flex justify-between border-b border-border/40 pb-2">
                <span className="text-muted-foreground">Kelas Penitipan:</span>
                <strong className="text-foreground">
                  {selectedBooking.class} (
                  {formatRupiah(selectedBooking.price_per_day)}/hari)
                </strong>
              </div>

              <div className="flex justify-between border-b border-border/40 pb-2">
                <span className="text-muted-foreground">Jadwal Keluar Rencana:</span>
                <strong className="text-foreground">
                  {formatDate(selectedBooking.check_out_date)}
                </strong>
              </div>

              <div className="flex justify-between border-b border-border/40 pb-2">
                <span className="text-muted-foreground">
                  Tanggal Check-Out (Hari Ini):
                </span>
                <strong className="text-foreground">
                  {formatDate(checkoutCalc.actualCheckoutDate)}
                </strong>
              </div>

              <div className="flex justify-between border-b border-border/40 pb-2">
                <span className="text-muted-foreground">
                  Estimasi Awal ({selectedBooking.total_days} hari):
                </span>
                <strong className="text-foreground">
                  {formatRupiah(selectedBooking.estimated_total)}
                </strong>
              </div>

              {checkoutCalc.lateDaysCount > 0 && (
                <div className="flex justify-between border-b border-border/40 pb-2 text-rose-600 dark:text-rose-400 font-bold bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20">
                  <span>
                    Denda Terlambat ({checkoutCalc.lateDaysCount} hari):
                  </span>
                  <span>+{formatRupiah(checkoutCalc.lateFee)}</span>
                </div>
              )}

              {checkoutCalc.refundDays > 0 && (
                <div className="flex justify-between border-b border-border/40 pb-2 text-blue-600 dark:text-blue-400 font-bold bg-blue-500/10 p-2.5 rounded-xl border border-blue-500/20">
                  <span>
                    Refund Ambil Lebih Awal ({checkoutCalc.refundDays} hari):
                  </span>
                  <span>-{formatRupiah(checkoutCalc.refund)}</span>
                </div>
              )}

              <div className="flex justify-between border-b border-border/40 pb-2 text-base font-black text-foreground pt-2">
                <span>Total Akhir Tagihan:</span>
                <span className="text-emerald-600 dark:text-emerald-400 text-lg">
                  {formatRupiah(checkoutCalc.finalCost)}
                </span>
              </div>

              <div className="p-3 bg-muted/60 text-foreground text-xs rounded-2xl leading-relaxed font-semibold flex items-start gap-2 border border-border/80">
                <Info className="w-4 h-4 shrink-0 text-primary mt-0.5" />
                <span>Info: {checkoutCalc.notes}</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <button
                type="button"
                disabled={isCheckingOut}
                className="px-5 py-2.5 border border-border hover:bg-muted text-xs font-bold rounded-xl text-foreground cursor-pointer disabled:opacity-50"
                onClick={() => setIsCheckoutOpen(false)}
              >
                Batal
              </button>
              <GsapTextButton
                type="button"
                onClick={handleCheckout}
                isLoading={isCheckingOut}
                idleText="Selesaikan Check-Out"
                loadingText="Sedang Memproses..."
                successText="Berhasil Selesai!"
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl cursor-pointer disabled:opacity-50 shadow-2xs"
              />
            </div>
          </div>
        </div>
      )}

      {/* Floating Bulk Actions Bar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-card/95 backdrop-blur-md border border-border shadow-2xl p-4 sm:p-5 rounded-3xl flex items-center gap-4 w-[92%] max-w-xl animate-in slide-in-from-bottom-8 duration-300">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-foreground">
                {selectedIds.length} Pesanan Terpilih
              </span>
              <button
                onClick={() => setSelectedIds([])}
                className="text-[11px] text-muted-foreground hover:text-foreground underline cursor-pointer"
              >
                Batalkan
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground font-semibold">
              Terapkan aksi serentak untuk pesanan yang menunggu konfirmasi.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleBulkApprove}
              disabled={isBulkLoading}
              className="px-3.5 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:bg-primary/95 transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50 shadow-2xs"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Setujui</span>
            </button>
            <button
              onClick={() => setIsBulkRejectOpen(true)}
              disabled={isBulkLoading}
              className="px-3.5 py-2 border border-rose-200 dark:border-rose-900/60 hover:border-rose-300 text-rose-600 bg-rose-500/5 hover:bg-rose-500/10 text-xs font-bold rounded-xl transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              <X className="w-3.5 h-3.5" />
              <span>Tolak</span>
            </button>
          </div>
        </div>
      )}

      {/* BULK REJECT DIALOG */}
      <ConfirmDialog
        isOpen={isBulkRejectOpen}
        title={`Tolak ${selectedIds.length} Pemesanan Terpilih?`}
        description="Berikan alasan penolakan untuk semua pemesanan yang dipilih. Alasan ini akan dikirim via notifikasi sistem dan email ke pemilik masing-masing."
        confirmText="Tolak Semua"
        cancelText="Kembali"
        variant="danger"
        isLoading={isBulkLoading}
        onConfirm={handleBulkReject}
        onCancel={() => setIsBulkRejectOpen(false)}
      >
        <div className="mt-4 space-y-1.5">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
            Alasan Penolakan Massal
          </label>
          <textarea
            required
            value={bulkRejectReason}
            onChange={(e) => setBulkRejectReason(e.target.value)}
            placeholder="Tulis alasan penolakan untuk semua pesanan..."
            rows={3}
            className="w-full px-3.5 py-2.5 bg-muted/40 border border-border rounded-xl text-xs focus:outline-hidden focus:border-primary/50 text-foreground font-medium transition-all"
          />
        </div>
      </ConfirmDialog>

      {/* AUTO REJECT CONFIRMATION DIALOG */}
      <ConfirmDialog
        isOpen={isAutoRejectConfirmOpen}
        title="Evaluasi & Tolak Otomatis Antrian Kamar?"
        description="Jalankan evaluasi otomatis untuk seluruh pesanan berstatus Menunggu & Antrian. Pesanan yang kapasitas kamarnya penuh dan waktu ketersediaan terdekat > 3 hari akan otomatis ditolak dengan template penolakan kamar penuh."
        confirmText="Jalankan Evaluasi"
        cancelText="Batal"
        variant="warning"
        isLoading={isAutoRejecting}
        onConfirm={handleAutoRejectWaiting}
        onCancel={() => setIsAutoRejectConfirmOpen(false)}
      />
    </div>
  );
}
