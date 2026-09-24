/**
 * Bookings Repository
 * Encapsulates all database operations on Supabase for the bookings domain.
 */

export class BookingsRepository {
  /**
   * Find booking by ID
   */
  static async findById(supabase, id, select = "*") {
    return await supabase
      .from("bookings")
      .select(select)
      .eq("id", id)
      .single();
  }

  /**
   * Find booking by ID and user ID (ownership check)
   */
  static async findByIdAndUserId(supabase, id, userId, select = "*") {
    return await supabase
      .from("bookings")
      .select(select)
      .eq("id", id)
      .eq("user_id", userId)
      .single();
  }

  /**
   * Find booking by ID with profile data
   */
  static async findWithProfile(supabase, id) {
    return await supabase
      .from("bookings")
      .select("*, profiles:user_id (full_name, email, phone)")
      .eq("id", id)
      .single();
  }

  /**
   * Update booking by ID
   */
  static async update(supabase, id, updateData) {
    return await supabase
      .from("bookings")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();
  }

  /**
   * Update booking with optimistic status check (e.g. for cancellation)
   */
  static async updateWithCondition(supabase, id, condition, updateData) {
    let query = supabase.from("bookings").update(updateData).eq("id", id);
    for (const [key, val] of Object.entries(condition)) {
      query = query.eq(key, val);
    }
    return await query.select().maybeSingle();
  }

  /**
   * Insert admin note for audit trail
   */
  static async insertAdminNote(supabase, { bookingId, adminId, category, content, isPinned = false }) {
    return await supabase.from("booking_admin_notes").insert({
      booking_id: bookingId,
      admin_id: adminId,
      category,
      content,
      is_pinned: isPinned,
    });
  }

  /**
   * Insert user notification
   */
  static async insertNotification(supabase, { userId, title, message, type, bookingId }) {
    return await supabase.from("notifications").insert({
      user_id: userId,
      title,
      message,
      type,
      booking_id: bookingId,
      is_read: false,
    });
  }

  /**
   * Insert batch notifications
   */
  static async insertBatchNotifications(supabase, notifications) {
    return await supabase.from("notifications").insert(notifications);
  }

  /**
   * Find all admin profiles
   */
  static async findAdmins(supabase) {
    return await supabase
      .from("profiles")
      .select("id, email, full_name")
      .eq("role", "admin");
  }
}

