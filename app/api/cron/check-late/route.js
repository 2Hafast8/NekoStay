import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { calculateLateFee } from '@/lib/utils/pricing'
import { sendLateWarning } from '@/lib/email/resend'

export async function GET(request) {
  try {
    // 1. Verify cron secret from headers
    const authHeader = request.headers.get('authorization')
    const expectedToken = `Bearer ${process.env.CRON_SECRET}`

    if (!process.env.CRON_SECRET || authHeader !== expectedToken) {
      return new Response('Unauthorized', { status: 401 })
    }

    // 2. Initialize Supabase Admin Client using service role key to bypass RLS
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('[Cron Error] SUPABASE_SERVICE_ROLE_KEY is missing from environment variables.')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]

    // 3. Get all active bookings that have passed their checkout date
    const { data: lateBookings, error: fetchError } = await supabaseAdmin
      .from('bookings')
      .select(`
        *,
        profiles (email, full_name)
      `)
      .eq('status', 'Aktif')
      .lt('check_out_date', todayStr)

    if (fetchError) throw fetchError

    console.log(`[Cron] Found ${lateBookings?.length || 0} late bookings.`)

    let processedCount = 0

    for (const booking of lateBookings || []) {
      const scheduledCheckout = new Date(booking.check_out_date)
      
      // Calculate late fee and days
      const { totalFee, breakdown } = calculateLateFee(
        booking.price_per_day,
        scheduledCheckout,
        today
      )

      if (breakdown.length === 0) continue

      const lateDaysCount = breakdown.length
      const todayFee = breakdown[breakdown.length - 1]?.fee || 0

      // Update late_fee_total in the database
      const { error: updateError } = await supabaseAdmin
        .from('bookings')
        .update({ late_fee_total: totalFee })
        .eq('id', booking.id)

      if (updateError) {
        console.error(`[Cron Error] Failed to update booking ${booking.id}:`, updateError.message)
        continue
      }

      // Send warning email if owner's email exists
      const userEmail = booking.profiles?.email
      if (userEmail) {
        try {
          await sendLateWarning(
            userEmail,
            booking.cat_name,
            lateDaysCount,
            todayFee
          )
        } catch (emailErr) {
          console.warn(`[Cron Warning] Failed to send email for booking ${booking.id}:`, emailErr.message)
        }
      }

      // Insert in-app warning notification
      // Avoid duplicate warning on the same day
      const { data: existingNotification } = await supabaseAdmin
        .from('notifications')
        .select('id')
        .eq('booking_id', booking.id)
        .eq('title', 'Peringatan Keterlambatan')
        .gte('created_at', todayStr)
        .limit(1)

      if (!existingNotification || existingNotification.length === 0) {
        await supabaseAdmin.from('notifications').insert({
          user_id: booking.user_id,
          title: 'Peringatan Keterlambatan',
          message: `Kucing Anda (${booking.cat_name}) belum diambil. Denda keterlambatan hari ini: Rp ${todayFee.toLocaleString('id-ID')}`,
          type: 'warning',
          booking_id: booking.id
        })
      }

      processedCount++
    }

    return NextResponse.json({
      success: true,
      message: 'Pemeriksaan keterlambatan harian selesai',
      processed: processedCount
    })

  } catch (error) {
    console.error('[Cron Error] check-late endpoint crash:', error)
    return NextResponse.json(
      { error: error.message || 'Gagal memproses cron keterlambatan' },
      { status: 500 }
    )
  }
}
