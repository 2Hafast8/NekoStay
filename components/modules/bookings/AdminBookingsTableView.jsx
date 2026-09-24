"use client";

import React from "react";
import Link from "next/link";
import {
  Cat,
  MessageCircle,
  AlertTriangle,
  FileText,
  ArrowRight,
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

export function AdminBookingsTableView({
  bookings = [],
  selectedIds = [],
  onSelectRow,
  isAllPagePendingSelected = false,
  onSelectAllPagePending,
  pagePendingCount = 0,
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
      {/* Desktop Table */}
      <div className="hidden md:block bg-card border border-border rounded-3xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-muted/40 border-b border-border text-muted-foreground text-xs font-bold">
                <th className="p-4 sm:p-5 w-12 text-center">
                  <input
                    type="checkbox"
                    checked={isAllPagePendingSelected}
                    onChange={onSelectAllPagePending}
                    disabled={pagePendingCount === 0}
                    className="w-4 h-4 rounded-md border-border cursor-pointer accent-primary disabled:opacity-40"
                    title="Pilih semua pesanan menunggu pada halaman ini"
                  />
                </th>
                <th className="p-4 sm:p-5">Kucing & Pemilik</th>
                <th className="p-4 sm:p-5">Kelas Room</th>
                <th className="p-4 sm:p-5">Jadwal Menginap</th>
                <th className="p-4 sm:p-5">Total Biaya</th>
                <th className="p-4 sm:p-5">Status Reservasi</th>
                <th className="p-4 sm:p-5">Status Pembayaran</th>
                <th className="p-4 sm:p-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {bookings.map((b) => {
                const waUrl = getWhatsAppUrl(
                  b.profiles?.phone,
                  b.cat_name,
                  b.profiles?.full_name
                );
                const pinnedNote = b.booking_admin_notes?.find((n) => n.is_pinned);
                const notesCount = b.booking_admin_notes?.length || 0;

                return (
                  <tr
                    key={b.id}
                    className={`hover:bg-muted/30 transition-colors anim-item ${
                      selectedIds.includes(b.id) ? "bg-primary/5" : ""
                    }`}
                  >
                    {/* Checkbox column */}
                    <td className="p-4 sm:p-5 text-center">
                      {b.status === "Menunggu" ? (
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(b.id)}
                          onChange={() => onSelectRow(b.id)}
                          className="w-4 h-4 rounded-md border-border cursor-pointer accent-primary"
                        />
                      ) : (
                        <span className="text-muted-foreground/30 text-xs font-bold">•</span>
                      )}
                    </td>

                    {/* Cat & Owner Info */}
                    <td className="p-4 sm:p-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-2xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0 border border-orange-500/20">
                          <Cat className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <div className="font-extrabold text-foreground flex items-center gap-2">
                            <span>{b.cat_name}</span>
                            <span className="text-[11px] font-normal text-muted-foreground">
                              ({b.cat_gender}, {b.cat_age})
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                            <span>{b.profiles?.full_name || "Tamu Neko"}</span>
                            {b.profiles?.phone && (
                              <>
                                <span className="opacity-40">•</span>
                                <span>{b.profiles.phone}</span>
                              </>
                            )}
                            {waUrl && (
                              <a
                                href={waUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 p-0.5"
                                title="Hubungi via WhatsApp"
                              >
                                <MessageCircle className="w-3.5 h-3.5 inline" />
                              </a>
                            )}
                          </div>

                          {pinnedNote && (
                            <button
                              type="button"
                              onClick={() => onOpenQuickNotes(b)}
                              className="mt-1.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30 text-[10px] font-extrabold cursor-pointer hover:bg-rose-500/25 transition-all max-w-[220px] text-left group"
                              title={`Peringatan Kritis: ${pinnedNote.content}`}
                            >
                              <AlertTriangle className="w-3 h-3 shrink-0 text-rose-600 dark:text-rose-400" />
                              <span className="truncate">{pinnedNote.content}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Room Class */}
                    <td className="p-4 sm:p-5">
                      <div className="space-y-1">
                        <RoomClassBadge roomClass={b.class} />
                        <div className="text-[11px] text-muted-foreground font-medium">
                          {formatRupiah(b.price_per_day)}/hari
                        </div>
                      </div>
                    </td>

                    {/* Schedule & Duration */}
                    <td className="p-4 sm:p-5">
                      <div className="space-y-1">
                        <div className="font-semibold text-foreground text-xs flex items-center gap-1.5">
                          <span>{formatDate(b.check_in_date)}</span>
                          <ArrowRight className="w-3 h-3 text-muted-foreground" />
                          <span>{formatDate(b.check_out_date)}</span>
                        </div>
                        <div className="text-[11px] text-muted-foreground font-bold">
                          {b.total_days} Hari
                        </div>
                      </div>
                    </td>

                    {/* Total Cost */}
                    <td className="p-4 sm:p-5">
                      <div className="font-black text-foreground text-sm">
                        {formatRupiah(getBookingNetAmount(b))}
                      </div>
                      {b.discount_amount > 0 && (
                        <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                          Diskon: -{formatRupiah(b.discount_amount)}
                        </div>
                      )}
                      {b.late_fee_total > 0 && (
                        <div className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">
                          Denda: +{formatRupiah(b.late_fee_total)}
                        </div>
                      )}
                      {b.refund_amount > 0 && (
                        <div className="text-[10px] text-blue-600 dark:text-blue-400 font-bold">
                          Refund: -{formatRupiah(b.refund_amount)}
                        </div>
                      )}
                    </td>

                    {/* Booking Status */}
                    <td className="p-4 sm:p-5">
                      <BookingStatus status={b.status} />
                    </td>

                    {/* Payment Status Dropdown */}
                    <td className="p-4 sm:p-5">
                      <AdminBookingPaymentBadge booking={b} onUpdated={onUpdated} />
                    </td>

                    {/* Action Buttons */}
                    <td className="p-4 sm:p-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/bookings/${b.id}`}
                          className="px-3 py-1.5 border border-border hover:bg-muted text-xs font-bold rounded-xl transition-all text-foreground"
                        >
                          Detail
                        </Link>

                        <button
                          type="button"
                          onClick={() => onOpenQuickNotes(b)}
                          className="px-2.5 py-1.5 border border-border hover:border-primary/50 hover:bg-primary/5 text-xs font-bold rounded-xl transition-all text-foreground inline-flex items-center gap-1 cursor-pointer"
                          title="Buka Catatan Internal Tim"
                        >
                          <FileText className="w-3.5 h-3.5 text-primary" />
                          <span>{notesCount > 0 ? notesCount : "+"}</span>
                        </button>

                        {b.status === "Menunggu" && (
                          <>
                            <button
                              onClick={() => onOpenApprove(b)}
                              className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:bg-primary/90 transition-all cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                              title="Setujui Penitipan"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Setujui</span>
                            </button>
                            <button
                              onClick={() => onOpenReject(b)}
                              className="p-1.5 border border-rose-200 dark:border-rose-900/60 text-rose-600 bg-rose-500/5 hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer"
                              title="Tolak Penitipan"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}

                        {b.status === "Aktif" && (
                          <button
                            onClick={() => onOpenCheckout(b)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                            title="Proses Check-Out Kucing"
                          >
                            <LogOut className="w-3.5 h-3.5" />
                            <span>Check-Out</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View Fallback */}
      <div className="space-y-4 md:hidden">
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
              key={`m-${b.id}`}
              className="bg-card border border-border rounded-3xl p-5 space-y-4 shadow-2xs anim-item"
            >
              <div className="flex justify-between items-start gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0 border border-orange-500/20">
                    <Cat className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-foreground text-sm">{b.cat_name}</h3>
                    <p className="text-[11px] text-muted-foreground">
                      {b.cat_gender} • {b.cat_age}
                    </p>
                  </div>
                </div>
                <BookingStatus status={b.status} />
              </div>

              {/* Owner & WhatsApp */}
              <div className="p-2.5 bg-muted/30 border border-border/60 rounded-2xl flex items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                    Pemilik:
                  </span>
                  <span className="text-xs font-bold text-foreground">
                    {b.profiles?.full_name || "Tamu Neko"}
                  </span>
                </div>
                {waUrl && (
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-500/20"
                    title="Chat Pemilik via WhatsApp"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </a>
                )}
              </div>

              {/* Sticky Alert / Note Indicator in Mobile Card */}
              {pinnedNote ? (
                <div
                  onClick={() => onOpenQuickNotes(b)}
                  className="p-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2 cursor-pointer hover:bg-rose-500/15 transition-all text-xs"
                >
                  <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-700 dark:text-rose-300">
                      Peringatan Kritis
                    </span>
                    <p className="font-bold text-foreground line-clamp-2 text-[11px] mt-0.5">
                      {pinnedNote.content}
                    </p>
                  </div>
                </div>
              ) : notesCount > 0 ? (
                <div
                  onClick={() => onOpenQuickNotes(b)}
                  className="p-2 rounded-xl bg-muted/40 hover:bg-muted border border-border/60 flex items-center justify-between gap-2 cursor-pointer text-xs"
                >
                  <span className="inline-flex items-center gap-1.5 font-medium text-foreground text-[11px]">
                    <FileText className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>{notesCount} Catatan Tim</span>
                  </span>
                  <span className="text-[10px] font-bold text-primary">Lihat</span>
                </div>
              ) : null}

              {/* Details breakdown */}
              <div className="space-y-2 border-t border-b border-border/60 py-3 text-xs text-muted-foreground">
                <div className="flex justify-between items-center">
                  <span>Kelas:</span>
                  <RoomClassBadge roomClass={b.class} />
                </div>
                <div className="flex justify-between items-center">
                  <span>Jadwal:</span>
                  <span className="font-semibold text-foreground">
                    {formatDate(b.check_in_date)} - {formatDate(b.check_out_date)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Total Biaya:</span>
                  <div className="text-right">
                    <div className="font-black text-foreground text-sm">
                      {formatRupiah(getBookingNetAmount(b))}
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span>Status Pembayaran:</span>
                  <AdminBookingPaymentBadge booking={b} onUpdated={onUpdated} />
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 pt-1">
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
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Setujui</span>
                    </button>
                    <button
                      onClick={() => onOpenReject(b)}
                      className="p-2 border border-rose-200 dark:border-rose-900/60 text-rose-600 bg-rose-500/5 hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                )}

                {b.status === "Aktif" && (
                  <button
                    onClick={() => onOpenCheckout(b)}
                    className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 flex-1 shadow-2xs"
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

