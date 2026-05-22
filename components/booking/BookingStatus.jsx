import { cn } from "@/lib/utils/cn";

const statusConfig = {
  Menunggu: {
    label: "⏳ Menunggu",
    bg: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
  },
  Aktif: {
    label: "✅ Aktif",
    bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
  },
  Selesai: {
    label: "🏁 Selesai",
    bg: "bg-blue-50 text-blue-700 border-blue-200",
    dot: "bg-blue-500",
  },
  Dibatalkan: {
    label: "❌ Dibatalkan",
    bg: "bg-rose-50 text-rose-700 border-rose-200",
    dot: "bg-rose-500",
  },
};

export function BookingStatus({ status, className }) {
  const config = statusConfig[status] || {
    label: status,
    bg: "bg-slate-50 text-slate-700 border-slate-200",
    dot: "bg-slate-500",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border shadow-sm transition-all duration-300",
        config.bg,
        className,
      )}
    >
      <span
        className={cn("w-1.5 h-1.5 rounded-full animate-pulse", config.dot)}
      />
      {config.label}
    </span>
  );
}
