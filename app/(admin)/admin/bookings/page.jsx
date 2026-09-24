"use client";

import { useState, useEffect, useCallback, useMemo, useRef, useSyncExternalStore } from "react";
import {
  CalendarRange,
  Sparkles,
  ShieldCheck,
  RefreshCcw,
  Download,
  Zap,
  Clock,
  Wallet,
  Building2,
  HeartPulse,
  Calendar,
  RotateCcw,
  Info,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { AdminBookingNotesQuickModal } from "@/components/admin/AdminBookingNotesQuickModal";
import { toast } from "sonner";
import { formatRupiah } from "@/lib/utils/format";
import { formatDate } from "@/lib/utils/dates";
import { getCheckoutCalculation } from "@/lib/modules/pricing/pricing.service";
import { useGsapReveal } from "@/hooks/useGsapReveal";
import { GsapDataLoader } from "@/components/shared/GsapDataLoader";
import { GsapTextButton } from "@/components/shared/GsapTextButton";
import {
  AdminBookingsFilterBar,
  AdminBookingsTableView,
  AdminBookingsGridView,
  AdminBookingsBulkBar,
} from "@/components/modules/bookings";

const emptySubscribe = () => () => {};

function getBookingNetAmount(b) {
  if (!b) return 0;
  const estimated = Number(b.estimated_total) || 0;
  const discount = Number(b.discount_amount) || 0;
  const lateFee = Number(b.late_fee_total) || 0;
  const refund = Number(b.refund_amount) || 0;
  return Math.max(0, estimated - discount + lateFee - refund);
}

export default function AdminBookingsPage() {
  const containerRef = useRef(null);
  const isMounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  const [bookings, setBookings] = useState([]);
  const [activeTab, setActiveTab] = useState("Semua");
  const [isLoading, setIsLoading] = useState(true);

  // Search, Filter & View States
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
  const [quickNotesBooking, setQuickNotesBooking] = useState(null);

  // Monthly / Yearly filter states
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(String(currentDate.getMonth() + 1));
  const [selectedYear, setSelectedYear] = useState(String(currentDate.getFullYear()));

  // Dialog States
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);
  const [isAutoRejecting, setIsAutoRejecting] = useState(false);
  const [isAutoRejectConfirmOpen, setIsAutoRejectConfirmOpen] = useState(false);

  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutCalc, setCheckoutCalc] = useState(null);
  const [refundPercentage, setRefundPercentage] = useState(90);

  const supabase = createClient();

  // Load finance settings & available classes
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
          profiles:user_id (full_name, phone),
          booking_admin_notes (id, category, content, is_pinned, created_at, profiles:admin_id(id, full_name, role))
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
    } catch (err) {
      console.error("Error fetching bookings:", err);
    } finally {
      setIsLoading(false);
    }
  }, [supabase, selectedMonth, selectedYear]);

  useEffect(() => {
    fetchAllBookings();

    let debounceTimer = null;
    const triggerDebouncedReload = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        fetchAllBookings();
      }, 400);
    };

    const channelId = `admin-bookings-realtime-${Math.random().toString(36).substring(7)}`;
    const channel = supabase
      .channel(channelId)
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, () => {
        triggerDebouncedReload();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "booking_admin_notes" }, () => {
        triggerDebouncedReload();
      })
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
    if (quickNotesBooking?.id) {
      const freshBooking = bookings.find((b) => b.id === quickNotesBooking.id);
      if (freshBooking && freshBooking !== quickNotesBooking) {
        setQuickNotesBooking(freshBooking);
      }
    }
  }, [bookings, quickNotesBooking?.id]);

  // Derived filtered bookings
  const filteredBookings = useMemo(() => {
    let temp = bookings;

    if (activeTab !== "Semua") {
      temp = temp.filter((b) => b.status === activeTab);
    }

    if (selectedClass !== "Semua") {
      temp = temp.filter((b) => b.class === selectedClass);
    }

    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      temp = temp.filter(
        (b) =>
          b.cat_name?.toLowerCase().includes(q) ||
          (b.profiles?.full_name && b.profiles.full_name.toLowerCase().includes(q))
      );
    }

    return temp;
  }, [activeTab, selectedClass, searchQuery, bookings]);

  useGsapReveal(
    containerRef,
    { selector: ".anim-item", y: 20, stagger: 0.04, duration: 0.45 },
    [filteredBookings, currentPage, activeTab]
  );

  // Executive KPI stats
  const stats = useMemo(() => {
    const total = bookings.length;
    const pending = bookings.filter((b) => b.status === "Menunggu").length;
    const queue = bookings.filter((b) => b.status === "Antrian").length;
    const active = bookings.filter((b) => b.status === "Aktif").length;
    const completed = bookings.filter((b) => b.status === "Selesai").length;
    const cancelled = bookings.filter((b) => b.status === "Dibatalkan").length;

    const validRevenueBookings = bookings.filter(
      (b) =>
        b.status !== "Dibatalkan" &&
        b.payment_status !== "Failed" &&
        (b.status === "Selesai" || b.status === "Aktif" || b.payment_status === "Paid")
    );

    const revenue = validRevenueBookings.reduce((sum, b) => sum + getBookingNetAmount(b), 0);

    const paidBookings = bookings.filter(
      (b) => b.payment_status === "Paid" && b.status !== "Dibatalkan"
    );
    const paidRevenue = paidBookings.reduce((sum, b) => sum + getBookingNetAmount(b), 0);
    const unpaidRevenue = Math.max(0, revenue - paidRevenue);

    return {
      total,
      pending,
      queue,
      active,
      completed,
      cancelled,
      revenue,
      paidRevenue,
      unpaidRevenue,
      validCount: validRevenueBookings.length,
      paidCount: paidBookings.length,
    };
  }, [bookings]);

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

      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(234, 88, 12);
      doc.text("NekoStay", 14, 15);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(14);
      doc.setTextColor(71, 85, 105);
      doc.text("Laporan Pesanan Penitipan Kucing", 14, 22);

      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString("id-ID")}`, 283, 14, {
        align: "right",
      });
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

      doc.setDrawColor(234, 88, 12);
      doc.setLineWidth(0.8);
      doc.line(14, 28, 283, 28);

      const tableData = filteredBookings.map((b, idx) => [
        idx + 1,
        b.cat_name,
        b.profiles?.full_name || "Tamu Neko",
        b.class,
        `${formatDate(b.check_in_date)} - ${formatDate(b.check_out_date)}`,
        `${b.total_days} Hari`,
        formatRupiah(getBookingNetAmount(b)),
        b.status,
        b.payment_status === "Paid" ? "Lunas" : "Belum Bayar",
      ]);

      autoTable(doc, {
        startY: 34,
        head: [
          [
            "#",
            "Kucing",
            "Pemilik",
            "Kelas",
            "Jadwal",
            "Durasi",
            "Total",
            "Status",
            "Pembayaran",
          ],
        ],
        body: tableData,
        theme: "striped",
        headStyles: {
          fillColor: [234, 88, 12],
          textColor: [255, 255, 255],
          fontSize: 8,
          fontStyle: "bold",
        },
        styles: { fontSize: 8, cellPadding: 2.5 },
      });

      doc.save(`Laporan_NekoStay_${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success("Laporan PDF berhasil diunduh.");
    } catch (err) {
      console.error("Export PDF error:", err);
      toast.error("Gagal membuat laporan PDF.");
    }
  };

  const handleApprove = async () => {
    if (!selectedBooking) return;
    setIsApproving(true);
    try {
      const res = await fetch(`/api/bookings/${selectedBooking.id}/confirm`, {
        method: "POST",
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Gagal menyetujui pesanan.");
      }
      toast.success(`Pesanan untuk ${selectedBooking.cat_name} telah disetujui!`);
      setIsApproveOpen(false);
      fetchAllBookings();
    } catch (err) {
      console.error("Error approving booking:", err);
      toast.error(err.message || "Gagal menyetujui pesanan.");
    } finally {
      setIsApproving(false);
    }
  };

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
        data.message || `Evaluasi selesai: ${data.data?.rejectedCount || 0} pesanan ditolak otomatis.`
      );
      fetchAllBookings();
    } catch (err) {
      toast.error(err.message || "Gagal mengevaluasi antrian kamar");
    } finally {
      setIsAutoRejecting(false);
      setIsAutoRejectConfirmOpen(false);
    }
  };

  const openCheckoutModal = (booking) => {
    setSelectedBooking(booking);
    const today = new Date();
    const calc = getCheckoutCalculation(booking, today, refundPercentage);
    setCheckoutCalc(calc);
    setIsCheckoutOpen(true);
  };

  const handleCheckout = async () => {
    if (!selectedBooking || !checkoutCalc) return;
    setIsCheckingOut(true);
    try {
      const { error } = await supabase
        .from("bookings")
        .update({
          status: "Selesai",
          actual_checkout: checkoutCalc.actualCheckoutDate.toISOString().split("T")[0],
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
  const paginatedBookings = filteredBookings.slice(startIdx, startIdx + itemsPerPage);

  const pagePendingBookings = paginatedBookings.filter((b) => b.status === "Menunggu");
  const isAllPagePendingSelected =
    pagePendingBookings.length > 0 && pagePendingBookings.every((b) => selectedIds.includes(b.id));

  const handleSelectRow = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
    );
  };

  const handleSelectAllPagePending = () => {
    if (isAllPagePendingSelected) {
      setSelectedIds((prev) => prev.filter((id) => !pagePendingBookings.some((b) => b.id === id)));
    } else {
      const pendingIds = pagePendingBookings.map((b) => b.id);
      setSelectedIds((prev) => {
        const newIds = [...prev];
        pendingIds.forEach((id) => {
          if (!newIds.includes(id)) newIds.push(id);
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

  const statusTabs = [
    { id: "Semua", label: "Semua", count: bookings.length },
    {
      id: "Menunggu",
      label: "Menunggu",
      count: bookings.filter((b) => b.status === "Menunggu").length,
    },
    {
      id: "Antrian",
      label: "Antrian",
      count: bookings.filter((b) => b.status === "Antrian").length,
    },
    {
      id: "Aktif",
      label: "Aktif",
      count: bookings.filter((b) => b.status === "Aktif").length,
    },
    {
      id: "Selesai",
      label: "Selesai",
      count: bookings.filter((b) => b.status === "Selesai").length,
    },
    {
      id: "Dibatalkan",
      label: "Dibatalkan",
      count: bookings.filter((b) => b.status === "Dibatalkan").length,
    },
  ];

  return (
    <div ref={containerRef} className="space-y-7">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 anim-item">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-extrabold tracking-wide border border-rose-500/20 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
            <span>MANAJEMEN RESERVASI</span>
            <span className="w-1 h-1 rounded-full bg-rose-400" />
            <span className="font-semibold text-[11px] opacity-90">{activePeriodLabel}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            Semua Pesanan Penitipan
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-2xl">
            Kelola persetujuan reservasi, pantau kucing yang sedang aktif menginap, hubungi pemilik
            langsung via WhatsApp, dan lakukan kalkulasi check-out.
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
              className={`w-4 h-4 text-muted-foreground ${isLoading ? "animate-spin text-primary" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* Executive KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 anim-item">
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
              {stats.pending > 0 ? "Perlu segera ditinjau" : "Semua reservasi telah diproses"}
            </p>
          </div>
        </div>

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
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground flex-wrap">
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                {formatRupiah(stats.paidRevenue)} Lunas
              </span>
              <span>•</span>
              <span>{stats.completed} Selesai</span>
              {stats.active > 0 && <span>, {stats.active} Aktif</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar Component */}
      <AdminBookingsFilterBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        statusTabs={statusTabs}
        viewMode={viewMode}
        setViewMode={setViewMode}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedYear={selectedYear}
        setSelectedYear={setSelectedYear}
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        selectedClass={selectedClass}
        setSelectedClass={setSelectedClass}
        availableClasses={availableClasses}
        isFiltersActive={isFiltersActive}
        onResetFilters={handleResetFilters}
        totalFiltered={filteredBookings.length}
        totalBookings={bookings.length}
        pagePendingCount={pagePendingBookings.length}
        isAllPagePendingSelected={isAllPagePendingSelected}
        onSelectAllPagePending={handleSelectAllPagePending}
      />

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
            Tidak ada reservasi yang sesuai dengan status &quot;{activeTab}&quot; atau kata kunci
            pencarian saat ini.
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
      ) : viewMode === "grid" ? (
        <AdminBookingsGridView
          bookings={paginatedBookings}
          selectedIds={selectedIds}
          onSelectRow={handleSelectRow}
          onOpenApprove={(b) => {
            setSelectedBooking(b);
            setIsApproveOpen(true);
          }}
          onOpenReject={(b) => {
            setSelectedBooking(b);
            setIsRejectOpen(true);
          }}
          onOpenCheckout={openCheckoutModal}
          onOpenQuickNotes={setQuickNotesBooking}
          onUpdated={fetchAllBookings}
          currentPage={currentPage}
          totalPages={totalPages}
          totalFiltered={filteredBookings.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      ) : (
        <AdminBookingsTableView
          bookings={paginatedBookings}
          selectedIds={selectedIds}
          onSelectRow={handleSelectRow}
          isAllPagePendingSelected={isAllPagePendingSelected}
          onSelectAllPagePending={handleSelectAllPagePending}
          pagePendingCount={pagePendingBookings.length}
          onOpenApprove={(b) => {
            setSelectedBooking(b);
            setIsApproveOpen(true);
          }}
          onOpenReject={(b) => {
            setSelectedBooking(b);
            setIsRejectOpen(true);
          }}
          onOpenCheckout={openCheckoutModal}
          onOpenQuickNotes={setQuickNotesBooking}
          onUpdated={fetchAllBookings}
          currentPage={currentPage}
          totalPages={totalPages}
          totalFiltered={filteredBookings.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Floating Bulk Actions Bar */}
      <AdminBookingsBulkBar
        selectedIds={selectedIds}
        onClearSelection={() => setSelectedIds([])}
        onApprove={handleBulkApprove}
        onOpenRejectModal={() => setIsBulkRejectOpen(true)}
        isBulkLoading={isBulkLoading}
      />

      {/* Confirm Approve Dialog */}
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

      {/* Reject Dialog */}
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

      {/* Checkout Calculator Dialog */}
      {isCheckoutOpen && checkoutCalc && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-xs"
            onClick={() => setIsCheckoutOpen(false)}
          />

          <div className="relative w-full max-w-lg bg-card border border-border p-6 sm:p-8 rounded-3xl shadow-2xl space-y-6 animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-bold text-foreground border-b border-border pb-3 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              <span>Kalkulasi Tagihan Check-Out ({selectedBooking.cat_name})</span>
            </h3>

            <div className="space-y-3.5 text-xs sm:text-sm">
              <div className="flex justify-between border-b border-border/40 pb-2">
                <span className="text-muted-foreground">Kelas Penitipan:</span>
                <strong className="text-foreground">
                  {selectedBooking.class} ({formatRupiah(selectedBooking.price_per_day)}/hari)
                </strong>
              </div>

              <div className="flex justify-between border-b border-border/40 pb-2">
                <span className="text-muted-foreground">Jadwal Keluar Rencana:</span>
                <strong className="text-foreground">
                  {formatDate(selectedBooking.check_out_date)}
                </strong>
              </div>

              <div className="flex justify-between border-b border-border/40 pb-2">
                <span className="text-muted-foreground">Tanggal Check-Out (Hari Ini):</span>
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
                  <span>Denda Terlambat ({checkoutCalc.lateDaysCount} hari):</span>
                  <span>+{formatRupiah(checkoutCalc.lateFee)}</span>
                </div>
              )}

              {checkoutCalc.refundDays > 0 && (
                <div className="flex justify-between border-b border-border/40 pb-2 text-blue-600 dark:text-blue-400 font-bold bg-blue-500/10 p-2.5 rounded-xl border border-blue-500/20">
                  <span>Refund Ambil Lebih Awal ({checkoutCalc.refundDays} hari):</span>
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

      {/* Bulk Reject Dialog */}
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

      {/* Auto Reject Confirmation Dialog */}
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

      {/* Quick Admin Notes Modal */}
      <AdminBookingNotesQuickModal
        isOpen={Boolean(quickNotesBooking)}
        booking={quickNotesBooking}
        onClose={() => setQuickNotesBooking(null)}
        onNotesUpdated={fetchAllBookings}
      />
    </div>
  );
}
