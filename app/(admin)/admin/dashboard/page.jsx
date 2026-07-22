"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CalendarRange,
  Sparkles,
  Clock,
  CheckCircle2,
  TrendingUp,
  HeartPulse,
  Settings,
  MessageSquare,
  Smartphone,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ScanLine,
  XCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { BookingStatus } from "@/components/booking/BookingStatus";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { formatRupiah } from "@/lib/utils/format";
import { formatDate } from "@/lib/utils/dates";
import { useLanguage } from "@/hooks/useLanguage";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { useGsapReveal, useGsapCounter } from "@/hooks/useGsapReveal";

export default function AdminDashboard() {
  return (
    <Suspense
      fallback={
        <div className="space-y-8 animate-pulse p-4 sm:p-6 bg-background dark:bg-zinc-950 min-h-screen">
          <div className="h-8 bg-muted dark:bg-zinc-800/60 rounded-xl w-48 mb-4" />
          <div className="h-6 bg-muted dark:bg-zinc-800/60 rounded-xl w-96 mb-8" />
          <div className="h-64 bg-card dark:bg-zinc-900 border border-border dark:border-zinc-800 rounded-3xl" />
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language: storeLanguage, t } = useLanguage();
  const [bookings, setBookings] = useState([]);
  const [outgoingLogs, setOutgoingLogs] = useState([]);
  const [adminEmail, setAdminEmail] = useState("admin@nekostay.com");
  const [isLoading, setIsLoading] = useState(true);
  const [activeSimulatorTab, setActiveSimulatorTab] = useState("all");
  const [currentLogPage, setCurrentLogPage] = useState(1);
  const [revenueRange, setRevenueRange] = useState("1m");
  const [isMounted, setIsMounted] = useState(false);

  // Scan token modal states
  const [scanModal, setScanModal] = useState(null); // null | 'processing' | { type: 'success' | 'error', data?, message? }

  const supabase = createClient();
  const language = isMounted ? storeLanguage : "id";

  const headerRef = useRef(null);
  const statsRef = useRef(null);
  const chartsRef = useRef(null);
  const tablesRef = useRef(null);
  const totalRef = useRef(null);
  const pendingRef = useRef(null);
  const activeRef = useRef(null);

  useGsapReveal(headerRef, { selector: ":scope > *", y: 16, stagger: 0.1, duration: 0.5 });
  useGsapReveal(statsRef, { selector: ":scope > *", y: 22, stagger: 0.08, duration: 0.5, delay: 0.05 });
  useGsapReveal(chartsRef, { selector: ":scope > *", y: 28, stagger: 0.12, duration: 0.55, start: "top 95%" });
  useGsapReveal(tablesRef, { selector: ":scope > *", y: 32, stagger: 0.12, duration: 0.55, start: "top 95%" });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Handle scan_token URL parameter (from native camera QR scan)
  useEffect(() => {
    const scanToken = searchParams.get("scan_token");
    if (!scanToken || scanModal) return;

    setScanModal("processing");

    fetch("/api/payments/scan-offline", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: scanToken }),
    })
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (ok) {
          setScanModal({ type: "success", data: data.booking });
        } else {
          setScanModal({ type: "error", message: data.error || "Verifikasi gagal" });
        }
      })
      .catch(() => {
        setScanModal({ type: "error", message: "Kesalahan jaringan saat memverifikasi" });
      })
      .finally(() => {
        // Clean the URL
        router.replace("/admin/dashboard");
      });
  }, [searchParams]);

  const formatOmzet = (val) => {
    if (val >= 1000000) {
      const millionVal = val / 1000000;
      if (millionVal >= 10) {
        return `Rp ${Math.floor(millionVal)}jt`;
      } else {
        return `Rp ${millionVal.toFixed(1).replace(".", ",")}jt`.replace(",0", "");
      }
    }
    return formatRupiah(val);
  };

  useEffect(() => {
    let isMounted = true;

    async function loadStatsAndLogs(currentUser) {
      try {
        if (currentUser?.email) {
          setAdminEmail(currentUser.email);
        }

        const { data, error } = await supabase
          .from("bookings")
          .select(
            `
            *,
            profiles (full_name, phone)
          `,
          )
          .order("created_at", { ascending: false });

        if (!isMounted) return;
        if (error) throw error;
        setBookings(data);

        // Fetch notifications as simulated WhatsApp/SMS outbox logs
        const { data: notifs, error: notifErr } = await supabase
          .from("notifications")
          .select(`
            id,
            title,
            message,
            created_at,
            profiles (
              full_name,
              phone
            )
          `)
          .order("created_at", { ascending: false })
          .limit(100);

        if (!isMounted) return;
        if (!notifErr && notifs) {
          const uniqueLogs = [];
          const seen = new Set();
          for (const notif of notifs) {
            const key = `${notif.title}|${notif.message}`;
            if (!seen.has(key)) {
              seen.add(key);
              uniqueLogs.push(notif);
            }
          }
          setOutgoingLogs(uniqueLogs);
        }

      } catch (err) {
        console.error("Error fetching admin stats & logs:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    // Listen for auth state changes (mount, token refresh, sign in/out)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;
      if (session?.user) {
        loadStatsAndLogs(session.user);
      } else {
        setBookings([]);
        setOutgoingLogs([]);
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const calculateRevenue = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    return bookings
      .filter((b) => b.status === "Selesai" || b.status === "Aktif")
      .filter((b) => {
        const bookingDate = new Date(b.created_at);
        if (revenueRange === "1m") {
          return bookingDate.getMonth() === currentMonth && bookingDate.getFullYear() === currentYear;
        } else if (revenueRange === "6m") {
          return bookingDate >= sixMonthsAgo;
        } else if (revenueRange === "1y") {
          return bookingDate >= oneYearAgo;
        }
        return false;
      })
      .reduce(
        (sum, b) =>
          sum +
          (b.estimated_total -
            (b.discount_amount || 0) +
            (b.late_fee_total || 0) -
            (b.refund_amount || 0)),
        0,
      );
  };

  const stats = {
    totalBookings: bookings.length,
    pending: bookings.filter((b) => b.status === "Menunggu").length,
    active: bookings.filter((b) => b.status === "Aktif").length,
    revenue: calculateRevenue(),
  };

  // Count up stats
  useGsapCounter(totalRef, stats.totalBookings);
  useGsapCounter(pendingRef, stats.pending);
  useGsapCounter(activeRef, stats.active);

  const processChartData = () => {
    if (!bookings.length) return { revenueData: [], classData: [], statusData: [] };

    const monthlyStats = {};
    const classCount = { Basic: 0, Standard: 0, Premium: 0 };
    const statusCount = { Menunggu: 0, Aktif: 0, Selesai: 0, Dibatalkan: 0 };

    [...bookings].reverse().forEach((b) => {
      const date = new Date(b.created_at);
      const monthYear = date.toLocaleString("id-ID", { month: "short", year: "2-digit" });

      if (!monthlyStats[monthYear]) {
        monthlyStats[monthYear] = { name: monthYear, revenue: 0 };
      }

      if (b.status === "Selesai" || b.status === "Aktif") {
        monthlyStats[monthYear].revenue +=
          b.estimated_total - (b.discount_amount || 0) + (b.late_fee_total || 0) - (b.refund_amount || 0);
      }

      if (classCount[b.class] !== undefined) classCount[b.class] += 1;
      if (statusCount[b.status] !== undefined) statusCount[b.status] += 1;
    });

    const revenueData = Object.values(monthlyStats).slice(-6); // last 6 months
    const classData = [
      { name: "Basic", value: classCount.Basic, color: "#3b82f6" },
      { name: "Standard", value: classCount.Standard, color: "#f59e0b" },
      { name: "Premium", value: classCount.Premium, color: "#8b5cf6" },
    ];
    const statusData = [
      { name: "Menunggu", value: statusCount.Menunggu, color: "#f59e0b" },
      { name: "Aktif", value: statusCount.Aktif, color: "#10b981" },
      { name: "Selesai", value: statusCount.Selesai, color: "#6366f1" },
      { name: "Dibatalkan", value: statusCount.Dibatalkan, color: "#ef4444" },
    ];

    return { revenueData, classData, statusData };
  };

  const { revenueData, classData, statusData } = processChartData();

  const recentBookings = bookings.slice(0, 5);

  const filteredLogs = outgoingLogs.filter((log) => {
    const lowerTitle = log.title.toLowerCase();
    const isLogWA =
      lowerTitle.includes("laporan") ||
      lowerTitle.includes("kucing") ||
      lowerTitle.includes("perubahan (wa)") ||
      lowerTitle.includes("review") ||
      lowerTitle.includes("pesanan baru") ||
      lowerTitle.includes("dibuat");

    if (activeSimulatorTab === "wa") return isLogWA;
    if (activeSimulatorTab === "sms") return !isLogWA;
    return true;
  });

  const logsPerPage = 6;
  const totalLogPages = Math.ceil(filteredLogs.length / logsPerPage);
  const paginatedLogs = filteredLogs.slice(
    (currentLogPage - 1) * logsPerPage,
    currentLogPage * logsPerPage
  );

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
    <div className="space-y-8 bg-background dark:bg-zinc-950 p-4 sm:p-6 transition-colors duration-300">
      {/* Scan Token Modal */}
      {scanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-xs" onClick={() => setScanModal(null)} />
          <div className="relative w-full max-w-sm bg-card border border-border p-8 rounded-3xl shadow-xl text-center space-y-5 animate-in fade-in zoom-in duration-200">
            {scanModal === "processing" && (
              <>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
                <p className="text-sm font-bold text-foreground">Memproses Verifikasi Pembayaran...</p>
              </>
            )}
            {scanModal?.type === "success" && (
              <>
                <div className="mx-auto w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center border-2 border-emerald-500/20">
                  <CheckCircle2 className="w-9 h-9 text-emerald-500" />
                </div>
                <h3 className="text-xl font-black text-foreground">Pembayaran Terverifikasi!</h3>
                <div className="space-y-3 text-left bg-muted/30 rounded-2xl p-5 border border-border/60">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Nama Kucing</span>
                    <span className="font-bold text-foreground">{scanModal.data?.catName}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Pemilik</span>
                    <span className="font-bold text-foreground">{scanModal.data?.customerName}</span>
                  </div>
                  <div className="flex justify-between text-sm border-t border-border/50 pt-3 font-extrabold">
                    <span className="text-foreground">Total Bayar</span>
                    <span className="text-emerald-600 text-base">{formatRupiah(scanModal.data?.amount || 0)}</span>
                  </div>
                </div>
                <button onClick={() => setScanModal(null)} className="w-full px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-bold rounded-2xl cursor-pointer">
                  Tutup
                </button>
              </>
            )}
            {scanModal?.type === "error" && (
              <>
                <div className="mx-auto w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center border-2 border-rose-500/20">
                  <XCircle className="w-9 h-9 text-rose-500" />
                </div>
                <h3 className="text-lg font-black text-foreground">Verifikasi Gagal</h3>
                <p className="text-xs text-rose-600 dark:text-rose-400 font-medium leading-relaxed">{scanModal.message}</p>
                <button onClick={() => setScanModal(null)} className="w-full px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-bold rounded-2xl cursor-pointer">
                  Tutup
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div ref={headerRef} className="space-y-1">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 text-[10px] font-extrabold uppercase tracking-wider">
              <Sparkles className="w-3 h-3 text-rose-500" />
              <span>{t("admin_db_badge")}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground dark:text-zinc-50">
              {t("admin_db_title")}
            </h1>
            <p className="text-sm text-muted-foreground dark:text-zinc-400">
              {t("admin_db_subtitle")}
            </p>
          </div>
          <Link
            href="/admin/scanner"
            className="px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold rounded-xl transition-all flex items-center gap-2 shadow-sm shadow-primary/15 shrink-0"
          >
            <ScanLine className="w-4 h-4" />
            Scan QR Pembayaran
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div ref={statsRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-card dark:bg-zinc-900 border border-border dark:border-zinc-800 p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-secondary dark:bg-zinc-800 text-primary rounded-xl">
            <CalendarRange className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-muted-foreground dark:text-zinc-450 uppercase tracking-wider block">
              Total Booking
            </span>
            <span ref={totalRef} className="text-2xl font-black text-foreground dark:text-zinc-100">
              0
            </span>
          </div>
        </div>

        <div className="bg-card dark:bg-zinc-900 border border-border dark:border-zinc-800 p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/20 text-amber-500 rounded-xl">
            <Clock className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-muted-foreground dark:text-zinc-450 uppercase tracking-wider block">
              {t("admin_db_stat_pending")}
            </span>
            <span ref={pendingRef} className="text-2xl font-black text-foreground dark:text-zinc-100">
              0
            </span>
          </div>
        </div>

        <div className="bg-card dark:bg-zinc-900 border border-border dark:border-zinc-800 p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 rounded-xl">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-muted-foreground dark:text-zinc-450 uppercase tracking-wider block">
              {t("admin_db_stat_active")}
            </span>
            <span ref={activeRef} className="text-2xl font-black text-foreground dark:text-zinc-100">
              0
            </span>
          </div>
        </div>

        <div className="bg-card dark:bg-zinc-900 border border-border dark:border-zinc-800 p-5 rounded-2xl flex items-center gap-4 relative">
          <div className="flex flex-col items-center gap-2 shrink-0">
            <div className="p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-600 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1 px-2 py-1 bg-muted/40 hover:bg-muted/80 border border-border/80 dark:border-zinc-800 rounded-lg text-[9px] font-bold text-foreground transition-all duration-150 justify-between cursor-pointer outline-none focus:outline-none min-w-[72px]">
                <span>
                  {revenueRange === "1m"
                    ? (language === "en" ? "1 Month" : "1 Bulan")
                    : revenueRange === "6m"
                    ? (language === "en" ? "6 Months" : "6 Bulan")
                    : (language === "en" ? "1 Year" : "1 Tahun")}
                </span>
                <ChevronDown className="w-2.5 h-2.5 text-muted-foreground shrink-0" />
              </DropdownMenuTrigger>
              <DropdownMenuContent side="bottom" align="center" sideOffset={6} className="text-xs">
                <DropdownMenuItem
                  onClick={() => setRevenueRange("1m")}
                  className={revenueRange === "1m" ? "text-orange-600 dark:text-orange-400 font-bold" : ""}
                >
                  {revenueRange === "1m" && <Check className="w-3.5 h-3.5 mr-1 shrink-0" />}
                  {language === "en" ? "1 Month" : "1 Bulan"}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setRevenueRange("6m")}
                  className={revenueRange === "6m" ? "text-orange-600 dark:text-orange-400 font-bold" : ""}
                >
                  {revenueRange === "6m" && <Check className="w-3.5 h-3.5 mr-1 shrink-0" />}
                  {language === "en" ? "6 Months" : "6 Bulan"}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setRevenueRange("1y")}
                  className={revenueRange === "1y" ? "text-orange-600 dark:text-orange-400 font-bold" : ""}
                >
                  {revenueRange === "1y" && <Check className="w-3.5 h-3.5 mr-1 shrink-0" />}
                  {language === "en" ? "1 Year" : "1 Tahun"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-bold text-muted-foreground dark:text-zinc-450 uppercase tracking-wider block">
              {revenueRange === "1m"
                ? (language === "en" ? "Active Revenue 1 Month" : "Omzet Aktif 1 Bulan")
                : revenueRange === "6m"
                ? (language === "en" ? "Active Revenue 6 Months" : "Omzet Aktif 6 Bulan")
                : (language === "en" ? "Active Revenue 1 Year" : "Omzet Aktif 1 Tahun")}
            </span>
            <span className="text-2xl font-black text-foreground dark:text-zinc-100 block mt-1">
              {formatOmzet(stats.revenue)}
            </span>
          </div>
        </div>
      </div>

      {/* Analytics Charts */}
      <div ref={chartsRef} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue Chart */}
        <div className="bg-card dark:bg-zinc-900 border border-border dark:border-zinc-800 p-6 rounded-3xl space-y-4">
          <h3 className="font-bold text-foreground dark:text-zinc-200 text-base border-b border-border/60 dark:border-zinc-800/60 pb-2">
            {t("admin_db_chart_trend")}
          </h3>
          <div className="h-[280px] w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:stroke-zinc-800" />
                <XAxis dataKey="name" tick={{fontSize: 11}} tickLine={false} axisLine={false} />
                <YAxis tick={{fontSize: 11}} tickLine={false} axisLine={false} tickFormatter={(val) => `Rp ${val/1000}k`} width={60}/>
                <RechartsTooltip 
                  formatter={(value) => [formatRupiah(value), t("admin_db_chart_revenue")]}
                  contentStyle={{ borderRadius: "12px", border: "1px solid #e5e7eb", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                  cursor={{ fill: 'transparent' }}
                />
                <Bar dataKey="revenue" name={t("admin_db_chart_revenue")} fill="#f43f5e" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut Charts (Class & Status) */}
        <div className="bg-card dark:bg-zinc-900 border border-border dark:border-zinc-800 p-6 rounded-3xl space-y-4 flex flex-col">
          <h3 className="font-bold text-foreground dark:text-zinc-200 text-base border-b border-border/60 dark:border-zinc-800/60 pb-2">
            {t("admin_db_chart_dist")}
          </h3>
          <div className="flex-1 flex flex-col sm:flex-row items-center justify-around pt-2">
            
            <div className="h-48 w-full sm:w-1/2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={classData.filter(d => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {classData.filter(d => d.value > 0).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}/>
                  <Legend iconType="circle" wrapperStyle={{ fontSize: "11px" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="h-48 w-full sm:w-1/2 mt-8 sm:mt-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData.filter(d => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusData.filter(d => d.value > 0).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}/>
                  <Legend iconType="circle" wrapperStyle={{ fontSize: "11px" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

          </div>
        </div>
      </div>

      {/* Recent Bookings & Quick Actions */}
      <div ref={tablesRef} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Bookings Table */}
        <div className="lg:col-span-2 bg-card dark:bg-zinc-900 border border-border dark:border-zinc-800 rounded-3xl p-6 space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-border/60 dark:border-zinc-800/60">
            <h3 className="font-bold text-foreground dark:text-zinc-200 text-base">
              {t("admin_db_recent_bookings")}
            </h3>
            <Link
              href="/admin/bookings"
              className="text-xs font-bold text-primary hover:underline"
            >
              {t("admin_db_view_all")}
            </Link>
          </div>

          {isLoading ? (
            <div className="space-y-4 animate-pulse">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-12 bg-muted dark:bg-zinc-800 rounded-xl" />
              ))}
            </div>
          ) : recentBookings.length === 0 ? (
            <p className="text-xs text-muted-foreground py-6 text-center">
              {t("admin_db_no_bookings")}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border/40 dark:border-zinc-800/40 text-muted-foreground font-bold">
                    <th className="pb-3">{t("admin_db_col_cat_owner")}</th>
                    <th className="pb-3">{t("admin_db_col_class_time")}</th>
                    <th className="pb-3">{t("admin_db_col_total")}</th>
                    <th className="pb-3">{t("admin_db_col_status")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30 dark:divide-zinc-850/30">
                  {recentBookings.map((b) => (
                    <tr
                      key={b.id}
                      className="hover:bg-muted/10 dark:hover:bg-zinc-800/10 transition-colors"
                    >
                      <td className="py-3">
                        <span className="font-bold text-foreground dark:text-zinc-200 block">
                          {b.cat_name}
                        </span>
                        <span className="text-[10px] text-muted-foreground dark:text-zinc-450">
                          {b.profiles?.full_name}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className="font-semibold text-foreground dark:text-zinc-200 block">
                          {b.class}
                        </span>
                        <span className="text-[10px] text-muted-foreground dark:text-zinc-455">
                          {formatDate(b.check_in_date)}
                        </span>
                      </td>
                      <td className="py-3 font-semibold text-foreground dark:text-zinc-200">
                        {formatRupiah(b.estimated_total - (b.discount_amount || 0))}
                      </td>
                      <td className="py-3">
                        <BookingStatus status={b.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick Config Links */}
        <div className="bg-card dark:bg-zinc-900 border border-border dark:border-zinc-800 rounded-3xl p-6 space-y-6">
          <h3 className="font-bold text-foreground dark:text-zinc-200 text-base border-b border-border/60 dark:border-zinc-800/60 pb-3">
            {t("admin_db_shortcut_title")}
          </h3>
          <div className="grid grid-cols-1 gap-3.5">
            <Link
              href="/admin/bookings"
              className="p-4 rounded-2xl bg-muted/30 dark:bg-zinc-950/20 border border-border/80 dark:border-zinc-850 hover:border-primary/30 hover:bg-primary/5 transition-all text-sm font-semibold flex items-center justify-between dark:text-zinc-350"
            >
              <span className="flex items-center gap-2">
                <CalendarRange className="w-4 h-4 text-primary" />
                {t("admin_db_shortcut_bookings")}
              </span>
              <span className="text-xs bg-amber-100 dark:bg-amber-950/40 text-amber-600 px-2.5 py-0.5 rounded-full font-bold">
                {stats.pending}
              </span>
            </Link>

            <Link
              href="/admin/reports"
              className="p-4 rounded-2xl bg-muted/30 dark:bg-zinc-950/20 border border-border/80 dark:border-zinc-850 hover:border-primary/30 hover:bg-primary/5 transition-all text-sm font-semibold flex items-center justify-between dark:text-zinc-350"
            >
              <span className="flex items-center gap-2">
                <HeartPulse className="w-4 h-4 text-primary" />
                {t("admin_db_shortcut_reports")}
              </span>
              <span className="text-xs bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 px-2.5 py-0.5 rounded-full font-bold">
                {stats.active}
              </span>
            </Link>

            <Link
              href="/admin/settings"
              className="p-4 rounded-2xl bg-muted/30 dark:bg-zinc-950/20 border border-border/80 dark:border-zinc-850 hover:border-primary/30 hover:bg-primary/5 transition-all text-sm font-semibold flex items-center justify-between dark:text-zinc-350"
            >
              <span className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-primary" />
                {t("admin_db_shortcut_settings")}
              </span>
              <Settings className="w-4 h-4 text-muted-foreground" />
            </Link>
          </div>
        </div>
      </div>

      {/* Real-time SMS & WhatsApp Outbox Simulator Panel */}
      <div className="bg-card dark:bg-zinc-900 border border-border dark:border-zinc-800 rounded-3xl p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 dark:border-zinc-800/60 pb-4">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5.5 h-5.5 text-primary" />
            <h3 className="font-extrabold text-foreground dark:text-zinc-150 text-base">
              {t("admin_db_gateway_title")}
            </h3>
          </div>
          <div className="flex items-center bg-muted/65 dark:bg-zinc-950/50 p-1 border border-border dark:border-zinc-805 rounded-xl text-xs font-bold gap-1">
            <button
              onClick={() => { setActiveSimulatorTab("all"); setCurrentLogPage(1); }}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeSimulatorTab === "all"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("admin_db_gateway_all")}
            </button>
            <button
              onClick={() => { setActiveSimulatorTab("wa"); setCurrentLogPage(1); }}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeSimulatorTab === "wa"
                  ? "bg-emerald-500 text-white shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("admin_db_gateway_wa")}
            </button>
            <button
              onClick={() => { setActiveSimulatorTab("sms"); setCurrentLogPage(1); }}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeSimulatorTab === "sms"
                  ? "bg-sky-500 text-white shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("admin_db_gateway_system")}
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="py-12 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredLogs.length === 0 ? (
          <p className="text-center py-12 text-sm text-muted-foreground dark:text-zinc-500">
            {t("admin_db_gateway_empty")}
          </p>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {paginatedLogs.map((log) => {
                const lowerTitle = log.title.toLowerCase();
                const isWA =
                  lowerTitle.includes("laporan") ||
                  lowerTitle.includes("kucing") ||
                  lowerTitle.includes("perubahan (wa)") ||
                  lowerTitle.includes("review") ||
                  lowerTitle.includes("pesanan baru") ||
                  lowerTitle.includes("dibuat");
                return (
                  <div
                    key={log.id}
                    className={`p-5 rounded-2xl border flex flex-col justify-between space-y-4 hover:shadow-xs transition-shadow bg-muted/15 dark:bg-zinc-950/20 ${
                      isWA
                        ? "border-emerald-250 dark:border-emerald-950/40"
                        : "border-sky-250 dark:border-sky-950/40"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider">
                      <span className="flex items-center gap-1.5">
                        <MessageSquare className={`w-3.5 h-3.5 ${isWA ? "text-emerald-500" : "text-sky-500"}`} />
                        <span className={isWA ? "text-emerald-600 dark:text-emerald-400" : "text-sky-600 dark:text-sky-400"}>
                          {isWA ? "WhatsApp Notifikasi" : "Notifikasi Sistem"}
                        </span>
                      </span>
                      <span className="px-2.5 py-0.5 bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-450 border border-emerald-200 dark:border-emerald-900 rounded-full flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        {t("admin_db_gateway_status")}
                      </span>
                    </div>

                     <div className="space-y-1.5 flex-1">
                      <div className="text-xs text-muted-foreground dark:text-zinc-400 font-semibold flex items-center gap-1">
                        <span>{t("admin_db_gateway_recipient")}:</span>
                        <strong className="text-foreground dark:text-zinc-200">
                          {isWA ? (
                            `${log.profiles?.full_name} (${log.profiles?.phone || "08123456789"})`
                          ) : (
                            adminEmail
                          )}
                        </strong>
                      </div>
                      <div className="p-3.5 rounded-xl border border-border/80 dark:border-zinc-850 bg-card dark:bg-zinc-900 leading-relaxed">
                        <strong className="text-xs text-foreground dark:text-zinc-200 block mb-1">
                          {log.title}
                        </strong>
                        <p className="text-xs text-muted-foreground dark:text-zinc-400">
                          {log.message}
                        </p>
                      </div>
                    </div>

                    <span className="text-[10px] text-muted-foreground dark:text-zinc-450 text-right block pt-1 font-medium">
                      {new Date(log.created_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit"
                      })}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalLogPages > 1 && (
              <div className="flex items-center justify-between gap-4 flex-wrap bg-muted/10 dark:bg-zinc-950/20 border border-border/80 dark:border-zinc-850 px-5 py-4 rounded-2xl">
                <p className="text-xs text-muted-foreground font-semibold">
                  Menampilkan <span className="text-foreground dark:text-zinc-200">{Math.min(filteredLogs.length, (currentLogPage - 1) * logsPerPage + 1)}</span> - <span className="text-foreground dark:text-zinc-200">{Math.min(filteredLogs.length, currentLogPage * logsPerPage)}</span> dari <span className="text-foreground dark:text-zinc-200">{filteredLogs.length}</span> notifikasi
                </p>
                
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentLogPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentLogPage === 1}
                    className="p-2 border border-border dark:border-zinc-800 rounded-xl hover:bg-muted/80 dark:hover:bg-zinc-900 disabled:opacity-40 transition-colors cursor-pointer text-muted-foreground hover:text-foreground"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  
                  {Array.from({ length: totalLogPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentLogPage(page)}
                      className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        currentLogPage === page
                          ? "bg-primary text-primary-foreground"
                          : "border border-border dark:border-zinc-800 hover:bg-muted/80 dark:hover:bg-zinc-900 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => setCurrentLogPage((prev) => Math.min(prev + 1, totalLogPages))}
                    disabled={currentLogPage === totalLogPages}
                    className="p-2 border border-border dark:border-zinc-800 rounded-xl hover:bg-muted/80 dark:hover:bg-zinc-900 disabled:opacity-40 transition-colors cursor-pointer text-muted-foreground hover:text-foreground"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
