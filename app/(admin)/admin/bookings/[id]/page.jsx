"use client";

import { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Cat,
  Calendar,
  Layers,
  ArrowLeft,
  Send,
  PhoneCall,
  AlertCircle,
  CheckCircle2,
  HeartPulse,
  FileText,
  Plus,
  Edit3,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { BookingStatus } from "@/components/booking/BookingStatus";
import { ImageUpload } from "@/components/shared/ImageUpload";
import { formatDate } from "@/lib/utils/dates";
import { formatRupiah } from "@/lib/utils/format";

export default function AdminBookingDetailPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const [booking, setBooking] = useState(null);
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  // Report Form States
  const [healthStatus, setHealthStatus] = useState("Sehat");
  const [reportPhoto, setReportPhoto] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(null);

  // Edit Form States
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editClass, setEditClass] = useState("");
  const [editCheckIn, setEditCheckIn] = useState("");
  const [editCheckOut, setEditCheckOut] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Admin Notes States
  const [adminNotes, setAdminNotes] = useState("");
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [notesSaveMsg, setNotesSaveMsg] = useState(null);

  const supabase = createClient();

  const loadBookingDetails = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select(
          `
          *,
          profiles (id, full_name, phone)
        `,
        )
        .eq("id", id)
        .single();

      if (error) throw error;
      setBooking(data);
      setEditClass(data.class);
      setEditCheckIn(data.check_in_date);
      setEditCheckOut(data.check_out_date);
      setAdminNotes(data.admin_notes || "");

      // Fetch reports
      const { data: reportsData } = await supabase
        .from("cat_reports")
        .select("*")
        .eq("booking_id", id)
        .order("report_date", { ascending: false });

      if (reportsData) {
        setReports(reportsData);
      }
    } catch (err) {
      console.error("Error fetching admin booking details:", err);
      setErrorMsg("Gagal memuat detail pesanan.");
    } finally {
      setIsLoading(false);
    }
  }, [id, supabase]);

  useEffect(() => {
    loadBookingDetails();
  }, [loadBookingDetails]);

  // Handle report submission
  const handleAddReport = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setReportSuccess(null);
    setIsSubmittingReport(true);

    try {
      const response = await fetch(`/api/bookings/${id}/report`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          healthStatus,
          photoUrl: reportPhoto || null,
          notes: notes || null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Gagal menyimpan laporan harian.");
      }

      setReportSuccess(
        "Laporan kondisi kucing berhasil ditambahkan dan pemilik telah dinotifikasi!",
      );
      // Reset form
      setNotes("");
      setReportPhoto("");
      loadBookingDetails();
    } catch (err) {
      setErrorMsg(err.message || "Gagal menyimpan laporan harian.");
    } finally {
      setIsSubmittingReport(false);
    }
  };

  // Handle edit submission
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSavingEdit(true);

    try {
      const response = await fetch(`/api/bookings/${id}/edit`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          className: editClass,
          checkInDate: editCheckIn,
          checkOutDate: editCheckOut,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      setIsEditOpen(false);
      loadBookingDetails();
      
    } catch (err) {
      setErrorMsg(err.message || "Gagal menyimpan perubahan pesanan.");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleSaveAdminNotes = async () => {
    setIsSavingNotes(true);
    setNotesSaveMsg(null);
    try {
      const { error } = await supabase
        .from("bookings")
        .update({ admin_notes: adminNotes })
        .eq("id", id);

      if (error) throw error;
      setNotesSaveMsg("Catatan admin berhasil disimpan!");
      setTimeout(() => setNotesSaveMsg(null), 3000);
    } catch (err) {
      console.error("Error saving admin notes:", err);
      setErrorMsg("Gagal menyimpan catatan admin.");
    } finally {
      setIsSavingNotes(false);
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
          ID pesanan tidak terdaftar atau tidak valid.
        </p>
        <Link
          href="/admin/bookings"
          className="inline-flex px-5 py-2.5 bg-primary text-primary-foreground text-xs font-bold rounded-xl"
        >
          Kembali ke Semua Pesanan
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Back Button */}
      <Link
        href="/admin/bookings"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Kembali ke Semua Pesanan
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

        {(booking.status === "Menunggu" || booking.status === "Aktif") && (
          <button
            onClick={() => setIsEditOpen(true)}
            className="px-5 py-2.5 bg-primary/10 text-primary hover:bg-primary/20 transition-colors rounded-xl text-sm font-bold flex items-center gap-2 cursor-pointer shrink-0"
          >
            <Edit3 className="w-4 h-4" />
            Edit Pesanan
          </button>
        )}
      </div>
      {errorMsg && (
        <div className="bg-rose-50 dark:bg-rose-950/20 text-rose-600 border border-rose-100 rounded-2xl p-4 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {reportSuccess && (
        <div className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 border border-emerald-100 rounded-2xl p-4 text-xs font-semibold leading-relaxed flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{reportSuccess}</span>
        </div>
      )}

      {/* Content Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Booking & Owner info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Booking & Owner Cards */}
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
                  Pemilik (Owner)
                </span>
                <strong className="text-foreground">
                  {booking.profiles?.full_name}
                </strong>
              </div>

              {booking.profiles?.phone && (
                <div className="space-y-0.5">
                  <span className="text-xs font-semibold text-muted-foreground block">
                    WhatsApp Pemilik
                  </span>
                  <a
                    href={`https://wa.me/${booking.profiles.phone.replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline font-bold"
                  >
                    <PhoneCall className="w-4 h-4" />
                    {booking.profiles.phone}
                  </a>
                </div>
              )}

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
                  Kondisi Kesehatan Awal
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
                    Catatan Tambahan Pemilik
                  </span>
                  <p className="text-xs font-medium text-foreground bg-muted/40 p-3 rounded-xl border border-border/40 mt-1 leading-relaxed">
                    {booking.cat_notes}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Condition Report Form (Only if stay is active) */}
          {booking.status === "Aktif" && (
            <div className="bg-card border border-border p-6 rounded-3xl space-y-6">
              <h3 className="text-sm font-extrabold text-foreground border-b border-border/60 pb-3 flex items-center gap-2">
                <Plus className="w-4.5 h-4.5 text-primary" />
                <span>Tambah Laporan Harian Kucing</span>
              </h3>

              <form onSubmit={handleAddReport} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                    Status Kesehatan Saat Ini
                  </label>
                  <select
                    value={healthStatus}
                    onChange={(e) => setHealthStatus(e.target.value)}
                    className="w-full px-4 py-3 bg-muted/30 border border-border rounded-xl text-sm focus:outline-hidden text-foreground font-medium"
                  >
                    <option value="Sehat">Sehat</option>
                    <option value="Kurang Fit">Kurang Fit</option>
                    <option value="Perlu Perhatian">Perlu Perhatian Khusus</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                    Catatan Aktivitas / Kondisi
                  </label>
                  <textarea
                    required
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder="Contoh: Nafsu makan baik, aktif bermain. Sudah diberi obat cacing..."
                    className="w-full px-4 py-3 bg-muted/30 border border-border rounded-xl text-sm focus:outline-hidden text-foreground font-medium"
                  />
                </div>

                <ImageUpload
                  onUpload={(url) => setReportPhoto(url)}
                  defaultValue={reportPhoto}
                  label="Foto Kucing Hari Ini (Opsional)"
                />

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={isSubmittingReport}
                    className="px-6 py-3 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/95 transition-all shadow-md shadow-primary/10 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmittingReport
                      ? "Menyimpan..."
                      : "Kirim Laporan Harian"}
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Past Reports List */}
          <div className="bg-card border border-border p-6 rounded-3xl space-y-6">
            <h3 className="text-sm font-extrabold text-foreground border-b border-border/60 pb-3 flex items-center gap-2">
              <HeartPulse className="w-4.5 h-4.5 text-primary" />
              <span>Riwayat Kondisi Kucing</span>
            </h3>

            {reports.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">
                Belum ada laporan kondisi harian yang dibuat.
              </p>
            ) : (
              <div className="space-y-6">
                {reports.map((report) => (
                  <div
                    key={report.id}
                    className="p-5 border border-border/80 rounded-2xl space-y-4 bg-muted/10"
                  >
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-primary" />
                        <span>Laporan Tanggal: {formatDate(report.report_date, "long")}</span>
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
                          alt="Foto Kucing"
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

        {/* Right Side: Pricing / Room Info */}
        <div className="space-y-6">
          <div className="bg-card border border-border p-6 rounded-3xl space-y-6">
            <h3 className="text-xs font-extrabold text-muted-foreground uppercase tracking-wider">
              Informasi Layanan
            </h3>

            <div className="space-y-4 text-sm">
              <div className="flex justify-between border-b border-border/50 pb-3">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-primary" />
                  Kelas Room:
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
                  <span>Refund Ambil Cepat:</span>
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

          {/* Admin Notes Card */}
          <div className="bg-card border border-border p-6 rounded-3xl space-y-4">
            <h3 className="text-xs font-extrabold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-primary" />
              <span>Catatan Khusus Admin</span>
            </h3>
            
            {notesSaveMsg && (
              <div className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 border border-emerald-100 rounded-xl p-2.5 text-[11px] font-semibold text-center">
                {notesSaveMsg}
              </div>
            )}
            
            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Tulis catatan admin internal (misalnya kebiasaan mpus, dll)..."
              rows={4}
              className="w-full px-3 py-2.5 bg-muted/40 border border-border rounded-xl text-xs focus:outline-hidden focus:border-primary/50 text-foreground font-medium resize-none leading-relaxed"
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSaveAdminNotes}
                disabled={isSavingNotes}
                className="px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:bg-primary/95 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isSavingNotes ? "Menyimpan..." : "Simpan Catatan"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-xs"
            onClick={() => setIsEditOpen(false)}
          />
          <div className="relative w-full max-w-md bg-card border border-border p-6 sm:p-8 rounded-3xl shadow-xl space-y-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-border/60 pb-4">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-primary" />
                <span>Edit Data Pesanan</span>
              </h3>
              <button
                onClick={() => setIsEditOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase block">
                  Kelas Room
                </label>
                <select
                  value={editClass}
                  onChange={(e) => setEditClass(e.target.value)}
                  className="w-full px-4 py-3 bg-muted/30 border border-border rounded-xl text-sm focus:outline-hidden text-foreground font-medium"
                >
                  <option value="Basic">Basic (Rp 50.000/hari)</option>
                  <option value="Standard">Standard (Rp 80.000/hari)</option>
                  <option value="Premium">Premium (Rp 130.000/hari)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase block">
                  Tanggal Check-In
                </label>
                <input
                  type="date"
                  value={editCheckIn}
                  onChange={(e) => setEditCheckIn(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-muted/30 border border-border rounded-xl text-sm focus:outline-hidden text-foreground font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase block">
                  Tanggal Check-Out
                </label>
                <input
                  type="date"
                  value={editCheckOut}
                  onChange={(e) => setEditCheckOut(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-muted/30 border border-border rounded-xl text-sm focus:outline-hidden text-foreground font-medium"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/95 transition-all shadow-md shadow-primary/10 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSavingEdit ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
