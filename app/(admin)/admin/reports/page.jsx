"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import {
  HeartPulse,
  Cat,
  Search,
  Calendar,
  ChevronRight,
  ChevronLeft,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Camera,
  Maximize2,
  X,
  Phone,
  User,
  Check,
  Activity,
  Filter,
  ArrowUpDown,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils/dates";
import { useLanguage } from "@/hooks/useLanguage";
import { useGsapReveal } from "@/hooks/useGsapReveal";
import { GsapDataLoader } from "@/components/shared/GsapDataLoader";
import { GsapTextButton } from "@/components/shared/GsapTextButton";
import { ImageUpload } from "@/components/shared/ImageUpload";
import { toast } from "sonner";

export default function AdminReportsPage() {
  const { t, language } = useLanguage();
  const supabase = createClient();

  // Data states
  const [reports, setReports] = useState([]);
  const [activeBookings, setActiveBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [healthFilter, setHealthFilter] = useState("all"); // "all" | "Sehat" | "Kurang Fit" | "Perlu Perhatian"
  const [scopeFilter, setScopeFilter] = useState("active"); // "active" | "today" | "all"
  const [reportsPerPage, setReportsPerPage] = useState(9);
  const [currentPage, setCurrentPage] = useState(1);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState("");
  const [modalHealthStatus, setModalHealthStatus] = useState("Sehat");
  const [modalNotes, setModalNotes] = useState("");
  const [modalPhotoUrl, setModalPhotoUrl] = useState("");
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  // Lightbox state
  const [lightboxPhoto, setLightboxPhoto] = useState(null); // { url, catName, date, status }

  const reportsListRef = useRef(null);
  useGsapReveal(reportsListRef, {
    selector: ":scope > *",
    y: 20,
    stagger: 0.06,
    duration: 0.5,
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Format phone to WhatsApp link
  const getWhatsAppUrl = (phone, catName, ownerName) => {
    if (!phone) return null;
    const clean = phone.replace(/\D/g, "");
    const normalized = clean.startsWith("0")
      ? "62" + clean.slice(1)
      : clean.startsWith("62")
      ? clean
      : "62" + clean;
    const text = encodeURIComponent(
      `Halo Kak ${ownerName || ""}, kami dari NekoStay ingin mengabarkan update kondisi harian anabul tercinta ${catName || ""}...`
    );
    return `https://wa.me/${normalized}?text=${text}`;
  };

  // Load all reports & active bookings
  async function loadData(showToast = false) {
    if (showToast) setIsRefreshing(true);
    try {
      // 1. Fetch reports with joined booking and customer profiles
      const { data: reportsData, error: reportsErr } = await supabase
        .from("cat_reports")
        .select(
          `
          *,
          bookings (
            id,
            status,
            cat_name,
            class,
            check_in_date,
            check_out_date,
            profiles:user_id (full_name, phone, email)
          )
        `
        )
        .order("report_date", { ascending: false })
        .order("created_at", { ascending: false });

      if (reportsErr) throw reportsErr;
      setReports(reportsData || []);

      // 2. Fetch currently active bookings
      const { data: activeData, error: activeErr } = await supabase
        .from("bookings")
        .select(
          `
          id,
          status,
          cat_name,
          class,
          check_in_date,
          check_out_date,
          profiles:user_id (full_name, phone, email)
        `
        )
        .eq("status", "Aktif")
        .order("check_in_date", { ascending: false });

      if (activeErr) throw activeErr;
      setActiveBookings(activeData || []);

      if (showToast) {
        toast.success(
          language === "en"
            ? "Cat condition data updated!"
            : "Data monitoring kondisi kucing diperbarui!"
        );
      }
    } catch (err) {
      console.error("Error loading reports:", err);
      if (showToast) toast.error("Gagal memuat data terbaru.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    loadData();

    // Setup real-time listener for live updates
    let debounceTimer = null;
    const triggerDebouncedReload = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        loadData();
      }, 400);
    };

    const channelId = `admin-reports-realtime-${Math.random().toString(36).substring(7)}`;
    const channel = supabase
      .channel(channelId)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "cat_reports" },
        () => triggerDebouncedReload()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookings" },
        () => triggerDebouncedReload()
      )
      .subscribe();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        loadData();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [supabase]);

  // Today's date string YYYY-MM-DD
  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);

  // Stats calculation
  const stats = useMemo(() => {
    const total = reports.length;
    const healthy = reports.filter((r) => r.health_status === "Sehat").length;
    const unwell = reports.filter((r) => r.health_status === "Kurang Fit").length;
    const attention = reports.filter(
      (r) => r.health_status === "Perlu Perhatian"
    ).length;
    const todayReports = reports.filter((r) => r.report_date === todayStr).length;

    // Active cats that have received report today
    const activeReportedToday = activeBookings.filter((b) =>
      reports.some(
        (r) => r.booking_id === b.id && r.report_date === todayStr
      )
    ).length;

    const healthyPercent = total > 0 ? Math.round((healthy / total) * 100) : 100;

    return {
      total,
      healthy,
      unwell,
      attention,
      todayReports,
      activeCount: activeBookings.length,
      activeReportedToday,
      healthyPercent,
    };
  }, [reports, activeBookings, todayStr]);

  // Filtered reports
  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      // Scope filter
      if (scopeFilter === "active" && r.bookings?.status !== "Aktif") {
        return false;
      }
      if (scopeFilter === "today" && r.report_date !== todayStr) {
        return false;
      }

      // Health status filter
      if (healthFilter !== "all" && r.health_status !== healthFilter) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const catName = r.bookings?.cat_name?.toLowerCase() || "";
        const ownerName = r.bookings?.profiles?.full_name?.toLowerCase() || "";
        const notes = r.notes?.toLowerCase() || "";
        const roomClass = r.bookings?.class?.toLowerCase() || "";

        return (
          catName.includes(q) ||
          ownerName.includes(q) ||
          notes.includes(q) ||
          roomClass.includes(q)
        );
      }

      return true;
    });
  }, [reports, scopeFilter, healthFilter, searchQuery, todayStr]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredReports.length / reportsPerPage) || 1;
  const paginatedReports = useMemo(() => {
    const start = (currentPage - 1) * reportsPerPage;
    return filteredReports.slice(start, start + reportsPerPage);
  }, [filteredReports, currentPage, reportsPerPage]);

  // Quick Open Modal with specific booking preselected
  const handleOpenAddForBooking = (bookingId) => {
    setSelectedBookingId(bookingId);
    setModalHealthStatus("Sehat");
    setModalNotes("");
    setModalPhotoUrl("");
    setIsAddModalOpen(true);
  };

  // Submit quick report
  const handleAddReportSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBookingId) {
      toast.error(
        language === "en"
          ? "Please select a boarding cat."
          : "Silakan pilih kucing yang sedang menginap."
      );
      return;
    }

    setIsSubmittingReport(true);
    try {
      const response = await fetch(`/api/bookings/${selectedBookingId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          healthStatus: modalHealthStatus,
          notes: modalNotes || null,
          photoUrl: modalPhotoUrl || null,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Gagal menyimpan laporan harian.");
      }

      toast.success(
        language === "en"
          ? "Daily report saved and owner notified!"
          : "Laporan harian berhasil disimpan dan pemilik telah dinotifikasi!"
      );

      setIsAddModalOpen(false);
      setModalNotes("");
      setModalPhotoUrl("");
      setModalHealthStatus("Sehat");
      setSelectedBookingId("");
      loadData();
    } catch (err) {
      console.error("Add report error:", err);
      toast.error(err.message || "Gagal menyimpan laporan harian.");
    } finally {
      setIsSubmittingReport(false);
    }
  };

  if (!isMounted) {
    return (
      <div className="space-y-8 animate-pulse p-4 sm:p-6 bg-background dark:bg-zinc-950 min-h-screen">
        <div className="h-8 bg-muted dark:bg-zinc-850 rounded-xl w-48 mb-4" />
        <div className="h-6 bg-muted dark:bg-zinc-850 rounded-xl w-96 mb-8" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-card dark:bg-zinc-900 border border-border dark:border-zinc-800 rounded-3xl" />
          ))}
        </div>
        <div className="h-64 bg-card dark:bg-zinc-900 border border-border dark:border-zinc-800 rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* ================= 1. HERO HEADER ================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-6">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-black uppercase tracking-wider">
            <HeartPulse className="w-3.5 h-3.5 text-rose-500" />
            <span>
              {language === "en"
                ? "CAT HEALTH & CARE MONITOR"
                : "MONITORING KONDISI KUCING & MEDIS"}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            {language === "en"
              ? "Cat Condition Reports"
              : "Rekam Kondisi Harian Kucing"}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
            {language === "en"
              ? "Track daily health status, manage boarding activity logs, and provide periodic photo updates directly to pet parents."
              : "Pantau kesehatan, log perawatan harian selama masa inap, dan kirimkan update kondisi anabul berkala ke pemilik."}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={isRefreshing}
            title={language === "en" ? "Refresh data" : "Segarkan data"}
            className="p-3 bg-card hover:bg-muted/80 text-muted-foreground hover:text-foreground border border-border rounded-2xl transition-all cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-primary" : ""}`} />
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedBookingId(activeBookings[0]?.id || "");
              setIsAddModalOpen(true);
            }}
            className="px-4 sm:px-5 py-3 rounded-2xl bg-primary hover:bg-primary/95 text-primary-foreground text-xs sm:text-sm font-extrabold shadow-md shadow-primary/20 transition-all flex items-center gap-2 cursor-pointer active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>{language === "en" ? "Add Daily Report" : "Tambah Laporan Baru"}</span>
          </button>
        </div>
      </div>

      {/* ================= 2. EXECUTIVE BENTO KPI STATS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Metric 1: Total Reports */}
        <div className="bg-card dark:bg-zinc-900/60 border border-border dark:border-zinc-850 p-5 rounded-3xl space-y-2.5 shadow-xs relative overflow-hidden group hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
              {language === "en" ? "Total Log Entries" : "Total Laporan"}
            </span>
            <div className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-foreground">
            {stats.total}
          </div>
          <p className="text-[11px] font-medium text-muted-foreground">
            {language === "en"
              ? "All recorded condition history"
              : "Seluruh rekam medis & log perawatan"}
          </p>
          <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-blue-500/5 rounded-full pointer-events-none group-hover:scale-125 transition-transform" />
        </div>

        {/* Metric 2: Healthy Status */}
        <div className="bg-card dark:bg-zinc-900/60 border border-border dark:border-zinc-850 p-5 rounded-3xl space-y-2.5 shadow-xs relative overflow-hidden group hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
              {language === "en" ? "Healthy & Fit" : "Kondisi Sehat"}
            </span>
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
              {stats.healthy}
            </span>
            <span className="text-xs font-bold text-muted-foreground">
              ({stats.healthyPercent}%)
            </span>
          </div>
          <p className="text-[11px] font-medium text-muted-foreground">
            {language === "en"
              ? "Cats active, energetic & stable"
              : "Anabul bugar, aktif, & nafsu makan baik"}
          </p>
          <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-emerald-500/5 rounded-full pointer-events-none group-hover:scale-125 transition-transform" />
        </div>

        {/* Metric 3: Needs Attention */}
        <div className="bg-card dark:bg-zinc-900/60 border border-border dark:border-zinc-850 p-5 rounded-3xl space-y-2.5 shadow-xs relative overflow-hidden group hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
              {language === "en" ? "Special Attention" : "Perlu Perhatian"}
            </span>
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-amber-600 dark:text-amber-400">
            {stats.unwell + stats.attention}
          </div>
          <p className="text-[11px] font-medium text-muted-foreground">
            {language === "en"
              ? `${stats.unwell} unwell • ${stats.attention} medical review`
              : `${stats.unwell} kurang fit • ${stats.attention} perhatian khusus`}
          </p>
          <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-amber-500/5 rounded-full pointer-events-none group-hover:scale-125 transition-transform" />
        </div>

        {/* Metric 4: Today's Log Progress */}
        <div className="bg-card dark:bg-zinc-900/60 border border-border dark:border-zinc-850 p-5 rounded-3xl space-y-2.5 shadow-xs relative overflow-hidden group hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
              {language === "en" ? "Today's Updates" : "Laporan Hari Ini"}
            </span>
            <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-primary">
              {stats.activeReportedToday}
            </span>
            <span className="text-xs font-bold text-muted-foreground">
              / {stats.activeCount} {language === "en" ? "boarded" : "menginap"}
            </span>
          </div>
          <p className="text-[11px] font-medium text-muted-foreground">
            {stats.activeCount === 0
              ? language === "en"
                ? "No active boarding stays currently"
                : "Belum ada anabul aktif menginap"
              : stats.activeReportedToday >= stats.activeCount
              ? language === "en"
                ? "All active cats reported today!"
                : "Seluruh anabul sudah dilaporkan hari ini!"
              : language === "en"
              ? `${stats.activeCount - stats.activeReportedToday} cat(s) awaiting today's report`
              : `${stats.activeCount - stats.activeReportedToday} anabul belum dibuatkan laporan`}
          </p>
          <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-primary/5 rounded-full pointer-events-none group-hover:scale-125 transition-transform" />
        </div>
      </div>

      {/* ================= 3. ACTIVE BOARDING TRACKER ================= */}
      {activeBookings.length > 0 && (
        <div className="bg-card dark:bg-zinc-900/60 border border-border dark:border-zinc-850 p-5 sm:p-6 rounded-3xl space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <Cat className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-foreground">
                  {language === "en"
                    ? "Active Boarding Cats Tracker"
                    : "Status Pemantauan Kucing Menginap Aktif"}
                </h3>
                <p className="text-[11px] text-muted-foreground font-medium">
                  {language === "en"
                    ? "Monitor daily condition reporting progress for currently boarded cats"
                    : "Pastikan seluruh anabul yang sedang menginap telah menerima laporan kondisi hari ini"}
                </p>
              </div>
            </div>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold shrink-0 self-start sm:self-center">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{activeBookings.length} {language === "en" ? "Boarding Cats" : "Kucing Menginap"}</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3 sm:gap-4">
            {activeBookings.map((b) => {
              const hasReportToday = reports.some(
                (r) => r.booking_id === b.id && r.report_date === todayStr
              );
              const latestReport = reports.find((r) => r.booking_id === b.id);
              const ownerName = b.profiles?.full_name || "-";
              const waUrl = getWhatsAppUrl(b.profiles?.phone, b.cat_name, ownerName);

              return (
                <div
                  key={b.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                    hasReportToday
                      ? "bg-muted/20 dark:bg-zinc-950/30 border-border/80"
                      : "bg-amber-500/5 dark:bg-amber-500/10 border-amber-500/30 shadow-xs"
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-xs shrink-0">
                          {b.cat_name ? b.cat_name.charAt(0).toUpperCase() : "C"}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-sm text-foreground">
                              {b.cat_name}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-secondary text-primary">
                              {b.class}
                            </span>
                          </div>
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <User className="w-3 h-3 text-muted-foreground/70" />
                            <span>{ownerName}</span>
                          </span>
                        </div>
                      </div>

                      {waUrl && (
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="WhatsApp Pemilik"
                          className="p-1.5 rounded-xl hover:bg-muted text-emerald-600 transition-colors"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>

                    {/* Latest condition snippet */}
                    {latestReport && (
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <span className="font-bold">Kondisi terakhir:</span>
                        <span
                          className={`font-extrabold ${
                            latestReport.health_status === "Sehat"
                              ? "text-emerald-600 dark:text-emerald-400"
                              : latestReport.health_status === "Kurang Fit"
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          {latestReport.health_status}
                        </span>
                        <span>• {formatDate(latestReport.report_date, "short")}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-border/50 flex items-center justify-between gap-2">
                    {hasReportToday ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-xl">
                        <Check className="w-3 h-3 text-emerald-500" />
                        <span>{language === "en" ? "Reported Today" : "Sudah Dilaporkan"}</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleOpenAddForBooking(b.id)}
                        className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-amber-950 font-black text-xs shadow-xs transition-all cursor-pointer active:scale-98"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{language === "en" ? "Create Today's Log" : "Buat Laporan Hari Ini"}</span>
                      </button>
                    )}

                    <Link
                      href={`/admin/bookings/${b.id}`}
                      className="p-1.5 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors text-xs font-bold flex items-center"
                      title={language === "en" ? "View Booking Details" : "Lihat Detail Pesanan"}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= 4. SEARCH & FILTER TOOLBAR ================= */}
      <div className="bg-card dark:bg-zinc-900/60 border border-border dark:border-zinc-850 p-5 rounded-3xl space-y-4 shadow-xs">
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
          {/* Search bar */}
          <div className="relative w-full lg:max-w-md">
            <Search className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={
                language === "en"
                  ? "Search cat name, owner, room class, or notes..."
                  : "Cari nama anabul, pemilik, kelas, atau isi catatan..."
              }
              className="w-full pl-11 pr-4 py-3 bg-muted/40 border border-border rounded-2xl text-xs sm:text-sm focus:outline-hidden text-foreground font-medium transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-3.5 p-0.5 rounded-md hover:bg-muted text-muted-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Scope Filter Tabs */}
          <div className="flex bg-muted/50 p-1.5 rounded-2xl border border-border/60 shrink-0 w-full lg:w-auto overflow-x-auto">
            <button
              onClick={() => {
                setScopeFilter("active");
                setCurrentPage(1);
              }}
              className={`flex-1 lg:flex-initial px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                scopeFilter === "active"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {language === "en" ? "Active Cats" : "Anabul Menginap Aktif"}
            </button>
            <button
              onClick={() => {
                setScopeFilter("today");
                setCurrentPage(1);
              }}
              className={`flex-1 lg:flex-initial px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                scopeFilter === "today"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {language === "en" ? "Today Only" : "Hari Ini Saja"}
            </button>
            <button
              onClick={() => {
                setScopeFilter("all");
                setCurrentPage(1);
              }}
              className={`flex-1 lg:flex-initial px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                scopeFilter === "all"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {language === "en" ? "All History" : "Semua Riwayat"}
            </button>
          </div>
        </div>

        {/* Health status filter chips */}
        <div className="flex items-center justify-between flex-wrap gap-2 pt-3 border-t border-border/60">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-muted-foreground flex items-center gap-1 mr-1">
              <Filter className="w-3.5 h-3.5" />
              <span>Status:</span>
            </span>

            {[
              { id: "all", label: language === "en" ? "All" : "Semua Status" },
              { id: "Sehat", label: "Sehat", dot: "bg-emerald-500" },
              { id: "Kurang Fit", label: "Kurang Fit", dot: "bg-amber-500" },
              { id: "Perlu Perhatian", label: "Perlu Perhatian", dot: "bg-rose-500" },
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => {
                  setHealthFilter(st.id);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer inline-flex items-center gap-1.5 border ${
                  healthFilter === st.id
                    ? "bg-primary text-primary-foreground border-primary shadow-xs"
                    : "border-border hover:bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {st.dot && <span className={`w-2 h-2 rounded-full ${st.dot}`} />}
                <span>{st.label}</span>
              </button>
            ))}

            {(searchQuery || healthFilter !== "all" || scopeFilter !== "active") && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setHealthFilter("all");
                  setScopeFilter("active");
                  setCurrentPage(1);
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer"
              >
                {language === "en" ? "Reset Filters" : "Reset Filter"}
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground font-semibold">
            <span>
              {language === "en" ? "Showing" : "Menampilkan"}{" "}
              <strong className="text-foreground">{filteredReports.length}</strong>{" "}
              {language === "en" ? "reports" : "laporan"}
            </span>

            <select
              value={reportsPerPage}
              onChange={(e) => {
                setReportsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-muted/40 border border-border rounded-lg px-2 py-1 text-xs text-foreground font-bold focus:outline-hidden"
            >
              <option value={6}>6 / hal</option>
              <option value={9}>9 / hal</option>
              <option value={12}>12 / hal</option>
              <option value={24}>24 / hal</option>
            </select>
          </div>
        </div>
      </div>

      {/* ================= 5. REPORTS CARDS GRID ================= */}
      {isLoading ? (
        <GsapDataLoader type="cards" message="Memuat laporan kondisi kucing..." rows={6} />
      ) : filteredReports.length === 0 ? (
        <div className="text-center py-20 bg-card border border-border border-dashed rounded-3xl p-8 max-w-xl mx-auto space-y-3">
          <div className="w-16 h-16 rounded-3xl bg-muted/60 flex items-center justify-center mx-auto text-muted-foreground">
            <HeartPulse className="w-8 h-8 opacity-40" />
          </div>
          <h3 className="text-base font-extrabold text-foreground">
            {language === "en" ? "No condition reports found" : "Tidak ada laporan kondisi"}
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
            {searchQuery || healthFilter !== "all"
              ? language === "en"
                ? "Try adjusting your search query or reset health status filter."
                : "Coba sesuaikan kata kunci pencarian atau ubah filter status kesehatan."
              : language === "en"
              ? "No daily logs have been submitted yet. Click 'Add Daily Report' above to start recording."
              : "Belum ada catatan laporan yang dibuat. Klik tombol 'Tambah Laporan Baru' di atas untuk memulai."}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div
            ref={reportsListRef}
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
          >
            {paginatedReports.map((report) => {
              const booking = report.bookings;
              const ownerName = booking?.profiles?.full_name || "Pelanggan";
              const ownerPhone = booking?.profiles?.phone;
              const waUrl = getWhatsAppUrl(ownerPhone, booking?.cat_name, ownerName);

              return (
                <div
                  key={report.id}
                  className="bg-card dark:bg-zinc-900/60 border border-border dark:border-zinc-850 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xs flex flex-col justify-between hover:border-primary/40 hover:shadow-md transition-all duration-200"
                >
                  {/* Card Top: Cat info & Health Badge */}
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-secondary text-primary flex items-center justify-center font-black text-sm shrink-0 border border-border/50">
                          {booking?.cat_name ? booking.cat_name.charAt(0).toUpperCase() : "C"}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h3 className="font-black text-base text-foreground">
                              {booking?.cat_name || "Anabul"}
                            </h3>
                            {booking?.class && (
                              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                                {booking.class}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5 font-medium">
                            <User className="w-3 h-3 text-muted-foreground/70" />
                            <span>{ownerName}</span>
                          </p>
                        </div>
                      </div>

                      {/* Health status badge */}
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-black rounded-full border ${
                          report.health_status === "Sehat"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25"
                            : report.health_status === "Kurang Fit"
                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25"
                            : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25"
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            report.health_status === "Sehat"
                              ? "bg-emerald-500"
                              : report.health_status === "Kurang Fit"
                              ? "bg-amber-500 animate-pulse"
                              : "bg-rose-500 animate-pulse"
                          }`}
                        />
                        <span>{report.health_status}</span>
                      </span>
                    </div>

                    {/* Photo Container */}
                    {report.photo_url ? (
                      <div
                        onClick={() =>
                          setLightboxPhoto({
                            url: report.photo_url,
                            catName: booking?.cat_name || "Anabul",
                            date: formatDate(report.report_date, "long"),
                            status: report.health_status,
                          })
                        }
                        className="group relative aspect-video w-full rounded-2xl overflow-hidden border border-border/70 bg-black/5 dark:bg-zinc-950 cursor-pointer shadow-2xs"
                      >
                        <img
                          src={report.photo_url}
                          alt={`Foto Kondisi ${booking?.cat_name || "Kucing"}`}
                          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-bold backdrop-blur-xs">
                          <Maximize2 className="w-4 h-4" />
                          <span>{language === "en" ? "Zoom Photo" : "Perbesar Foto"}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="py-6 px-4 bg-muted/25 rounded-2xl border border-dashed border-border/70 flex flex-col items-center justify-center gap-1.5 text-muted-foreground/60 text-xs font-medium">
                        <Camera className="w-5 h-5 opacity-40" />
                        <span>{language === "en" ? "No photo attached" : "Tidak ada foto dilampirkan"}</span>
                      </div>
                    )}

                    {/* Daily Notes */}
                    {report.notes && (
                      <div className="bg-muted/30 dark:bg-zinc-950/40 p-4 rounded-2xl border border-border/60 text-xs text-foreground leading-relaxed font-medium space-y-1">
                        <span className="text-[10px] uppercase font-black tracking-wider text-muted-foreground block">
                          {language === "en" ? "Activity & Medical Notes" : "Catatan Aktivitas & Medis"}
                        </span>
                        <p className="whitespace-pre-line">{report.notes}</p>
                      </div>
                    )}
                  </div>

                  {/* Card Bottom: Date & Quick Actions */}
                  <div className="pt-4 border-t border-border/60 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-1.5 text-muted-foreground font-semibold text-[11px]">
                      <Calendar className="w-3.5 h-3.5 text-primary" />
                      <span>{formatDate(report.report_date, "long")}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {waUrl && (
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="WhatsApp Pemilik"
                          className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 transition-colors cursor-pointer"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                      )}

                      <Link
                        href={`/admin/bookings/${report.booking_id}`}
                        className="inline-flex items-center gap-1 py-1.5 px-3 rounded-xl border border-border bg-card hover:bg-muted/80 text-foreground font-bold text-xs transition-colors cursor-pointer"
                      >
                        <span>{language === "en" ? "Detail" : "Pesanan"}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between gap-4 flex-wrap bg-card dark:bg-zinc-900/60 border border-border dark:border-zinc-850 px-6 py-4 rounded-3xl shadow-xs">
              <p className="text-xs text-muted-foreground font-semibold">
                {language === "en" ? "Showing page" : "Halaman"}{" "}
                <span className="font-extrabold text-foreground">{currentPage}</span>{" "}
                {language === "en" ? "of" : "dari"}{" "}
                <span className="font-extrabold text-foreground">{totalPages}</span> ({filteredReports.length} total)
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-2 border border-border rounded-xl hover:bg-muted/80 disabled:opacity-40 transition-colors cursor-pointer text-muted-foreground hover:text-foreground"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      currentPage === page
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "border border-border hover:bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-2 border border-border rounded-xl hover:bg-muted/80 disabled:opacity-40 transition-colors cursor-pointer text-muted-foreground hover:text-foreground"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= 6. MODAL: ADD DAILY REPORT ================= */}
      {isAddModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsAddModalOpen(false);
          }}
        >
          <div className="bg-card dark:bg-zinc-900 border border-border dark:border-zinc-800 w-full max-w-lg rounded-3xl shadow-2xl p-6 sm:p-7 space-y-6 animate-in fade-in zoom-in-95 duration-200 my-auto">
            <div className="flex items-start justify-between gap-3 border-b border-border/60 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
                  <HeartPulse className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-foreground">
                    {language === "en" ? "New Daily Cat Report" : "Tambah Laporan Kondisi Kucing"}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {language === "en"
                      ? "Directly notifies pet owner via in-app & email"
                      : "Tercatat di rekam medis dan otomatis menotifikasi pemilik"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddReportSubmit} className="space-y-4">
              {/* Select Active Cat */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                  {language === "en" ? "Select Boarding Cat" : "Pilih Kucing yang Menginap"} *
                </label>
                {activeBookings.length === 0 ? (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-700 dark:text-amber-400 font-medium">
                    {language === "en"
                      ? "No active boarding stays currently. You can still add reports directly from booking detail."
                      : "Tidak ada pesanan aktif saat ini. Anda dapat menambahkan laporan dari halaman detail pesanan."}
                  </div>
                ) : (
                  <select
                    required
                    value={selectedBookingId}
                    onChange={(e) => setSelectedBookingId(e.target.value)}
                    className="w-full px-4 py-3 bg-muted/40 border border-border rounded-xl text-xs sm:text-sm font-bold text-foreground focus:outline-hidden focus:border-primary"
                  >
                    <option value="">-- Pilih Anabul Menginap --</option>
                    {activeBookings.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.cat_name} • {b.class} (Pemilik: {b.profiles?.full_name || "-"})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Health Status Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                  {language === "en" ? "Health Condition" : "Status Kesehatan Terkini"} *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    {
                      id: "Sehat",
                      label: "Sehat",
                      sub: "Aktif & Bugar",
                      color: "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
                      inactive: "border-border hover:bg-muted text-muted-foreground",
                    },
                    {
                      id: "Kurang Fit",
                      label: "Kurang Fit",
                      sub: "Pemantauan",
                      color: "border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-400",
                      inactive: "border-border hover:bg-muted text-muted-foreground",
                    },
                    {
                      id: "Perlu Perhatian",
                      label: "Perhatian",
                      sub: "Pemeriksaan",
                      color: "border-rose-500 bg-rose-500/10 text-rose-700 dark:text-rose-400",
                      inactive: "border-border hover:bg-muted text-muted-foreground",
                    },
                  ].map((btn) => (
                    <button
                      key={btn.id}
                      type="button"
                      onClick={() => setModalHealthStatus(btn.id)}
                      className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                        modalHealthStatus === btn.id ? `${btn.color} font-black shadow-xs` : btn.inactive
                      }`}
                    >
                      <span className="block text-xs font-extrabold">{btn.label}</span>
                      <span className="block text-[10px] opacity-75">{btn.sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                  {language === "en" ? "Daily Activity & Condition Notes" : "Catatan Aktivitas & Kondisi Harian"} *
                </label>
                <textarea
                  required
                  rows={3}
                  value={modalNotes}
                  onChange={(e) => setModalNotes(e.target.value)}
                  placeholder={
                    language === "en"
                      ? "Example: Great appetite, played actively with feather toy. Grooming done and ears cleaned..."
                      : "Contoh: Nafsu makan sangat baik, aktif bermain bola benang. Sudah dimandikan & dibersihkan telinga..."
                  }
                  className="w-full px-4 py-3 bg-muted/40 border border-border rounded-xl text-xs sm:text-sm font-medium text-foreground focus:outline-hidden focus:border-primary leading-relaxed"
                />
              </div>

              {/* Photo Upload */}
              <div className="space-y-1.5">
                <ImageUpload
                  onUpload={(url) => setModalPhotoUrl(url)}
                  defaultValue={modalPhotoUrl}
                  label={
                    language === "en"
                      ? "Cat's Photo Today (Optional)"
                      : "Foto Anabul Hari Ini (Opsional)"
                  }
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/60">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  {language === "en" ? "Cancel" : "Batal"}
                </button>

                <GsapTextButton
                  type="submit"
                  isLoading={isSubmittingReport}
                  disabled={!selectedBookingId || !modalNotes.trim()}
                  idleText={language === "en" ? "Save & Send Report" : "Simpan & Kirim Laporan"}
                  loadingText={language === "en" ? "Saving..." : "Menyimpan..."}
                  successText={language === "en" ? "Report Sent!" : "Laporan Terkirim!"}
                  className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-extrabold shadow-md shadow-primary/20 cursor-pointer disabled:opacity-50"
                />
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= 7. MODAL: PHOTO LIGHTBOX ================= */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setLightboxPhoto(null)}
        >
          <div
            className="relative max-w-3xl w-full max-h-[90vh] flex flex-col bg-card dark:bg-zinc-900 border border-border dark:border-zinc-800 rounded-3xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-border dark:border-zinc-800 bg-card dark:bg-zinc-900">
              <div className="flex items-center gap-2">
                <Cat className="w-4 h-4 text-primary" />
                <span className="font-bold text-sm text-foreground">
                  {lightboxPhoto.catName}
                </span>
                <span className="text-xs text-muted-foreground">
                  • {lightboxPhoto.date}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                  {lightboxPhoto.status}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setLightboxPhoto(null)}
                className="p-1.5 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="relative flex-1 bg-black/90 flex items-center justify-center p-2 min-h-[300px] max-h-[75vh] overflow-hidden">
              <img
                src={lightboxPhoto.url}
                alt={lightboxPhoto.catName}
                className="max-h-full max-w-full object-contain rounded-xl select-none"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

