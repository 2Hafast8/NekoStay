import { createClient } from "@/lib/supabase/server";
import { verifyAdmin } from "@/lib/supabase/admin";
import {
  apiSuccess,
  apiUnauthorized,
  apiForbidden,
  apiNotFound,
  apiError,
} from "@/lib/utils/response";

export async function PATCH(request, { params }) {
  try {
    const supabase = await createClient();
    const { id: bookingId, noteId } = await params;

    const { isAdmin, user } = await verifyAdmin(supabase);
    if (!user) return apiUnauthorized();
    if (!isAdmin) return apiForbidden("Hanya administrator yang dapat mengubah catatan internal.");

    const body = await request.json();
    const { is_pinned } = body;

    if (typeof is_pinned !== "boolean") {
      return apiError("Field is_pinned harus berupa boolean.", 400);
    }

    // Verify note exists for this booking
    const { data: existingNote, error: fetchErr } = await supabase
      .from("booking_admin_notes")
      .select("*")
      .eq("id", noteId)
      .eq("booking_id", bookingId)
      .maybeSingle();

    if (fetchErr || !existingNote) {
      return apiNotFound("Catatan tidak ditemukan.");
    }

    if (is_pinned) {
      // Unpin any other note for this booking
      await supabase
        .from("booking_admin_notes")
        .update({ is_pinned: false })
        .eq("booking_id", bookingId);

      // Pin this note
      const { data: updated, error: updateErr } = await supabase
        .from("booking_admin_notes")
        .update({ is_pinned: true, updated_at: new Date().toISOString() })
        .eq("id", noteId)
        .select("*, profiles:admin_id(id, full_name, role)")
        .single();

      if (updateErr) throw updateErr;

      // Sync into bookings.admin_notes
      await supabase
        .from("bookings")
        .update({ admin_notes: `[${existingNote.category.toUpperCase()}] ${existingNote.content}` })
        .eq("id", bookingId);

      return apiSuccess({
        note: updated,
        data: { note: updated },
      });
    } else {
      // Unpin this note
      const { data: updated, error: updateErr } = await supabase
        .from("booking_admin_notes")
        .update({ is_pinned: false, updated_at: new Date().toISOString() })
        .eq("id", noteId)
        .select("*, profiles:admin_id(id, full_name, role)")
        .single();

      if (updateErr) throw updateErr;

      // Clear bookings.admin_notes
      await supabase
        .from("bookings")
        .update({ admin_notes: null })
        .eq("id", bookingId);

      return apiSuccess({
        note: updated,
        data: { note: updated },
      });
    }
  } catch (err) {
    console.error("Error updating booking admin note:", err);
    return apiError(err.message || "Gagal memperbarui catatan admin.");
  }
}

export async function DELETE(request, { params }) {
  try {
    const supabase = await createClient();
    const { id: bookingId, noteId } = await params;

    const { isAdmin, user } = await verifyAdmin(supabase);
    if (!user) return apiUnauthorized();
    if (!isAdmin) return apiForbidden("Hanya administrator yang dapat menghapus catatan internal.");

    // Check existing note
    const { data: existingNote, error: fetchErr } = await supabase
      .from("booking_admin_notes")
      .select("*")
      .eq("id", noteId)
      .eq("booking_id", bookingId)
      .maybeSingle();

    if (fetchErr || !existingNote) {
      return apiNotFound("Catatan tidak ditemukan.");
    }

    const wasPinned = existingNote.is_pinned;

    const { error: deleteErr } = await supabase
      .from("booking_admin_notes")
      .delete()
      .eq("id", noteId);

    if (deleteErr) throw deleteErr;

    // If the deleted note was pinned, clear bookings.admin_notes
    if (wasPinned) {
      await supabase
        .from("bookings")
        .update({ admin_notes: null })
        .eq("id", bookingId);
    }

    return apiSuccess({
      deleted: true,
      noteId,
      data: { deleted: true, noteId },
    });
  } catch (err) {
    console.error("Error deleting booking admin note:", err);
    return apiError(err.message || "Gagal menghapus catatan admin.");
  }
}

