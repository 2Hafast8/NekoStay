"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  Cat,
  Plus,
  Sparkles,
  LayoutDashboard,
  History,
  Clock,
  HelpCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { animate } from "animejs";
import { createClient } from "@/lib/supabase/client";
import { BookingCard } from "@/components/booking/BookingCard";
import { useLanguage } from "@/hooks/useLanguage";
import { useAnimeReveal } from "@/hooks/useAnimeReveal";

export default function UserDashboard() {
  const { t, language } = useLanguage();
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [activeTab, setActiveTab] = useState("Semua");
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 6;
  const supabase = createClient();

  // Animation refs
  const headerRef = useRef(null);
  const statsRef = useRef(null);
  const totalRef = useRef(null);
  const activeRef = useRef(null);
  const waitingRef = useRef(null);
  const completedRef = useRef(null);

  // Stagger reveals with Anime.js
  useAnimeReveal(headerRef, { selector: ".anim-head", translateY: 20, stagger: 90, duration: 600 });
  useAnimeReveal(statsRef, { selector: ".stat-card", translateY: 25, stagger: 80, duration: 650 });

  const fetchBookings = useCallback(
    async (uid) => {
      try {
        const { data, error } = await supabase
          .from("bookings")
          .select(
            `
          *,
          profiles (full_name, phone)
        `,
          )
          .eq("user_id", uid)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setBookings(data);
        setFilteredBookings(data);
      } catch (err) {
        console.error("Error fetching bookings:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [supabase],
  );

  useEffect(() => {
    let isMounted = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;
      const currentUser = session?.user || null;
      if (currentUser) {
        setUserId(currentUser.id);
        fetchBookings(currentUser.id);
      } else {
        setBookings([]);
        setFilteredBookings([]);
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, fetchBookings]);

  useEffect(() => {
    setCurrentPage(1);
    if (activeTab === "Semua") {
      setFilteredBookings(bookings);
    } else {
      setFilteredBookings(bookings.filter((b) => b.status === activeTab));
    }
  }, [activeTab, bookings]);

  const totalPages = Math.ceil(filteredBookings.length / ITEMS_PER_PAGE);
  const paginatedBookings = filteredBookings.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const stats = {
    total: bookings.length,
    active: bookings.filter((b) => b.status === "Aktif").length,
    waiting: bookings.filter((b) => b.status === "Menunggu").length,
    completed: bookings.filter((b) => b.status === "Selesai").length,
  };

  // Anime.js Stat Counters Effect
  useEffect(() => {
    const counterObj = { total: 0, active: 0, waiting: 0, completed: 0 };
    animate({
      targets: counterObj,
      total: stats.total,
      active: stats.active,
      waiting: stats.waiting,
      completed: stats.completed,
      duration: 1200,
      easing: "easeOutExpo",
      update: () => {
        if (totalRef.current) totalRef.current.textContent = Math.round(counterObj.total);
        if (activeRef.current) activeRef.current.textContent = Math.round(counterObj.active);
        if (waitingRef.current) waitingRef.current.textContent = Math.round(counterObj.waiting);
        if (completedRef.current) completedRef.current.textContent = Math.round(counterObj.completed);
      },
    });
  }, [stats.total, stats.active, stats.waiting, stats.completed]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div ref={headerRef} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1 anim-head">
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-extrabold uppercase tracking-wider">
            <Sparkles className="w-3 h-3" />
            <span>{t("user_db_badge")}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            {t("user_db_title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("user_db_subtitle")}
          </p>
        </div>

        <Link
          href="/booking/new"
          className="anim-head inline-flex items-center justify-center gap-2 px-5 py-3 bg-primary hover:bg-primary/95 text-primary-foreground font-bold text-xs rounded-2xl shadow-md hover:shadow-lg transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{t("user_db_btn_new")}</span>
        </Link>
      </div>

      {/* Stats Cards */}
      <div ref={statsRef} className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        <div className="stat-card bg-card border border-border p-5 rounded-3xl space-y-2 hover:border-primary/30 transition-all">
          <div className="p-2.5 bg-primary/10 text-primary rounded-2xl w-fit">
            <LayoutDashboard className="w-5 h-5" />
          </div>
          <div>
            <p ref={totalRef} className="text-2xl font-black text-foreground">
              0
            </p>
            <p className="text-xs text-muted-foreground font-bold">
              {t("user_db_stat_total")}
            </p>
          </div>
        </div>

        <div className="stat-card bg-card border border-border p-5 rounded-3xl space-y-2 hover:border-amber-500/30 transition-all">
          <div className="p-2.5 bg-amber-500/10 text-amber-500 rounded-2xl w-fit">
            <Cat className="w-5 h-5" />
          </div>
          <div>
            <p ref={activeRef} className="text-2xl font-black text-amber-500">
              0
            </p>
            <p className="text-xs text-muted-foreground font-bold">
              {t("user_db_stat_active")}
            </p>
          </div>
        </div>

        <div className="stat-card bg-card border border-border p-5 rounded-3xl space-y-2 hover:border-blue-500/30 transition-all">
          <div className="p-2.5 bg-blue-500/10 text-blue-500 rounded-2xl w-fit">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p ref={waitingRef} className="text-2xl font-black text-blue-500">
              0
            </p>
            <p className="text-xs text-muted-foreground font-bold">
              {t("user_db_stat_waiting")}
            </p>
          </div>
        </div>

        <div className="stat-card bg-card border border-border p-5 rounded-3xl space-y-2 hover:border-emerald-500/30 transition-all">
          <div className="p-2.5 bg-emerald-500/10 text-emerald-500 rounded-2xl w-fit">
            <History className="w-5 h-5" />
          </div>
          <div>
            <p ref={completedRef} className="text-2xl font-black text-emerald-500">
              0
            </p>
            <p className="text-xs text-muted-foreground font-bold">
              {t("user_db_stat_completed")}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Filter */}
      <div className="flex items-center gap-2 border-b border-border pb-3 overflow-x-auto">
        {["Semua", "Aktif", "Menunggu", "Selesai", "Dibatalkan"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === tab
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-muted/40 text-muted-foreground hover:bg-muted"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Bookings Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-56 bg-card border border-border rounded-3xl"
            />
          ))}
        </div>
      ) : paginatedBookings.length === 0 ? (
        <div className="bg-card border border-border p-12 text-center rounded-3xl space-y-4">
          <div className="p-4 bg-secondary text-primary rounded-full w-fit mx-auto">
            <Cat className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-foreground">
              {t("user_db_empty_title")}
            </h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              {t("user_db_empty_desc")}
            </p>
          </div>
          <Link
            href="/booking/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground font-bold text-xs rounded-xl shadow-xs hover:bg-primary/95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>{t("user_db_btn_new")}</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedBookings.map((b) => (
              <BookingCard key={b.id} booking={b} />
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Menampilkan {(currentPage - 1) * ITEMS_PER_PAGE + 1} -{" "}
                {Math.min(currentPage * ITEMS_PER_PAGE, filteredBookings.length)}{" "}
                dari {filteredBookings.length} pesanan
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-xl border border-border hover:bg-muted text-foreground disabled:opacity-40 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-bold px-2 text-foreground">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-xl border border-border hover:bg-muted text-foreground disabled:opacity-40 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* FAQ Section */}
      <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-secondary text-primary rounded-2xl">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-foreground">
              {language === "en" ? "Frequently Asked Questions" : "Pertanyaan Umum (FAQ)"}
            </h3>
            <p className="text-xs text-muted-foreground">
              {language === "en" ? "Common questions about cat boarding at NekoStay" : "Informasi penting mengenai layanan penitipan kucing NekoStay."}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {[
            {
              q: language === "en" ? "How do I check my cat's condition?" : "Bagaimana cara memantau kondisi kucing saya?",
              a: language === "en" ? "You can click on any active booking card to see daily photo updates, notes from caretaker, and health status." : "Anda cukup mengklik salah satu pesanan aktif di atas untuk melihat foto harian, catatan perawat, serta status kesehatan kucing Anda.",
            },
            {
              q: language === "en" ? "What foods are provided?" : "Makanan apa yang disediakan di NekoStay?",
              a: language === "en" ? "We provide premium dry and wet food twice or thrice daily depending on room class. You can also bring custom food." : "Kami menyediakan pakan kering & basah kualitas premium sesuai paket kelas kamar. Anda juga dapat membawa makanan khusus dari rumah.",
            },
            {
              q: language === "en" ? "How do I cancel or reschedule?" : "Bagaimana cara membatalkan atau mengubah tanggal penitipan?",
              a: language === "en" ? "You can cancel active bookings via booking details page prior to check-in date or contact our admin via WhatsApp." : "Pembatalan dapat dilakukan langsung dari halaman detail pesanan sebelum H-1 check-in, atau dengan menghubungi admin via WhatsApp.",
            },
          ].map((item, idx) => (
            <AnimeFaqItem key={idx} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
}

function AnimeFaqItem({ item }) {
  const [isOpen, setIsOpen] = useState(false);
  const contentRef = useRef(null);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    if (isOpen) {
      animate({
        targets: el,
        height: [0, el.scrollHeight],
        opacity: [0, 1],
        duration: 350,
        easing: "easeOutQuart",
      });
    } else {
      animate({
        targets: el,
        height: 0,
        opacity: 0,
        duration: 300,
        easing: "easeInQuart",
      });
    }
  }, [isOpen]);

  return (
    <div className="border border-border/80 dark:border-zinc-800 rounded-2xl overflow-hidden bg-muted/10 transition-colors">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-4 flex items-center justify-between gap-4 text-left font-bold text-sm text-foreground hover:bg-muted/30 cursor-pointer transition-colors"
      >
        <span>{item.q}</span>
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      <div
        ref={contentRef}
        className="overflow-hidden"
        style={{ height: 0, opacity: 0 }}
      >
        <p className="px-5 pb-4 text-xs text-muted-foreground leading-relaxed border-t border-border/40 pt-3">
          {item.a}
        </p>
      </div>
    </div>
  );
}
