import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const confirmSchema = z.object({
  // No additional data needed for confirmation
})

export async function POST(request, { params }) {
  try {
    const supabase = await createClient()
    const { id } = await params

    // Cek user session & role
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get booking with profiles
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*, profiles (full_name, email)')
      .eq('id', id)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Cek status
    if (booking.status !== 'Menunggu') {
      return NextResponse.json(
        { error: 'Hanya booking dengan status Menunggu yang dapat dikonfirmasi' },
        { status: 400 }
      )
    }

    // Update status ke Aktif
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        status: 'Aktif',
      })
      .eq('id', id)

    if (updateError) throw updateError

    // Send transactional status update email securely on the server
    const userEmail = booking.profiles?.email
    if (userEmail) {
      try {
        const { sendBookingStatusUpdate } = await import('@/lib/email/resend')
        await sendBookingStatusUpdate(
          userEmail,
          booking.profiles.full_name,
          booking.cat_name,
          booking.id,
          'Aktif'
        )
      } catch (emailErr) {
        console.warn('[Server Email Warning] Resend status update failed:', emailErr.message)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Booking berhasil dikonfirmasi',
    })
  } catch (error) {
    console.error('Confirm booking error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Gagal mengkonfirmasi booking' },
      { status: 500 }
    )
  }
}
