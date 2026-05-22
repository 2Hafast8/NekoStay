import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { sendCatReport } from '@/lib/email/resend'
import { formatDate } from '@/lib/utils/dates'

export async function POST(request, { params }) {
  try {
    const supabase = await createClient()
    const { id } = await params

    // 1. Check user session & admin role
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

    // 2. Parse request body
    const body = await request.json()
    const { healthStatus, photoUrl, notes } = body

    if (!healthStatus) {
      return NextResponse.json({ error: 'Status kesehatan wajib diisi' }, { status: 400 })
    }

    // 3. Get booking and owner profiles details
    let booking = null
    let bookingError = null

    // Try fetching with email column first
    const firstAttempt = await supabase
      .from('bookings')
      .select(`
        *,
        profiles (full_name, phone, email)
      `)
      .eq('id', id)
      .single()

    if (firstAttempt.error) {
      // If it fails (likely due to missing email column in profiles), try without email
      const secondAttempt = await supabase
        .from('bookings')
        .select(`
          *,
          profiles (full_name, phone)
        `)
        .eq('id', id)
        .single()

      if (secondAttempt.error) {
        bookingError = secondAttempt.error
      } else {
        booking = secondAttempt.data
      }
    } else {
      booking = firstAttempt.data
    }

    if (bookingError || !booking) {
      return NextResponse.json({ error: bookingError?.message || 'Booking tidak ditemukan' }, { status: 404 })
    }

    const todayStr = new Date().toISOString().split('T')[0]

    // 4. Insert report record
    const { data: report, error: reportError } = await supabase
      .from('cat_reports')
      .insert({
        booking_id: id,
        admin_id: user.id,
        health_status: healthStatus,
        photo_url: photoUrl || null,
        notes: notes || null,
        report_date: todayStr
      })
      .select()
      .single()

    if (reportError) throw reportError

    // 5. Insert notification
    await supabase.from('notifications').insert({
      user_id: booking.user_id,
      title: `Laporan Kondisi Baru: ${booking.cat_name}`,
      message: `Kondisi kucing Anda hari ini: ${healthStatus}. Catatan: ${notes || 'Kondisi stabil.'}`,
      type: healthStatus === 'Sehat' ? 'success' : healthStatus === 'Kurang Fit' ? 'warning' : 'error',
      booking_id: booking.id
    })

    // 6. Send transactional email via Resend securely on the server
    if (booking.profiles) {
      try {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin
        // Use user email if stored in profiles, or fallback to fetching if needed
        const userEmail = booking.profiles.email

        if (userEmail) {
          await sendCatReport(userEmail, {
            catName: booking.cat_name,
            ownerName: booking.profiles.full_name,
            healthStatus: healthStatus,
            notes: notes || undefined,
            photoUrl: photoUrl || undefined,
            reportDate: formatDate(todayStr, 'long'),
            bookingUrl: `${appUrl}/booking/${booking.id}`
          })
        } else {
          console.warn('[Server Email Warning] profiles.email is empty. Ask the user to run SQL migration to sync emails.')
        }
      } catch (emailErr) {
        console.warn('[Server Email Warning] Resend email failed:', emailErr)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Laporan berhasil disimpan dan notifikasi telah terkirim',
      report
    })

  } catch (error) {
    console.error('Add report API error:', error)
    return NextResponse.json(
      { error: error.message || 'Gagal menyimpan laporan' },
      { status: 500 }
    )
  }
}
