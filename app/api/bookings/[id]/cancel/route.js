import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const cancelSchema = z.object({
  reason: z.string().min(5, 'Alasan pembatalan minimal 5 karakter').max(500),
})

export async function POST(request, { params }) {
  try {
    const supabase = await createClient()
    const { id } = await params

    // Cek user session
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const validatedData = cancelSchema.parse(body)

    // 1. Get current booking status in DB
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('id, status, cat_name, user_id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: 'Booking tidak ditemukan' },
        { status: 404 }
      )
    }

    // 2. Strict status check: User CANNOT cancel if status is already confirmed/accepted by Admin ('Aktif', 'Selesai', etc.)
    if (booking.status !== 'Menunggu') {
      return NextResponse.json(
        {
          error: `Pesanan ini telah diterima/dikonfirmasi oleh Admin (Status: ${booking.status}) dan tidak dapat dibatalkan secara langsung.`,
          currentStatus: booking.status
        },
        { status: 400 }
      )
    }

    // 3. Atomic Database Update (Lock: .eq('status', 'Menunggu') prevents race condition if Admin accepted right now)
    const { data: updatedBooking, error: updateError } = await supabase
      .from('bookings')
      .update({
        status: 'Dibatalkan',
        cancel_reason: validatedData.reason,
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .eq('status', 'Menunggu')
      .select()
      .maybeSingle()

    if (updateError) throw updateError

    // If update returned null, Admin updated status right at this millisecond
    if (!updatedBooking) {
      const { data: latestBooking } = await supabase
        .from('bookings')
        .select('status')
        .eq('id', id)
        .single()

      return NextResponse.json(
        {
          error: `Pesanan telah diterima oleh Admin (Status: ${latestBooking?.status || 'Aktif'}). Pembatalan dibatalkan.`,
          currentStatus: latestBooking?.status || 'Aktif'
        },
        { status: 400 }
      )
    }

    // 4. Send notification to Admins
    try {
      const { data: admins } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'admin')

      if (admins && admins.length > 0) {
        const notificationsToInsert = admins.map((admin) => ({
          user_id: admin.id,
          title: 'Pesanan Dibatalkan User',
          message: `Booking untuk kucing ${booking.cat_name} telah dibatalkan oleh pemilik. Alasan: ${validatedData.reason}`,
          type: 'warning',
          booking_id: id,
          is_read: false,
        }))

        await supabase.from('notifications').insert(notificationsToInsert)
      }
    } catch (notifErr) {
      console.warn('Failed to insert cancel notification:', notifErr)
    }

    return NextResponse.json({
      success: true,
      message: 'Booking berhasil dibatalkan',
    })
  } catch (error) {
    console.error('Cancel booking error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Gagal membatalkan booking' },
      { status: 500 }
    )
  }
}
