import Link from "next/link";
import { Calendar, Cat, Layers, DollarSign, AlertTriangle, TrendingDown } from "lucide-react";
import { BookingStatus } from "./BookingStatus";
import { formatDate } from "@/lib/utils/dates";
import { formatRupiah } from "@/lib/utils/format";

export function BookingCard({ booking, isAdmin = false }) {
  const detailHref = isAdmin
    ? `/admin/bookings/${booking.id}`
    : `/booking/${booking.id}`;

  return (
    <div className="relative group overflow-hidden bg-card text-card-foreground border border-border/80 hover:border-primary/40 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between">
      {/* Background soft gradient ornament */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -z-10 group-hover:scale-110 transition-transform duration-500" />

      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-secondary rounded-2xl text-primary">
              <Cat className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg group-hover:text-primary transition-colors">
                {booking.cat_name}
              </h3>
              <p className="text-xs text-muted-foreground">
                {booking.cat_gender} • {booking.cat_age}
              </p>
            </div>
          </div>
          <BookingStatus status={booking.status} />
        </div>

        {isAdmin && booking.profiles && (
          <div className="mb-4 text-xs bg-muted/50 p-2.5 rounded-lg border border-border/40">
            <span className="text-muted-foreground block">Pemilik:</span>
            <span className="font-semibold">
              {booking.profiles.full_name}
            </span>{" "}
            {booking.profiles.phone && `(${booking.profiles.phone})`}
          </div>
        )}

        <div className="space-y-3.5 text-sm text-muted-foreground my-4">
          <div className="flex items-center gap-2.5">
            <Layers className="w-4 h-4 text-primary/70" />
            <span>
              Kelas <strong className="text-foreground">{booking.class}</strong>{" "}
              ({formatRupiah(booking.price_per_day)}/hari)
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <Calendar className="w-4 h-4 text-primary/70" />
            <span>
              {formatDate(booking.check_in_date)} -{" "}
              {formatDate(booking.check_out_date)}
              <span className="text-xs ml-1 bg-muted px-2 py-0.5 rounded-full font-medium text-foreground">
                {booking.total_days} Hari
              </span>
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <DollarSign className="w-4 h-4 text-emerald-500" />
            <span className="font-semibold text-foreground">
              Estimasi: {formatRupiah(booking.estimated_total)}
            </span>
          </div>

          {booking.late_fee_total > 0 && (
            <div className="flex items-center gap-2.5 text-rose-600 font-medium">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>
                Denda Terlambat: +{formatRupiah(booking.late_fee_total)}
              </span>
            </div>
          )}

          {booking.refund_amount > 0 && (
            <div className="flex items-center gap-2.5 text-blue-600 font-medium">
              <TrendingDown className="w-4 h-4 text-blue-500 shrink-0" />
              <span>
                Refund Pengambilan Cepat: -{formatRupiah(booking.refund_amount)}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 bg-muted/40 border-t border-border/50 flex items-center justify-end">
        <Link
          href={detailHref}
          className="w-full text-center py-2 px-4 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-[1.01] active:scale-100 shadow-sm hover:shadow transition-all"
        >
          Lihat Detail
        </Link>
      </div>
    </div>
  );
}
