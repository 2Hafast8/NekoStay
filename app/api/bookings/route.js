import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { bookingFormSchema } from '@/lib/validations/booking'

export async function POST(request) {
  try {
    const supabase = await createClient()

    // Check user session
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = bookingFormSchema.parse(body)

    // Get user profile for email
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    // Get class price
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select('price_per_day')
      .eq('name', validatedData.class)
      .single()

    if (classError || !classData) {
      return NextResponse.json(
        { error: 'Class not found' },
        { status: 404 }
      )
    }

    // Calculate days and total
    const checkInDate = new Date(validatedData.check_in_date)
    const checkOutDate = new Date(validatedData.check_out_date)
    const totalDays = Math.floor((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24))

    if (totalDays <= 0) {
      return NextResponse.json(
        { error: 'Check-out date must be after check-in date' },
        { status: 400 }
      )
    }

    const estimatedTotal = totalDays * classData.price_per_day

    // Insert booking into database
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        user_id: user.id,
        cat_name: validatedData.cat_name,
        cat_gender: validatedData.cat_gender,
        cat_age: validatedData.cat_age,
        cat_health_status: validatedData.cat_health_status,
        cat_favorite_food: validatedData.cat_favorite_food || null,
        cat_is_pregnant: validatedData.cat_is_pregnant || false,
        cat_notes: validatedData.cat_notes || null,
        cat_photo_url: validatedData.cat_photo_url || null,
        class: validatedData.class,
        price_per_day: classData.price_per_day,
        check_in_date: validatedData.check_in_date,
        check_out_date: validatedData.check_out_date,
        status: 'Menunggu',
      })
      .select()
      .single()

    if (bookingError) {
      console.error('Booking creation error:', bookingError)
      throw bookingError
    }

    // Create in-app notification for user
    try {
      await supabase.from('notifications').insert({
        user_id: user.id,
        title: `Pesanan Penitipan ${validatedData.cat_name} Dibuat`,
        message: `Pesanan Anda telah diterima. Menunggu konfirmasi admin.`,
        type: 'info',
        booking_id: booking.id,
      })
    } catch (notifErr) {
      console.warn('[Warning] Notification creation failed:', notifErr.message)
    }

    // Create in-app notification for admin securely via RPC
    try {
      await supabase.rpc("create_admin_notification", {
        booking_id_param: booking.id,
        title_param: `Pesanan Baru: ${validatedData.cat_name}`,
        message_param: `${profile.full_name} mengirim pesanan penitipan kucing.`,
        type_param: "info",
      });
    } catch (notifErr) {
      console.warn('[Warning] Admin notification creation failed:', notifErr.message)
    }

    // Send booking confirmation email to user
    try {
      const { sendBookingConfirmation } = await import('@/lib/email/resend')
      const checkInFormatted = checkInDate.toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
      const checkOutFormatted = checkOutDate.toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })

      await sendBookingConfirmation(
        profile.email,
        profile.full_name,
        validatedData.cat_name,
        booking.id,
        checkInFormatted,
        checkOutFormatted,
        validatedData.class,
        estimatedTotal
      )
    } catch (emailErr) {
      console.warn('[Server Email Warning] Booking confirmation email failed:', emailErr.message)
      // Don't fail the request if email fails - the booking is already created
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Booking berhasil dibuat',
        booking: {
          id: booking.id,
          cat_name: booking.cat_name,
          status: booking.status,
          total_days: totalDays,
          estimated_total: estimatedTotal,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Create booking error:', error)

    if (error instanceof z.ZodError) {
      const firstError = error.errors[0]
      return NextResponse.json(
        { error: firstError.message || 'Validation error' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Gagal membuat pesanan booking' },
      { status: 500 }
    )
  }
}
