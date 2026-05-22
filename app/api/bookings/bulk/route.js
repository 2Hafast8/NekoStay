import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const bulkActionSchema = z.object({
  ids: z.array(z.string().uuid()),
  action: z.enum(['approve', 'reject']),
  rejectReason: z.string().optional(),
})

export async function POST(request) {
  try {
    const supabase = await createClient()

    // 1. Verify user session & admin role
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

    // 2. Validate request body
    const body = await request.json()
    const { ids, action, rejectReason } = bulkActionSchema.parse(body)

    if (ids.length === 0) {
      return NextResponse.json({ error: 'ID list cannot be empty' }, { status: 400 })
    }

    // 3. Fetch selected bookings to process
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('*, profiles (full_name, email)')
      .in('id', ids)

    if (bookingsError) throw bookingsError

    const validBookings = bookings.filter((b) => b.status === 'Menunggu')
    if (validBookings.length === 0) {
      return NextResponse.json({ error: 'No bookings in waiting status to process' }, { status: 400 })
    }

    const validIds = validBookings.map((b) => b.id)
    let processedCount = 0

    if (action === 'approve') {
      // Bulk update status to Aktif
      const { error: updateError } = await supabase
        .from('bookings')
        .update({ status: 'Aktif' })
        .in('id', validIds)

      if (updateError) throw updateError

      // Process notifications & emails
      for (const booking of validBookings) {
        // Create in-app notification
        await supabase.from('notifications').insert({
          user_id: booking.user_id,
          title: 'Pesanan Penitipan Disetujui',
          message: `Kabar baik! Penitipan untuk ${booking.cat_name} telah aktif. Silakan bawa kucing Anda ke pengantaran.`,
          type: 'success',
          booking_id: booking.id,
        })

        // Send confirmation email
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
            console.warn('[Bulk Route Warning] Resend status update failed:', emailErr.message)
          }
        }
        processedCount++
      }

    } else if (action === 'reject') {
      const reason = rejectReason || 'Ditolak oleh admin'

      // Bulk update status to Dibatalkan & reject_reason
      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          status: 'Dibatalkan',
          reject_reason: reason,
        })
        .in('id', validIds)

      if (updateError) throw updateError

      // Process notifications & emails
      for (const booking of validBookings) {
        // Create in-app notification
        await supabase.from('notifications').insert({
          user_id: booking.user_id,
          title: 'Pesanan Penitipan Ditolak',
          message: `Mohon maaf, pesanan penitipan ${booking.cat_name} ditolak dengan alasan: ${reason}`,
          type: 'error',
          booking_id: booking.id,
        })

        // Send rejection email
        const userEmail = booking.profiles?.email
        if (userEmail) {
          try {
            const { sendBookingStatusUpdate } = await import('@/lib/email/resend')
            await sendBookingStatusUpdate(
              userEmail,
              booking.profiles.full_name,
              booking.cat_name,
              booking.id,
              'Dibatalkan',
              reason
            )
          } catch (emailErr) {
            console.warn('[Bulk Route Warning] Resend status update failed:', emailErr.message)
          }
        }
        processedCount++
      }
    }

    return NextResponse.json({
      success: true,
      message: `Berhasil memproses ${processedCount} pesanan secara massal.`,
      processed: processedCount,
    })

  } catch (error) {
    console.error('Bulk actions error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Gagal memproses tindakan massal pesanan' },
      { status: 500 }
    )
  }
}
