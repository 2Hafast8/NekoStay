"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
  TrendingDown,
  Download,
  Search,
  ChevronLeft,
  ChevronRight,
  Info,
  ChevronDown,
  SlidersHorizontal,
  Wallet,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { BookingStatus } from "@/components/booking/BookingStatus";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { formatRupiah } from "@/lib/utils/format";
import { formatDate } from "@/lib/utils/dates";
import { getCheckoutCalculation } from "@/lib/utils/pricing";
import { useLanguage } from "@/hooks/useLanguage";
import { useGsapReveal } from "@/hooks/useGsapReveal";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export default function AdminBookingsPage() {
  const { t } = useLanguage();
  const containerRef = useRef(null);

  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [activeTab, setActiveTab] = useState("Semua");
  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filter & Pagination States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClass, setSelectedClass] = useState("Semua");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isBulkLoading, setIsBulkLoading] = useState(false);
  const [bulkRejectReason, setBulkRejectReason] = useState("");
  const [isBulkRejectOpen, setIsBulkRejectOpen] = useState(false);
  const itemsPerPage = 10;

  // Monthly / Yearly filter states (defaults to current month and year)
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(String(currentDate.getMonth() + 1)); // "1"-"12" or "all"
  const [selectedYear, setSelectedYear] = useState(String(currentDate.getFullYear())); // e.g. "2026" or "all"

  useGsapReveal(containerRef, { selector: ".anim-item", y: 20, stagger: 0.05, duration: 0.45 }, [filteredBookings, currentPage, activeTab]);

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

  // Approve Dialog
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  // Checkout Dialog
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutCalc, setCheckoutCalc] = useState(null);

  const supabase = createClient();

  const fetchAllBookings = useCallback(async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from("bookings")
        .select(
          `
          *,
          profiles (full_name, phone)
        `
        );

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

      const { data, error } = await query.order("created_at", { ascending: false });

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
  }, [fetchAllBookings]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

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

  const handleExportPDF = async () => {
    if (!filteredBookings || filteredBookings.length === 0) {
      alert("Tidak ada data untuk diekspor.");
      return;
    }

    try {
      // Dynamic imports to prevent SSR/build crashes in Next.js
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
      doc.setTextColor(234, 88, 12); // Brand orange (#ea580c)
      doc.text("NekoStay", 14, 15);

      // Sub-brand Title
      doc.setFont("helvetica", "normal");
      doc.setFontSize(14);
      doc.setTextColor(71, 85, 105); // Slate gray (#475569)
      doc.text("Laporan Pesanan Penitipan Kucing", 14, 22);

      // Metadata lines on the right side
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString("id-ID")}`, 283, 14, { align: "right" });
      doc.text(`Status Filter: ${activeTab}`, 283, 19, { align: "right" });

      const monthNames = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
      ];
      const filterPeriodText = selectedYear === "all"
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
      doc.setFillColor(248, 250, 252); // Slate 50
      doc.roundedRect(14, 33, 269, 14, 2, 2, "F");

      // Summary Content
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(30, 41, 59); // Slate 800
      doc.text("RINGKASAN LAPORAN:", 20, 42);

      doc.setFont("helvetica", "normal");
      doc.text("Total Pesanan: ", 75, 42);
      doc.setFont("helvetica", "bold");
      doc.text(`${filteredBookings.length}`, 102, 42);

      // Sum estimated_total
      const totalEst = filteredBookings.reduce((sum, b) => sum + (b.estimated_total || 0), 0);
      doc.setFont("helvetica", "normal");
      doc.text("Total Estimasi Pendapatan: ", 130, 42);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(234, 88, 12);
      const formattedRevenue = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(totalEst);
      doc.text(formattedRevenue, 182, 42);

      // Reset text color for normal text
      doc.setTextColor(51, 65, 85);

      const tableHeaders = [
        ["No", "Nama Kucing", "Pemilik", "Kelas Room", "Check-In", "Check-Out", "Durasi", "Total Biaya", "Status"]
      ];

      const tableRows = filteredBookings.map((b, index) => [
        index + 1,
        b.cat_name,
        b.profiles?.full_name || "Tanpa Nama",
        b.class,
        formatDate(b.check_in_date),
        formatDate(b.check_out_date),
        `${b.total_days} Hari`,
        new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(b.estimated_total || 0),
        b.status
      ]);

      autoTable(doc, {
        head: tableHeaders,
        body: tableRows,
        startY: 53,
        theme: "striped",
        headStyles: {
          fillColor: [234, 88, 12], // Brand orange (#ea580c)
          textColor: 255,
          fontStyle: "bold",
          fontSize: 9,
          halign: "center",
        },
        bodyStyles: {
          fontSize: 8,
          textColor: [51, 65, 85], // Slate 700
        },
        columnStyles: {
          0: { halign: "center", cellWidth: 10 },    // No
          1: { fontStyle: "bold" },                  // Cat Name
          4: { halign: "center" },                   // Check-in
          5: { halign: "center" },                   // Check-out
          6: { halign: "center" },                   // Duration
          7: { halign: "right", fontStyle: "bold" },   // Cost
          8: { halign: "center" },                   // Status
        },
        styles: {
          font: "helvetica",
          cellPadding: 3,
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252], // Slate 50
        },
      });

      // Add dynamic page footer at the end of PDF generation
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184); // Slate 400

        // Left Footer
        doc.text(
          "Dicetak otomatis melalui Panel Admin NekoStay",
          14,
          200
        );

        // Right Footer
        doc.text(
          `Halaman ${i} dari ${pageCount}`,
          283,
          200,
          { align: "right" }
        );
      }

      // Save the generated PDF
      const sanitizeName = (str) => str.replace(/[^a-z0-9]/gi, "_");
      doc.save(`Laporan_Pesanan_NekoStay_${sanitizeName(activeTab)}_${selectedYear}_${selectedMonth}.pdf`);
    } catch (error) {
      console.error("Gagal mengekspor PDF:", error);
      alert("Terjadi kesalahan saat memproses ekspor PDF.");
    }
  };

  // Process Approval
  const handleApprove = async () => {
    if (!selectedBooking) return;
    setIsApproving(true);

    try {
      // Set status to Aktif
      const { error } = await supabase
        .from("bookings")
        .update({ status: "Aktif" })
        .eq("id", selectedBooking.id);

      if (error) throw error;

      // Notify User
      await supabase.from("notifications").insert({
        user_id: selectedBooking.user_id,
        title: "Pesanan Penitipan Disetujui",
        message: `Kabar baik! Penitipan untuk ${selectedBooking.cat_name} telah aktif. Silakan bawa kucing Anda ke pengantaran.`,
        type: "success",
        booking_id: selectedBooking.id,
      });

      setIsApproveOpen(false);
      fetchAllBookings();
    } catch (err) {
      console.error("Error approving booking:", err);
    } finally {
      setIsApproving(false);
    }
  };

  // Process Rejection
  const handleReject = async () => {
    if (!selectedBooking || !rejectReason.trim()) return;
    setIsRejecting(true);

    try {
      // Set status to Dibatalkan and save reject_reason
      const { error } = await supabase
        .from("bookings")
        .update({
          status: "Dibatalkan",
          reject_reason: rejectReason,
        })
        .eq("id", selectedBooking.id);

      if (error) throw error;

      // Notify User
      await supabase.from("notifications").insert({
        user_id: selectedBooking.user_id,
        title: "Pesanan Penitipan Ditolak",
        message: `Mohon maaf, pesanan penitipan ${selectedBooking.cat_name} ditolak dengan alasan: ${rejectReason}`,
        type: "error",
        booking_id: selectedBooking.id,
      });

      setIsRejectOpen(false);
      setRejectReason("");
      fetchAllBookings();
    } catch (err) {
      console.error("Error rejecting booking:", err);
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
      alert(result.message || "Berhasil menyetujui pesanan.");
      setSelectedIds([]);
      fetchAllBookings();
    } catch (err) {
      console.error("Bulk approve error:", err);
      alert(err.message || "Gagal menyetujui pesanan terpilih.");
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
      alert(result.message || "Berhasil menolak pesanan.");
      setSelectedIds([]);
      setBulkRejectReason("");
      setIsBulkRejectOpen(false);
      fetchAllBookings();
    } catch (err) {
      console.error("Bulk reject error:", err);
      alert(err.message || "Gagal menolak pesanan terpilih.");
    } finally {
      setIsBulkLoading(false);
    }
  };

  // Open Checkout and calculate on-the-fly values
  const openCheckoutModal = (booking) => {
    setSelectedBooking(booking);
    const today = new Date();
    const calc = getCheckoutCalculation(booking, today);
    setCheckoutCalc(calc);
    setIsCheckoutOpen(true);
  };

  // Process Checkout Completion
  const handleCheckout = async () => {
    if (!selectedBooking || !checkoutCalc) return;
    setIsCheckingOut(true);

    try {
      // Save Checkout info to DB
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

      // Notify User
      await supabase.from("notifications").insert({
        user_id: selectedBooking.user_id,
        title: "Kucing Selesai Dititipkan",
        message: `Terima kasih! Penitipan ${selectedBooking.cat_name} telah selesai. Mpus sudah berhasil check-out. ${checkoutCalc.notes}`,
        type: "success",
        booking_id: selectedBooking.id,
      });

      setIsCheckoutOpen(false);
      fetchAllBookings();
    } catch (err) {
      console.error("Error checking out booking:", err);
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
      // Deselect all pending on current page
      setSelectedIds((prev) =>
        prev.filter(
          (id) => !pagePendingBookings.some((b) => b.id === id)
        )
      );
    } else {
      // Select all pending on current page
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
      <div className="space-y-8 animate-pulse p-4 sm:p-6 bg-background dark:bg-zinc-950 min-h-screen">
        <div className="h-8 bg-muted dark:bg-zinc-800/60 rounded-xl w-48 mb-4" />
        <div className="h-6 bg-muted dark:bg-zinc-800/60 rounded-xl w-96 mb-8" />
        <div className="h-64 bg-card dark:bg-zinc-900 border border-border dark:border-zinc-800 rounded-3xl" />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center gap-4 flex-wrap anim-item">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 text-[10px] font-extrabold uppercase tracking-wider">
            <Sparkles className="w-3 h-3 text-rose-500" />
            <span>{t("admin_bookings_badge")}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            {t("admin_bookings_title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("admin_bookings_subtitle")}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleExportPDF}
            className="p-3 bg-muted hover:bg-muted/80 rounded-xl transition-colors cursor-pointer text-muted-foreground hover:text-foreground flex items-center gap-2"
            title={t("admin_bookings_export_pdf")}
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline text-xs font-bold">{t("admin_bookings_export_pdf")}</span>
          </button>
          <button
            onClick={fetchAllBookings}
            className="p-3 bg-muted hover:bg-muted/80 rounded-xl transition-colors cursor-pointer text-muted-foreground hover:text-foreground"
            title={t("admin_bookings_refresh")}
          >
            <RefreshCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs Filter */}
      <div className="flex border-b border-border/80 overflow-x-auto pb-px gap-6 anim-item">
        {["Semua", "Menunggu", "Aktif", "Selesai", "Dibatalkan"].map((tab) => {
          const tabMapping = {
            "Semua": t("admin_bookings_tab_all"),
            "Menunggu": t("admin_bookings_tab_pending"),
            "Aktif": t("admin_bookings_tab_active"),
            "Selesai": t("admin_bookings_tab_completed"),
            "Dibatalkan": t("admin_bookings_tab_cancelled")
          };
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 text-sm font-semibold transition-all relative cursor-pointer whitespace-nowrap ${
                activeTab === tab
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tabMapping[tab]}
              {activeTab === tab && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col gap-4 bg-card border border-border p-4 rounded-2xl anim-item">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
          {/* Search bar */}
          <div className="relative w-full md:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={t("admin_bookings_search_placeholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-muted/40 border border-border rounded-xl text-xs focus:outline-hidden focus:border-primary/50 text-foreground font-medium"
            />
          </div>

          {/* Selector group */}
          <div className="flex flex-wrap items-center gap-3">
            <SlidersHorizontal className="w-4 h-4 text-muted-foreground shrink-0 hidden sm:block" />

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
              const currentYearLabel = yearOptions.find(o => o.value === selectedYear)?.label ?? selectedYear;
              return (
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center gap-2 px-3 py-2 bg-muted/40 hover:bg-muted border border-border rounded-xl text-xs font-semibold text-foreground transition-all duration-150 min-w-[110px] justify-between">
                    <span className="text-muted-foreground font-normal mr-0.5">Tahun:</span>
                    <span>{currentYearLabel}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground ml-1 shrink-0" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="bottom" align="start" sideOffset={6}>
                    <DropdownMenuLabel>Filter Tahun</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {yearOptions.map((opt) => (
                      <DropdownMenuItem
                        key={opt.value}
                        onClick={() => setSelectedYear(opt.value)}
                        className={selectedYear === opt.value ? "text-orange-600 dark:text-orange-400" : ""}
                      >
                        {selectedYear === opt.value && <Check className="w-3.5 h-3.5 shrink-0" />}
                        {selectedYear !== opt.value && <span className="w-3.5 h-3.5 shrink-0" />}
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
              const currentMonthLabel = monthOptions.find(o => o.value === selectedMonth)?.label ?? selectedMonth;
              const isDisabled = selectedYear === "all";
              return (
                <DropdownMenu>
                  <DropdownMenuTrigger
                    disabled={isDisabled}
                    className={`flex items-center gap-2 px-3 py-2 bg-muted/40 hover:bg-muted border border-border rounded-xl text-xs font-semibold text-foreground transition-all duration-150 min-w-[140px] justify-between ${
                      isDisabled ? "opacity-50 cursor-not-allowed pointer-events-none" : ""
                    }`}
                  >
                    <span className="text-muted-foreground font-normal mr-0.5">Bulan:</span>
                    <span>{currentMonthLabel}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground ml-1 shrink-0" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="bottom" align="start" sideOffset={6}>
                    <DropdownMenuLabel>Filter Bulan</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {monthOptions.map((opt) => (
                      <DropdownMenuItem
                        key={opt.value}
                        onClick={() => setSelectedMonth(opt.value)}
                        className={selectedMonth === opt.value ? "text-orange-600 dark:text-orange-400" : ""}
                      >
                        {selectedMonth === opt.value && <Check className="w-3.5 h-3.5 shrink-0" />}
                        {selectedMonth !== opt.value && <span className="w-3.5 h-3.5 shrink-0" />}
                        {opt.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              );
            })()}

            {/* Class Dropdown */}
            {(() => {
              const classOptions = [
                { value: "Semua", label: "Semua Kelas" },
                { value: "Basic", label: "Basic" },
                { value: "Standard", label: "Standard" },
                { value: "Premium", label: "Premium" },
              ];
              const currentClassLabel = classOptions.find(o => o.value === selectedClass)?.label ?? selectedClass;
              return (
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center gap-2 px-3 py-2 bg-muted/40 hover:bg-muted border border-border rounded-xl text-xs font-semibold text-foreground transition-all duration-150 min-w-[130px] justify-between">
                    <span className="text-muted-foreground font-normal mr-0.5">Kelas:</span>
                    <span>{currentClassLabel}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground ml-1 shrink-0" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="bottom" align="start" sideOffset={6}>
                    <DropdownMenuLabel>Filter Kelas</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {classOptions.map((opt) => (
                      <DropdownMenuItem
                        key={opt.value}
                        onClick={() => setSelectedClass(opt.value)}
                        className={selectedClass === opt.value ? "text-orange-600 dark:text-orange-400" : ""}
                      >
                        {selectedClass === opt.value && <Check className="w-3.5 h-3.5 shrink-0" />}
                        {selectedClass !== opt.value && <span className="w-3.5 h-3.5 shrink-0" />}
                        {opt.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Bookings Table */}
      {isLoading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="h-16 bg-card border border-border rounded-2xl"
            />
          ))}
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border border-dashed rounded-3xl p-8 max-w-xl mx-auto text-muted-foreground">
          <CalendarRange className="w-8 h-8 mx-auto mb-2.5 text-muted-foreground/35" />
          <p className="text-sm font-bold">{t("admin_bookings_empty")}</p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-muted/40 border-b border-border/80 text-muted-foreground font-bold">
                    <th className="p-4 sm:p-5 w-12 text-center">
                      <input
                        type="checkbox"
                        checked={isAllPagePendingSelected}
                        onChange={handleSelectAllPagePending}
                        disabled={pagePendingBookings.length === 0}
                        className="w-4 h-4 rounded-sm border-border cursor-pointer accent-primary"
                      />
                    </th>
                    <th className="p-4 sm:p-5">{t("admin_bookings_col_owner_cat")}</th>
                    <th className="p-4 sm:p-5">{t("admin_bookings_col_class_rate")}</th>
                    <th className="p-4 sm:p-5">{t("admin_bookings_col_schedule")}</th>
                    <th className="p-4 sm:p-5">{t("admin_bookings_col_est_total")}</th>
                    <th className="p-4 sm:p-5">{t("admin_bookings_col_status")}</th>
                    <th className="p-4 sm:p-5">Status Bayar</th>
                    <th className="p-4 sm:p-5 text-right">{t("admin_bookings_col_action")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {paginatedBookings.map((b) => (
                    <tr
                      key={b.id}
                      className="hover:bg-muted/15 transition-colors anim-item"
                    >
                      <td className="p-4 sm:p-5 text-center">
                        {b.status === "Menunggu" ? (
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(b.id)}
                            onChange={() => handleSelectRow(b.id)}
                            className="w-4 h-4 rounded-sm border-border cursor-pointer accent-primary"
                          />
                        ) : (
                          <div className="w-4 h-4" />
                        )}
                      </td>
                      <td className="p-4 sm:p-5">
                        <div className="font-bold text-foreground">
                          {b.cat_name}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {b.profiles?.full_name}{" "}
                          {b.profiles?.phone && `(${b.profiles.phone})`}
                        </div>
                      </td>
                      <td className="p-4 sm:p-5 font-semibold text-foreground">
                        {b.class}
                        <span className="text-[10px] text-muted-foreground font-medium block mt-0.5">
                          {formatRupiah(b.price_per_day)}/hari
                        </span>
                      </td>
                      <td className="p-4 sm:p-5">
                        <span className="font-semibold text-foreground text-xs block">
                          {formatDate(b.check_in_date)} -{" "}
                          {formatDate(b.check_out_date)}
                        </span>
                        <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full font-bold text-foreground inline-block mt-1">
                          {b.total_days} Hari
                        </span>
                      </td>
                      <td className="p-4 sm:p-5">
                        <div className="font-extrabold text-foreground">
                          {formatRupiah(b.estimated_total)}
                        </div>
                        {b.late_fee_total > 0 && (
                          <div className="text-[10px] font-bold text-rose-500 mt-1 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-rose-500 shrink-0" />
                            <span>Denda: +{formatRupiah(b.late_fee_total)}</span>
                          </div>
                        )}
                        {b.refund_amount > 0 && (
                          <div className="text-[10px] font-bold text-blue-500 mt-1 flex items-center gap-1">
                            <TrendingDown className="w-3 h-3 text-blue-500 shrink-0" />
                            <span>Refund: -{formatRupiah(b.refund_amount)}</span>
                          </div>
                        )}
                      </td>
                      <td className="p-4 sm:p-5">
                        <BookingStatus status={b.status} />
                      </td>
                      <td className="p-4 sm:p-5">
                        <DropdownMenu>
                          <DropdownMenuTrigger className={`inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold rounded-full border cursor-pointer transition-all ${
                            b.payment_status === 'Paid' ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' :
                            b.payment_status === 'Failed' ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800' :
                            b.payment_status === 'Refunded' ? 'bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800' :
                            'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                          }`}>
                            <Wallet className="w-3 h-3" />
                            {b.payment_status === 'Paid' ? 'Lunas' : b.payment_status === 'Failed' ? 'Gagal' : b.payment_status === 'Refunded' ? 'Refund' : 'Belum'}
                            <ChevronDown className="w-2.5 h-2.5" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent side="bottom" align="start" sideOffset={4}>
                            {[
                              { value: 'Unpaid', label: 'Belum Dibayar' },
                              { value: 'Paid', label: 'Lunas' },
                              { value: 'Failed', label: 'Gagal' },
                              { value: 'Refunded', label: 'Dikembalikan' },
                            ].map((opt) => (
                              <DropdownMenuItem
                                key={opt.value}
                                onClick={async () => {
                                  if (b.payment_status === opt.value) return;
                                  try {
                                    const res = await fetch(`/api/bookings/${b.id}/payment-status`, {
                                      method: 'PATCH',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ paymentStatus: opt.value }),
                                    });
                                    if (!res.ok) {
                                      const data = await res.json();
                                      alert(data.error || 'Gagal mengubah status');
                                      return;
                                    }
                                    fetchAllBookings();
                                  } catch (err) {
                                    alert(err.message || 'Terjadi kesalahan');
                                  }
                                }}
                                className={b.payment_status === opt.value ? 'text-orange-600 dark:text-orange-400 font-bold' : ''}
                              >
                                {b.payment_status === opt.value && <Check className="w-3.5 h-3.5 mr-1 shrink-0" />}
                                {opt.label}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                      <td className="p-4 sm:p-5 text-right">
                        <div className="flex items-center justify-end gap-2.5">
                          <Link
                            href={`/admin/bookings/${b.id}`}
                            className="px-3 py-1.5 border border-border hover:bg-muted text-xs font-bold rounded-xl transition-all inline-block"
                          >
                            {t("admin_bookings_btn_detail")}
                          </Link>

                          {b.status === "Menunggu" && (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedBooking(b);
                                  setIsApproveOpen(true);
                                }}
                                className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:bg-primary/90 transition-all cursor-pointer flex items-center gap-1"
                              >
                                <Check className="w-3.5 h-3.5" />
                                {t("admin_bookings_btn_approve")}
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedBooking(b);
                                  setIsRejectOpen(true);
                                }}
                                className="px-3 py-1.5 border border-rose-200 hover:border-rose-300 text-rose-600 bg-rose-500/5 hover:bg-rose-500/10 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1"
                              >
                                <X className="w-3.5 h-3.5" />
                                {t("admin_bookings_btn_reject")}
                              </button>
                            </>
                          )}

                          {b.status === "Aktif" && (
                            <button
                              onClick={() => openCheckoutModal(b)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1"
                            >
                              <LogOut className="w-3.5 h-3.5" />
                              {t("admin_bookings_btn_checkout")}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="space-y-4 md:hidden">
            {/* Mobile "Select All" bar if there are pending bookings */}
            {pagePendingBookings.length > 0 && (
              <div className="bg-card border border-border p-4 rounded-2xl flex items-center justify-between shadow-xs">
                <label className="flex items-center gap-2 text-xs font-bold text-muted-foreground cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isAllPagePendingSelected}
                    onChange={handleSelectAllPagePending}
                    className="w-4.5 h-4.5 rounded-sm border-border accent-primary"
                  />
                  Pilih Semua Menunggu
                </label>
                {selectedIds.length > 0 && (
                  <span className="text-xs bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-bold">
                    {selectedIds.length} Terpilih
                  </span>
                )}
              </div>
            )}

            {paginatedBookings.map((b) => (
              <div key={b.id} className="bg-card border border-border rounded-2xl p-5 space-y-4 shadow-xs anim-item">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    {b.status === "Menunggu" && (
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(b.id)}
                        onChange={() => handleSelectRow(b.id)}
                        className="w-4.5 h-4.5 rounded-sm border-border accent-primary shrink-0 cursor-pointer"
                      />
                    )}
                    <div>
                      <h3 className="font-extrabold text-foreground text-sm">
                        {b.cat_name}
                      </h3>
                      <p className="text-[11px] text-muted-foreground">
                        Pemilik: {b.profiles?.full_name || "Tamu Neko"}
                      </p>
                    </div>
                  </div>
                  <BookingStatus status={b.status} />
                </div>

                <div className="grid grid-cols-2 gap-y-3 gap-x-2 border-t border-b border-border/40 py-3 text-xs text-muted-foreground">
                  <div>
                    <span className="text-[10px] text-muted-foreground block uppercase font-bold tracking-wider">Kelas & Tarif</span>
                    <span className="font-semibold text-foreground">{b.class}</span>
                    <span className="text-[10px] text-muted-foreground block">{formatRupiah(b.price_per_day)}/hari</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block uppercase font-bold tracking-wider">Durasi Jadwal</span>
                    <span className="font-semibold text-foreground">{b.total_days} Hari</span>
                    <span className="text-[10px] text-muted-foreground block">{formatDate(b.check_in_date)} s/d {formatDate(b.check_out_date)}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[10px] text-muted-foreground block uppercase font-bold tracking-wider">Estimasi Tagihan</span>
                    <span className="font-extrabold text-foreground text-sm">{formatRupiah(b.estimated_total)}</span>
                    {b.late_fee_total > 0 && (
                      <span className="text-[10px] font-bold text-rose-500 block mt-0.5">Denda: +{formatRupiah(b.late_fee_total)}</span>
                    )}
                    {b.refund_amount > 0 && (
                      <span className="text-[10px] font-bold text-blue-500 block mt-0.5">Refund: -{formatRupiah(b.refund_amount)}</span>
                    )}
                  </div>
                  <div className="col-span-2">
                    <span className="text-[10px] text-muted-foreground block uppercase font-bold tracking-wider">Status Bayar</span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full mt-1 ${
                      b.payment_status === 'Paid' ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400' :
                      b.payment_status === 'Failed' ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400' :
                      b.payment_status === 'Refunded' ? 'bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400' :
                      'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400'
                    }`}>
                      <Wallet className="w-3 h-3" />
                      {b.payment_status === 'Paid' ? 'Lunas' : b.payment_status === 'Failed' ? 'Gagal' : b.payment_status === 'Refunded' ? 'Dikembalikan' : 'Belum Dibayar'}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                  <Link
                    href={`/admin/bookings/${b.id}`}
                    className="px-3.5 py-2 border border-border hover:bg-muted text-xs font-bold rounded-xl transition-all text-center flex-1 sm:flex-initial"
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
                        className="px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:bg-primary/90 transition-all cursor-pointer flex items-center justify-center gap-1 flex-1 sm:flex-initial"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Setujui
                      </button>
                      <button
                        onClick={() => {
                          setSelectedBooking(b);
                          setIsRejectOpen(true);
                        }}
                        className="px-4 py-2 border border-rose-200 hover:border-rose-300 text-rose-600 bg-rose-500/5 hover:bg-rose-500/10 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 flex-1 sm:flex-initial"
                      >
                        <X className="w-3.5 h-3.5" />
                        Tolak
                      </button>
                    </>
                  )}

                  {b.status === "Aktif" && (
                    <button
                      onClick={() => openCheckoutModal(b)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 flex-1 sm:flex-initial"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Check-Out
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-4 flex-wrap bg-card border border-border px-5 py-4 rounded-2xl anim-item">
          <p className="text-xs text-muted-foreground font-semibold">
            Menampilkan <span className="text-foreground">{Math.min(filteredBookings.length, (currentPage - 1) * itemsPerPage + 1)}</span> - <span className="text-foreground">{Math.min(filteredBookings.length, currentPage * itemsPerPage)}</span> dari <span className="text-foreground">{filteredBookings.length}</span> pesanan
          </p>
          
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 border border-border rounded-xl hover:bg-muted/80 disabled:opacity-40 transition-colors cursor-pointer text-muted-foreground hover:text-foreground"
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
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-2 border border-border rounded-xl hover:bg-muted/80 disabled:opacity-40 transition-colors cursor-pointer text-muted-foreground hover:text-foreground"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* APPROVE DIALOG */}
      <ConfirmDialog
        isOpen={isApproveOpen}
        title="Setujui Penitipan Kucing?"
        description={`Apakah Anda yakin ingin menyetujui pemesanan kucing ${selectedBooking?.cat_name}? Status akan berubah menjadi aktif dan check-in terdaftar.`}
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
        description={`Berikan alasan penolakan pemesanan untuk kucing ${selectedBooking?.cat_name}. Alasan ini akan dikirim via email dan notifikasi ke pemilik.`}
        confirmText="Tolak Booking"
        cancelText="Kembali"
        variant="danger"
        isLoading={isRejecting}
        onConfirm={handleReject}
        onCancel={() => setIsRejectOpen(false)}
      >
        <div className="mt-4 space-y-1.5">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
            Alasan Penolakan
          </label>
          <textarea
            required
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Tulis alasan penolakan..."
            rows={3}
            className="w-full px-3 py-2 bg-muted/40 border border-border rounded-xl text-xs focus:outline-hidden focus:border-primary/50 text-foreground font-medium"
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

          <div className="relative w-full max-w-lg bg-card border border-border p-6 sm:p-8 rounded-3xl shadow-xl space-y-6 animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-bold text-foreground border-b border-border/60 pb-3 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              <span>
                Kalkulasi Tagihan Check-Out ({selectedBooking.cat_name})
              </span>
            </h3>

            <div className="space-y-4 text-xs sm:text-sm">
              <div className="flex justify-between border-b border-border/40 pb-2">
                <span className="text-muted-foreground">Kelas Penitipan:</span>
                <strong className="text-foreground">
                  {selectedBooking.class} (
                  {formatRupiah(selectedBooking.price_per_day)}/hari)
                </strong>
              </div>

              <div className="flex justify-between border-b border-border/40 pb-2">
                <span className="text-muted-foreground">Jadwal Keluar:</span>
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
                <div className="flex justify-between border-b border-border/40 pb-2 text-rose-600 font-bold bg-rose-500/5 p-2 rounded-lg">
                  <span>
                    Denda Terlambat ({checkoutCalc.lateDaysCount} hari):
                  </span>
                  <span>+{formatRupiah(checkoutCalc.lateFee)}</span>
                </div>
              )}

              {checkoutCalc.refundDays > 0 && (
                <div className="flex justify-between border-b border-border/40 pb-2 text-blue-600 font-bold bg-blue-500/5 p-2 rounded-lg">
                  <span>
                    Refund Ambil Awal ({checkoutCalc.refundDays} hari):
                  </span>
                  <span>-{formatRupiah(checkoutCalc.refund)}</span>
                </div>
              )}

              <div className="flex justify-between border-b border-border/40 pb-2 text-base font-black text-foreground pt-2">
                <span>Total Akhir Tagihan:</span>
                <span className="text-emerald-600 text-lg">
                  {formatRupiah(checkoutCalc.finalCost)}
                </span>
              </div>

              <div className="p-3 bg-secondary text-secondary-foreground text-xs rounded-xl leading-relaxed font-semibold flex items-start gap-1.5">
                <Info className="w-4 h-4 shrink-0 text-primary mt-0.5" />
                <span>Info: {checkoutCalc.notes}</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border/60">
              <button
                type="button"
                disabled={isCheckingOut}
                className="px-5 py-2.5 border border-border hover:bg-muted text-xs font-bold rounded-xl text-foreground cursor-pointer disabled:opacity-50"
                onClick={() => setIsCheckoutOpen(false)}
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isCheckingOut}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                onClick={handleCheckout}
              >
                {isCheckingOut ? (
                  <>
                    <svg
                      className="animate-spin h-3.5 w-3.5 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Sedang Memproses...
                  </>
                ) : (
                  "Selesaikan Check-Out"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Actions Floating Bar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-card border border-border shadow-2xl p-4 sm:p-5 rounded-2xl flex items-center gap-4 w-[90%] max-w-xl animate-in slide-in-from-bottom-8 duration-300">
          <div className="flex-1">
            <p className="text-xs font-bold text-foreground">
              {selectedIds.length} Pesanan Terpilih
            </p>
            <p className="text-[10px] text-muted-foreground font-semibold">
              Terapkan aksi secara massal untuk pesanan berstatus Menunggu.
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleBulkApprove}
              disabled={isBulkLoading}
              className="px-3.5 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:bg-primary/95 transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" />
              Setujui
            </button>
            <button
              onClick={() => setIsBulkRejectOpen(true)}
              disabled={isBulkLoading}
              className="px-3.5 py-2 border border-rose-200 hover:border-rose-300 text-rose-600 bg-rose-500/5 hover:bg-rose-500/10 text-xs font-bold rounded-xl transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              <X className="w-3.5 h-3.5" />
              Tolak
            </button>
          </div>
        </div>
      )}

      {/* BULK REJECT DIALOG */}
      <ConfirmDialog
        isOpen={isBulkRejectOpen}
        title={`Tolak ${selectedIds.length} Pemesanan Terpilih?`}
        description={`Berikan alasan penolakan untuk semua pemesanan yang dipilih. Alasan ini akan dikirim via email dan notifikasi ke pemilik masing-masing.`}
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
            placeholder="Tulis alasan penolakan..."
            rows={3}
            className="w-full px-3 py-2 bg-muted/40 border border-border rounded-xl text-xs focus:outline-hidden focus:border-primary/50 text-foreground font-medium"
          />
        </div>
      </ConfirmDialog>
    </div>
  );
}
