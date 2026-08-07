"use client";

import { useState } from "react";
import { MessageSquare, Calendar, Layers, Send, X, Sparkles, AlertCircle } from "lucide-react";
import { formatDate } from "@/lib/utils/dates";

export function WaInteractiveModal({ isOpen, onClose, booking, adminPhone = "628123456789" }) {
  const [changeType, setChangeType] = useState("dates"); // 'dates' | 'class' | 'other'
  const [newCheckOutDate, setNewCheckOutDate] = useState("");
  const [newClass, setNewClass] = useState("Deluxe");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !booking) return null;

  const handleSendWa = async () => {
    setIsSubmitting(true);

    let changeTypeTitle = "";
    let changeDetailsText = "";

    if (changeType === "dates") {
      changeTypeTitle = "🗓️ Perpanjangan Hari / Ubah Tanggal";
      changeDetailsText = `- Tanggal Check-Out Baru: ${newCheckOutDate ? formatDate(newCheckOutDate) : "Perpanjang 2 Hari"}\n- Catatan: ${additionalNotes || "Mohon perpanjang penitipan."}`;
    } else if (changeType === "class") {
      changeTypeTitle = "🏨 Perubahan Kelas Kamar";
      changeDetailsText = `- Pilihan Kelas Kamar Baru: ${newClass}\n- Catatan: ${additionalNotes || "Mohon dipindahkan ke kelas kamar ini."}`;
    } else {
      changeTypeTitle = "💬 Perubahan Lainnya";
      changeDetailsText = `- Detail Permintaan: ${additionalNotes || "Ada pertanyaan terkait pesanan."}`;
    }

    const messageTemplate = `💬 *PERMINTAAN PERUBAHAN PESANAN NEKOSTAY*
---------------------------------------
📌 *ID Booking*: ${booking.id}
🐾 *Nama Kucing*: ${booking.cat_name}
🏨 *Kelas Kamar*: ${booking.class}
📅 *Jadwal Saat Ini*: ${formatDate(booking.check_in_date)} - ${formatDate(booking.check_out_date)}

━━━━━━━━━━━━━━━━━━━━━━━
🔘 *TIPE PERUBAHAN*: ${changeTypeTitle}
📝 *DETAIL PERUBAHAN*:
${changeDetailsText}
━━━━━━━━━━━━━━━━━━━━━━━

Halo Admin NekoStay, mohon bantuan untuk memproses perubahan pesanan saya di atas. Terima kasih!`;

    const cleanPhone = adminPhone.replace(/[^0-9]/g, "");
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageTemplate)}`;

    // Call API to register admin notification
    try {
      await fetch(`/api/bookings/${booking.id}/wa-request-change`, {
        method: "POST",
      });
    } catch (err) {
      console.error("Gagal mengirim notif ke server:", err);
    } finally {
      setIsSubmitting(false);
      window.open(waUrl, "_blank", "noopener,noreferrer");
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-card dark:bg-zinc-900 border border-border dark:border-zinc-800 w-full max-w-lg p-6 sm:p-8 rounded-3xl space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-foreground dark:text-zinc-100">
                Pilih Perubahan Pesanan (WhatsApp)
              </h3>
              <p className="text-xs text-muted-foreground">
                Kucing: <strong>{booking.cat_name}</strong> (#{booking.id.substring(0, 8)})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-muted-foreground hover:text-foreground cursor-pointer rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step 1: Interactive Options */}
        <div className="space-y-4">
          <label className="text-xs font-extrabold text-muted-foreground uppercase tracking-wider block">
            Pilih Jenis Perubahan:
          </label>

          <div className="grid grid-cols-1 gap-3">
            <button
              type="button"
              onClick={() => setChangeType("dates")}
              className={`p-4 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                changeType === "dates"
                  ? "border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/30"
                  : "border-border/60 bg-muted/20 hover:bg-muted/50"
              }`}
            >
              <div className="p-2 bg-emerald-500 text-white rounded-xl">
                <Calendar className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h4 className="font-extrabold text-xs text-foreground dark:text-zinc-100">
                  Perpanjang / Ubah Tanggal Penitipan
                </h4>
                <p className="text-[11px] text-muted-foreground">
                  Tambah durasi hari menginap atau ubah jadwal check-out.
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setChangeType("class")}
              className={`p-4 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                changeType === "class"
                  ? "border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/30"
                  : "border-border/60 bg-muted/20 hover:bg-muted/50"
              }`}
            >
              <div className="p-2 bg-primary text-primary-foreground rounded-xl">
                <Layers className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h4 className="font-extrabold text-xs text-foreground dark:text-zinc-100">
                  Ubah Kelas Kamar
                </h4>
                <p className="text-[11px] text-muted-foreground">
                  Upgrade atau ganti ke kelas kamar lain (misal: Standard → Executive).
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setChangeType("other")}
              className={`p-4 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                changeType === "other"
                  ? "border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/30"
                  : "border-border/60 bg-muted/20 hover:bg-muted/50"
              }`}
            >
              <div className="p-2 bg-amber-500 text-white rounded-xl">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h4 className="font-extrabold text-xs text-foreground dark:text-zinc-100">
                  Permintaan & Bantuan Lainnya
                </h4>
                <p className="text-[11px] text-muted-foreground">
                  Kirim catatan khusus atau pertanyaan umum ke admin.
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Step 2: Dynamic Detail Inputs */}
        <div className="space-y-4 pt-2 border-t border-border/60">
          {changeType === "dates" && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground dark:text-zinc-200">
                Pilih Tanggal Check-Out Baru (Opsional):
              </label>
              <input
                type="date"
                value={newCheckOutDate}
                onChange={(e) => setNewCheckOutDate(e.target.value)}
                min={booking.check_out_date}
                className="w-full px-4 py-2.5 bg-muted/30 border border-border rounded-xl text-xs font-bold text-foreground"
              />
            </div>
          )}

          {changeType === "class" && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground dark:text-zinc-200">
                Pilih Kelas Kamar Baru:
              </label>
              <select
                value={newClass}
                onChange={(e) => setNewClass(e.target.value)}
                className="w-full px-4 py-2.5 bg-muted/30 border border-border rounded-xl text-xs font-bold text-foreground"
              >
                <option value="Standard">Standard</option>
                <option value="Deluxe">Deluxe Suite</option>
                <option value="Executive">Executive Royal</option>
                <option value="VIP Cat Castle">VIP Cat Castle</option>
              </select>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground dark:text-zinc-200">
              Catatan / Pesan Tambahan untuk Admin:
            </label>
            <textarea
              rows={2}
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder="Tuliskan detail permintaan Anda..."
              className="w-full px-4 py-2.5 bg-muted/30 border border-border rounded-xl text-xs font-medium text-foreground resize-none"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-border/60">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-border text-xs font-bold hover:bg-muted cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSendWa}
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-all shadow-md shadow-emerald-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>Buka & Kirim di WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
}
