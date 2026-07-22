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
import { createClient } from "@/lib/supabase/client";
import { BookingCard } from "@/components/booking/BookingCard";
import { useLanguage } from "@/hooks/useLanguage";
import { useGsapReveal, useGsapCounter } from "@/hooks/useGsapReveal";
import { gsap } from "gsap";

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

  // GSAP animation refs
  const headerRef = useRef(null);
  const statsRef = useRef(null);
  const totalRef = useRef(null);
  const activeRef = useRef(null);
  const waitingRef = useRef(null);
  const completedRef = useRef(null);

  // Stagger reveals
  useGsapReveal(headerRef, { selector: ":scope > *", y: 20, stagger: 0.12, duration: 0.55, delay: 0.1 });
  useGsapReveal(statsRef, { selector: ":scope > *", y: 28, stagger: 0.1, duration: 0.55, start: "top 95%" });

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

    // Listen for auth state changes (mount, token refresh, sign in/out)
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

  // Count up stats
  useGsapCounter(totalRef, stats.total);
  useGsapCounter(activeRef, stats.active);
  useGsapCounter(waitingRef, stats.waiting);
  useGsapCounter(completedRef, stats.completed);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div ref={headerRef} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
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
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/95 transition-all shadow-md shadow-primary/10 hover:scale-[1.01] active:scale-100 cursor-pointer w-fit"
        >
          <Plus className="w-4.5 h-4.5" />
          {t("user_db_new_booking")}
        </Link>
      </div>

      {/* Stats Section */}
      <div ref={statsRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-card border border-border p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-secondary text-primary rounded-xl">
            <LayoutDashboard className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
              {t("user_db_stat_total")}
            </span>
            <span ref={totalRef} className="text-2xl font-black text-foreground">
              0
            </span>
          </div>
        </div>

        <div className="bg-card border border-border p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
              {t("user_db_stat_active")}
            </span>
            <span ref={activeRef} className="text-2xl font-black text-foreground">
              0
            </span>
          </div>
        </div>

        <div className="bg-card border border-border p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/20 text-amber-500 rounded-xl">
            <Clock className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
              {t("user_db_stat_pending")}
            </span>
            <span ref={waitingRef} className="text-2xl font-black text-foreground">
              0
            </span>
          </div>
        </div>

        <div className="bg-card border border-border p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 text-blue-600 rounded-xl">
            <History className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
              {t("user_db_stat_completed")}
            </span>
            <span ref={completedRef} className="text-2xl font-black text-foreground">
              0
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Filter */}
      <div className="flex border-b border-border/80 overflow-x-auto pb-px gap-6">
        {["Semua", "Menunggu", "Aktif", "Selesai", "Dibatalkan"].map((tab) => {
          const tabMapping = {
            "Semua": t("user_db_tab_all"),
            "Menunggu": t("user_db_tab_waiting"),
            "Aktif": t("user_db_tab_active"),
            "Selesai": t("user_db_tab_completed"),
            "Dibatalkan": t("user_db_tab_cancelled")
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

      {/* Booking List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="border border-border/60 rounded-3xl p-6 space-y-4 bg-card"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-muted animate-pulse" />
                  <div className="space-y-2">
                    <div className="h-4.5 w-24 bg-muted rounded-md animate-pulse" />
                    <div className="h-3 w-16 bg-muted rounded-md animate-pulse" />
                  </div>
                </div>
                <div className="h-6 w-20 bg-muted rounded-full animate-pulse" />
              </div>
              <div className="h-20 bg-muted/50 rounded-xl animate-pulse" />
              <div className="h-10 bg-muted rounded-xl animate-pulse" />
            </div>
          ))}
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="text-center py-16 bg-card border border-dashed border-border rounded-3xl p-8 max-w-xl mx-auto space-y-4">
          <div className="p-4 bg-secondary text-primary rounded-full w-fit mx-auto">
            <Cat className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-foreground">
              {t("user_db_no_bookings")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t("user_db_no_bookings_desc")}
            </p>
          </div>
          {activeTab === "Semua" && (
            <Link
              href="/booking/new"
              className="inline-flex px-5 py-2.5 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:bg-primary/95 transition-all cursor-pointer"
            >
              {t("user_db_new_booking")}
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedBookings.map((booking) => (
              <BookingCard key={booking.id} booking={booking} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-muted-foreground font-medium">
                {language === "en"
                  ? `Showing ${(currentPage - 1) * ITEMS_PER_PAGE + 1}–${Math.min(currentPage * ITEMS_PER_PAGE, filteredBookings.length)} of ${filteredBookings.length} bookings`
                  : `Menampilkan ${(currentPage - 1) * ITEMS_PER_PAGE + 1}–${Math.min(currentPage * ITEMS_PER_PAGE, filteredBookings.length)} dari ${filteredBookings.length} pesanan`}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-xl border border-border text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      currentPage === page
                        ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                        : "border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-xl border border-border text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* FAQ & Help Section (Heuristic 10: Help and Documentation) */}
      <HelpSection language={language === "en" ? "en" : "id"} t={t} />
    </div>
  );
}

function GsapFaqItem({ item, isOpen, onClick }) {
  const contentRef = useRef(null);
  const isInitialMount = useRef(true);

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const el = contentRef.current;
    if (!el) return;

    if (prefersReduced) {
      el.style.height = isOpen ? "auto" : "0px";
      el.style.opacity = isOpen ? "1" : "0";
      return;
    }

    if (isInitialMount.current) {
      isInitialMount.current = false;
      gsap.set(el, { height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 });
      return;
    }

    if (isOpen) {
      gsap.fromTo(
        el,
        { height: 0, opacity: 0 },
        {
          height: "auto",
          opacity: 1,
          duration: 0.35,
          ease: "power2.out",
          overwrite: "auto",
        }
      );
    } else {
      gsap.to(el, {
        height: 0,
        opacity: 0,
        duration: 0.3,
        ease: "power2.inOut",
        overwrite: "auto",
      });
    }
  }, [isOpen]);

  return (
    <div className="border border-border/80 dark:border-zinc-800 rounded-xl overflow-hidden bg-muted/10 transition-colors">
      <button
        type="button"
        onClick={onClick}
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
        <div className="px-5 pb-4 text-xs text-muted-foreground dark:text-zinc-400 leading-relaxed border-t border-border/30 pt-3">
          {item.a}
        </div>
      </div>
    </div>
  );
}

function HelpSection({ language, t }) {
  const [openIndex, setOpenIndex] = useState(null);

  const faqItems = [
    {
      q: language === "en" ? "How do I check in my cat?" : "Bagaimana cara penyerahan kucing?",
      a: language === "en"
        ? "Bring your cat along with their favorite food/toys to the NekoStay location on your scheduled check-in day. Our staff will register and double-check your cat's health status."
        : "Bawa kucing Anda beserta pakan kesukaannya ke lokasi NekoStay pada hari check-in. Staf kami akan mendata dan memeriksa ulang kondisi kesehatan kucing sebelum masuk ke kandang."
    },
    {
      q: language === "en" ? "How is the late checkout fee calculated?" : "Bagaimana denda keterlambatan dihitung?",
      a: language === "en"
        ? "If checkout is delayed past the scheduled date, an 8% compounding late fee is applied daily to protect class reservation slot availability. Please update us early if you're running late!"
        : "Jika penjemputan terlambat dari jadwal, denda 8% akumulatif per hari akan dikenakan pada tarif harian untuk mengompensasi slot kandang. Harap hubungi admin jika Anda terpaksa terlambat."
    },
    {
      q: language === "en" ? "How can I request changes to my booking?" : "Dapatkah saya mengubah jadwal atau detail pesanan?",
      a: language === "en"
        ? "For active bookings, you can request stay extensions or room class upgrades directly by clicking 'Contact Support (WhatsApp)' in your booking detail screen."
        : "Untuk pesanan yang sedang berjalan (aktif), Anda dapat mengajukan perpanjangan hari atau perubahan kelas kamar secara mudah dengan mengklik tombol 'Hubungi Admin (WhatsApp)' di halaman detail pesanan."
    },
    {
      q: language === "en" ? "Where can I view daily updates of my cat?" : "Di mana saya bisa melihat update harian kucing saya?",
      a: language === "en"
        ? "Open your booking card on this dashboard and select 'Lihat Detail'. Any health reports, appetite progress, and latest photos will be posted under the 'Riwayat Kondisi Kucing' section."
        : "Buka kartu pesanan Anda di dashboard ini, lalu klik 'Lihat Detail'. Laporan kesehatan, status makan, dan foto terbaru si mpus akan di-update oleh staf kami di kolom 'Riwayat Kondisi Kucing'."
    }
  ];

  return (
    <div className="bg-card dark:bg-zinc-900/60 border border-border dark:border-zinc-850 p-6 sm:p-8 rounded-3xl space-y-6 mt-12 animate-in fade-in duration-300">
      <div className="flex items-center gap-3 border-b border-border/60 dark:border-zinc-800/60 pb-4">
        <div className="p-2 bg-primary/10 text-primary rounded-xl">
          <HelpCircle className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-black text-foreground">
            {language === "en" ? "Help Center & FAQ" : "Pusat Bantuan & Tanya Jawab"}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {language === "en" ? "Find answers to common questions about NekoStay boarding services" : "Temukan jawaban atas pertanyaan umum seputar layanan penitipan NekoStay"}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {faqItems.map((item, idx) => (
          <GsapFaqItem
            key={idx}
            item={item}
            isOpen={openIndex === idx}
            onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
          />
        ))}
      </div>
    </div>
  );
}
