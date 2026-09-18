"use client";

import { AlertTriangle, PinOff, ShieldAlert, Sparkles, User } from "lucide-react";
import { formatDate } from "@/lib/utils/dates";

const CATEGORY_MAP = {
  urgent: { label: "Perhatian Kritis", badgeClass: "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30" },
  medical: { label: "Medis & Obat", badgeClass: "bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30" },
  diet: { label: "Diet & Pakan", badgeClass: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30" },
  behavior: { label: "Perilaku & Sifat", badgeClass: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30" },
  shift_handoff: { label: "Serah Terima Shift", badgeClass: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30" },
  general: { label: "Umum", badgeClass: "bg-muted text-muted-foreground border-border" },
};

export function AdminBookingStickyAlert({
  pinnedNote,
  onUnpin,
  onOpenCreateModal,
  isActionLoading = false,
}) {
  if (!pinnedNote) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-dashed border-border/80 bg-card/60 p-4 transition-colors hover:border-primary/40 dark:bg-zinc-900/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-muted-foreground">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ShieldAlert className="h-4 w-4" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Tidak ada peringatan kritis aktif</p>
              <p className="text-[11px] text-muted-foreground">
                Sematkan instruksi penting (alergi, pantangan, perilaku agresif) agar selalu terbaca staf klinik.
              </p>
            </div>
          </div>
          {onOpenCreateModal && (
            <button
              type="button"
              onClick={onOpenCreateModal}
              className="inline-flex items-center justify-center gap-1.5 self-start sm:self-center px-3 py-1.5 rounded-xl border border-primary/30 bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-all cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>+ Pasang Peringatan</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  const catMeta = CATEGORY_MAP[pinnedNote.category] || CATEGORY_MAP.general;
  const authorName = pinnedNote.profiles?.full_name || "Admin Klinik";

  return (
    <div className="relative overflow-hidden rounded-3xl border border-rose-500/30 bg-gradient-to-r from-rose-500/10 via-amber-500/5 to-card p-5 sm:p-6 shadow-sm dark:from-rose-950/40 dark:via-zinc-900/40 dark:to-zinc-950 transition-all">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="relative mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 shadow-xs">
            <AlertTriangle className="h-5 w-5" />
          </div>

          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/40">
                Peringatan Kritis Operasional
              </span>
              <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold ${catMeta.badgeClass}`}>
                {catMeta.label}
              </span>
            </div>

            <p className="text-sm sm:text-base font-bold text-foreground leading-snug break-words">
              {pinnedNote.content}
            </p>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground pt-1">
              <span className="inline-flex items-center gap-1">
                <User className="h-3 w-3 text-rose-500 shrink-0" />
                <span className="font-semibold text-foreground/90">{authorName}</span>
              </span>
              <span>•</span>
              <span>{formatDate(pinnedNote.created_at || new Date())}</span>
            </div>
          </div>
        </div>

        {onUnpin && (
          <button
            type="button"
            onClick={() => onUnpin(pinnedNote.id)}
            disabled={isActionLoading}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-300/60 dark:border-rose-800/60 bg-background/80 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shrink-0 shadow-2xs self-start sm:self-center"
            title="Lepas sematan dari banner atas"
          >
            <PinOff className="h-3.5 w-3.5" />
            <span>Lepas Sematan</span>
          </button>
        )}
      </div>
    </div>
  );
}

