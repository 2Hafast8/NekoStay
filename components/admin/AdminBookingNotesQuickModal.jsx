"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  X,
  Cat,
  ExternalLink,
  AlertTriangle,
  PinOff,
  ShieldAlert,
  Loader2,
} from "lucide-react";
import { AdminBookingNotesTimeline } from "./AdminBookingNotesTimeline";
import { BookingStatus } from "@/components/booking/BookingStatus";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export function AdminBookingNotesQuickModal({
  isOpen,
  onClose,
  booking,
  onNotesUpdated,
}) {
  const [notes, setNotes] = useState(() => booking?.booking_admin_notes || []);
  const [isLoading, setIsLoading] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const fetchNotes = useCallback(async (bookingId) => {
    if (!bookingId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/notes`);
      if (res.ok) {
        const data = await res.json();
        const noteList = Array.isArray(data.notes)
          ? data.notes
          : Array.isArray(data.data?.notes)
          ? data.data.notes
          : Array.isArray(data.data)
          ? data.data
          : null;

        if (noteList !== null) {
          setNotes(noteList);
          return;
        }
      }
      throw new Error("Respon data catatan tidak sesuai.");
    } catch (err) {
      console.error("Error fetching notes in quick modal:", err);

      // Fallback 1: Query Supabase client directly (matches Booking Detail page behavior)
      try {
        const supabase = createClient();
        const { data: clientNotes, error: clientErr } = await supabase
          .from("booking_admin_notes")
          .select("*, profiles:admin_id(id, full_name, role)")
          .eq("booking_id", bookingId)
          .order("created_at", { ascending: false });

        if (!clientErr && Array.isArray(clientNotes)) {
          setNotes(clientNotes);
          return;
        }
      } catch (fallbackErr) {
        console.error("Supabase client query fallback failed:", fallbackErr);
      }

      // Fallback 2: booking's existing notes if any
      if (booking?.booking_admin_notes && Array.isArray(booking.booking_admin_notes)) {
        setNotes(booking.booking_admin_notes);
      }
    } finally {
      setIsLoading(false);
    }
  }, [booking]);

  // Synchronize notes immediately when booking prop changes or modal opens
  useEffect(() => {
    if (isOpen && booking?.id) {
      if (Array.isArray(booking.booking_admin_notes) && booking.booking_admin_notes.length > 0) {
        setNotes(booking.booking_admin_notes);
      }
      fetchNotes(booking.id);
    } else if (!isOpen) {
      setNotes([]);
    }
  }, [isOpen, booking?.id, booking?.booking_admin_notes, fetchNotes]);

  if (!isOpen || !booking) return null;

  const handleCreateNote = async ({ category, content, isPinned }) => {
    setIsActionLoading(true);
    try {
      const res = await fetch(`/api/bookings/${booking.id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, content, is_pinned: isPinned }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan catatan.");

      toast.success("Catatan admin berhasil ditambahkan!");
      await fetchNotes(booking.id);
      if (onNotesUpdated) onNotesUpdated();
    } catch (err) {
      toast.error(err.message || "Gagal menyimpan catatan.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleTogglePin = async (noteId, currentPin) => {
    setIsActionLoading(true);
    try {
      const res = await fetch(`/api/bookings/${booking.id}/notes/${noteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_pinned: !currentPin }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengubah status sematan.");

      toast.success(!currentPin ? "Catatan disematkan ke banner kritis!" : "Sematan catatan dilepas.");
      await fetchNotes(booking.id);
      if (onNotesUpdated) onNotesUpdated();
    } catch (err) {
      toast.error(err.message || "Gagal mengubah status sematan.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDeleteNote = async (noteId) => {
    setIsActionLoading(true);
    try {
      const res = await fetch(`/api/bookings/${booking.id}/notes/${noteId}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menghapus catatan.");

      toast.success("Catatan admin berhasil dihapus.");
      await fetchNotes(booking.id);
      if (onNotesUpdated) onNotesUpdated();
    } catch (err) {
      toast.error(err.message || "Gagal menghapus catatan.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const pinnedNote = notes.find((n) => n.is_pinned);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-card border border-border/80 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-border/60 bg-muted/20 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
              <Cat className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-extrabold text-foreground text-base sm:text-lg truncate">
                  Catatan Admin: {booking.cat_name}
                </h3>
                <BookingStatus status={booking.status} />
              </div>
              <p className="text-xs text-muted-foreground truncate">
                ID #{booking.id.slice(0, 8)}... • Kelas {booking.class} • Pemilik: {booking.profiles?.full_name || "Pelanggan"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* Active Sticky Alert preview inside modal if any */}
          {pinnedNote && (
            <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/30">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-700 dark:text-rose-300">
                        Banner Peringatan Aktif
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm font-bold text-foreground mt-0.5 break-words">
                      {pinnedNote.content}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleTogglePin(pinnedNote.id, true)}
                  disabled={isActionLoading}
                  className="p-1.5 rounded-lg border border-rose-300/60 dark:border-rose-800 text-rose-600 hover:bg-rose-500/20 text-xs font-bold transition-all cursor-pointer shrink-0"
                  title="Lepas sematan dari banner"
                >
                  <PinOff className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {isLoading && notes.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <span className="text-xs font-semibold">Memuat riwayat catatan...</span>
            </div>
          ) : (
            <AdminBookingNotesTimeline
              notes={notes}
              onCreateNote={handleCreateNote}
              onTogglePinNote={handleTogglePin}
              onDeleteNote={handleDeleteNote}
              isActionLoading={isActionLoading}
              compact
            />
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-border/60 bg-muted/20 flex items-center justify-between gap-3 shrink-0">
          <Link
            href={`/admin/bookings/${booking.id}`}
            onClick={onClose}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
          >
            <span>Buka Detail Pesanan Penuh</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-border bg-card hover:bg-muted text-foreground text-xs font-bold rounded-xl transition-all cursor-pointer shadow-2xs"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

