"use client";

import React from "react";
import { Check, X } from "lucide-react";

export function AdminBookingsBulkBar({
  selectedIds,
  onClearSelection,
  onApprove,
  onOpenRejectModal,
  isBulkLoading,
}) {
  if (!selectedIds || selectedIds.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-card/95 backdrop-blur-md border border-border shadow-2xl p-4 sm:p-5 rounded-3xl flex items-center gap-4 w-[92%] max-w-xl animate-in slide-in-from-bottom-8 duration-300">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-black text-foreground">
            {selectedIds.length} Pesanan Terpilih
          </span>
          <button
            onClick={onClearSelection}
            className="text-[11px] text-muted-foreground hover:text-foreground underline cursor-pointer"
          >
            Batalkan
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground font-semibold">
          Terapkan aksi serentak untuk pesanan yang menunggu konfirmasi.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onApprove}
          disabled={isBulkLoading}
          className="px-3.5 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:bg-primary/95 transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50 shadow-2xs"
        >
          <Check className="w-3.5 h-3.5" />
          <span>Setujui</span>
        </button>
        <button
          onClick={onOpenRejectModal}
          disabled={isBulkLoading}
          className="px-3.5 py-2 border border-rose-200 dark:border-rose-900/60 hover:border-rose-300 text-rose-600 bg-rose-500/5 hover:bg-rose-500/10 text-xs font-bold rounded-xl transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
        >
          <X className="w-3.5 h-3.5" />
          <span>Tolak</span>
        </button>
      </div>
    </div>
  );
}

