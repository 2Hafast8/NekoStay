"use client";

import React from "react";
import Link from "next/link";
import {
  Cat,
  MessageCircle,
  AlertTriangle,
  FileText,
  Check,
  X,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { formatRupiah } from "@/lib/utils/format";
import { formatDate } from "@/lib/utils/dates";
import { BookingStatus } from "@/components/booking/BookingStatus";
import { RoomClassBadge } from "./RoomClassBadge";
import { AdminBookingPaymentBadge } from "./AdminBookingPaymentBadge";

function getWhatsAppUrl(phone, catName, ownerName) {
  if (!phone) return null;
  const clean = phone.replace(/[^0-9]/g, "");
  const normalized = clean.startsWith("0")
    ? "62" + clean.slice(1)
    : clean.startsWith("62")
    ? clean
    : clean;
  const text = encodeURIComponent(
    `Halo Kak ${ownerName || "Pelanggan"}, terkait pesanan penitipan untuk kucing kesayangan Anda (${catName || "NekoStay"})...`
  );
  return `https://wa.me/${normalized}?text=${text}`;
}

function getBookingNetAmount(b) {
  if (!b) return 0;
  const estimated = Number(b.estimated_total) || 0;
  const discount = Number(b.discount_amount) || 0;
  const lateFee = Number(b.late_fee_total) || 0;
  const refund = Number(b.refund_amount) || 0;
  return Math.max(0, estimated - discount + lateFee - refund);
}

export function AdminBookingsGridView({
  bookings = [],
  selectedIds = [],
  onSelectRow,
  onOpenApprove,
  onOpenReject,
  onOpenCheckout,
  onOpenQuickNotes,
  onUpdated,
  // Pagination
  currentPage = 1,
  totalPages = 1,
  totalFiltered = 0,
  itemsPerPage = 10,
  onPageChange,
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
        {bookings.map((b) => {
          const waUrl = getWhatsAppUrl(
            b.profiles?.phone,
            b.cat_name,
            b.profiles?.full_name
          );
          const pinnedNote = b.booking_admin_notes?.find((n) => n.is_pinned);
          const notesCount = b.booking_admin_notes?.length || 0;

          return (
            <div
              key={b.id}
              className={`bg-card border rounded-3xl p-5 space-y-4 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between anim-item ${
                selectedIds.includes(b.id)
                  ? "border-primary ring-1 ring-primary/40 bg-primary/2"
                  : "border-border hover:border-border/80"
              }`}
            >
              <div className="space-y-3.5">
                {/* Header card: Cat info + Status */}
                <div className="flex justify-between items-start gap-2">
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    {b.status === "Menunggu" ? (
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(b.id)}
                        onChange={() => onSelectRow(b.id)}
                        className="w-4.5 h-4.5 rounded-md border-border accent-primary shrink-0 cursor-pointer"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0 border border-orange-500/20">
                        <Cat className="w-4 h-4" />
                      </div>
                    )}

                    <div className="truncate">
                      <h3 className="font-extrabold text-foreground text-sm truncate flex items-center gap-1.5">
                        <span>{b.cat_name}</span>
                      </h3>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {b.cat_gender} • {b.cat_age}
                      </p>
                    </div>
                  </div>

                  <BookingStatus status={b.status} />
                </div>

                {/* Owner Information & WhatsApp Shortcut */}
                <div className="p-2.5 bg-muted/30 border border-border/60 rounded-2xl flex items-center justify-between gap-2">
                  <div className="truncate">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                      Pemilik:
                    </span>
                    <span className="text-xs font-bold text-foreground truncate block">
                      {b.profiles?.full_name || "Tamu Neko"}
                    </span>
                  </div>
                  {waUrl && (
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl transition-all shrink-0 border border-emerald-500/20"
                      title="Chat Pemilik via WhatsApp"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </a>
                  )}
                </div>

                {/* Sticky Alert / Note Indicator in Grid */}
                {pinnedNote ? (
                  <div
                    onClick={() => onOpenQuickNotes(b)}
                    className="p-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2 cursor-pointer hover:bg-rose-500/15 transition-all text-xs group"
                    title="Klik untuk membuka catatan internal admin"
                  >
                    <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-700 dark:text-rose-300">
                        Peringatan Kritis
                      </span>
                      <p className="font-bold text-foreground line-clamp-2 text-[11px] mt-0.5 group-hover:text-primary transition-colors">
                        {pinnedNote.content}
                      </p>
                    </div>
                  </div>
                ) : notesCount > 0 ? (
                  <div
                    onClick={() => onOpenQuickNotes(b)}
                    className="p-2 rounded-xl bg-muted/40 hover:bg-muted border border-border/60 flex items-center justify-between gap-2 cursor-pointer text-xs transition-all group"
                    title="Klik untuk membuka catatan internal admin"
                  >
                    <span className="inline-flex items-center gap-1.5 font-medium text-foreground text-[11px] group-hover:text-primary transition-colors">
                      <FileText className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>{notesCount} Catatan Admin</span>
                    </span>
                    <span className="text-[10px] font-bold text-primary">Lihat</span>
                  </div>
                ) : null}

                {/* Room & Schedule breakdown */}
                <div className="space-y-2 border-t border-b border-border/60 py-3 text-xs text-muted-foreground">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">
                      Kelas:
                    </span>
                    <RoomClassBadge roomClass={b.class} />
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">
                      Jadwal:
                    </span>
                    <span className="font-semibold text-foreground text-[11px]">
                      {formatDate(b.check_in_date)} - {formatDate(b.check_out_date)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">
                      Total Biaya:
                    </span>
                    <div className="text-right">
                      <div className="font-black text-foreground text-sm">
                        {formatRupiah(getBookingNetAmount(b))}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-1">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">
                      Status Bayar:
                    </span>
                    <AdminBookingPaymentBadge booking={b} onUpdated={onUpdated} />
                  </div>
                </div>
              </div>

              {/* Action buttons footer */}
              <div className="flex gap-2 pt-2 border-t border-border/60">
                <Link
                  href={`/admin/bookings/${b.id}`}
                  className="px-3 py-2 border border-border hover:bg-muted text-xs font-bold rounded-xl transition-all text-center flex-1 text-foreground"
                >
                  Detail
                </Link>

                <button
                  type="button"
                  onClick={() => onOpenQuickNotes(b)}
                  className="px-2.5 py-2 border border-border hover:border-primary/50 hover:bg-primary/5 text-xs font-bold rounded-xl transition-all text-center text-foreground flex items-center justify-center gap-1 cursor-pointer"
                  title="Buka Catatan Internal Tim"
                >
                  <FileText className="w-3.5 h-3.5 text-primary" />
                  <span>{notesCount > 0 ? notesCount : "+"}</span>
                </button>

                {b.status === "Menunggu" && (
                  <>
                    <button
                      onClick={() => onOpenApprove(b)}
                      className="px-3 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:bg-primary/90 transition-all cursor-pointer flex items-center justify-center gap-1 flex-1 shadow-2xs"
                      title="Setujui Penitipan"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Setujui</span>
                    </button>
                    <button
                      onClick={() => onOpenReject(b)}
                      className="p-2 border border-rose-200 dark:border-rose-900/60 text-rose-600 bg-rose-500/5 hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer"
                      title="Tolak Penitipan"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                )}

                {b.status === "Aktif" && (
                  <button
                    onClick={() => onOpenCheckout(b)}
                    className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 flex-1 shadow-2xs"
                    title="Proses Check-Out Kucing"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Check-Out</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-4 flex-wrap bg-card border border-border px-5 py-4 rounded-2xl anim-item">
          <p className="text-xs text-muted-foreground font-semibold">
            Menampilkan{" "}
            <span className="text-foreground font-bold">
              {Math.min(totalFiltered, (currentPage - 1) * itemsPerPage + 1)}
            </span>{" "}
            -{" "}
            <span className="text-foreground font-bold">
              {Math.min(totalFiltered, currentPage * itemsPerPage)}
            </span>{" "}
            dari{" "}
            <span className="text-foreground font-bold">{totalFiltered}</span> pesanan
          </p>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 border border-border rounded-xl hover:bg-muted/80 disabled:opacity-40 transition-colors cursor-pointer text-muted-foreground hover:text-foreground"
              title="Halaman Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  currentPage === page
                    ? "bg-primary text-primary-foreground"
                    : "border border-border hover:bg-muted/80 text-muted-foreground hover:text-foreground"
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-2 border border-border rounded-xl hover:bg-muted/80 disabled:opacity-40 transition-colors cursor-pointer text-muted-foreground hover:text-foreground"
              title="Halaman Berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

