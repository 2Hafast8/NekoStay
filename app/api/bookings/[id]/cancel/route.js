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

    // Get booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Cek status
    if (booking.status !== 'Menunggu' && booking.status !== 'Aktif') {
      return NextResponse.json(
        { error: 'Booking tidak dapat dibatalkan di status ' + booking.status },
        { status: 400 }
      )
    }

    // Update booking
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        status: 'Dibatalkan',
        cancel_reason: validatedData.reason,
      })
      .eq('id', id)

    if (updateError) throw updateError

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
