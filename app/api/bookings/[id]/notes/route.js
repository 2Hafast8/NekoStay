import { createClient } from "@/lib/supabase/server";
import { verifyAdmin } from "@/lib/supabase/admin";
import { adminBookingNoteSchema } from "@/lib/validations/booking";
import {
  apiSuccess,
  apiUnauthorized,
  apiForbidden,
  apiNotFound,
  apiValidationError,
  apiError,
} from "@/lib/utils/response";

export async function GET(request, { params }) {
  try {
    const supabase = await createClient();
    const { id: bookingId } = await params;

    const { isAdmin, user } = await verifyAdmin(supabase);
    if (!user) return apiUnauthorized();
    if (!isAdmin) return apiForbidden("Hanya administrator yang dapat mengakses catatan internal.");

    const { data: notes, error } = await supabase
      .from("booking_admin_notes")
      .select("*, profiles:admin_id(id, full_name, role)")
      .eq("booking_id", bookingId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return apiSuccess({
      notes: notes || [],
      data: { notes: notes || [] },
    });
  } catch (err) {
    console.error("Error fetching booking admin notes:", err);
    return apiError(err.message || "Gagal memuat catatan admin.");
  }
}

export async function POST(request, { params }) {
  try {
    const supabase = await createClient();
    const { id: bookingId } = await params;

    const { isAdmin, user } = await verifyAdmin(supabase);
    if (!user) return apiUnauthorized();
    if (!isAdmin) return apiForbidden("Hanya administrator yang dapat menambah catatan internal.");

    const body = await request.json();
    const parsed = adminBookingNoteSchema.safeParse({ ...body, booking_id: bookingId });

    if (!parsed.success) {
      return apiValidationError(parsed.error);
    }

    const { category, content, is_pinned } = parsed.data;

    // Check booking exists
    const { data: booking, error: checkError } = await supabase
      .from("bookings")
      .select("id")
      .eq("id", bookingId)
      .maybeSingle();

    if (checkError || !booking) {
      return apiNotFound("Pesanan tidak ditemukan.");
    }

    // If pinned, unpin existing pinned notes for this booking first
    if (is_pinned) {
      await supabase
        .from("booking_admin_notes")
        .update({ is_pinned: false })
        .eq("booking_id", bookingId);
    }

    // Insert note
    const { data: newNote, error: insertError } = await supabase
      .from("booking_admin_notes")
      .insert({
        booking_id: bookingId,
        admin_id: user.id,
        category,
        content,
        is_pinned: Boolean(is_pinned),
      })
      .select("*, profiles:admin_id(id, full_name, role)")
      .single();

    if (insertError) throw insertError;

    // Backward compatibility: sync pinned note into bookings.admin_notes
    if (is_pinned) {
      await supabase
        .from("bookings")
        .update({ admin_notes: `[${category.toUpperCase()}] ${content}` })
        .eq("id", bookingId);
    }

    return apiSuccess({
      note: newNote,
      data: { note: newNote },
    }, 201);
  } catch (err) {
    console.error("Error creating booking admin note:", err);
    return apiError(err.message || "Gagal menyimpan catatan admin.");
  }
}

