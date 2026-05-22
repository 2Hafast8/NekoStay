"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  CalendarRange,
  Sparkles,
  Clock,
  CheckCircle2,
  TrendingUp,
  HeartPulse,
  Settings,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { BookingStatus } from "@/components/booking/BookingStatus";
import { formatRupiah } from "@/lib/utils/format";
import { formatDate } from "@/lib/utils/dates";

export default function AdminDashboard() {
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function loadStats() {
      try {
        const { data, error } = await supabase
          .from("bookings")
          .select(
            `
            *,
            profiles (full_name, phone)
          `,
          )
          .order("created_at", { ascending: false });

        if (error) throw error;
        setBookings(data);
      } catch (err) {
        console.error("Error fetching admin stats:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadStats();
  }, [supabase]);

  const stats = {
    totalBookings: bookings.length,
    pending: bookings.filter((b) => b.status === "Menunggu").length,
    active: bookings.filter((b) => b.status === "Aktif").length,
    revenue: bookings
      .filter((b) => b.status === "Selesai" || b.status === "Aktif")
      .reduce(
        (sum, b) =>
          sum +
          (b.estimated_total +
            (b.late_fee_total || 0) -
            (b.refund_amount || 0)),
        0,
      ),
  };

  const recentBookings = bookings.slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 text-[10px] font-extrabold uppercase tracking-wider">
          <Sparkles className="w-3 h-3 text-rose-500" />
          <span>Sistem Informasi Admin</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
          Overview Bisnis NekoStay
        </h1>
        <p className="text-sm text-muted-foreground">
          Kelola pemesanan, buat laporan harian, dan atur layanan tarif hotel
          kucing.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-card border border-border p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-secondary text-primary rounded-xl">
            <CalendarRange className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
              Total Booking
            </span>
            <span className="text-2xl font-black text-foreground">
              {stats.totalBookings}
            </span>
          </div>
        </div>

        <div className="bg-card border border-border p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/20 text-amber-500 rounded-xl">
            <Clock className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
              Menunggu Persetujuan
            </span>
            <span className="text-2xl font-black text-foreground">
              {stats.pending}
            </span>
          </div>
        </div>

        <div className="bg-card border border-border p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 rounded-xl">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
              Kucing Menginap
            </span>
            <span className="text-2xl font-black text-foreground">
              {stats.active}
            </span>
          </div>
        </div>

        <div className="bg-card border border-border p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-600 rounded-xl">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
              Omzet Aktif
            </span>
            <span className="text-2xl font-black text-foreground">
              {formatRupiah(stats.revenue)}
            </span>
          </div>
        </div>
      </div>

      {/* Recent Bookings & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Bookings Table */}
        <div className="lg:col-span-2 bg-card border border-border rounded-3xl p-6 space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-border/60">
            <h3 className="font-bold text-foreground text-base">
              Pemesanan Terbaru
            </h3>
            <Link
              href="/admin/bookings"
              className="text-xs font-bold text-primary hover:underline"
            >
              Lihat Semua
            </Link>
          </div>

          {isLoading ? (
            <div className="space-y-4 animate-pulse">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-12 bg-muted rounded-xl" />
              ))}
            </div>
          ) : recentBookings.length === 0 ? (
            <p className="text-xs text-muted-foreground py-6 text-center">
              Belum ada pemesanan masuk.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border/40 text-muted-foreground font-bold">
                    <th className="pb-3">Pemilik & Kucing</th>
                    <th className="pb-3">Kelas & Waktu</th>
                    <th className="pb-3">Total Estimasi</th>
                    <th className="pb-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {recentBookings.map((b) => (
                    <tr
                      key={b.id}
                      className="hover:bg-muted/10 transition-colors"
                    >
                      <td className="py-3">
                        <span className="font-bold text-foreground block">
                          {b.cat_name}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {b.profiles?.full_name}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className="font-semibold text-foreground block">
                          {b.class}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {formatDate(b.check_in_date)}
                        </span>
                      </td>
                      <td className="py-3 font-semibold text-foreground">
                        {formatRupiah(b.estimated_total)}
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
        <div className="bg-card border border-border rounded-3xl p-6 space-y-6">
          <h3 className="font-bold text-foreground text-base border-b border-border/60 pb-3">
            Pintasan Cepat
          </h3>
          <div className="grid grid-cols-1 gap-3.5">
            <Link
              href="/admin/bookings"
              className="p-4 rounded-2xl bg-muted/30 border border-border/80 hover:border-primary/30 hover:bg-primary/5 transition-all text-sm font-semibold flex items-center justify-between"
            >
              <span className="flex items-center gap-2">
                <CalendarRange className="w-4 h-4 text-primary" />
                Proses Persetujuan Booking
              </span>
              <span className="text-xs bg-amber-100 dark:bg-amber-950/40 text-amber-600 px-2.5 py-0.5 rounded-full font-bold">
                {stats.pending}
              </span>
            </Link>

            <Link
              href="/admin/reports"
              className="p-4 rounded-2xl bg-muted/30 border border-border/80 hover:border-primary/30 hover:bg-primary/5 transition-all text-sm font-semibold flex items-center justify-between"
            >
              <span className="flex items-center gap-2">
                <HeartPulse className="w-4 h-4 text-primary" />
                Tulis Laporan Kucing Harian
              </span>
              <span className="text-xs bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 px-2.5 py-0.5 rounded-full font-bold">
                {stats.active}
              </span>
            </Link>

            <Link
              href="/admin/settings"
              className="p-4 rounded-2xl bg-muted/30 border border-border/80 hover:border-primary/30 hover:bg-primary/5 transition-all text-sm font-semibold flex items-center justify-between"
            >
              <span className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-primary" />
                Konfigurasi Tarif & Layanan
              </span>
              <Settings className="w-4 h-4 text-muted-foreground" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
