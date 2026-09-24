"use client";

import { useState } from "react";
import { Wallet, ChevronDown, Check } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { EmergencyPaymentModal } from "@/components/admin/EmergencyPaymentModal";

export function AdminBookingPaymentBadge({ booking, onUpdated }) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState(null);

  const statusConfig = {
    Paid: {
      label: "Lunas",
      className:
        "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60",
    },
    Unpaid: {
      label: "Belum Dibayar",
      className:
        "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60",
    },
    Failed: {
      label: "Gagal",
      className:
        "bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60",
    },
    Refunded: {
      label: "Dikembalikan",
      className:
        "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800/60",
    },
  };

  const current = statusConfig[booking.payment_status] || statusConfig.Unpaid;

  const handleOpenEmergencyModal = (newStatus) => {
    if (newStatus === booking.payment_status || isUpdating) return;
    setTargetStatus(newStatus);
    setIsEmergencyModalOpen(true);
  };

  const handleConfirmUpdate = async (reason) => {
    if (!targetStatus || targetStatus === booking.payment_status || isUpdating) return;
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/bookings/${booking.id}/payment-status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentStatus: targetStatus,
          reason,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal mengubah status pembayaran");
      }
      toast.success("Status pembayaran berhasil diperbarui");
      setIsEmergencyModalOpen(false);
      setTargetStatus(null);
      if (onUpdated) onUpdated();
    } catch (err) {
      toast.error(
        err.message || "Terjadi kesalahan saat memperbarui status pembayaran"
      );
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          disabled={isUpdating}
          className="focus:outline-hidden cursor-pointer disabled:opacity-60"
          title="Klik untuk ubah status pembayaran"
        >
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full border transition-all hover:opacity-90 shadow-2xs ${current.className}`}
          >
            <Wallet className="w-3 h-3" />
            <span>{current.label}</span>
            <ChevronDown className="w-3 h-3 opacity-60 ml-0.5" />
          </span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-44 p-1.5">
          <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
            Ubah Status Bayar
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {[
            { value: "Paid", label: "Lunas" },
            { value: "Unpaid", label: "Belum Dibayar" },
            { value: "Failed", label: "Gagal" },
            { value: "Refunded", label: "Dikembalikan" },
          ].map((opt) => (
            <DropdownMenuItem
              key={opt.value}
              onClick={() => handleOpenEmergencyModal(opt.value)}
              className={`text-xs font-semibold cursor-pointer ${
                booking.payment_status === opt.value
                  ? "text-primary dark:text-primary font-bold bg-primary/5"
                  : ""
              }`}
            >
              {booking.payment_status === opt.value ? (
                <Check className="w-3.5 h-3.5 mr-1.5 text-primary shrink-0" />
              ) : (
                <span className="w-3.5 h-3.5 mr-1.5 shrink-0" />
              )}
              {opt.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <EmergencyPaymentModal
        isOpen={isEmergencyModalOpen}
        onClose={() => {
          setIsEmergencyModalOpen(false);
          setTargetStatus(null);
        }}
        onConfirm={handleConfirmUpdate}
        booking={booking}
        targetStatus={targetStatus}
        isSubmitting={isUpdating}
      />
    </>
  );
}

export { AdminBookingPaymentBadge as PaymentStatusDropdown };

