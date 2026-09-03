"use client";

import { useState, useEffect } from "react";
import {
  QrCode,
  Download,
  FileText,
  Copy,
  Check,
  X,
  Store,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";
import { formatRupiah } from "@/lib/utils/format";
import { toast } from "sonner";

export function OfflineQrModal({
  isOpen,
  onClose,
  booking,
  token,
  qrDataUrl,
  language = "id",
}) {
  const [copied, setCopied] = useState(false);

  // Kunci scroll body dan tangani tombol ESC saat modal terbuka
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Hitung total akhir
  const finalTotal =
    (booking?.estimated_total || 0) -
    (booking?.discount_amount || 0) +
    (booking?.late_fee_total || 0) -
    (booking?.refund_amount || 0);

  const handleCopyToken = () => {
    if (!token) return;
    navigator.clipboard.writeText(token);
    setCopied(true);
    toast.success(
      language === "en" ? "Token copied to clipboard!" : "Kode token berhasil disalin!"
    );
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQrImage = () => {
    if (!qrDataUrl) {
      toast.error(
        language === "en" ? "QR Code not ready yet" : "QR Code belum siap"
      );
      return;
    }
    const link = document.createElement("a");
    link.href = qrDataUrl;
    link.download = `nekostay-qr-${booking?.cat_name || "booking"}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(
      language === "en" ? "QR Code image downloaded!" : "Gambar QR Code berhasil diunduh!"
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative bg-card dark:bg-zinc-900 border border-border dark:border-zinc-800 w-full max-w-[min(94vw,480px)] sm:max-w-[520px] lg:max-w-[560px] 2xl:max-w-[620px] max-h-[min(92vh,820px)] flex flex-col rounded-3xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 my-auto">
        {/* Sticky Header Modal */}
        <div className="shrink-0 flex items-start justify-between gap-3 p-5 sm:p-6 border-b border-border/60 dark:border-zinc-800 bg-card dark:bg-zinc-900 rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 dark:bg-emerald-950/30 rounded-2xl text-emerald-600 dark:text-emerald-400 shrink-0">
              <QrCode className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg text-foreground dark:text-zinc-100 leading-snug">
                {language === "en" ? "Desk Payment QR Code" : "QR Code Pembayaran di Kasir"}
              </h3>
              <p className="text-[11px] sm:text-xs text-muted-foreground dark:text-zinc-400">
                {language === "en"
                  ? "Show this QR code at hotel desk upon check-in"
                  : "Tunjukkan QR ini ke kasir saat check-in"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer shrink-0"
            aria-label={language === "en" ? "Close" : "Tutup"}
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="overflow-y-auto flex-1 p-5 sm:p-6 space-y-4 sm:space-y-5">
          {/* Email sent notice banner */}
          <div className="p-3 sm:p-3.5 bg-emerald-500/10 dark:bg-emerald-950/20 border border-emerald-500/20 dark:border-emerald-900/30 rounded-2xl flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <p className="text-xs sm:text-[13px] text-emerald-700 dark:text-emerald-350 leading-relaxed font-medium">
              {language === "en"
                ? "Booking receipt PDF has been sent to your email! You can also show or download this QR code directly."
                : "Bukti pemesanan PDF telah dikirim ke email Anda! Anda juga dapat menunjukkan atau mengunduh kode QR ini secara langsung."}
            </p>
          </div>

          {/* QR Code Container */}
          <div className="flex flex-col items-center justify-center space-y-3 sm:space-y-4">
            <div className="relative p-3 sm:p-4 bg-white rounded-2xl shadow-md border border-zinc-200 flex items-center justify-center w-full max-w-[min(220px,26vh,50vw)] sm:max-w-[min(250px,30vh)] aspect-square mx-auto">
              {/* Viewfinder corner brackets */}
              <div className="absolute top-2 left-2 w-3.5 h-3.5 border-t-2 border-l-2 border-primary rounded-tl-xs" />
              <div className="absolute top-2 right-2 w-3.5 h-3.5 border-t-2 border-r-2 border-primary rounded-tr-xs" />
              <div className="absolute bottom-2 left-2 w-3.5 h-3.5 border-b-2 border-l-2 border-primary rounded-bl-xs" />
              <div className="absolute bottom-2 right-2 w-3.5 h-3.5 border-b-2 border-r-2 border-primary rounded-br-xs" />

              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="QR Code Pembayaran Offline"
                  className="w-full h-full object-contain select-none"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-zinc-400 space-y-1">
                  <AlertCircle className="w-6 h-6 text-amber-500" />
                  <span className="text-[11px] font-semibold">Memuat QR...</span>
                </div>
              )}
            </div>

            {/* Amount to pay */}
            <div className="text-center space-y-1">
              <span className="text-[10px] sm:text-[11px] uppercase font-bold text-muted-foreground tracking-wider block">
                {language === "en" ? "Total Due at Desk" : "Total Tagihan di Kasir"}
              </span>
              <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
                {formatRupiah(finalTotal)}
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground dark:text-zinc-400">
                {booking?.cat_name} • {booking?.class} ({booking?.total_days || 1} {language === "en" ? "Days" : "Hari"})
              </p>
            </div>

            {/* Token verification code */}
            {token && (
              <div className="w-full flex items-center justify-between gap-2 px-3 sm:px-4 py-2 bg-muted/50 dark:bg-zinc-950/50 border border-border/80 dark:border-zinc-800 rounded-xl text-xs sm:text-sm">
                <span className="font-mono text-[10px] sm:text-xs text-muted-foreground font-bold shrink-0">
                  TOKEN:
                </span>
                <span className="font-mono font-bold text-foreground dark:text-zinc-200 truncate select-all">
                  {token}
                </span>
                <button
                  type="button"
                  onClick={handleCopyToken}
                  title={language === "en" ? "Copy Token" : "Salin Token"}
                  className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer shrink-0"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            )}

            {/* Expiry note */}
            <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400">
              <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>
                {language === "en" ? "Valid for 24 hours" : "Berlaku 24 jam dari waktu pembuatan"}
              </span>
            </div>
          </div>
        </div>

        {/* Sticky Action Footer */}
        <div className="shrink-0 p-4 sm:p-5 border-t border-border/60 dark:border-zinc-800 bg-card/95 dark:bg-zinc-900/95 backdrop-blur-xs space-y-2 rounded-b-3xl">
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <button
              type="button"
              onClick={handleDownloadQrImage}
              disabled={!qrDataUrl}
              className="flex items-center justify-center gap-1.5 py-2.5 sm:py-3 px-3 rounded-xl bg-primary text-primary-foreground font-bold text-xs sm:text-sm hover:bg-primary/95 transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>{language === "en" ? "Save QR Image" : "Unduh Gambar QR"}</span>
            </button>

            <a
              href={`/api/bookings/${booking?.id}/receipt`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 py-2.5 sm:py-3 px-3 rounded-xl border border-border dark:border-zinc-800 bg-muted/30 dark:bg-zinc-950/30 text-foreground dark:text-zinc-200 font-bold text-xs sm:text-sm hover:bg-muted dark:hover:bg-zinc-800 transition-all cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-500" />
              <span>{language === "en" ? "Download PDF" : "Unduh Struk PDF"}</span>
            </a>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 sm:py-3 rounded-xl border border-border dark:border-zinc-800 text-xs sm:text-sm font-bold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            {language === "en" ? "Close" : "Tutup"}
          </button>
        </div>
      </div>
    </div>
  );
}
