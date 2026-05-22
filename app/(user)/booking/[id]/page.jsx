"use client";

import { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Cat,
  Calendar,
  Layers,
  ArrowLeft,
  PhoneCall,
  AlertCircle,
  HeartPulse,
  FileText,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { BookingStatus } from "@/components/booking/BookingStatus";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { formatDate } from "@/lib/utils/dates";
import { formatRupiah } from "@/lib/utils/format";

export default function BookingDetailPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const [booking, setBooking] = useState(null);
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  // Cancel dialog states
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const supabase = createClient();

  const loadBookingDetails = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select(
          `
          *,
          profiles (full_name, phone)
        `,
        )
        .eq("id", id)
        .single();

      if (error) throw error;
      setBooking(data);

      // Fetch condition reports for this booking
      const { data: reportsData } = await supabase
        .from("cat_reports")
        .select("*")
        .eq("booking_id", id)
        .order("report_date", { ascending: false });

      if (reportsData) {
        setReports(reportsData);
      }
    } catch (err) {
      console.error("Error fetching booking details:", err);
      setErrorMsg("Gagal memuat rincian pesanan.");
    } finally {
      setIsLoading(false);
    }
  }, [id, supabase]);

  useEffect(() => {
    loadBookingDetails();
  }, [loadBookingDetails]);

  const handleCancelBooking = async () => {
    if (!cancelReason.trim()) return;
    setIsCancelling(true);
    setErrorMsg(null);

    try {
      // Update booking status to Dibatalkan and store cancel reason
      const { error } = await supabase
        .from("bookings")
        .update({
          status: "Dibatalkan",
          cancel_reason: cancelReason,
        })
        .eq("id", id);

      if (error) throw error;

      // Notify admin about the cancellation
      const { data: admins } = await supabase
        .from("profiles")
        .select("id")
        .eq("role", "admin");

      if (admins && booking) {
        const notificationsToInsert = admins.map((admin) => ({
          user_id: admin.id,
          title: "Pesanan Dibatalkan User",
          message: `Booking untuk kucing ${booking.cat_name} telah dibatalkan oleh pemilik. Alasan: ${cancelReason}`,
          type: "warning",
          booking_id: id,
          is_read: false,
        }));

        await supabase.from("notifications").insert(notificationsToInsert);
      }

      setIsCancelOpen(false);
      loadBookingDetails();
    } catch (err) {
      setErrorMsg(err.message || "Gagal membatalkan pesanan. Coba lagi.");
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto animate-pulse">
        <div className="h-6 w-24 bg-muted rounded-md" />
        <div className="h-32 bg-card border border-border rounded-3xl" />
        <div className="h-64 bg-card border border-border rounded-3xl" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="text-center py-16 max-w-md mx-auto space-y-4">
        <div className="p-4 bg-rose-50 text-rose-500 rounded-full w-fit mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-foreground">
          Pesanan Tidak Ditemukan
        </h3>
        <p className="text-sm text-muted-foreground">
          ID pesanan tidak terdaftar atau Anda tidak memiliki hak akses.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex px-5 py-2.5 bg-primary text-primary-foreground text-xs font-bold rounded-xl"
        >
          Kembali ke Dashboard
        </Link>
      </div>
    );
  }

  // Pre-fill WhatsApp message link for admin change requests
  const waNumber = process.env.NEXT_PUBLIC_ADMIN_WHATSAPP || "628123456789";
  const waMessage = encodeURIComponent(
    `Halo Admin NekoStay, saya ingin mengajukan perubahan jadwal/kelas untuk kucing saya yang bernama ${booking.cat_name} (ID Booking: ${booking.id})`,
  );
  const waUrl = `https://wa.me/${waNumber}?text=${waMessage}`;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Back Button */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Kembali ke Dashboard
      </Link>

      {/* Header Info */}
      <div className="bg-card border border-border p-6 sm:p-8 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -z-10" />
        <div className="flex items-center gap-4">
          <div className="p-4 bg-secondary text-primary rounded-2xl">
            <Cat className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-black text-foreground">
                {booking.cat_name}
              </h1>
              <BookingStatus status={booking.status} />
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">
              ID Pesanan: {booking.id}
            </p>
          </div>
        </div>

        {booking.status === "Menunggu" && (
          <button
            onClick={() => setIsCancelOpen(true)}
            className="px-5 py-3 border border-rose-200 hover:border-rose-300 bg-rose-500/5 hover:bg-rose-500/10 text-rose-600 text-xs font-bold rounded-2xl transition-all cursor-pointer w-fit"
          >
            Batalkan Pesanan
          </button>
        )}
      </div>

      {errorMsg && (
        <div className="bg-rose-50 dark:bg-rose-950/20 text-rose-600 border border-rose-100 rounded-2xl p-4 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Booking details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border border-border p-6 rounded-3xl space-y-6">
            <h3 className="text-sm font-extrabold text-foreground border-b border-border/60 pb-3 flex items-center gap-2">
              <FileText className="w-4.5 h-4.5 text-primary" />
              <span>Detail Informasi Penitipan</span>
            </h3>

            {booking.cat_photo_url && (
              <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-border/80 shadow-xs mb-4">
                <img
                  src={booking.cat_photo_url}
                  alt="Kucing"
                  className="object-cover w-full h-full"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-x-4 gap-y-6 text-sm">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-muted-foreground block">
                  Jenis Kelamin
                </span>
                <strong className="text-foreground">
                  {booking.cat_gender}
                </strong>
              </div>

              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-muted-foreground block">
                  Usia Kucing
                </span>
                <strong className="text-foreground">{booking.cat_age}</strong>
              </div>

              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-muted-foreground block">
                  Kondisi Kesehatan
                </span>
                <strong className="text-foreground">
                  {booking.cat_health_status}
                </strong>
              </div>

              {booking.cat_favorite_food && (
                <div className="space-y-0.5">
                  <span className="text-xs font-semibold text-muted-foreground block">
                    Makanan Terfavorit
                  </span>
                  <strong className="text-foreground">
                    {booking.cat_favorite_food}
                  </strong>
                </div>
              )}

              {booking.cat_is_pregnant && (
                <div className="space-y-0.5">
                  <span className="text-xs font-semibold text-muted-foreground block">
                    Kondisi Hamil
                  </span>
                  <strong className="text-rose-600 font-bold">
                    Sedang Hamil
                  </strong>
                </div>
              )}

              {booking.cat_notes && (
                <div className="col-span-2 space-y-0.5">
                  <span className="text-xs font-semibold text-muted-foreground block">
                    Catatan Tambahan
                  </span>
                  <p className="text-xs font-medium text-foreground bg-muted/40 p-3 rounded-xl border border-border/40 mt-1 leading-relaxed">
                    {booking.cat_notes}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Condition Reports from Admin */}
          <div className="bg-card border border-border p-6 rounded-3xl space-y-6">
            <h3 className="text-sm font-extrabold text-foreground border-b border-border/60 pb-3 flex items-center gap-2">
              <HeartPulse className="w-4.5 h-4.5 text-primary" />
              <span>Riwayat Kondisi Kucing (Update Berkala)</span>
            </h3>

            {reports.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <div className="p-3 bg-secondary text-primary rounded-full w-fit mx-auto">
                  <HeartPulse className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-foreground">
                    Belum Ada Laporan
                  </h4>
                  <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
                    Laporan kesehatan dan foto harian kucing Anda akan diupdate
                    berkala oleh admin NekoStay.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {reports.map((report) => (
                  <div
                    key={report.id}
                    className="p-5 border border-border/80 rounded-2xl space-y-4 hover:border-primary/20 transition-colors bg-muted/10"
                  >
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-primary" />
                        <span>Laporan: {formatDate(report.report_date, "long")}</span>
                      </span>
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-semibold rounded-full border ${
                          report.health_status === "Sehat"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : report.health_status === "Kurang Fit"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-rose-50 text-rose-700 border-rose-200"
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${
                          report.health_status === "Sehat"
                            ? "bg-emerald-500"
                            : report.health_status === "Kurang Fit"
                              ? "bg-amber-500"
                              : "bg-rose-500"
                        }`} />
                        {report.health_status}
                      </span>
                    </div>

                    {report.photo_url && (
                      <div className="relative aspect-video max-w-md rounded-xl overflow-hidden border border-border/60">
                        <img
                          src={report.photo_url}
                          alt="Foto Kucing Terkini"
                          className="object-cover w-full h-full"
                        />
                      </div>
                    )}

                    {report.notes && (
                      <p className="text-xs text-muted-foreground leading-relaxed bg-card p-3 rounded-lg border border-border/40">
                        {report.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Price Details & Booking Meta */}
        <div className="space-y-6">
          {/* Booking Info Box */}
          <div className="bg-card border border-border p-6 rounded-3xl space-y-6">
            <h3 className="text-xs font-extrabold text-muted-foreground uppercase tracking-wider">
              Informasi Layanan
            </h3>

            <div className="space-y-4 text-sm">
              <div className="flex justify-between border-b border-border/50 pb-3">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-primary" />
                  Kelas:
                </span>
                <span className="font-bold text-foreground">
                  {booking.class}
                </span>
              </div>

              <div className="flex justify-between border-b border-border/50 pb-3">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-primary" />
                  Check-In:
                </span>
                <span className="font-bold text-foreground">
                  {formatDate(booking.check_in_date)}
                </span>
              </div>

              <div className="flex justify-between border-b border-border/50 pb-3">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-primary" />
                  Check-Out:
                </span>
                <span className="font-bold text-foreground">
                  {formatDate(booking.check_out_date)}
                </span>
              </div>

              <div className="flex justify-between border-b border-border/50 pb-3">
                <span className="text-muted-foreground">Durasi:</span>
                <span className="font-bold text-foreground">
                  {booking.total_days} Hari
                </span>
              </div>

              <div className="flex justify-between border-b border-border/50 pb-3">
                <span className="text-muted-foreground">Tarif / Hari:</span>
                <span className="font-bold text-foreground">
                  {formatRupiah(booking.price_per_day)}
                </span>
              </div>

              <div className="flex justify-between border-b border-border/50 pb-3 font-extrabold text-foreground text-base">
                <span>Estimasi Biaya:</span>
                <span>{formatRupiah(booking.estimated_total)}</span>
              </div>

              {booking.late_fee_total > 0 && (
                <div className="flex justify-between text-rose-600 font-bold text-sm bg-rose-500/5 p-2 rounded-lg">
                  <span>Denda Terlambat:</span>
                  <span>+{formatRupiah(booking.late_fee_total)}</span>
                </div>
              )}

              {booking.refund_amount > 0 && (
                <div className="flex justify-between text-blue-600 font-bold text-sm bg-blue-500/5 p-2 rounded-lg">
                  <span>Refund (Cepat):</span>
                  <span>-{formatRupiah(booking.refund_amount)}</span>
                </div>
              )}

              <div className="flex justify-between pt-2 font-black text-foreground text-lg">
                <span>Total Akhir:</span>
                <span className="text-emerald-600">
                  {formatRupiah(
                    booking.estimated_total +
                      booking.late_fee_total -
                      booking.refund_amount,
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* WhatsApp Admin Request */}
          {booking.status === "Aktif" && (
            <div className="bg-card border border-border p-6 rounded-3xl space-y-4">
              <h3 className="text-xs font-extrabold text-muted-foreground uppercase tracking-wider">
                Perubahan Jadwal?
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Untuk memperpanjang hari penitipan atau mengganti kelas kamar,
                silakan hubungi admin kami melalui WhatsApp.
              </p>
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-2xl bg-emerald-500 text-white font-bold text-xs hover:bg-emerald-600 transition-all shadow-md shadow-emerald-500/10 cursor-pointer"
              >
                <PhoneCall className="w-4 h-4" />
                Hubungi Admin (WhatsApp)
              </a>
            </div>
          )}

          {/* Cancellation Info (if canceled) */}
          {booking.status === "Dibatalkan" && (
            <div className="bg-rose-500/5 border border-rose-500/10 p-5 rounded-3xl space-y-2">
              <span className="text-xs font-bold text-rose-600 uppercase tracking-wider block">
                Keterangan Batal
              </span>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {booking.cancel_reason
                  ? `Alasan Pemilik: "${booking.cancel_reason}"`
                  : booking.reject_reason
                    ? `Alasan Penolakan Admin: "${booking.reject_reason}"`
                    : "Dibatalkan."}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Cancel Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isCancelOpen}
        title="Batalkan Pesanan Penitipan?"
        description="Apakah Anda yakin ingin membatalkan pesanan ini? Tindakan ini tidak dapat dibatalkan."
        confirmText="Ya, Batalkan"
        cancelText="Kembali"
        variant="danger"
        isLoading={isCancelling}
        onConfirm={handleCancelBooking}
        onCancel={() => setIsCancelOpen(false)}
      >
        <div className="mt-4 space-y-2">
          <label className="text-xs font-semibold text-muted-foreground block">
            Alasan Pembatalan (Wajib)
          </label>
          <textarea
            required
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Tulis alasan pembatalan..."
            rows={3}
            className="w-full px-3 py-2 bg-muted/40 border border-border rounded-xl text-xs focus:outline-hidden"
          />
        </div>
      </ConfirmDialog>
    </div>
  );
}
