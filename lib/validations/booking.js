import { z } from 'zod'

export const bookingFormSchema = z.object({
  // Data Kucing
  cat_name: z.string()
    .min(1, 'Nama kucing wajib diisi')
    .max(50, 'Nama kucing maksimal 50 karakter'),
  cat_gender: z.enum(['Jantan', 'Betina'], {
    required_error: 'Gender kucing wajib dipilih',
  }),
  cat_age: z.string().min(1, 'Usia kucing wajib diisi'),
  cat_health_status: z.enum(['Sehat', 'Sakit', 'Dalam Pengobatan']),
  cat_favorite_food: z.string().optional().default(''),
  cat_is_pregnant: z.boolean().default(false),
  cat_notes: z.string().optional().default(''),
  cat_photo_url: z.string().optional().default(''),

  // Data Pemesanan
  class: z.enum(['Basic', 'Standard', 'Premium']),
  check_in_date: z.string().min(1, 'Tanggal masuk wajib diisi'),
  check_out_date: z.string().min(1, 'Tanggal keluar wajib diisi'),
}).refine(
  (data) => new Date(data.check_out_date) > new Date(data.check_in_date),
  {
    message: 'Tanggal keluar harus setelah tanggal masuk',
    path: ['check_out_date'],
  }
)

export const loginSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
})

export const registerSchema = z.object({
  full_name: z.string().min(2, 'Nama minimal 2 karakter').max(100, 'Nama maksimal 100 karakter'),
  email: z.string().email('Format email tidak valid'),
  phone: z.string().min(10, 'Nomor HP minimal 10 digit').max(15, 'Nomor HP maksimal 15 digit'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  confirmPassword: z.string().min(6, 'Konfirmasi password wajib diisi'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Password dan konfirmasi tidak cocok',
  path: ['confirmPassword'],
})

export const cancelBookingSchema = z.object({
  reason: z.string().min(5, 'Alasan pembatalan minimal 5 karakter'),
})

export const rejectBookingSchema = z.object({
  reason: z.string().min(5, 'Alasan penolakan minimal 5 karakter'),
})

export const catReportSchema = z.object({
  health_status: z.enum(['Sehat', 'Kurang Fit', 'Perlu Perhatian']),
  photo_url: z.string().optional().default(''),
  notes: z.string().optional().default(''),
})
