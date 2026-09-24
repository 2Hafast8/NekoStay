"use client";

import { useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  ShieldAlert,
  KeyRound,
  WifiOff,
  X,
  Terminal,
  ChevronDown,
  ChevronUp,
  RotateCcw,
} from "lucide-react";
import { formatUserError, IS_DEV } from "@/lib/utils/errors";

const CATEGORY_STYLES = {
  security: {
    container: "bg-rose-500/10 dark:bg-rose-950/30 border-rose-500/20 dark:border-rose-900/40 text-rose-900 dark:text-rose-200",
    tip: "text-rose-700/85 dark:text-rose-300/80",
    closeBtn: "text-rose-500/70 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-500/10",
    retryBtn: "bg-rose-600 hover:bg-rose-700 text-white",
    divider: "border-rose-500/15 dark:border-rose-900/30",
  },
  auth: {
    container: "bg-amber-500/10 dark:bg-amber-950/30 border-amber-500/20 dark:border-amber-900/40 text-amber-950 dark:text-amber-200",
    tip: "text-amber-800/85 dark:text-amber-300/80",
    closeBtn: "text-amber-600/70 hover:text-amber-800 dark:hover:text-amber-200 hover:bg-amber-500/10",
    retryBtn: "bg-amber-600 hover:bg-amber-700 text-white",
    divider: "border-amber-500/15 dark:border-amber-900/30",
  },
  network: {
    container: "bg-sky-500/10 dark:bg-sky-950/30 border-sky-500/20 dark:border-sky-900/40 text-sky-950 dark:text-sky-200",
    tip: "text-sky-800/85 dark:text-sky-300/80",
    closeBtn: "text-sky-600/70 hover:text-sky-800 dark:hover:text-sky-200 hover:bg-sky-500/10",
    retryBtn: "bg-sky-600 hover:bg-sky-700 text-white",
    divider: "border-sky-500/15 dark:border-sky-900/30",
  },
  warning: {
    container: "bg-amber-500/10 dark:bg-amber-950/30 border-amber-500/20 dark:border-amber-900/40 text-amber-950 dark:text-amber-200",
    tip: "text-amber-800/85 dark:text-amber-300/80",
    closeBtn: "text-amber-600/70 hover:text-amber-800 dark:hover:text-amber-200 hover:bg-amber-500/10",
    retryBtn: "bg-amber-600 hover:bg-amber-700 text-white",
    divider: "border-amber-500/15 dark:border-amber-900/30",
  },
  error: {
    container: "bg-rose-500/10 dark:bg-rose-950/30 border-rose-500/20 dark:border-rose-900/40 text-rose-900 dark:text-rose-200",
    tip: "text-rose-700/85 dark:text-rose-300/80",
    closeBtn: "text-rose-500/70 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-500/10",
    retryBtn: "bg-rose-600 hover:bg-rose-700 text-white",
    divider: "border-rose-500/15 dark:border-rose-900/30",
  },
};

/**
 * UserErrorAlert: Komponen notifikasi kesalahan yang aman dan ramah pengguna (UI/UX Pro Max).
 *
 * Fitur:
 * - Bahasa empati dari sudut pandang pengguna (tanpa pesan teknis bocor di mode deploy).
 * - Tips aksi yang jelas untuk memandu pengguna.
 * - Palet warna tematik sesuai kategori masalah (keamanan, autentikasi, jaringan, peringatan, sistem).
 * - Dukungan tombol coba lagi (onRetry) langsung pada kartu notifikasi.
 * - Mode Dev interaktif: diagnostik teknis lengkap hanya muncul saat proses pengembangan.
 * - Aksesibilitas WCAG (role="alert", aria-live="polite", kontras warna tinggi).
 */
export function UserErrorAlert({
  error,
  onDismiss,
  onRetry,
  children,
  language = "id",
  className = "",
}) {
  const [showDevDetails, setShowDevDetails] = useState(false);

  if (!error) return null;

  // Hanya anggap sudah diformat jika memiliki penanda internal _isFormatted
  // Objek mentah dari PostgreSQL/Supabase (yang juga memiliki .code & .message) tetap akan diformat aman
  const errorObj =
    error && typeof error === "object" && error._isFormatted === true
      ? error
      : formatUserError(error, { language });

  const { message, tip, category = "error", devInfo } = errorObj || {};
  const style = CATEGORY_STYLES[category] || CATEGORY_STYLES.error;

  // Pemilihan ikon berdasarkan kategori masalah
  const renderIcon = () => {
    const iconClass = "w-4.5 h-4.5 shrink-0";
    switch (category) {
      case "security":
        return <ShieldAlert className={`${iconClass} text-rose-500`} />;
      case "auth":
        return <KeyRound className={`${iconClass} text-amber-500`} />;
      case "network":
        return <WifiOff className={`${iconClass} text-sky-500`} />;
      case "warning":
        return <AlertTriangle className={`${iconClass} text-amber-500`} />;
      default:
        return <AlertCircle className={`${iconClass} text-rose-500`} />;
    }
  };

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`border rounded-2xl p-3.5 sm:p-4 text-xs shadow-xs transition-all animate-in fade-in slide-in-from-top-2 duration-200 ${style.container} ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="mt-0.5">{renderIcon()}</div>
          <div className="space-y-1 min-w-0 flex-1">
            <p className="font-bold leading-snug break-words">
              {message}
            </p>
            {tip && (
              <p className={`text-[11px] leading-relaxed ${style.tip}`}>
                💡 <span className="font-semibold">{tip}</span>
              </p>
            )}
          </div>
        </div>

        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className={`p-1 -mr-1 -mt-0.5 rounded-lg transition-colors cursor-pointer shrink-0 ${style.closeBtn}`}
            title={language === "en" ? "Dismiss alert" : "Tutup pemberitahuan"}
            aria-label={language === "en" ? "Dismiss alert" : "Tutup pemberitahuan"}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {onRetry && (
        <div className="mt-2.5">
          <button
            type="button"
            onClick={onRetry}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-[11px] shadow-xs cursor-pointer transition-opacity hover:opacity-90 active:scale-95 ${style.retryBtn}`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{language === "en" ? "Try Again" : "Coba Lagi"}</span>
          </button>
        </div>
      )}

      {children && <div className="mt-2.5">{children}</div>}

      {/* Bagian Diagnostik Khusus Mode Pengembangan (HANYA AKTIF SAAT DEV, DILINDUNGI SAAT DEPLOY) */}
      {IS_DEV && devInfo && (
        <div className={`mt-3 pt-2.5 border-t ${style.divider}`}>
          <button
            type="button"
            onClick={() => setShowDevDetails((prev) => !prev)}
            className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-amber-700 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-1 rounded-lg border border-amber-500/20 transition-all cursor-pointer"
          >
            <Terminal className="w-3 h-3" />
            <span>
              {showDevDetails
                ? "Sembunyikan Detail Teknis (Mode Dev)"
                : "Lihat Detail Teknis (Mode Dev)"}
            </span>
            {showDevDetails ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
          </button>

          {showDevDetails && (
            <div className="mt-2 p-3 bg-zinc-950 text-emerald-400 rounded-xl font-mono text-[10px] leading-relaxed break-all shadow-inner border border-zinc-800 space-y-1 animate-in fade-in duration-150">
              <div className="flex items-center justify-between text-zinc-400 font-semibold border-b border-zinc-800 pb-1 mb-1">
                <span>[Diagnostik Pengembang - Mode Dev Aktif]</span>
                <span className="text-[9px] text-amber-400 uppercase">
                  Tidak Muncul di Mode Deploy
                </span>
              </div>
              <p className="text-zinc-300">{devInfo}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
