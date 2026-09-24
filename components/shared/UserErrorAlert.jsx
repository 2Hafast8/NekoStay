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
} from "lucide-react";
import { formatUserError, IS_DEV } from "@/lib/utils/errors";

/**
 * UserErrorAlert: Komponen notifikasi kesalahan yang aman dan ramah pengguna (UI/UX Pro Max).
 *
 * Fitur:
 * - Bahasa empati dari sudut pandang pengguna (tanpa pesan teknis bocor di mode deploy).
 * - Tips aksi yang jelas untuk memandu pengguna.
 * - Mode Dev interaktif: diagnostik teknis lengkap hanya muncul saat proses pengembangan.
 * - Aksesibilitas WCAG (role="alert", aria-live="polite", kontras warna tinggi).
 */
export function UserErrorAlert({
  error,
  onDismiss,
  language = "id",
  className = "",
}) {
  const [showDevDetails, setShowDevDetails] = useState(false);

  if (!error) return null;

  // Format error menjadi objek terstruktur jika masih berupa string atau objek mentah
  const errorObj =
    typeof error === "object" && error.code && error.message
      ? error
      : formatUserError(error, { language });

  const { message, tip, category, devInfo } = errorObj;

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
      className={`bg-rose-500/10 dark:bg-rose-950/30 border border-rose-500/20 dark:border-rose-900/40 rounded-2xl p-3.5 sm:p-4 text-xs shadow-xs transition-all animate-in fade-in slide-in-from-top-2 duration-200 ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="mt-0.5">{renderIcon()}</div>
          <div className="space-y-1 min-w-0 flex-1">
            <p className="font-bold text-rose-900 dark:text-rose-200 leading-snug break-words">
              {message}
            </p>
            {tip && (
              <p className="text-[11px] text-rose-700/85 dark:text-rose-300/80 leading-relaxed">
                💡 <span className="font-semibold">{tip}</span>
              </p>
            )}
          </div>
        </div>

        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="p-1 -mr-1 -mt-0.5 rounded-lg text-rose-500/70 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-500/10 transition-colors cursor-pointer shrink-0"
            title={language === "en" ? "Dismiss alert" : "Tutup pemberitahuan"}
            aria-label="Tutup pemberitahuan"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {children && <div className="mt-2.5">{children}</div>}

      {/* Bagian Diagnostik Khusus Mode Pengembangan (HANYA AKTIF SAAT DEV, DILINDUNGI SAAT DEPLOY) */}
      {IS_DEV && devInfo && (
        <div className="mt-3 pt-2.5 border-t border-rose-500/15 dark:border-rose-900/30">
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
