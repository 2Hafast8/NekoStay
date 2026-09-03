import { z } from "zod";

/**
 * Validasi Pembuatan Pesanan Penitipan Kucing Baru (Form & API)
 */
export const bookingFormSchema = z
  .object({
    // Data Kucing
    cat_name: z
      .string()
      .trim()
      .min(1, "Nama kucing wajib diisi")
      .max(50, "Nama kucing maksimal 50 karakter"),
    cat_gender: z.enum(["Jantan", "Betina"], {
      message: "Gender kucing wajib dipilih (Jantan/Betina)",
    }),
    cat_age: z.string().trim().min(1, "Usia kucing wajib diisi"),
    cat_health_status: z.enum(["Sehat", "Sakit", "Dalam Pengobatan"], {
      message: "Status kesehatan kucing wajib dipilih",
    }),
    cat_favorite_food: z.string().trim().optional().nullable(),
    cat_is_pregnant: z.boolean().default(false),
    cat_notes: z.string().trim().max(1000, "Catatan maksimal 1000 karakter").optional().nullable(),
    cat_photo_url: z.string().url("URL foto tidak valid").optional().nullable().or(z.literal("")),

    // Data Pemesanan
    class: z.enum(["Basic", "Standard", "Premium"], {
      message: "Kelas kamar wajib dipilih (Basic, Standard, Premium)",
    }),
    status: z.enum(["Menunggu", "Aktif", "Selesai", "Dibatalkan", "Antrian"]).optional(),
    check_in_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal masuk harus YYYY-MM-DD"),
    check_out_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal keluar harus YYYY-MM-DD"),
    notes: z.string().trim().optional().nullable(),
    referral_code: z.string().trim().optional().nullable(),
    discount_amount: z.number().nonnegative().optional().default(0),
  })
  .refine(
    (data) => new Date(data.check_out_date) > new Date(data.check_in_date),
    {
      message: "Tanggal keluar harus setelah tanggal masuk",
      path: ["check_out_date"],
    }
  );

/**
 * Validasi Input Laporan Harian Kucing oleh Admin
 */
export const catReportSchema = z.object({
  booking_id: z.string().uuid("ID booking tidak valid").optional(),
  healthStatus: z.enum(["Sehat", "Kurang Fit", "Perlu Perhatian"], {
    message: "Status kesehatan wajib dipilih (Sehat, Kurang Fit, Perlu Perhatian)",
  }),
  notes: z.string().trim().max(2000, "Catatan maksimal 2000 karakter").optional().nullable(),
  photoUrl: z.string().url("URL foto tidak valid").optional().nullable().or(z.literal("")),
});

/**
 * Validasi Ulasan Pesanan oleh Pengguna
 */
export const reviewSchema = z.object({
  bookingId: z.string().uuid("ID booking harus berupa UUID valid"),
  rating: z.coerce.number().int().min(1, "Rating minimal 1 bintang").max(5, "Rating maksimal 5 bintang"),
  reviewText: z.string().trim().min(3, "Ulasan minimal 3 karakter").max(1000, "Ulasan maksimal 1000 karakter").optional().default(""),
});

/**
 * Validasi Balasan Ulasan oleh Admin
 */
export const reviewReplySchema = z.object({
  reviewId: z.string().uuid("ID review harus berupa UUID valid"),
  replyText: z.string().trim().min(2, "Balasan minimal 2 karakter").max(2000, "Balasan maksimal 2000 karakter"),
});

/**
 * Validasi Pembatalan Pesanan oleh Pengguna
 */
export const cancelBookingSchema = z.object({
  reason: z.string().trim().min(5, "Alasan pembatalan minimal 5 karakter").max(500, "Alasan pembatalan maksimal 500 karakter"),
});

/**
 * Validasi Perubahan Detail Pesanan oleh Admin
 */
export const editBookingSchema = z.object({
  className: z.enum(["Basic", "Standard", "Premium"], {
    message: "Kelas kamar harus salah satu dari: Basic, Standard, Premium",
  }),
  checkInDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal check-in harus YYYY-MM-DD"),
  checkOutDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal check-out harus YYYY-MM-DD"),
}).refine(
  (data) => new Date(data.checkOutDate) > new Date(data.checkInDate),
  {
    message: "Tanggal Check-Out harus setelah Check-In",
    path: ["checkOutDate"],
  }
);

/**
 * Validasi Reschedule / Pengajuan Perubahan Jadwal
 */
export const rescheduleSchema = z.object({
  check_in_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal check-in harus YYYY-MM-DD"),
  check_out_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal check-out harus YYYY-MM-DD"),
  reason: z.string().trim().min(3, "Alasan perubahan jadwal minimal 3 karakter").max(500),
}).refine(
  (data) => new Date(data.check_out_date) > new Date(data.check_in_date),
  {
    message: "Tanggal keluar harus setelah tanggal masuk",
    path: ["check_out_date"],
  }
);

/**
 * Validasi Tindakan Massal (Bulk Action) oleh Admin
 */
export const bulkActionSchema = z.object({
  ids: z.array(z.string().uuid("ID booking harus berupa UUID")).min(1, "Daftar ID tidak boleh kosong"),
  action: z.enum(["approve", "reject"], {
    message: "Tindakan harus 'approve' atau 'reject'",
  }),
  rejectReason: z.string().trim().max(500).optional(),
});

/**
 * Validasi Pemindaian Token QR Pembayaran Offline
 */
export const scanOfflineSchema = z.object({
  token: z.string().uuid("Format token QR pembayaran tidak valid"),
});

/**
 * Validasi Pemberian Poin Referral
 */
export const awardPointsSchema = z.object({
  ownerId: z.string().uuid("ID pemilik referral tidak valid"),
  bookingId: z.string().uuid("ID booking tidak valid"),
  points: z.coerce.number().int().positive("Poin harus bilangan bulat positif").max(1000, "Poin maksimal 1000 per transaksi"),
});

/**
 * Validasi Pembuatan Pembayaran Midtrans Online
 */
export const paymentCreateSchema = z.object({
  bookingId: z.string().uuid("ID booking harus berupa UUID valid"),
});

/**
 * Validasi Permintaan Kode QR Pembayaran Offline
 */
export const offlineQrSchema = z.object({
  bookingId: z.string().uuid("ID booking harus berupa UUID valid"),
  sendEmail: z.boolean().optional().default(true),
});
