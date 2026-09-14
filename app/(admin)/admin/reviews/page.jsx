"use client";

import { useState, useEffect, useCallback, useMemo, useRef, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  MessageSquare,
  Star,
  Send,
  Sparkles,
  User,
  Calendar,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  Search,
  X,
  RotateCcw,
  MessageCircle,
  ShieldCheck,
  Cat,
  SlidersHorizontal,
  ChevronDown,
  Check,
  RefreshCcw,
  AlertCircle,
  Eye,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils/dates";
import { useLanguage } from "@/hooks/useLanguage";
import { useGsapReveal } from "@/hooks/useGsapReveal";
import { GsapDataLoader } from "@/components/shared/GsapDataLoader";
import { GsapTextButton } from "@/components/shared/GsapTextButton";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const emptySubscribe = () => () => {};

function RatingStars({ rating, size = "w-4 h-4" }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${size} ${
            star <= rating
              ? "text-amber-400 fill-amber-400"
              : "text-muted-foreground/30"
          }`}
        />
      ))}
    </div>
  );
}

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
    `Halo Kak ${ownerName || "Pelanggan"}, terima kasih banyak atas ulasan dan kepercayaannya menitipkan ${
      catName || "kucing kesayangan"
    } di NekoStay...`
  );
  return `https://wa.me/${normalized}?text=${text}`;
}

// Room Class Badge
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

export default function AdminReviewsPage() {
  const { t } = useLanguage();
  const [reviews, setReviews] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const isMounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRating, setSelectedRating] = useState("all");
  const [selectedReplyStatus, setSelectedReplyStatus] = useState("all"); // 'all' | 'unreplied' | 'replied'
  const [selectedClass, setSelectedClass] = useState("all");
  const [availableClasses, setAvailableClasses] = useState([]);
  const [sortBy, setSortBy] = useState("newest"); // 'newest' | 'highest' | 'lowest'

  // States for replying
  const [replyingToId, setReplyingToId] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  const supabase = createClient();
  const containerRef = useRef(null);

  useGsapReveal(
    containerRef,
    { selector: ".anim-item", y: 20, stagger: 0.04, duration: 0.45 },
    [reviews, currentPage, selectedRating, selectedReplyStatus, selectedClass, sortBy]
  );

  // Load available room classes
  useEffect(() => {
    async function loadClasses() {
      try {
        const { data } = await supabase
          .from("classes")
          .select("name")
          .order("price_per_day", { ascending: true });
        if (data && data.length > 0) {
          setAvailableClasses(data.map((c) => c.name));
        }
      } catch (err) {
        console.error("Error loading classes:", err);
      }
    }
    loadClasses();
  }, [supabase]);

  const loadReviews = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("reviews")
        .select(`
          *,
          profiles:user_id (full_name, phone, email),
          bookings:booking_id (
            id,
            cat_name,
            class,
            check_in_date,
            check_out_date
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (err) {
      console.error("Error fetching reviews list:", err);
      toast.error(t("admin_rev_load_failed"));
    } finally {
      setIsLoading(false);
    }
  }, [supabase, t]);

  useEffect(() => {
    loadReviews();

    let debounceTimer = null;
    const triggerDebouncedReload = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        loadReviews();
      }, 400);
    };

    const channelId = `admin-reviews-realtime-${Math.random()
      .toString(36)
      .substring(7)}`;
    const channel = supabase
      .channel(channelId)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reviews" },
        () => {
          triggerDebouncedReload();
        }
      )
      .subscribe();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        loadReviews();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [loadReviews, supabase]);

  // Submit review reply
  const handleReplySubmit = async (e, bookingId) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setIsSubmittingReply(true);

    try {
      const response = await fetch(`/api/reviews/reply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookingId,
          replyText: replyText.trim(),
        }),
      });

      const resData = await response.json();
      if (!response.ok)
        throw new Error(resData.error || t("admin_rev_reply_failed"));

      toast.success(t("admin_rev_reply_success"));
      setReplyingToId(null);
      setReplyText("");
      loadReviews();
    } catch (err) {
      console.error("Error submitting review reply:", err);
      toast.error(err.message || t("admin_rev_reply_failed"));
    } finally {
      setIsSubmittingReply(false);
    }
  };

  // Executive KPI stats calculation
  const stats = useMemo(() => {
    const total = reviews.length;
    const avgRating =
      total > 0
        ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / total).toFixed(1)
        : "0.0";
    const replied = reviews.filter((r) => !!r.reply_text).length;
    const pending = reviews.filter((r) => !r.reply_text).length;
    const fiveStar = reviews.filter((r) => r.rating === 5).length;
    const fourStar = reviews.filter((r) => r.rating === 4).length;
    const threeStar = reviews.filter((r) => r.rating === 3).length;
    const twoStar = reviews.filter((r) => r.rating === 2).length;
    const oneStar = reviews.filter((r) => r.rating === 1).length;
    const responseRate =
      total > 0 ? Math.round((replied / total) * 100) : 100;
    const fiveStarPercent =
      total > 0 ? Math.round((fiveStar / total) * 100) : 0;

    return {
      total,
      avgRating,
      replied,
      pending,
      fiveStar,
      fourStar,
      threeStar,
      twoStar,
      oneStar,
      responseRate,
      fiveStarPercent,
    };
  }, [reviews]);

  // Filter and sort reviews
  const filteredReviews = useMemo(() => {
    let list = [...reviews];

    if (selectedRating !== "all") {
      list = list.filter((r) => r.rating === parseInt(selectedRating, 10));
    }

    if (selectedReplyStatus === "unreplied") {
      list = list.filter((r) => !r.reply_text);
    } else if (selectedReplyStatus === "replied") {
      list = list.filter((r) => !!r.reply_text);
    }

    if (selectedClass !== "all") {
      list = list.filter((r) => r.bookings?.class === selectedClass);
    }

    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      list = list.filter((r) => {
        const catName = r.bookings?.cat_name?.toLowerCase() || "";
        const ownerName = r.profiles?.full_name?.toLowerCase() || "";
        const phone = r.profiles?.phone?.toLowerCase() || "";
        const reviewTxt = r.review_text?.toLowerCase() || "";
        const replyTxt = r.reply_text?.toLowerCase() || "";
        return (
          catName.includes(q) ||
          ownerName.includes(q) ||
          phone.includes(q) ||
          reviewTxt.includes(q) ||
          replyTxt.includes(q)
        );
      });
    }

    if (sortBy === "highest") {
      list.sort((a, b) => b.rating - a.rating || new Date(b.created_at) - new Date(a.created_at));
    } else if (sortBy === "lowest") {
      list.sort((a, b) => a.rating - b.rating || new Date(b.created_at) - new Date(a.created_at));
    } else {
      list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    return list;
  }, [reviews, selectedRating, selectedReplyStatus, selectedClass, searchQuery, sortBy]);

  // Reset all filters
  const isFiltersActive =
    searchQuery !== "" ||
    selectedRating !== "all" ||
    selectedReplyStatus !== "all" ||
    selectedClass !== "all" ||
    sortBy !== "newest";

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedRating("all");
    setSelectedReplyStatus("all");
    setSelectedClass("all");
    setSortBy("newest");
    setCurrentPage(1);
    toast.info("Semua filter pencarian telah direset.");
  };

  const reviewsPerPage = 6;
  const totalPages = Math.max(1, Math.ceil(filteredReviews.length / reviewsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedReviews = filteredReviews.slice(
    (safeCurrentPage - 1) * reviewsPerPage,
    safeCurrentPage * reviewsPerPage
  );

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

  return (
    <div ref={containerRef} className="space-y-7">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 anim-item">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-extrabold tracking-wide border border-rose-500/20 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
            <span>MANAJEMEN REPUTASI & ULASAN</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            {t("admin_rev_title")}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-2xl">
            Pantau kepuasan pemilik anabul, tanggapi umpan balik ulasan pelanggan
            secara langsung via email resmi NekoStay, dan jalin hubungan baik melalui WhatsApp.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              setSelectedReplyStatus(
                selectedReplyStatus === "unreplied" ? "all" : "unreplied"
              );
            }}
            className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 border shadow-2xs ${
              selectedReplyStatus === "unreplied"
                ? "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30"
                : "bg-card hover:bg-muted text-foreground border-border"
            }`}
            title="Saring ulasan yang belum dibalas"
          >
            <Clock className="w-4 h-4 text-amber-500" />
            <span>Perlu Dibalas ({stats.pending})</span>
          </button>

          <button
            onClick={loadReviews}
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
        {/* Card 1: Total Reviews */}
        <div
          onClick={() => {
            setSelectedRating("all");
            setSelectedReplyStatus("all");
          }}
          className={`p-4 sm:p-5 rounded-3xl border transition-all cursor-pointer select-none bg-card hover:shadow-md ${
            selectedRating === "all" && selectedReplyStatus === "all"
              ? "border-blue-500/60 ring-2 ring-blue-500/20 shadow-xs"
              : "border-border hover:border-border/80"
          }`}
        >
          <div className="flex items-center justify-between gap-3 mb-3">
            <span className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
              Total Ulasan
            </span>
            <div className="w-9 h-9 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              {stats.total}
            </div>
            <p className="text-[11px] font-medium text-muted-foreground">
              Ulasan masuk dari seluruh pelanggan
            </p>
          </div>
        </div>

        {/* Card 2: Average Rating Score */}
        <div
          onClick={() => setSelectedRating("5")}
          className={`p-4 sm:p-5 rounded-3xl border transition-all cursor-pointer select-none bg-card hover:shadow-md ${
            selectedRating === "5"
              ? "border-amber-500/60 ring-2 ring-amber-500/20 shadow-xs"
              : "border-border hover:border-border/80"
          }`}
        >
          <div className="flex items-center justify-between gap-3 mb-3">
            <span className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
              Skor Kepuasan
            </span>
            <div className="w-9 h-9 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20">
              <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 tracking-tight">
                {stats.avgRating}
              </span>
              <span className="text-xs font-bold text-muted-foreground">
                / 5.0
              </span>
            </div>
            <p className="text-[11px] font-medium text-muted-foreground">
              {stats.fiveStarPercent}% memberi bintang 5 ({stats.fiveStar} ulasan)
            </p>
          </div>
        </div>

        {/* Card 3: Pending Response */}
        <div
          onClick={() => setSelectedReplyStatus("unreplied")}
          className={`p-4 sm:p-5 rounded-3xl border transition-all cursor-pointer select-none bg-card hover:shadow-md ${
            selectedReplyStatus === "unreplied"
              ? "border-rose-500/60 ring-2 ring-rose-500/20 shadow-xs"
              : "border-border hover:border-border/80"
          }`}
        >
          <div className="flex items-center justify-between gap-3 mb-3">
            <span className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
              Perlu Dibalas
            </span>
            <div className="w-9 h-9 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-500/20">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400 tracking-tight">
              {stats.pending}
            </div>
            <p className="text-[11px] font-medium text-muted-foreground">
              {stats.pending > 0
                ? "Menunggu tanggapan admin"
                : "Semua ulasan telah ditanggapi"}
            </p>
          </div>
        </div>

        {/* Card 4: Response Rate */}
        <div
          onClick={() => setSelectedReplyStatus("replied")}
          className={`p-4 sm:p-5 rounded-3xl border transition-all cursor-pointer select-none bg-card hover:shadow-md ${
            selectedReplyStatus === "replied"
              ? "border-emerald-500/60 ring-2 ring-emerald-500/20 shadow-xs"
              : "border-border hover:border-border/80"
          }`}
        >
          <div className="flex items-center justify-between gap-3 mb-3">
            <span className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
              Tingkat Respon
            </span>
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
              {stats.responseRate}%
            </div>
            <p className="text-[11px] font-medium text-muted-foreground">
              {stats.replied} dari {stats.total} ulasan terjawab
            </p>
          </div>
        </div>
      </div>

      {/* Star Rating Quick Filter Strip */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar anim-item">
        {[
          { value: "all", label: "Semua Rating", count: stats.total },
          { value: "5", label: "5 Bintang", stars: 5, count: stats.fiveStar },
          { value: "4", label: "4 Bintang", stars: 4, count: stats.fourStar },
          { value: "3", label: "3 Bintang", stars: 3, count: stats.threeStar },
          { value: "2", label: "2 Bintang", stars: 2, count: stats.twoStar },
          { value: "1", label: "1 Bintang", stars: 1, count: stats.oneStar },
        ].map((tab) => {
          const isActive = selectedRating === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => setSelectedRating(tab.value)}
              className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer border ${
                isActive
                  ? "bg-primary text-primary-foreground border-primary shadow-xs"
                  : "bg-card border-border text-muted-foreground hover:text-foreground hover:bg-muted/40"
              }`}
            >
              {tab.stars ? (
                <Star
                  className={`w-3.5 h-3.5 shrink-0 ${
                    isActive
                      ? "fill-primary-foreground text-primary-foreground"
                      : "fill-amber-400 text-amber-400"
                  }`}
                />
              ) : (
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
              )}
              <span>{tab.label}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  isActive
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search & Advanced Filters Toolbar */}
      <div className="bg-card border border-border p-4 rounded-3xl shadow-xs space-y-3 anim-item">
        <div className="flex flex-col lg:flex-row gap-3 justify-between items-stretch lg:items-center">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Cari kucing, pemilik, isi review, atau balasan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-9 py-2.5 bg-muted/40 hover:bg-muted/60 border border-border rounded-2xl text-xs focus:outline-hidden focus:border-primary/60 text-foreground font-medium transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 cursor-pointer"
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

            {/* Reply Status Dropdown */}
            {(() => {
              const replyOptions = [
                { value: "all", label: "Semua Status Balasan" },
                { value: "unreplied", label: "Belum Dibalas" },
                { value: "replied", label: "Sudah Dibalas" },
              ];
              const currentLabel =
                replyOptions.find((o) => o.value === selectedReplyStatus)?.label ??
                "Status Balasan";
              return (
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center gap-2 px-3 py-2 bg-muted/40 hover:bg-muted border border-border rounded-xl text-xs font-semibold text-foreground transition-all min-w-[130px] justify-between cursor-pointer">
                    <span className="text-muted-foreground font-normal">
                      Balasan:
                    </span>
                    <span className="font-bold">{currentLabel.replace("Semua Status ", "")}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground ml-1 shrink-0" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    side="bottom"
                    align="start"
                    sideOffset={6}
                    className="p-1"
                  >
                    <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                      Status Tanggapan
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {replyOptions.map((opt) => (
                      <DropdownMenuItem
                        key={opt.value}
                        onClick={() => setSelectedReplyStatus(opt.value)}
                        className={`text-xs font-semibold cursor-pointer ${
                          selectedReplyStatus === opt.value
                            ? "text-primary font-bold bg-primary/5"
                            : ""
                        }`}
                      >
                        {selectedReplyStatus === opt.value ? (
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
              const classOptions = [
                { value: "all", label: "Semua Kelas" },
                ...(availableClasses.length > 0
                  ? availableClasses.map((c) => ({ value: c, label: c }))
                  : [
                      { value: "Basic", label: "Basic" },
                      { value: "Standard", label: "Standard" },
                      { value: "Premium", label: "Premium" },
                    ]),
              ];
              const currentClassLabel =
                classOptions.find((o) => o.value === selectedClass)?.label ??
                selectedClass;
              return (
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center gap-2 px-3 py-2 bg-muted/40 hover:bg-muted border border-border rounded-xl text-xs font-semibold text-foreground transition-all min-w-[120px] justify-between cursor-pointer">
                    <span className="text-muted-foreground font-normal">
                      Kelas:
                    </span>
                    <span className="font-bold">{currentClassLabel}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground ml-1 shrink-0" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    side="bottom"
                    align="start"
                    sideOffset={6}
                    className="p-1"
                  >
                    <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                      Filter Kelas
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {classOptions.map((opt) => (
                      <DropdownMenuItem
                        key={opt.value}
                        onClick={() => setSelectedClass(opt.value)}
                        className={`text-xs font-semibold cursor-pointer ${
                          selectedClass === opt.value
                            ? "text-primary font-bold bg-primary/5"
                            : ""
                        }`}
                      >
                        {selectedClass === opt.value ? (
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

            {/* Sort Dropdown */}
            {(() => {
              const sortOptions = [
                { value: "newest", label: "Terbaru" },
                { value: "highest", label: "Rating Tertinggi" },
                { value: "lowest", label: "Rating Terendah" },
              ];
              const currentSortLabel =
                sortOptions.find((o) => o.value === sortBy)?.label ?? "Terbaru";
              return (
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center gap-2 px-3 py-2 bg-muted/40 hover:bg-muted border border-border rounded-xl text-xs font-semibold text-foreground transition-all min-w-[110px] justify-between cursor-pointer">
                    <span className="text-muted-foreground font-normal">
                      Urut:
                    </span>
                    <span className="font-bold">{currentSortLabel}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground ml-1 shrink-0" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    side="bottom"
                    align="start"
                    sideOffset={6}
                    className="p-1"
                  >
                    <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                      Urutkan Berdasarkan
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {sortOptions.map((opt) => (
                      <DropdownMenuItem
                        key={opt.value}
                        onClick={() => setSortBy(opt.value)}
                        className={`text-xs font-semibold cursor-pointer ${
                          sortBy === opt.value
                            ? "text-primary font-bold bg-primary/5"
                            : ""
                        }`}
                      >
                        {sortBy === opt.value ? (
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

            {/* Reset Filters */}
            {isFiltersActive && (
              <button
                onClick={handleResetFilters}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground bg-muted/30 hover:bg-muted border border-border transition-all cursor-pointer"
                title="Reset semua filter ulasan"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Results Banner */}
        <div className="flex items-center justify-between text-xs text-muted-foreground font-medium pt-1 border-t border-border/50">
          <span>
            Menampilkan{" "}
            <strong className="text-foreground font-bold">
              {filteredReviews.length}
            </strong>{" "}
            ulasan dari total{" "}
            <strong className="text-foreground font-bold">{reviews.length}</strong>
          </span>
          {stats.pending > 0 && selectedReplyStatus !== "unreplied" && (
            <button
              onClick={() => setSelectedReplyStatus("unreplied")}
              className="text-amber-600 dark:text-amber-400 hover:underline font-bold cursor-pointer text-xs flex items-center gap-1"
            >
              <Clock className="w-3 h-3" />
              <span>Lihat {stats.pending} Ulasan Belum Dibalas</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Reviews Content */}
      {isLoading ? (
        <GsapDataLoader
          type="cards"
          message="Memuat ulasan pelanggan..."
          rows={4}
        />
      ) : filteredReviews.length === 0 ? (
        <div className="text-center py-20 bg-card border border-border border-dashed rounded-3xl p-8 max-w-xl mx-auto space-y-3 anim-item">
          <div className="w-14 h-14 mx-auto rounded-3xl bg-muted/60 flex items-center justify-center text-muted-foreground">
            <MessageSquare className="w-7 h-7" />
          </div>
          <h3 className="text-base font-extrabold text-foreground">
            Tidak Ada Ulasan Ditemukan
          </h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            {isFiltersActive
              ? "Tidak ada ulasan yang cocok dengan kriteria filter atau pencarian Anda saat ini."
              : t("admin_rev_empty")}
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
        <div className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {paginatedReviews.map((rev) => {
              const hasReply = !!rev.reply_text;
              const replyList = rev.reply_text
                ? rev.reply_text.split("\n---\n")
                : [];
              const replyCount = replyList.length;
              const isReplying = replyingToId === rev.id;
              const isMaxed = replyCount >= 3;

              const waUrl = getWhatsAppUrl(
                rev.profiles?.phone,
                rev.bookings?.cat_name,
                rev.profiles?.full_name
              );

              return (
                <div
                  key={rev.id}
                  className="bg-card border border-border rounded-3xl p-5 sm:p-6 hover:shadow-md transition-all flex flex-col justify-between anim-item space-y-4"
                >
                  <div className="space-y-4">
                    {/* Header: Customer, Cat, and Star Rating */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-border/60 pb-3.5">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black text-sm shrink-0 border border-primary/20">
                          {rev.profiles?.full_name
                            ? rev.profiles.full_name.charAt(0).toUpperCase()
                            : "U"}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-extrabold text-foreground text-sm">
                              {rev.profiles?.full_name || "Pelanggan NekoStay"}
                            </span>
                            {waUrl && (
                              <a
                                href={waUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold border border-emerald-500/20 transition-colors"
                                title="Chat WhatsApp Pemilik"
                              >
                                <MessageCircle className="w-3 h-3" />
                                <span>WhatsApp</span>
                              </a>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                            <span className="inline-flex items-center gap-1 font-semibold text-foreground">
                              <Cat className="w-3.5 h-3.5 text-primary" />
                              <span>{rev.bookings?.cat_name || "Kucing"}</span>
                            </span>
                            <span className="opacity-40">•</span>
                            <RoomClassBadge
                              roomClass={rev.bookings?.class || "Standard"}
                            />
                            {rev.bookings?.check_in_date && (
                              <>
                                <span className="opacity-40">•</span>
                                <span className="text-[11px]">
                                  {formatDate(rev.bookings.check_in_date)}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Stars and Date */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1.5 shrink-0">
                        <div className="flex items-center gap-1 bg-amber-500/10 px-2.5 py-1 rounded-xl border border-amber-500/20">
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-3.5 h-3.5 ${
                                  star <= rev.rating
                                    ? "text-amber-500 fill-amber-500"
                                    : "text-muted-foreground/30"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-xs font-black text-amber-700 dark:text-amber-400 ml-1">
                            {rev.rating}.0
                          </span>
                        </div>
                        <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-muted-foreground/60" />
                          <span>{formatDate(rev.created_at, "long")}</span>
                        </span>
                      </div>
                    </div>

                    {/* Customer Review Text */}
                    <div className="p-4 bg-muted/20 border border-border/70 rounded-2xl relative">
                      <div className="text-xs text-foreground leading-relaxed font-medium">
                        {rev.review_text ? (
                          <p className="italic">
                            &quot;{rev.review_text}&quot;
                          </p>
                        ) : (
                          <p className="text-muted-foreground italic">
                            {t("admin_rev_no_text")}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Threaded Admin Replies */}
                    {hasReply && (
                      <div className="space-y-2.5 pt-1">
                        {replyList.map((rText, rIdx) => (
                          <div
                            key={rIdx}
                            className="bg-primary/5 border border-primary/15 p-3.5 rounded-2xl space-y-1 relative"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] font-extrabold text-primary uppercase tracking-wider flex items-center gap-1.5">
                                <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                                <span>Tanggapan Resmi Admin #{rIdx + 1}</span>
                              </span>
                              <span className="text-[10px] text-muted-foreground font-semibold">
                                Terkirim via Email
                              </span>
                            </div>
                            <p className="text-xs text-foreground/90 leading-relaxed font-medium pl-5">
                              {rText}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Inline Reply Form */}
                    {isReplying && (
                      <form
                        onSubmit={(e) => handleReplySubmit(e, rev.booking_id)}
                        className="space-y-3 pt-2 bg-muted/30 p-4 border border-border rounded-2xl animate-in fade-in zoom-in duration-150"
                      >
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <label className="text-xs font-extrabold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                            <Send className="w-3.5 h-3.5 text-primary" />
                            <span>
                              Balas Ulasan (Tanggapan #{replyCount + 1}/3)
                            </span>
                          </label>
                          <span className="text-[10px] text-muted-foreground font-semibold">
                            Template Cepat:
                          </span>
                        </div>

                        {/* Quick Reply Templates */}
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              setReplyText(
                                `Terima kasih banyak Kak ${
                                  rev.profiles?.full_name || ""
                                } atas ulasan dan kepercayaannya menitipkan ${
                                  rev.bookings?.cat_name || "mpus kesayangan"
                                } di NekoStay! Senang sekali mpus sehat dan ceria selama bersama kami. Ditunggu kunjungan penitipan berikutnya ya!`
                              )
                            }
                            className="px-2.5 py-1 text-[11px] rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 font-semibold transition-colors cursor-pointer border border-amber-500/20"
                          >
                            <span>Terima Kasih (Puas)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setReplyText(
                                `Terima kasih atas ulasan dan penilaian yang diberikan untuk NekoStay. Kami selalu berkomitmen memberikan perawatan terbaik, bersih, dan penuh kasih sayang untuk kucing kesayangan Anda.`
                              )
                            }
                            className="px-2.5 py-1 text-[11px] rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground font-semibold transition-colors cursor-pointer border border-border"
                          >
                            <span>Apresiasi Standar</span>
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setReplyText(
                                `Terima kasih atas kritik dan masukan berharga yang disampaikan. Kami mohon maaf atas hal yang kurang berkenan dan tim manajemen NekoStay akan segera mengevaluasi untuk peningkatan mutu pelayanan ke depan.`
                              )
                            }
                            className="px-2.5 py-1 text-[11px] rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-semibold transition-colors cursor-pointer border border-rose-500/20"
                          >
                            <span>Evaluasi / Masukan</span>
                          </button>
                        </div>

                        <textarea
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Tulis balasan resmi Anda kepada pemilik kucing (akan dikirimkan langsung ke email mereka)..."
                          rows={3}
                          className="w-full text-xs p-3 bg-background border border-border rounded-xl focus:outline-hidden focus:border-primary/60 text-foreground font-medium transition-all"
                          required
                        />

                        <div className="flex items-center justify-between gap-2 pt-1">
                          <span className="text-[10px] text-muted-foreground">
                            Pesan balasan resmi akan dikirim ke{" "}
                            <strong>{rev.profiles?.email || "email pemilik"}</strong>
                          </span>
                          <div className="flex gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setReplyingToId(null);
                                setReplyText("");
                              }}
                              className="px-3.5 py-1.5 border border-border rounded-xl text-muted-foreground text-xs font-bold hover:bg-muted transition-all cursor-pointer"
                            >
                              Batal
                            </button>
                            <GsapTextButton
                              type="submit"
                              isLoading={isSubmittingReply}
                              idleText="Kirim Balasan via Email"
                              loadingText="Mengirim Email..."
                              successText="Terkirim!"
                              icon={<Send className="w-3.5 h-3.5" />}
                              className="px-4 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:bg-primary/90 transition-all cursor-pointer shadow-2xs disabled:opacity-50"
                            />
                          </div>
                        </div>
                      </form>
                    )}
                  </div>

                  {/* Card Bottom Footer: Quota & Action Buttons */}
                  <div className="flex items-center justify-between gap-3 pt-3 border-t border-border/60">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                          hasReply
                            ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900"
                            : "bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900"
                        }`}
                      >
                        {hasReply ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          <Clock className="w-3 h-3" />
                        )}
                        <span>
                          {hasReply
                            ? `Dibalas (${replyCount}/3)`
                            : "Belum Dibalas"}
                        </span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/bookings/${rev.booking_id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-xl text-xs font-bold text-foreground hover:bg-muted transition-all"
                        title="Lihat Rincian Pesanan Booking"
                      >
                        <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>Detail</span>
                      </Link>

                      {isMaxed ? (
                        <span className="px-3 py-1.5 bg-muted/60 border border-border text-muted-foreground text-xs font-bold rounded-xl">
                          Maksimal 3 Balasan
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            if (isReplying) {
                              setReplyingToId(null);
                              setReplyText("");
                            } else {
                              setReplyingToId(rev.id);
                              setReplyText("");
                            }
                          }}
                          className="px-3.5 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:bg-primary/90 transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>
                            {isReplying ? "Tutup Form" : "Balas Ulasan"}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between gap-4 flex-wrap bg-card border border-border px-5 py-4 rounded-3xl anim-item">
              <p className="text-xs text-muted-foreground font-semibold">
                Menampilkan{" "}
                <span className="text-foreground font-bold">
                  {Math.min(
                    filteredReviews.length,
                    (currentPage - 1) * reviewsPerPage + 1
                  )}
                </span>{" "}
                -{" "}
                <span className="text-foreground font-bold">
                  {Math.min(
                    filteredReviews.length,
                    currentPage * reviewsPerPage
                  )}
                </span>{" "}
                dari{" "}
                <span className="text-foreground font-bold">
                  {filteredReviews.length}
                </span>{" "}
                ulasan
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

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
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
                  )
                )}

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
        </div>
      )}
    </div>
  );
}
