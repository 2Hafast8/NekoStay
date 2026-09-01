/**
 * Standardized helper to insert notifications into public.notifications table.
 * Per SKILL.md Section 12 pattern.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} userId
 * @param {string} title
 * @param {string} message
 * @param {'info'|'warning'|'success'|'error'} [type='info']
 * @param {string|null} [bookingId=null]
 * @returns {Promise<{ data: object | null, error: object | null }>}
 */
export async function insertNotification(
  supabase,
  userId,
  title,
  message,
  type = "info",
  bookingId = null
) {
  try {
    const { data, error } = await supabase
      .from("notifications")
      .insert({
        user_id: userId,
        title,
        message,
        type,
        booking_id: bookingId ?? null,
        is_read: false,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.warn("[insertNotification Error]:", error.message);
    }
    return { data, error };
  } catch (err) {
    console.error("[insertNotification Exception]:", err);
    return { data: null, error: err };
  }
}
