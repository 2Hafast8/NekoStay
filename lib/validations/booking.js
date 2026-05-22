import { z } from "zod";

export const bookingFormSchema = z
  .object({
    // Data Kucing
    cat_name: z
      .string()
      .min(1, "Nama kucing wajib diisi")
      .max(50, "Nama kucing maksimal 50 karakter"),
    cat_gender: z.enum(["Jantan", "Betina"], {
      message: "Gender kucing wajib dipilih",
    }),
    cat_age: z.string().min(1, "Usia kucing wajib diisi"),
    cat_health_status: z.enum(["Sehat", "Sakit", "Dalam Pengobatan"]),
    cat_favorite_food: z.string().optional(),
    cat_is_pregnant: z.boolean().default(false),
    cat_notes: z.string().optional(),
    cat_photo_url: z.string().url("URL foto tidak valid").optional(),

    // Data Pemesanan
    class: z.enum(["Basic", "Standard", "Premium"]),
    check_in_date: z.string().min(1, "Tanggal masuk wajib diisi"),
    check_out_date: z.string().min(1, "Tanggal keluar wajib diisi"),
  })
  .refine(
    (data) => new Date(data.check_out_date) > new Date(data.check_in_date),
    {
      message: "Tanggal keluar harus setelah tanggal masuk",
      path: ["check_out_date"],
    },
  );
