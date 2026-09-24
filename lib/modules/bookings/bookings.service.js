import { BookingsRepository } from "./bookings.repository.js";

const PAYMENT_STATUS_LABELS = {
  Unpaid: "Belum Dibayar",
  Paid: "Lunas",
  Failed: "Gagal",
  Refunded: "Dikembalikan",
};

export class BookingsService {
  /**
   * Update emergency payment status with administrative audit note
   */
  static async updateEmergencyPaymentStatus(supabase, { bookingId, adminUser, paymentStatus, reason }) {
    const { data: booking, error: fetchError } = await BookingsRepository.findWithProfile(supabase, bookingId);

    if (fetchError || !booking) {
      throw { status: 404, message: "Data pesanan tidak ditemukan." };
    }

    const updateData = { payment_status: paymentStatus };
    if (paymentStatus === "Paid" && booking.offline_payment_token) {
      updateData.offline_token_used = true;
    } else if (paymentStatus === "Unpaid" && booking.offline_payment_token) {
      updateData.offline_token_used = false;
    }

    const { data: updatedBooking, error: updateError } = await BookingsRepository.update(
      supabase,
      bookingId,
      updateData
    );

    if (updateError) {
      console.error("[BookingsService updateEmergencyPaymentStatus Error]:", updateError);
      throw { status: 500, message: "Gagal memperbarui status pembayaran" };
    }

    const previousStatusLabel = PAYMENT_STATUS_LABELS[booking.payment_status] || booking.payment_status;
    const newStatusLabel = PAYMENT_STATUS_LABELS[paymentStatus] || paymentStatus;

    // Catat riwayat audit darurat ke booking_admin_notes
    try {
      await BookingsRepository.insertAdminNote(supabase, {
        bookingId,
        adminId: adminUser.id,
        category: "urgent",
        content: `[PERUBAHAN MANUAL DARURAT]: Status pembayaran diubah dari "${previousStatusLabel}" ke "${newStatusLabel}".\nAlasan verifikasi: ${reason}`,
        isPinned: true,
      });
    } catch (noteErr) {
      console.warn("[BookingsService Audit Note Warning]:", noteErr.message);
    }

    // Kirim notifikasi ke pelanggan
    try {
      await BookingsRepository.insertNotification(supabase, {
        userId: booking.user_id,
        title: "Status Pembayaran Diperbarui",
        message: `Status pembayaran untuk penitipan ${booking.cat_name} telah diperbarui menjadi "${newStatusLabel}" oleh admin.`,
        type: paymentStatus === "Paid" ? "success" : "info",
        bookingId: booking.id,
      });
    } catch (notifErr) {
      console.warn("[BookingsService Notification Warning]:", notifErr.message);
    }

    return {
      updatedBooking,
      statusLabel: newStatusLabel,
    };
  }

  /**
   * Confirm booking from 'Menunggu' or 'Antrian' to 'Aktif'
   */
  static async confirmBooking(supabase, { bookingId }) {
    const { data: booking, error: bookingError } = await BookingsRepository.findById(
      supabase,
      bookingId,
      "id, status, cat_name, user_id"
    );

    if (bookingError || !booking) {
      throw { status: 404, message: "Data booking tidak ditemukan" };
    }

    if (booking.status !== "Menunggu" && booking.status !== "Antrian") {
      throw {
        status: 400,
        message: "Hanya booking dengan status Menunggu atau Antrian yang dapat dikonfirmasi",
      };
    }

    // Trigger otomatis men-generate offline_payment_token di database saat status menjadi Aktif
    const { error: updateError } = await BookingsRepository.update(supabase, bookingId, {
      status: "Aktif",
    });

    if (updateError) {
      console.error("[BookingsService confirmBooking Error]:", updateError);
      throw { status: 500, message: "Gagal memperbarui status booking" };
    }

    const { data: updatedBooking } = await BookingsRepository.findWithProfile(supabase, bookingId);

    // Kirim notifikasi ke customer
    try {
      await BookingsRepository.insertNotification(supabase, {
        userId: booking.user_id,
        title: "Pesanan Penitipan Dikonfirmasi!",
        message: `Pesanan penitipan untuk kucing ${booking.cat_name} telah dikonfirmasi dan aktif. Silakan antar kucing Anda sesuai jadwal.`,
        type: "success",
        bookingId,
      });
    } catch (notifErr) {
      console.warn("[BookingsService confirmBooking Notification Warning]:", notifErr.message);
    }

    // Kirim email status booking aktif
    const userEmail = updatedBooking?.profiles?.email;
    if (userEmail && updatedBooking) {
      try {
        const { sendBookingStatusUpdate } = await import("@/lib/email/resend");
        await sendBookingStatusUpdate(
          userEmail,
          updatedBooking.profiles.full_name,
          updatedBooking.cat_name,
          updatedBooking.id,
          "Aktif",
          updatedBooking
        );
      } catch (emailErr) {
        console.warn("[BookingsService Email Warning]:", emailErr.message);
      }
    }

    return { id: bookingId, status: "Aktif" };
  }

  /**
   * Cancel booking by customer (allowed only for 'Menunggu')
   */
  static async cancelBooking(supabase, { bookingId, userId, reason }) {
    const { data: booking, error: bookingError } = await BookingsRepository.findByIdAndUserId(
      supabase,
      bookingId,
      userId,
      "id, status, cat_name, user_id"
    );

    if (bookingError || !booking) {
      throw { status: 404, message: "Booking tidak ditemukan atau bukan milik Anda" };
    }

    if (booking.status !== "Menunggu") {
      throw {
        status: 400,
        message: `Pesanan ini telah diproses (Status: ${booking.status}) dan tidak dapat dibatalkan secara langsung.`,
      };
    }

    const updatedBooking = await BookingsRepository.updateWithCondition(
      supabase,
      bookingId,
      { user_id: userId, status: "Menunggu" },
      {
        status: "Dibatalkan",
        cancel_reason: reason,
      }
    );

    if (!updatedBooking || updatedBooking.error) {
      if (updatedBooking?.error) {
        console.error("[BookingsService cancelBooking Error]:", updatedBooking.error);
        throw { status: 500, message: "Gagal membatalkan pesanan" };
      }
      throw {
        status: 400,
        message: "Status pesanan telah berubah saat proses pembatalan. Pembatalan tidak dapat dilanjutkan.",
      };
    }

    // Notifikasi ke seluruh admin
    try {
      const { data: admins } = await BookingsRepository.findAdmins(supabase);
      if (admins && admins.length > 0) {
        const notificationsToInsert = admins.map((admin) => ({
          user_id: admin.id,
          title: "Pesanan Dibatalkan User",
          message: `Booking untuk kucing ${booking.cat_name} telah dibatalkan oleh pemilik. Alasan: ${reason}`,
          type: "warning",
          booking_id: bookingId,
          is_read: false,
        }));
        await BookingsRepository.insertBatchNotifications(supabase, notificationsToInsert);
      }
    } catch (notifErr) {
      console.warn("[BookingsService cancelBooking Admin Notif Warning]:", notifErr.message);
    }

    return { id: updatedBooking.data ? updatedBooking.data.id : bookingId };
  }
}

