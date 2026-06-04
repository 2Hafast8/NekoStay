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
  Star,
  Check,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { BookingStatus } from "@/components/booking/BookingStatus";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { formatDate } from "@/lib/utils/dates";
import { formatRupiah } from "@/lib/utils/format";
import { useLanguage, dictionary } from "@/hooks/useLanguage";
export default function BookingDetailPage({ params }) {
  const { id } = use(params);
  return (
    <div className="max-w-4xl w-full mx-auto">
      <BookingDetailContent id={id} />
    </div>
  );
}

function BookingDetailContent({ id }) {
  const router = useRouter();
  const { language: storeLanguage } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const language = mounted ? storeLanguage : "id";
  const t = (key) => dictionary[language]?.[key] || key;
  const [booking, setBooking] = useState(null);
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Cancel dialog states
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Review states
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [checkingReview, setCheckingReview] = useState(true);
  const [reviewSuccess, setReviewSuccess] = useState(false);

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

      // Check if user has already reviewed this stay
      const { data: existingReview } = await supabase
        .from("reviews")
        .select("id")
        .eq("booking_id", id)
        .maybeSingle();

      if (existingReview) {
        setHasReviewed(true);
      }
    } catch (err) {
      console.error("Error fetching booking details:", err);
      setErrorMsg(language === "en" ? "Failed to load booking details." : "Gagal memuat rincian pesanan.");
    } finally {
      setIsLoading(false);
      setCheckingReview(false);
    }
  }, [id, supabase, language]);

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
          title: language === "en" ? "Booking Canceled by User" : "Pesanan Dibatalkan User",
          message: language === "en"
            ? `Booking for cat ${booking.cat_name} was canceled by owner. Reason: ${cancelReason}`
            : `Booking untuk kucing ${booking.cat_name} telah dibatalkan oleh pemilik. Alasan: ${cancelReason}`,
          type: "warning",
          booking_id: id,
          is_read: false,
        }));

        await supabase.from("notifications").insert(notificationsToInsert);
      }

      setIsCancelOpen(false);
      loadBookingDetails();
    } catch (err) {
      setErrorMsg(err.message || (language === "en" ? "Failed to cancel booking." : "Gagal membatalkan pesanan. Coba lagi."));
    } finally {
      setIsCancelling(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (rating < 1 || rating > 5) return;
    setIsSubmittingReview(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: id,
          rating,
          reviewText,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || (language === "en" ? "Failed to submit review" : "Gagal mengirimkan ulasan"));
      }

      setReviewSuccess(true);
      setHasReviewed(true);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto animate-pulse mt-8">
        <div className="h-6 w-24 bg-muted dark:bg-zinc-800 rounded-md" />
        <div className="h-32 bg-card dark:bg-zinc-900 border border-border dark:border-zinc-800 rounded-3xl" />
        <div className="h-64 bg-card dark:bg-zinc-900 border border-border dark:border-zinc-800 rounded-3xl" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="text-center py-16 max-w-md mx-auto space-y-4">
        <div className="p-4 bg-rose-50 dark:bg-rose-950/20 text-rose-500 rounded-full w-fit mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-foreground dark:text-zinc-200">
          {language === "en" ? "Booking Not Found" : "Pesanan Tidak Ditemukan"}
        </h3>
        <p className="text-sm text-muted-foreground dark:text-zinc-400">
          {language === "en" 
            ? "Booking ID is not registered or you do not have permission to access it."
            : "ID pesanan tidak terdaftar atau Anda tidak memiliki hak akses."}
        </p>
        <Link
          href="/dashboard"
          className="inline-flex px-5 py-2.5 bg-primary text-primary-foreground text-xs font-bold rounded-xl"
        >
          {language === "en" ? "Back to Dashboard" : "Kembali ke Dashboard"}
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
    <div className="space-y-8 mt-4">
      {/* Back Button */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        {language === "en" ? "Back to Dashboard" : "Kembali ke Dashboard"}
      </Link>

      {/* Header Info */}
      <div className="bg-card dark:bg-zinc-900/60 border border-border dark:border-zinc-850 p-6 sm:p-8 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -z-10" />
        <div className="flex items-center gap-4">
          <div className="p-4 bg-secondary dark:bg-zinc-800 text-primary rounded-2xl">
            <Cat className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-black text-foreground dark:text-zinc-100">
                {booking.cat_name}
              </h1>
              <BookingStatus status={booking.status} />
            </div>
            <p className="text-xs text-muted-foreground dark:text-zinc-405 mt-1.5">
              ID: {booking.id}
            </p>
          </div>
        </div>

        {booking.status === "Menunggu" && (
          <button
            onClick={() => setIsCancelOpen(true)}
            className="px-5 py-3 border border-rose-200 hover:border-rose-300 dark:border-rose-950/40 bg-rose-500/5 hover:bg-rose-500/10 text-rose-600 dark:text-rose-450 text-xs font-bold rounded-2xl transition-all cursor-pointer w-fit"
          >
            {language === "en" ? "Cancel Booking" : "Batalkan Pesanan"}
          </button>
        )}
      </div>

      {errorMsg && (
        <div className="bg-rose-50 dark:bg-rose-950/20 text-rose-600 border border-rose-100 dark:border-rose-900 rounded-2xl p-4 text-xs font-semibold flex items-center gap-2 animate-pulse">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Booking details */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Review stay card if completed */}
          {booking.status === "Selesai" && !checkingReview && (
            <div className="bg-card dark:bg-zinc-900/60 border border-border dark:border-zinc-850 p-6 sm:p-8 rounded-3xl space-y-6">
              <div className="flex items-center gap-2 font-bold text-foreground dark:text-zinc-150 text-lg border-b border-border/60 dark:border-zinc-800/60 pb-3">
                <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                <span>{language === "en" ? "Rate Your Stay Experience" : "Beri Ulasan & Penilaian"}</span>
              </div>

              {reviewSuccess || hasReviewed ? (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 rounded-2xl text-center space-y-2">
                  <div className="p-2 bg-emerald-500 text-white rounded-full w-fit mx-auto">
                    <Check className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-foreground dark:text-zinc-200">
                    {language === "en" ? "Thank You!" : "Terima Kasih!"}
                  </h4>
                  <p className="text-xs text-muted-foreground dark:text-zinc-400">
                    {language === "en" 
                      ? "Your review has been saved and displayed on the homepage."
                      : "Ulasan Anda sangat berarti bagi kami dan telah berhasil dipublikasikan di halaman beranda."}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmitReview} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground dark:text-zinc-400 uppercase tracking-wider block">
                      {language === "en" ? "Rating" : "Penilaian Bintang"}
                    </label>
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          className="p-1 hover:scale-110 transition-transform cursor-pointer"
                        >
                          <Star
                            className={`w-8 h-8 transition-colors ${
                              star <= (hoverRating || rating)
                                ? "fill-amber-500 text-amber-500"
                                : "text-zinc-300 dark:text-zinc-700"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground dark:text-zinc-400 uppercase tracking-wider block">
                      {language === "en" ? "Review Details" : "Tulis Ulasan Anda"}
                    </label>
                    <textarea
                      required
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      rows={3}
                      placeholder={
                        language === "en"
                          ? "Share your experience with NekoStay, the room condition, or the staff care..."
                          : "Ceritakan pengalaman Anda bersama NekoStay, bagaimana pelayanan staf, kenyamanan kandang si mpus, dll..."
                      }
                      className="w-full px-4 py-3 bg-muted/30 dark:bg-zinc-950/30 border border-border dark:border-zinc-800 rounded-xl text-sm focus:outline-hidden focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-medium text-foreground dark:text-zinc-200"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingReview}
                    className="px-6 py-3 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/95 transition-all shadow-md shadow-primary/10 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmittingReview ? (language === "en" ? "Submitting..." : "Mengirim...") : (language === "en" ? "Submit Review" : "Kirim Ulasan")}
                  </button>
                </form>
              )}
            </div>
          )}

          <div className="bg-card dark:bg-zinc-900/60 border border-border dark:border-zinc-850 p-6 rounded-3xl space-y-6">
            <h3 className="text-sm font-extrabold text-foreground dark:text-zinc-150 border-b border-border/60 dark:border-zinc-800/60 pb-3 flex items-center gap-2">
              <FileText className="w-4.5 h-4.5 text-primary" />
              <span>{language === "en" ? "Boarding Information Details" : "Detail Informasi Penitipan"}</span>
            </h3>

            {booking.cat_photo_url && (
              <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-border/80 dark:border-zinc-800 shadow-xs mb-4">
                <img
                  src={booking.cat_photo_url}
                  alt="Kucing"
                  className="object-cover w-full h-full"
                />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6 text-sm">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-muted-foreground dark:text-zinc-400 block">
                  {language === "en" ? "Gender" : "Jenis Kelamin"}
                </span>
                <strong className="text-foreground dark:text-zinc-200">
                  {booking.cat_gender === "Jantan" ? t("book_cat_gender_m") : t("book_cat_gender_f")}
                </strong>
              </div>

              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-muted-foreground dark:text-zinc-400 block">
                  {language === "en" ? "Cat's Age" : "Usia Kucing"}
                </span>
                <strong className="text-foreground dark:text-zinc-200">{booking.cat_age}</strong>
              </div>

              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-muted-foreground dark:text-zinc-400 block">
                  {t("book_cat_health")}
                </span>
                <strong className="text-foreground dark:text-zinc-200">
                  {booking.cat_health_status === "Sehat" ? t("book_cat_health_healthy") : booking.cat_health_status === "Sakit" ? t("book_cat_health_sick") : t("book_cat_health_med")}
                </strong>
              </div>

              {booking.cat_favorite_food && (
                <div className="space-y-0.5">
                  <span className="text-xs font-semibold text-muted-foreground dark:text-zinc-400 block">
                    {t("book_cat_food")}
                  </span>
                  <strong className="text-foreground dark:text-zinc-200">
                    {booking.cat_favorite_food}
                  </strong>
                </div>
              )}

              {booking.cat_is_pregnant && (
                <div className="space-y-0.5">
                  <span className="text-xs font-semibold text-muted-foreground dark:text-zinc-400 block">
                    {language === "en" ? "Pregnancy Condition" : "Kondisi Hamil"}
                  </span>
                  <strong className="text-rose-600 dark:text-rose-450 font-bold">
                    {t("book_cat_pregnant")}
                  </strong>
                </div>
              )}

              {booking.cat_notes && (
                <div className="col-span-2 space-y-0.5">
                  <span className="text-xs font-semibold text-muted-foreground dark:text-zinc-400 block">
                    {language === "en" ? "Special Notes" : "Catatan Tambahan"}
                  </span>
                  <p className="text-xs font-medium text-foreground dark:text-zinc-300 bg-muted/40 dark:bg-zinc-950/40 p-3 rounded-xl border border-border/40 dark:border-zinc-850/40 mt-1 leading-relaxed">
                    {booking.cat_notes}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Condition Reports from Admin */}
          <div className="bg-card dark:bg-zinc-900/60 border border-border dark:border-zinc-850 p-6 rounded-3xl space-y-6">
            <h3 className="text-sm font-extrabold text-foreground dark:text-zinc-150 border-b border-border/60 dark:border-zinc-800/60 pb-3 flex items-center gap-2">
              <HeartPulse className="w-4.5 h-4.5 text-primary" />
              <span>{language === "en" ? "Cat Health Status Reports (Periodic Updates)" : "Riwayat Kondisi Kucing (Update Berkala)"}</span>
            </h3>

            {reports.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <div className="p-3 bg-secondary dark:bg-zinc-800 text-primary rounded-full w-fit mx-auto">
                  <HeartPulse className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-foreground dark:text-zinc-200">
                    {language === "en" ? "No Reports Yet" : "Belum Ada Laporan"}
                  </h4>
                  <p className="text-xs text-muted-foreground dark:text-zinc-405 max-w-xs mx-auto leading-relaxed">
                    {language === "en"
                      ? "Daily health updates and cat photos will be regularly posted here by NekoStay staff."
                      : "Laporan kesehatan dan foto harian kucing Anda akan diupdate berkala oleh admin NekoStay."}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {reports.map((report) => (
                  <div
                    key={report.id}
                    className="p-5 border border-border/80 dark:border-zinc-805 rounded-2xl space-y-4 hover:border-primary/20 transition-colors bg-muted/10"
                  >
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <span className="text-xs font-bold text-muted-foreground dark:text-zinc-400 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-primary" />
                        <span>{language === "en" ? "Report" : "Laporan"}: {formatDate(report.report_date, "long")}</span>
                      </span>
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-semibold rounded-full border ${
                          report.health_status === "Sehat"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900"
                            : report.health_status === "Kurang Fit"
                              ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900"
                              : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-450 dark:border-rose-900"
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
                      <div className="relative aspect-video max-w-md rounded-xl overflow-hidden border border-border/60 dark:border-zinc-800">
                        <img
                          src={report.photo_url}
                          alt="Foto Kucing Terkini"
                          className="object-cover w-full h-full"
                        />
                      </div>
                    )}

                    {report.notes && (
                      <p className="text-xs text-muted-foreground dark:text-zinc-400 leading-relaxed bg-card dark:bg-zinc-900/60 p-3 rounded-lg border border-border/40 dark:border-zinc-850/40">
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
          <div className="bg-card dark:bg-zinc-900/60 border border-border dark:border-zinc-850 p-6 rounded-3xl space-y-6">
            <h3 className="text-xs font-extrabold text-muted-foreground dark:text-zinc-450 uppercase tracking-wider">
              {language === "en" ? "Service Information" : "Informasi Layanan"}
            </h3>

            <div className="space-y-4 text-sm">
              <div className="flex justify-between border-b border-border/50 dark:border-zinc-800/50 pb-3">
                <span className="text-muted-foreground dark:text-zinc-400 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-primary" />
                  {language === "en" ? "Class" : "Kelas"}:
                </span>
                <span className="font-bold text-foreground dark:text-zinc-200">
                  {booking.class}
                </span>
              </div>

              <div className="flex justify-between border-b border-border/50 dark:border-zinc-800/50 pb-3">
                <span className="text-muted-foreground dark:text-zinc-400 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-primary" />
                  Check-In:
                </span>
                <span className="font-bold text-foreground dark:text-zinc-200">
                  {formatDate(booking.check_in_date)}
                </span>
              </div>

              <div className="flex justify-between border-b border-border/50 dark:border-zinc-800/50 pb-3">
                <span className="text-muted-foreground dark:text-zinc-400 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-primary" />
                  Check-Out:
                </span>
                <span className="font-bold text-foreground dark:text-zinc-200">
                  {formatDate(booking.check_out_date)}
                </span>
              </div>

              <div className="flex justify-between border-b border-border/50 dark:border-zinc-800/50 pb-3">
                <span className="text-muted-foreground dark:text-zinc-400">{language === "en" ? "Duration" : "Durasi"}:</span>
                <span className="font-bold text-foreground dark:text-zinc-200">
                  {booking.total_days} {language === "en" ? "Days" : "Hari"}
                </span>
              </div>

              <div className="flex justify-between border-b border-border/50 dark:border-zinc-800/50 pb-3">
                <span className="text-muted-foreground dark:text-zinc-400">{language === "en" ? "Rate / Day" : "Tarif / Hari"}:</span>
                <span className="font-bold text-foreground dark:text-zinc-200">
                  {formatRupiah(booking.price_per_day)}
                </span>
              </div>

              <div className="flex justify-between border-b border-border/50 dark:border-zinc-800/50 pb-3 font-extrabold text-foreground dark:text-zinc-150 text-base">
                <span>{language === "en" ? "Estimated Cost" : "Estimasi Biaya"}:</span>
                <span>{formatRupiah(booking.estimated_total)}</span>
              </div>

              {booking.discount_amount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-450 font-bold text-sm bg-emerald-500/5 p-2 rounded-lg">
                  <span>{language === "en" ? "Referral Discount" : "Diskon Referral"}:</span>
                  <span>-{formatRupiah(booking.discount_amount)}</span>
                </div>
              )}

              {booking.late_fee_total > 0 && (
                <div className="flex justify-between text-rose-600 dark:text-rose-455 font-bold text-sm bg-rose-500/5 p-2 rounded-lg">
                  <span>{language === "en" ? "Late Fee" : "Denda Terlambat"}:</span>
                  <span>+{formatRupiah(booking.late_fee_total)}</span>
                </div>
              )}

              {booking.refund_amount > 0 && (
                <div className="flex justify-between text-blue-600 dark:text-blue-450 font-bold text-sm bg-blue-500/5 p-2 rounded-lg">
                  <span>{language === "en" ? "Refund (Early)" : "Refund (Cepat)"}:</span>
                  <span>-{formatRupiah(booking.refund_amount)}</span>
                </div>
              )}

              <div className="flex justify-between pt-2 font-black text-foreground dark:text-zinc-100 text-lg">
                <span>{language === "en" ? "Final Total" : "Total Akhir"}:</span>
                <span className="text-emerald-600 dark:text-emerald-400">
                  {formatRupiah(
                    booking.estimated_total -
                      (booking.discount_amount || 0) +
                      booking.late_fee_total -
                      booking.refund_amount,
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* WhatsApp Admin Request */}
          {booking.status === "Aktif" && (
            <div className="bg-card dark:bg-zinc-900/60 border border-border dark:border-zinc-850 p-6 rounded-3xl space-y-4">
              <h3 className="text-xs font-extrabold text-muted-foreground dark:text-zinc-450 uppercase tracking-wider">
                {language === "en" ? "Schedule Change?" : "Perubahan Jadwal?"}
              </h3>
              <p className="text-xs text-muted-foreground dark:text-zinc-400 leading-relaxed">
                {language === "en"
                  ? "To extend the boarding period or upgrade/downgrade cage class, please contact our support via WhatsApp."
                  : "Untuk memperpanjang hari penitipan atau mengganti kelas kamar, silakan hubungi admin kami melalui WhatsApp."}
              </p>
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={async () => {
                  try {
                    await fetch(`/api/bookings/${booking.id}/wa-request-change`, { method: "POST" });
                  } catch (e) {
                    console.error("Gagal mengirim notif WA:", e);
                  }
                }}
                className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-2xl bg-emerald-500 text-white font-bold text-xs hover:bg-emerald-600 transition-all shadow-md shadow-emerald-500/10 cursor-pointer"
              >
                <PhoneCall className="w-4 h-4" />
                {language === "en" ? "Contact Support (WhatsApp)" : "Hubungi Admin (WhatsApp)"}
              </a>
            </div>
          )}

          {/* Cancellation Info (if canceled) */}
          {booking.status === "Dibatalkan" && (
            <div className="bg-rose-500/5 border border-rose-500/10 p-5 rounded-3xl space-y-2">
              <span className="text-xs font-bold text-rose-600 dark:text-rose-450 uppercase tracking-wider block">
                {language === "en" ? "Cancellation Notes" : "Keterangan Batal"}
              </span>
              <p className="text-xs text-muted-foreground dark:text-zinc-400 leading-relaxed">
                {booking.cancel_reason
                  ? `${language === "en" ? "User Reason" : "Alasan Pemilik"}: "${booking.cancel_reason}"`
                  : booking.reject_reason
                    ? `${language === "en" ? "Admin Reject Reason" : "Alasan Penolakan Admin"}: "${booking.reject_reason}"`
                    : (language === "en" ? "Canceled." : "Dibatalkan.")}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Cancel Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isCancelOpen}
        title={language === "en" ? "Cancel Boarding Stay?" : "Batalkan Pesanan Penitipan?"}
        description={
          language === "en"
            ? "Are you sure you want to cancel this booking? This action is permanent."
            : "Apakah Anda yakin ingin membatalkan pesanan ini? Tindakan ini tidak dapat dibatalkan."
        }
        confirmText={language === "en" ? "Yes, Cancel" : "Ya, Batalkan"}
        cancelText={language === "en" ? "Back" : "Kembali"}
        variant="danger"
        isLoading={isCancelling}
        onConfirm={handleCancelBooking}
        onCancel={() => setIsCancelOpen(false)}
      >
        <div className="mt-4 space-y-2">
          <label className="text-xs font-semibold text-muted-foreground dark:text-zinc-400 block">
            {language === "en" ? "Cancellation Reason (Required)" : "Alasan Pembatalan (Wajib)"}
          </label>
          <textarea
            required
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder={language === "en" ? "Write reason for canceling..." : "Tulis alasan pembatalan..."}
            rows={3}
            className="w-full px-3 py-2 bg-muted/40 dark:bg-zinc-950/20 border border-border dark:border-zinc-800 rounded-xl text-xs focus:outline-hidden text-foreground dark:text-zinc-200"
          />
        </div>
      </ConfirmDialog>
    </div>
  );
}
