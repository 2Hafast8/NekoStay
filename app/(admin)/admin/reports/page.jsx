"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { HeartPulse, Cat, Search, Calendar, ChevronRight, ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils/dates";
import { useLanguage } from "@/hooks/useLanguage";

export default function AdminReportsPage() {
  const { t } = useLanguage();
  const [reports, setReports] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    async function loadReports() {
      try {
        const { data, error } = await supabase
          .from("cat_reports")
          .select(
            `
            *,
            bookings (
              cat_name,
              profiles (full_name)
            )
          `,
          )
          .order("report_date", { ascending: false });

        if (error) throw error;
        setReports(data || []);
      } catch (err) {
        console.error("Error loading reports:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadReports();
  }, [supabase]);

  const translateHealthStatus = (status) => {
    if (status === "Sehat") return t("status_healthy");
    if (status === "Kurang Fit") return t("status_unwell");
    if (status === "Sakit") return t("status_sick");
    return status;
  };

  const filteredReports = reports.filter(
    (r) =>
      r.bookings?.cat_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.bookings?.profiles?.full_name
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      r.notes?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const reportsPerPage = 4;
  const totalPages = Math.ceil(filteredReports.length / reportsPerPage);
  const paginatedReports = filteredReports.slice(
    (currentPage - 1) * reportsPerPage,
    currentPage * reportsPerPage
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
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 text-[10px] font-extrabold uppercase tracking-wider">
          <HeartPulse className="w-3 h-3 text-rose-500" />
          <span>{t("admin_rep_badge")}</span>
        </span>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
          {t("admin_rep_title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("admin_rep_subtitle")}
        </p>
      </div>

      {/* Search Filter */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
          placeholder={t("admin_rep_search")}
          className="w-full pl-11 pr-4 py-3 bg-muted/40 border border-border rounded-xl text-sm focus:outline-hidden text-foreground font-medium"
        />
      </div>

      {/* Reports List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
          {[1, 2].map((n) => (
            <div
              key={n}
              className="h-48 bg-card border border-border rounded-3xl"
            />
          ))}
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border border-dashed rounded-3xl p-8 max-w-xl mx-auto text-muted-foreground">
          <HeartPulse className="w-8 h-8 mx-auto mb-2.5 text-muted-foreground/35" />
          <p className="text-sm font-bold">{t("admin_rep_empty")}</p>
          <p className="text-xs">
            {t("admin_rep_empty_desc")}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {paginatedReports.map((report) => (
              <div
                key={report.id}
                className="bg-card border border-border rounded-3xl p-6 space-y-4 shadow-xs flex flex-col justify-between hover:border-primary/25 transition-all"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-secondary text-primary rounded-xl">
                        <Cat className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-foreground">
                          {report.bookings?.cat_name}
                        </h3>
                        <p className="text-[10px] text-muted-foreground">
                          {t("admin_rep_owner")}{report.bookings?.profiles?.full_name}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-full border ${
                        report.health_status === "Sehat"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : report.health_status === "Kurang Fit"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-rose-50 text-rose-700 border-rose-200"
                      }`}
                    >
                      {translateHealthStatus(report.health_status)}
                    </span>
                  </div>

                  {report.photo_url && (
                    <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-border/60">
                      <img
                        src={report.photo_url}
                        alt="Kucing"
                        className="object-cover w-full h-full"
                      />
                    </div>
                  )}

                  {report.notes && (
                    <p className="text-xs text-muted-foreground leading-relaxed bg-muted/30 p-3.5 rounded-xl border border-border/40 font-medium">
                      {report.notes}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between gap-4 pt-4 border-t border-border/50 text-[10px] sm:text-xs font-bold text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDate(report.report_date, "long")}
                  </span>
                  <Link
                    href={`/admin/bookings/${report.booking_id}`}
                    className="text-primary hover:underline flex items-center gap-0.5"
                  >
                    {t("admin_rep_detail")}
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between gap-4 flex-wrap bg-card border border-border px-5 py-4 rounded-2xl">
              <p className="text-xs text-muted-foreground font-semibold">
                {t("pager_showing")} <span className="text-foreground">{Math.min(filteredReports.length, (currentPage - 1) * reportsPerPage + 1)}</span> - <span className="text-foreground">{Math.min(filteredReports.length, currentPage * reportsPerPage)}</span> {t("pager_of")} <span className="text-foreground">{filteredReports.length}</span> {t("pager_reports")}
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
        </div>
      )}
    </div>
  );
}
