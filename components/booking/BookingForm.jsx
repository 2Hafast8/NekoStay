'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { ClassSelector } from '@/components/booking/ClassSelector'
import { PriceCalculator } from '@/components/booking/PriceCalculator'
import { CAT_GENDERS, CAT_HEALTH_STATUSES, CLASS_DETAILS } from '@/lib/constants'
import { formatDate } from '@/lib/utils/dates'
import { Cat, Upload, AlertCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { z } from 'zod'

const bookingSchema = z.object({
  cat_name: z.string().min(1, 'Nama kucing harus diisi'),
  cat_gender: z.enum(['Jantan', 'Betina'], { message: 'Pilih gender kucing' }),
  cat_age: z.string().min(1, 'Umur kucing harus diisi'),
  cat_health_status: z.enum(['Sehat', 'Sakit', 'Dalam Pengobatan'], { message: 'Pilih status kesehatan' }),
  cat_favorite_food: z.string().optional(),
  cat_is_pregnant: z.boolean().default(false),
  cat_notes: z.string().optional(),
  class: z.enum(['Basic', 'Standard', 'Premium'], { message: 'Pilih kelas penitipan' }),
  check_in_date: z.string().min(1, 'Pilih tanggal check-in'),
  check_out_date: z.string().min(1, 'Pilih tanggal check-out'),
})

export function BookingForm() {
  const router = useRouter()
  const supabase = createClient()
  const [catPhoto, setCatPhoto] = useState(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting: isValidating },
  } = useForm({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      cat_gender: 'Jantan',
      cat_health_status: 'Sehat',
      cat_is_pregnant: false,
      class: 'Standard',
    },
  })

  const selectedClass = watch('class')
  const checkIn = watch('check_in_date')
  const checkOut = watch('check_out_date')

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validasi ukuran (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran foto maksimal 5MB')
      return
    }

    try {
      setUploadingPhoto(true)
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('cat-photos')
        .upload(`bookings/${fileName}`, file)

      if (uploadError) throw uploadError

      const { data } = supabase.storage
        .from('cat-photos')
        .getPublicUrl(`bookings/${fileName}`)

      setCatPhoto({
        url: data.publicUrl,
        path: `bookings/${fileName}`,
      })
      toast.success('Foto berhasil diupload')
    } catch (err) {
      toast.error('Gagal upload foto')
      console.error('Upload error:', err)
    } finally {
      setUploadingPhoto(false)
    }
  }

  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true)

      // Validasi tanggal
      const checkInDate = new Date(data.check_in_date)
      const checkOutDate = new Date(data.check_out_date)

      if (checkInDate >= checkOutDate) {
        toast.error('Tanggal check-out harus lebih lambat dari check-in')
        return
      }

      if (checkInDate < new Date()) {
        toast.error('Tanggal check-in tidak boleh di masa lalu')
        return
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Anda harus login terlebih dahulu')
        return
      }

      // Hitung total hari dan biaya
      const totalDays = Math.ceil(
        (checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)
      )
      const CLASS_PRICES = {
        Basic: 50000,
        Standard: 80000,
        Premium: 130000,
      }
      const pricePerDay = CLASS_PRICES[data.class]
      const estimatedTotal = totalDays * pricePerDay

      // Insert ke database
      const { error: insertError, data: bookingData } = await supabase
        .from('bookings')
        .insert({
          user_id: user.id,
          cat_name: data.cat_name,
          cat_gender: data.cat_gender,
          cat_age: data.cat_age,
          cat_health_status: data.cat_health_status,
          cat_favorite_food: data.cat_favorite_food || null,
          cat_is_pregnant: data.cat_is_pregnant,
          cat_notes: data.cat_notes || null,
          cat_photo_url: catPhoto?.url || null,
          class: data.class,
          price_per_day: pricePerDay,
          check_in_date: data.check_in_date,
          check_out_date: data.check_out_date,
          total_days: totalDays,
          estimated_total: estimatedTotal,
          status: 'Menunggu',
        })
        .select()
        .single()

      if (insertError) throw insertError

      toast.success('Pesanan berhasil dibuat! Menunggu konfirmasi admin.')
      router.push(`/booking/${bookingData.id}`)
    } catch (err) {
      toast.error(err.message || 'Gagal membuat pesanan')
      console.error('Submit error:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Foto Kucing */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <h3 className="font-semibold text-slate-900 dark:text-white mb-4">
          Foto Kucing
        </h3>

        {catPhoto ? (
          <div className="relative inline-block">
            <img
              src={catPhoto.url}
              alt="Cat"
              className="w-32 h-32 rounded-lg object-cover"
            />
            <button
              type="button"
              onClick={() => setCatPhoto(null)}
              className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
            >
              ✕
            </button>
          </div>
        ) : (
          <label className="flex items-center justify-center w-32 h-32 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              disabled={uploadingPhoto}
              className="hidden"
            />
            <div className="text-center">
              {uploadingPhoto ? (
                <Loader2 className="mx-auto text-slate-400 animate-spin" size={24} />
              ) : (
                <>
                  <Upload className="mx-auto text-slate-400 mb-2" size={24} />
                  <span className="text-xs text-slate-500 block">Upload Foto</span>
                </>
              )}
            </div>
          </label>
        )}
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
          Max 5MB, format: JPG, PNG
        </p>
      </div>

      {/* Data Kucing */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 space-y-4">
        <h3 className="font-semibold text-slate-900 dark:text-white mb-4">
          Data Kucing
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="cat_name">Nama Kucing *</Label>
            <Input
              id="cat_name"
              placeholder="Nama kucing Anda"
              {...register('cat_name')}
              className="mt-1.5"
            />
            {errors.cat_name && (
              <p className="text-xs text-red-500 mt-1">{errors.cat_name.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="cat_age">Umur Kucing *</Label>
            <Input
              id="cat_age"
              placeholder="Contoh: 2 tahun / 6 bulan"
              {...register('cat_age')}
              className="mt-1.5"
            />
            {errors.cat_age && (
              <p className="text-xs text-red-500 mt-1">{errors.cat_age.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="cat_gender">Gender *</Label>
            <Controller
              name="cat_gender"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CAT_GENDERS.map((g) => (
                      <SelectItem key={g} value={g}>
                        {g}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div>
            <Label htmlFor="cat_health_status">Status Kesehatan *</Label>
            <Controller
              name="cat_health_status"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CAT_HEALTH_STATUSES.map((h) => (
                      <SelectItem key={h} value={h}>
                        {h}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="cat_favorite_food">Makanan Favorit</Label>
          <Input
            id="cat_favorite_food"
            placeholder="Contoh: Whiskas, Royal Canin, dll"
            {...register('cat_favorite_food')}
            className="mt-1.5"
          />
        </div>

        <div className="flex items-center gap-3">
          <Checkbox
            id="cat_is_pregnant"
            {...register('cat_is_pregnant')}
          />
          <Label htmlFor="cat_is_pregnant" className="cursor-pointer">
            Kucing sedang hamil
          </Label>
        </div>

        <div>
          <Label htmlFor="cat_notes">Catatan Tambahan</Label>
          <Textarea
            id="cat_notes"
            placeholder="Informasi tambahan tentang kucing Anda"
            {...register('cat_notes')}
            className="mt-1.5"
            rows={3}
          />
        </div>
      </div>

      {/* Pilihan Kelas & Tanggal */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 space-y-4">
        <h3 className="font-semibold text-slate-900 dark:text-white mb-4">
          Kelas & Jadwal
        </h3>

        <div>
          <Label className="mb-3 block">Pilih Kelas Penitipan *</Label>
          <Controller
            name="class"
            control={control}
            render={({ field }) => (
              <ClassSelector value={field.value} onChange={field.onChange} />
            )}
          />
          {errors.class && (
            <p className="text-xs text-red-500 mt-2">{errors.class.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="check_in_date">Tanggal Check-in *</Label>
            <Input
              id="check_in_date"
              type="date"
              {...register('check_in_date')}
              className="mt-1.5"
            />
            {errors.check_in_date && (
              <p className="text-xs text-red-500 mt-1">{errors.check_in_date.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="check_out_date">Tanggal Check-out *</Label>
            <Input
              id="check_out_date"
              type="date"
              {...register('check_out_date')}
              className="mt-1.5"
            />
            {errors.check_out_date && (
              <p className="text-xs text-red-500 mt-1">{errors.check_out_date.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Preview Harga */}
      {selectedClass && checkIn && checkOut && (
        <PriceCalculator
          className={selectedClass}
          checkIn={checkIn}
          checkOut={checkOut}
        />
      )}

      {/* Info */}
      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg p-4 flex gap-3">
        <AlertCircle className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" size={20} />
        <div className="text-sm text-blue-800 dark:text-blue-300">
          <p className="font-semibold mb-1">Informasi Penting</p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>Pesanan akan ditinjau admin dalam 24 jam</li>
            <li>Anda akan menerima notifikasi email jika pesanan dikonfirmasi</li>
            <li>Pembayaran dilakukan saat pesanan dikonfirmasi</li>
          </ul>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={() => router.back()}
        >
          Batal
        </Button>
        <Button
          type="submit"
          className="flex-1"
          disabled={isSubmitting || isValidating}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 animate-spin" size={18} />
              Membuat Pesanan...
            </>
          ) : (
            'Buat Pesanan'
          )}
        </Button>
      </div>
    </form>
  )
}
