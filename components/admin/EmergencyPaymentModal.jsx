"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, ArrowRight, Check, X, ShieldAlert, Loader2 } from "lucide-react";
import { formatRupiah } from "@/lib/utils/format";

const statusConfig = {
  Unpaid: {
    label: "Belum Dibayar",
    className: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  },
  Paid: {
    label: "Lunas",
    className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  },
  Failed: {
    label: "Gagal",
    className: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20",
  },
  Refunded: {
    label: "Dikembalikan",
    className: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  },
};

export function EmergencyPaymentModal({
  isOpen,
  onClose,
  onConfirm,
  booking,
  targetStatus,
  isSubmitting = false,
}) {
  const [reason, setReason] = useState("");
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (isOpen) {
      setReason("");
      setIsConfirmed(false);
      setErrorMsg("");
    }
  }, [isOpen]);

  if (!isOpen || !booking || !targetStatus) return null;

  const currentStatusInfo = statusConfig[booking.payment_status] || statusConfig.Unpaid;
  const targetStatusInfo = statusConfig[targetStatus] || statusConfig.Unpaid;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (reason.trim().length < 5) {
      setErrorMsg("Alasan verifikasi wajib diisi minimal 5 karakter sebagai catatan audit resmi.");
      return;
    }
    if (!isConfirmed) {
      setErrorMsg("Harap centang konfirmasi tanggung jawab verifikasi sebelum melanjutkan.");
      return;
    }
    setErrorMsg("");
    onConfirm(reason.trim());
  };

  const isFormValid = reason.trim().length >= 5 && isConfirmed;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-xs transition-opacity"
        onClick={isSubmitting ? undefined : onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg transform overflow-hidden rounded-2xl bg-card border border-border p-6 shadow-2xl transition-all animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-all disabled:opacity-30 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-3.5 mb-4">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">
              Ubah Status Pembayaran Manual
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Prosedur darurat untuk rekonsiliasi manual di luar gateway Midtrans.
            </p>
          </div>
        </div>

        {/* Warning Alert Banner */}
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5 mb-4">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
          <div className="leading-relaxed">
            <span className="font-bold">Perhatian:</span> Tindakan ini mengubah status keuangan secara manual. Alasan yang Anda masukkan akan tercatat permanen di catatan internal pesanan sebagai jejak audit.
          </div>
        </div>

        {/* Booking Details Card */}
        <div className="p-3.5 rounded-xl bg-muted/50 border border-border mb-4 space-y-2.5 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Kucing & Pesanan:</span>
            <span className="font-bold text-foreground">
              {booking.cat_name} <span className="font-mono text-[11px] text-muted-foreground">({booking.id.substring(0, 8)}...)</span>
            </span>
          </div>

          {booking.estimated_total && (
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total Tagihan:</span>
              <span className="font-mono font-bold text-foreground">
                {formatRupiah(booking.estimated_total)}
              </span>
            </div>
          )}

          <div className="flex justify-between items-center pt-2 border-t border-border/60">
            <span className="text-muted-foreground">Perubahan Status:</span>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 text-[11px] font-bold rounded-md border ${currentStatusInfo.className}`}>
                {currentStatusInfo.label}
              </span>
              <ArrowRight className="w-3 h-3 text-muted-foreground" />
              <span className={`px-2 py-0.5 text-[11px] font-bold rounded-md border ${targetStatusInfo.className}`}>
                {targetStatusInfo.label}
              </span>
            </div>
          </div>
        </div>

        {/* Form Input */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-bold text-foreground">
                Alasan Perubahan & Catatan Verifikasi <span className="text-rose-500">*</span>
              </label>
              <span className={`text-[11px] font-mono ${reason.trim().length < 5 ? "text-amber-500" : "text-muted-foreground"}`}>
                {reason.trim().length} / 500
              </span>
            </div>
            <textarea
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (errorMsg) setErrorMsg("");
              }}
              disabled={isSubmitting}
              rows={3}
              placeholder="Contoh: Pembayaran transfer BCA manual telah diverifikasi ke mutasi rekening pemilik klinik atas kendala jaringan / cash di kasir."
              className="w-full text-xs rounded-xl border border-border bg-background p-2.5 text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
              maxLength={500}
            />
            {errorMsg && (
              <p className="text-[11px] text-rose-500 mt-1 font-medium">{errorMsg}</p>
            )}
          </div>

          <label className="flex items-start gap-2.5 cursor-pointer text-xs select-none">
            <input
              type="checkbox"
              checked={isConfirmed}
              onChange={(e) => {
                setIsConfirmed(e.target.checked);
                if (errorMsg) setErrorMsg("");
              }}
              disabled={isSubmitting}
              className="mt-0.5 rounded border-border text-primary focus:ring-primary cursor-pointer w-4 h-4"
            />
            <span className="text-muted-foreground leading-snug">
              Saya telah memeriksa bukti transaksi dan bertanggung jawab penuh atas perubahan status manual ini.
            </span>
          </label>

          {/* Footer Actions */}
          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-border bg-card text-foreground hover:bg-muted transition-all cursor-pointer disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-primary text-primary-foreground hover:bg-primary/95 transition-all shadow-sm shadow-primary/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Konfirmasi & Simpan</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

