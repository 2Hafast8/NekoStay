"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Cat,
  Plus,
  Sparkles,
  LayoutDashboard,
  History,
  Clock,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { BookingCard } from "@/components/booking/BookingCard";
import { useLanguage } from "@/hooks/useLanguage";

export default function UserDashboard() {
  const { t } = useLanguage();
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [activeTab, setActiveTab] = useState("Semua");
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState("");
  const supabase = createClient();

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
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        fetchBookings(user.id);
      }
    }
    loadUser();
  }, [supabase, fetchBookings]);

  useEffect(() => {
    if (activeTab === "Semua") {
      setFilteredBookings(bookings);
    } else {
      setFilteredBookings(bookings.filter((b) => b.status === activeTab));
    }
  }, [activeTab, bookings]);

  const stats = {
    total: bookings.length,
    active: bookings.filter((b) => b.status === "Aktif").length,
    waiting: bookings.filter((b) => b.status === "Menunggu").length,
    completed: bookings.filter((b) => b.status === "Selesai").length,
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-card border border-border p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-secondary text-primary rounded-xl">
            <LayoutDashboard className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
              {t("user_db_stat_total")}
            </span>
            <span className="text-2xl font-black text-foreground">
              {stats.total}
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
            <span className="text-2xl font-black text-foreground">
              {stats.active}
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
            <span className="text-2xl font-black text-foreground">
              {stats.waiting}
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
            <span className="text-2xl font-black text-foreground">
              {stats.completed}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBookings.map((booking) => (
            <BookingCard key={booking.id} booking={booking} />
          ))}
        </div>
      )}
    </div>
  );
}
